import { type Plugin } from '@elizaos/core';
import { crisisAction } from './crisisAction';
import { riskEvaluator } from './riskEvaluator';

const mentalHealthPlugin: Plugin = {
  name: 'mental-health-plugin',
  description: 'Ações e avaliadores para saúde mental infanto juvenil.',
  actions: [crisisAction],
  evaluators: [riskEvaluator], // opcional, remova se não existir
};

export default mentalHealthPlugin;
