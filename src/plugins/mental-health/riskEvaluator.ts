import { type Evaluator, type ActionResult, elizaLogger, ModelType } from '@elizaos/core';

let riskLock: Promise<any> | null = null;
let lastCall = 0;
const MIN_DELAY = 2000;
const riskCache = new Map<string, string>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runRiskModel(runtime: any, history: any, message: any): Promise<string> {
  const prompt = `
  Avalie o nível de risco da conversa abaixo, considerando sinais de abuso, violência, assédio, exploração infantil, coerção, autolesão ou vulnerabilidade emocional.
  Classifique apenas a mensagem atual no contexto da conversa.

  Regras:
  - Responda somente com: low, medium ou high.
  - Não explique.
  - Não forneça justificativa.

  Histórico:
  ${JSON.stringify(history, null, 2)}

  Mensagem atual:
  ${message}

  Saída:
  (low | medium | high)
  `;

  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let error: any = null;
    const response = await runtime.useModel(ModelType.TEXT_LARGE, { prompt }).catch((err: any) => {
      error = err;
      return null; // Return null on error
    });

    if (error) {
      const code = error?.status || error?.code;
      const details = error?.details || (error?.error ? error.error.details : []);
      const retryInfo = details?.find((d: any) => d['@type']?.includes('RetryInfo'));

      let retryMs = 0;
      if (retryInfo?.retryDelay) {
        const seconds = parseInt(retryInfo.retryDelay.replace('s', '').trim(), 10);
        retryMs = seconds * 1000;
      }

      elizaLogger.error(`RISK_EVALUATOR: erro attempt ${attempt}/${MAX_RETRIES}:`, error);

      if (code === 429 || error?.status === 'RESOURCE_EXHAUSTED') {
        const delay = retryMs || attempt * 2000;

        elizaLogger.warn(`[RISK_EVALUATOR] 429 recebido. Aguardando ${delay}ms para tentar novamente...`);
        await sleep(delay);
        continue; // try again
      }

      break; // break on other errors
    }

    if (typeof response === 'string') return response.trim().toLowerCase();
    if (response?.text) return response.text.trim().toLowerCase();
    if (response?.choices?.[0]?.message?.content) return response.choices[0].message.content.trim().toLowerCase();

    elizaLogger.warn('RISK_EVALUATOR: resposta inesperada:', response);
    return 'medium';
  }

  elizaLogger.warn("[RISK_EVALUATOR] Falha total após retries. Retornando 'medium'.");
  return 'medium';
}

export const riskEvaluator: Evaluator = {
  name: 'RISK_EVALUATOR',
  description: 'Classifica risco da conversa (low, medium, high).',

  validate: async (_runtime, message) => {
    const text = message?.content?.text || (typeof message?.content === 'string' ? message.content : '');

    return typeof text === 'string' && text.length > 0;
  },

  handler: async (runtime: any, message: any, state: any): Promise<ActionResult> => {
    const incomingMessage = message?.content?.text || (typeof message?.content === 'string' ? message.content : '');

    if (riskCache.has(incomingMessage)) {
      elizaLogger.info(`RISK_EVALUATOR: Cache hit for message: "${incomingMessage}"`);
      return { success: true, data: { level: riskCache.get(incomingMessage) } };
    }

    // Espera a chamada anterior terminar
    if (riskLock) {
      await riskLock;
    }

    const executionPromise = (async () => {
      try {
        const now = Date.now();
        const timeSinceLastCall = now - lastCall;
        if (timeSinceLastCall < MIN_DELAY) {
          const delay = MIN_DELAY - timeSinceLastCall;
          elizaLogger.info(`RISK_EVALUATOR: Throttling call for ${delay}ms`);
          await sleep(delay);
        }

        const memoryService = runtime.getService('memory');
        const roomId = state?.room?.id;

        let history: any[] = [];
        if (!memoryService || !roomId) {
          history = [{ role: 'user', content: incomingMessage, timestamp: new Date().toISOString() }];
        } else {
          const summaries = await memoryService.getSessionSummaries(roomId);
          history = (summaries || []).map((s: any) => ({
            role: s.role,
            content: s.content?.text || (typeof s.content === 'string' ? s.content : ''),
            timestamp: s.timestamp,
          }));
          history.push({ role: 'user', content: incomingMessage, timestamp: new Date().toISOString() });
        }

        lastCall = Date.now();
        const result = await runRiskModel(runtime, history, incomingMessage);
        const level = ['low', 'medium', 'high'].includes(result) ? result : 'medium';

        riskCache.set(incomingMessage, level);
        elizaLogger.warn(`RISK_EVALUATOR: nível de risco identificado - ${level}`);

        return { success: true, data: { level } };
      } catch (err) {
        elizaLogger.error('RISK_EVALUATOR erro no handler:', err);
        return { success: false, data: { level: 'medium' } };
      }
    })();

    riskLock = executionPromise;

    return executionPromise.finally(() => {
      if (riskLock === executionPromise) {
        riskLock = null;
      }
    });
  },

  examples: [],
};
