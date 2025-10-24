export type PreferenceDefaultScopeType = PreferenceSchemas['default']
export type PreferenceKeyType = keyof PreferenceDefaultScopeType

export type PreferenceUpdateOptions = {
  optimistic: boolean
}

/**
 * Theme mode options for UI appearance
 */
export enum ThemeMode {
  light = 'light',
  dark = 'dark',
  system = 'system'
}

/**
 * Import PreferenceSchemas type from schemas file
 * This will be defined in preferenceSchemas.ts
 */
export interface PreferenceSchemas {
  default: {
    // User Configuration
    'user.avatar': string
    'user.name': string
    'user.id': string

    // UI Configuration
    'ui.theme_mode': ThemeMode

    // Topic State
    'topic.current_id': string

    // Web Search Configuration
    'websearch.search_with_time': boolean
    'websearch.max_results': number
    'websearch.override_search_service': boolean
    'websearch.content_limit': number | undefined

    // App State
    'app.initialized': boolean
  }
}
