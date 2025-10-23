import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { createUpdateTimestamps } from './columnHelpers'

/**
 * App State table - Application-level runtime state storage
 *
 * Stores application lifecycle and initialization state that is managed
 * internally by the app, not configurable by users.
 *
 * This differs from preferences in that:
 * - App state is managed by application logic, not user preferences
 * - Controls application lifecycle and initialization flow
 * - Not intended for cross-device synchronization
 *
 * Current state keys:
 * - app.initialized      : Whether the app has completed initialization
 * - app.welcome_shown    : Whether the welcome screen has been shown
 *
 * @example
 * { key: 'app.initialized', value: true, description: 'App initialization status' }
 * { key: 'app.welcome_shown', value: false, description: 'Welcome screen display status' }
 */
export const appStateTable = sqliteTable('app_state', {
  // Primary key - application state identifier
  // Uses dot notation: 'app.*'
  key: text('key').primaryKey().notNull(),

  // JSON-serialized state value
  // Typically boolean or simple types
  value: text('value', { mode: 'json' }).notNull(),

  // Optional description for documentation
  description: text('description'),

  // Standard timestamp fields
  ...createUpdateTimestamps
})
