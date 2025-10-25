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

import { useCallback } from 'react'

import { useAppDispatch, useAppSelector } from '@/store'
import { setWelcomeShown as setWelcomeShownAction } from '@/store/app'

/**
 * Hook for managing application state
 *
 * Returns application lifecycle state and functions to update them.
 *
 * State variables:
 * - initialized: Whether the app has completed its first-time setup (preference-backed)
 * - welcomeShown: Whether the welcome screen has been shown to the user (redux-backed)
 */
export function useAppState() {
  const dispatch = useAppDispatch()
  const welcomeShown = useAppSelector(state => state.app.welcomeShown)

  const setWelcomeShown = useCallback(
    async (value: boolean) => {
      dispatch(setWelcomeShownAction(value))
    },
    [dispatch]
  )

  return {
    welcomeShown,
    setWelcomeShown
  }
}
