import { type Action, type ActionResult, elizaLogger, type IAgentRuntime } from '@elizaos/core';
import { sql, gte, type SQL } from 'drizzle-orm';
import { crisisEventsTable } from '../../db/schema';

type Period = 'today' | 'week' | 'month' | 'all';

export const crisisReportAction: Action = {
  name: 'CRISIS_REPORT',
  description: 'Gera um relatório com a contagem de acionamentos do protocolo de crise.',
  // This action is now internal and can only be triggered by a specific command.
  validate: async (_runtime, message) => {
    const txt = message?.content?.text?.toLowerCase() || '';
    return txt.startsWith('/report crisis');
  },
  handler: async (runtime: IAgentRuntime, message): Promise<ActionResult> => {
    const txt = message?.content?.text?.toLowerCase() || '';
    const parts = txt.split(' ');
    const periodArg = (parts[2] as Period) || 'all';
    let period: Period = 'all';

    if (['today', 'week', 'month'].includes(periodArg)) {
      period = periodArg as Period;
    }

    const periodMap = {
      today: 'hoje',
      week: 'na última semana',
      month: 'neste mês',
      all: 'no total',
    };

    try {
      let whereCondition: SQL | undefined = undefined;
      const now = new Date();

      if (period === 'today') {
        const today = now.toISOString().slice(0, 10);
        whereCondition = sql`date(${crisisEventsTable.triggeredAt}) = ${today}`;
      } else if (period === 'week') {
        const sevenDaysAgo = new Date(new Date().setDate(now.getDate() - 7));
        whereCondition = gte(crisisEventsTable.triggeredAt, sevenDaysAgo);
      } else if (period === 'month') {
        const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
        whereCondition = sql`strftime('%Y-%m', ${crisisEventsTable.triggeredAt}) = ${currentMonth}`;
      }

      const query = runtime.db
        .select({ count: sql<number>`count(*)` })
        .from(crisisEventsTable)
        .where(whereCondition);

      const result = await query;
      const count = result[0]?.count ?? 0;
      const reply = `O protocolo de crise foi acionado ${count} vez(es) ${periodMap[period]}.`;

      return {
        success: true,
        data: {
          text: reply,
        },
      };
    } catch (error) {
      elizaLogger.error('CRISIS_REPORT: Failed to query database.', error);
      if (error instanceof Error && /relation "crisis_events" does not exist|no such table/i.test(error.message)) {
        return {
          success: true,
          data: {
            text: 'Ainda não há registros de acionamentos do protocolo de crise.',
          },
        };
      }
      return {
        success: false,
        error: 'Ocorreu um erro ao gerar o relatório. Não foi possível consultar o banco de dados.',
      };
    }
  },
};

