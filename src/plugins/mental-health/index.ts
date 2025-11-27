import { type Plugin } from '@elizaos/core';
import { crisisAction } from './crisisAction';
import { crisisReportAction } from './crisisReportAction';
import * as schema from '../../db/schema';

const mentalHealthPlugin: Plugin = {
  name: 'mental-health-plugin',
  description: 'Ações para saúde mental infanto juvenil.',
  actions: [crisisAction, crisisReportAction],
  schema,
};

export default mentalHealthPlugin;
