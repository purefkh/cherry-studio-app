import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { createUpdateTimestamps } from './columnHelpers'

/**
 * Preference table - User preferences and configuration storage
 *
 * Stores user-configurable settings that affect application behavior and UX.
 * All preferences have default values defined in @shared/data/preference/preferenceSchemas
 *
 * Key structure uses dot notation for hierarchical organization:
 * - user.*        : User-related settings
 * - ui.*          : UI and appearance settings
 * - topic.*       : Conversation topic state
 * - websearch.*   : Web search configuration
 *
 * @example
 * { key: 'user.name', value: 'John Doe', description: 'User display name' }
 * { key: 'ui.theme_mode', value: 'dark', description: 'Application theme mode' }
 */
export const preferenceTable = sqliteTable('preference', {
  // Primary key - hierarchical preference identifier
  // Examples: 'user.name', 'ui.theme_mode', 'websearch.max_results'
  key: text('key').primaryKey().notNull(),

  // JSON-serialized preference value
  // Type varies by preference key, see PreferenceSchemas in shared/data/preference
  value: text('value', { mode: 'json' }),

  // Optional human-readable description of the preference
  // Useful for UI display and documentation
  description: text('description'),

  // Standard timestamp fields
  ...createUpdateTimestamps
})
