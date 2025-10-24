import * as Localization from 'expo-localization'

import { getSystemAssistants } from '@/config/assistants'
import { initBuiltinMcp } from '@/config/mcp'
import { SYSTEM_PROVIDERS } from '@/config/providers'
import { getWebSearchProviders } from '@/config/websearchProviders'
import { storage } from '@/utils'
import { assistantDatabase, mcpDatabase, providerDatabase, websearchProviderDatabase } from '@database'
import { db } from '@db'
import { seedDatabase } from '@db/seeding'

import { loggerService } from './LoggerService'
import { preferenceService } from './PreferenceService'
import { providerService } from './ProviderService'

type AppDataMigration = {
  version: number
  description: string
  migrate: () => Promise<void>
}

const logger = loggerService.withContext('AppInitializationService')

const APP_DATA_MIGRATIONS: AppDataMigration[] = [
  {
    version: 1,
    description: 'Initial app data seeding',
    migrate: async () => {
      await seedDatabase(db)

      // Use direct database access for initial seeding (performance)
      // AssistantService cache will be built naturally as the app is used
      const systemAssistants = getSystemAssistants()
      await assistantDatabase.upsertAssistants(systemAssistants)

      await providerDatabase.upsertProviders(SYSTEM_PROVIDERS)

      const websearchProviders = getWebSearchProviders()
      await websearchProviderDatabase.upsertWebSearchProviders(websearchProviders)

      const locales = Localization.getLocales()
      if (locales.length > 0) {
        storage.set('language', locales[0]?.languageTag)
      }

      const builtinMcp = initBuiltinMcp()
      await mcpDatabase.upsertMcps(builtinMcp)
    }
  }
]

const LATEST_APP_DATA_VERSION = APP_DATA_MIGRATIONS[APP_DATA_MIGRATIONS.length - 1]?.version ?? 0

export async function runAppDataMigrations(): Promise<void> {
  const currentVersion = await preferenceService.get('app.initialization_version')

  if (LATEST_APP_DATA_VERSION === 0) {
    logger.info('No app data migrations defined. Skipping initialization step.')
    await preferenceService.set('app.initialized', true)
    return
  }

  if (currentVersion >= LATEST_APP_DATA_VERSION) {
    logger.info(`App data already up to date at version ${currentVersion}`)

    const isInitialized = await preferenceService.get('app.initialized')
    if (!isInitialized) {
      await preferenceService.set('app.initialized', true)
    }

    // Initialize ProviderService cache (loads default provider)
    await providerService.initialize()

    return
  }

  const wasInitialized = await preferenceService.get('app.initialized')
  if (wasInitialized) {
    await preferenceService.set('app.initialized', false)
  }

  const pendingMigrations = APP_DATA_MIGRATIONS.filter(migration => migration.version > currentVersion).sort(
    (a, b) => a.version - b.version
  )

  logger.info(
    `Preparing to run ${pendingMigrations.length} app data migration(s) from version ${currentVersion} to ${LATEST_APP_DATA_VERSION}`
  )

  for (const migration of pendingMigrations) {
    logger.info(`Running app data migration v${migration.version}: ${migration.description}`)

    try {
      await migration.migrate()
      await preferenceService.set('app.initialization_version', migration.version)
      logger.info(`Completed app data migration v${migration.version}`)
    } catch (error) {
      logger.error(`App data migration v${migration.version} failed`, error as Error)
      throw error
    }
  }

  await preferenceService.set('app.initialized', true)
  logger.info(`App data migrations completed. Current version: ${LATEST_APP_DATA_VERSION}`)

  // Initialize ProviderService cache (loads default provider)
  await providerService.initialize()
}

export function getAppDataVersion(): number {
  return LATEST_APP_DATA_VERSION
}
