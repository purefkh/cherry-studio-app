/**
 * Database Seeding Module
 *
 * This module provides functions to initialize the database with default data.
 * Seeding is idempotent - running it multiple times will not create duplicates.
 *
 * Seeding includes:
 * - Preferences: User-configurable settings and app state with default values
 *
 * Usage:
 * ```typescript
 * import { seedDatabase } from '@/db/seeding'
 *
 * await seedDatabase(db)
 * ```
 */

import { seedPreferences } from './preferenceSeeding'

/**
 * Run all seeding functions to initialize the database
 *
 * This is the main entry point for database seeding.
 * All seeding functions are idempotent - they check for existing
 * data and only insert missing records.
 *
 * @param db - The Drizzle database instance
 */
export async function seedDatabase(db: any) {
  console.log('[Seeding] Starting database seeding...')

  try {
    // Seed preferences (includes user settings and app state)
    await seedPreferences(db)

    console.log('[Seeding] Database seeding completed successfully')
  } catch (error) {
    console.error('[Seeding] Database seeding failed:', error)
    throw error
  }
}

// Export individual seeding functions for granular control
export { seedPreferences } from './preferenceSeeding'
