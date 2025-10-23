/**
 * Database Seeding Module
 *
 * This module provides functions to initialize the database with default data.
 * Seeding is idempotent - running it multiple times will not create duplicates.
 *
 * Seeding includes:
 * - Preferences: User-configurable settings with default values
 * - App State: Application lifecycle and initialization state
 *
 * Usage:
 * ```typescript
 * import { seedDatabase } from '@/db/seeding'
 *
 * await seedDatabase(db)
 * ```
 */

import { seedAppState } from './appStateSeeding'
import { seedPreferences } from './preferenceSeeding'

/**
 * Run all seeding functions to initialize the database
 *
 * This is the main entry point for database seeding.
 * It runs all seeding functions in the correct order:
 * 1. App state (application lifecycle)
 * 2. Preferences (user settings)
 *
 * All seeding functions are idempotent - they check for existing
 * data and only insert missing records.
 *
 * @param db - The Drizzle database instance
 */
export async function seedDatabase(db: any) {
  console.log('[Seeding] Starting database seeding...')

  try {
    // Seed app state first (controls initialization flow)
    await seedAppState(db)

    // Seed preferences (user settings)
    await seedPreferences(db)

    console.log('[Seeding] Database seeding completed successfully')
  } catch (error) {
    console.error('[Seeding] Database seeding failed:', error)
    throw error
  }
}

// Export individual seeding functions for granular control
export { seedAppState } from './appStateSeeding'
export { seedPreferences } from './preferenceSeeding'
