import { type Evaluator, type ActionResult } from '@elizaos/core';
import { elizaLogger } from '@elizaos/core';

export const riskEvaluator: Evaluator = {
  name: 'RISK_EVALUATOR',
  description: 'Avalia se o texto indica risco à saúde mental da criança/adolescente.',
  validate: async (_runtime, message) => {
    return typeof message?.content?.text === 'string';
  },
  handler: async (_runtime, message): Promise<ActionResult> => {
    const txt = (message?.content?.text || '').toLowerCase();

    let level: 'low' | 'medium' | 'high' = 'low';

    if (/triste|sozinh|medo|ansioso|chorar/.test(txt)) {
      level = 'medium';
    }
    if (/suicid|autoagress|autoles|matar|me machucar|me ferir/.test(txt)) {
      level = 'high';
    }

    elizaLogger.info('RISK_EVALUATOR: ' + level);

    return {
      success: true,
      data: { level },
    };
  },

  // Deixar vazio para não gerar erros de tipo
  examples: [],
};
