import { appStateTable } from '@db/schema'
import { eq } from 'drizzle-orm'

/**
 * Application state keys and their default values
 */
const APP_STATE_DEFAULTS = {
  'app.initialized': {
    value: false,
    description: 'Whether the application has completed initialization'
  },
  'app.welcome_shown': {
    value: false,
    description: 'Whether the welcome screen has been shown to the user'
  }
} as const

type AppStateKey = keyof typeof APP_STATE_DEFAULTS

/**
 * Seed the app_state table with default values
 *
 * This function initializes application state keys with their default values.
 * It checks for existing state and only inserts missing ones, preserving
 * any runtime-modified values.
 *
 * App state differs from preferences in that:
 * - Managed by application logic, not user configuration
 * - Controls application lifecycle and initialization flow
 * - Not intended for user modification or cross-device sync
 *
 * @param db - The Drizzle database instance
 */
export async function seedAppState(db: any) {
  console.log('[Seeding] Starting app state seeding...')

  let insertedCount = 0
  let skippedCount = 0

  // Iterate through all app state defaults
  for (const [key, config] of Object.entries(APP_STATE_DEFAULTS)) {
    const stateKey = key as AppStateKey

    try {
      // Check if state already exists
      const existing = await db.select().from(appStateTable).where(eq(appStateTable.key, stateKey)).get()

      if (existing) {
        skippedCount++
        console.log(`[Seeding] Skipping existing app state: ${stateKey}`)
        continue
      }

      // Insert new app state
      await db.insert(appStateTable).values({
        key: stateKey,
        value: config.value as any, // Drizzle will handle JSON serialization
        description: config.description
      })

      insertedCount++
      console.log(`[Seeding] Inserted app state: ${stateKey} = ${config.value}`)
    } catch (error) {
      console.error(`[Seeding] Error seeding app state ${stateKey}:`, error)
      throw error
    }
  }

  console.log(
    `[Seeding] App state seeding completed: ${insertedCount} inserted, ${skippedCount} skipped, ${insertedCount + skippedCount} total`
  )
}
