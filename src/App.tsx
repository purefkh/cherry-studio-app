import '@/i18n'
import 'react-native-reanimated'
import '../global.css'

import { HeroUINativeProvider, useTheme as useHerouiTheme } from 'heroui-native'
import { createTamagui, TamaguiProvider } from 'tamagui'
import { defaultConfig } from '@tamagui/config/v4'

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin'
import { useFonts } from 'expo-font'
import * as Localization from 'expo-localization'
import * as SplashScreen from 'expo-splash-screen'
import { SQLiteProvider } from 'expo-sqlite'
import React, { Suspense, useEffect } from 'react'
import { ActivityIndicator } from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { Provider, useSelector } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'

import { getWebSearchProviders } from '@/config/websearchProviders'
import { useTheme } from '@/hooks/useTheme'
import { loggerService } from '@/services/LoggerService'
import store, { persistor, RootState, useAppDispatch } from '@/store'
import { setInitialized } from '@/store/app'

import { assistantDatabase, mcpDatabase, providerDatabase, websearchProviderDatabase } from '@database'
import migrations from '../drizzle/migrations'
import { getSystemAssistants } from './config/assistants'
import { SYSTEM_PROVIDERS } from './config/providers'
import { DialogProvider } from './hooks/useDialog'
import { ToastProvider } from './hooks/useToast'
import MainStackNavigator from './navigators/MainStackNavigator'
import { storage } from './utils'
import { initBuiltinMcp } from './config/mcp'
import { DATABASE_NAME, db, expoDb } from '@db'
import { seedDatabase } from '@db/seeding'

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()
const logger = loggerService.withContext('DataBase Assistants')

// 数据库初始化组件
function DatabaseInitializer() {
  const { success, error } = useMigrations(db, migrations)
  const [loaded] = useFonts({
    JetbrainMono: require('./assets/fonts/JetBrainsMono-Regular.ttf')
  })
  const initialized = useSelector((state: RootState) => state.app.initialized)
  const dispatch = useAppDispatch()

  useDrizzleStudio(expoDb)

  useEffect(() => {
    if (success) {
      logger.info('Migrations completed successfully', expoDb.databasePath)
    } else if (error) {
      logger.error('Migrations failed', error)
    }
  }, [success, error])

  useEffect(() => {
    if (success && loaded) {
      const initializeApp = async () => {
        try {
          logger.info('First launch, initializing app data...')

          // Seed database with default preferences and app state
          await seedDatabase(db)

          const systemAssistants = getSystemAssistants()
          await assistantDatabase.upsertAssistants([...systemAssistants])
          await providerDatabase.upsertProviders(SYSTEM_PROVIDERS)
          const websearchProviders = getWebSearchProviders()
          await websearchProviderDatabase.upsertWebSearchProviders(websearchProviders)
          storage.set('language', Localization.getLocales()[0]?.languageTag)
          const builtinMcp = initBuiltinMcp()
          await mcpDatabase.upsertMcps(builtinMcp)
          dispatch(setInitialized(true))
          logger.info('App data initialized successfully.')
        } catch (e) {
          logger.error('Failed to initialize app data', e)
        }
      }

      initializeApp()
    }
  }, [success, loaded, initialized, dispatch])

  useEffect(() => {
    if (loaded && initialized) {
      SplashScreen.hideAsync()
    }
  }, [loaded, initialized])

  return null
}

// 主题和导航组件
function ThemedApp() {
  const { themeSetting, activeTheme } = useTheme()
  const { isDark } = useHerouiTheme()

  const config = createTamagui(defaultConfig)

  return (
    <TamaguiProvider config={config} defaultTheme={activeTheme}>
      <HeroUINativeProvider config={{ colorScheme: themeSetting }}>
        <KeyboardProvider>
          <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
            <SystemBars style={isDark ? 'dark' : 'light'} />
            <DatabaseInitializer />
            <DialogProvider>
              <ToastProvider>
                <BottomSheetModalProvider>
                  <MainStackNavigator />
                </BottomSheetModalProvider>
              </ToastProvider>
            </DialogProvider>
          </NavigationContainer>
        </KeyboardProvider>
      </HeroUINativeProvider>
    </TamaguiProvider>
  )
}

// Redux 状态管理组件
function AppWithRedux() {
  return (
    <Provider store={store}>
      <PersistGate loading={<ActivityIndicator size="large" />} persistor={persistor}>
        <ThemedApp />
      </PersistGate>
    </Provider>
  )
}

// 根组件 - 只负责最基础的 Provider 设置
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Suspense fallback={<ActivityIndicator size="large" />}>
        <SQLiteProvider databaseName={DATABASE_NAME} options={{ enableChangeListener: true }} useSuspense>
          <AppWithRedux />
        </SQLiteProvider>
      </Suspense>
    </GestureHandlerRootView>
  )
}
