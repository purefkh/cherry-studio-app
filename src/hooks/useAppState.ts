/**
 * useAppState - React Hook for managing application lifecycle state
 *
 * Provides access to app-level state variables that control
 * application initialization and onboarding flow.
 *
 * @example Basic Usage
 * ```typescript
 * function App() {
 *   const { initialized, welcomeShown, setInitialized } = useAppState()
 *
 *   useEffect(() => {
 *     if (!initialized) {
 *       initializeApp().then(() => {
 *         setInitialized(true)
 *       })
 *     }
 *   }, [initialized])
 *
 *   if (!initialized) return <LoadingScreen />
 *   if (!welcomeShown) return <WelcomeScreen />
 *   return <MainApp />
 * }
 * ```
 */

import { usePreference } from './usePreference'

/**
 * Hook for managing application state
 *
 * Returns application lifecycle state and functions to update them.
 * These states are persisted in the preference table.
 *
 * State variables:
 * - initialized: Whether the app has completed its first-time setup
 * - welcomeShown: Whether the welcome screen has been shown to the user
 */
export function useAppState() {
  const [initialized, setInitialized] = usePreference('app.initialized')
  const [welcomeShown, setWelcomeShown] = usePreference('app.welcome_shown')

  return {
    initialized,
    welcomeShown,
    setInitialized,
    setWelcomeShown
  }
}
