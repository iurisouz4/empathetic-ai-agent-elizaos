import { type DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '../db/schema';

/**
 * Augments the IAgentRuntime interface from @elizaos/core.
 * This is the correct way to inform TypeScript about properties
 * added to the runtime by plugins. In this case, we are adding the 'db'
 * property from the SQL plugin, which is necessary because the plugin's
 * package.json prevents direct module import and type resolution.
 */
declare module '@elizaos/core' {
  export interface IAgentRuntime {
    db: DrizzleD1Database<typeof schema>;
  }
}