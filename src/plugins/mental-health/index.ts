import { type Plugin } from '@elizaos/core';
import { crisisAction } from './crisisAction';

const mentalHealthPlugin: Plugin = {
  name: 'mental-health-plugin',
  description: 'Ações para saúde mental infanto juvenil.',
  actions: [crisisAction],
};

export default mentalHealthPlugin;
