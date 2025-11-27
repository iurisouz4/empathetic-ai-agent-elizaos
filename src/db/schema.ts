import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Schema for logging crisis action trigger events.
 * Using pgTable for PostgreSQL compatibility, as indicated by pglite errors.
 */
export const crisisEventsTable = pgTable('crisis_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`), // Use UUID as primary key with default UUID generation
  triggeredAt: timestamp('triggered_at').notNull().defaultNow(), // Use timestamp with default to current time
});
