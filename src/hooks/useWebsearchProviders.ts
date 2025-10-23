import { eq } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useMemo } from 'react'

import { WebSearchProvider } from '@/types/websearch'
import { usePreference } from './usePreference'

import { db } from '@db'
import { transformDbToWebSearchProvider } from '@db/mappers'
import { websearchProviderDatabase } from '@database'
import { websearch_providers } from '@db/schema'

export function useWebsearchProviders() {
  const query = db.select().from(websearch_providers)
  const { data: rawProviders, updatedAt } = useLiveQuery(query)

  const processedProviders = useMemo(() => {
    if (!rawProviders || rawProviders.length === 0) return []
    return rawProviders.map(provider => transformDbToWebSearchProvider(provider))
  }, [rawProviders])

  const freeProviders = useMemo(() => {
    return processedProviders.filter(provider => provider.id.startsWith('local-'))
  }, [processedProviders])

  const apiProviders = useMemo(() => {
    return processedProviders.filter(provider => !provider.id.startsWith('local-') && provider.id !== 'searxng')
  }, [processedProviders])

  if (!updatedAt || !rawProviders || rawProviders.length === 0) {
    return {
      freeProviders: [],
      apiProviders: [],
      isLoading: true
    }
  }

  return {
    freeProviders,
    apiProviders,
    isLoading: false
  }
}

/**
 * Fetch all web search providers from the database.
 */
export function useAllWebSearchProviders() {
  const query = db.select().from(websearch_providers)
  const { data: rawProviders, updatedAt } = useLiveQuery(query)

  const processedProviders = useMemo(() => {
    if (!rawProviders || rawProviders.length === 0) return []
    return rawProviders.map(provider => transformDbToWebSearchProvider(provider))
  }, [rawProviders])

  if (!updatedAt || !rawProviders || rawProviders.length === 0) {
    return {
      providers: [],
      isLoading: true
    }
  }

  return {
    providers: processedProviders,
    isLoading: false
  }
}

/**
 * Fetch a web search provider by its ID.
 * @param providerId
 */
export function useWebSearchProvider(providerId: string) {
  const query = db.select().from(websearch_providers).where(eq(websearch_providers.id, providerId))
  const { data: rawProvider, updatedAt } = useLiveQuery(query)

  const updateProvider = async (provider: WebSearchProvider) => {
    await websearchProviderDatabase.upsertWebSearchProviders([provider])
  }

  const provider = useMemo(() => {
    if (!rawProvider || rawProvider.length === 0) return null
    return transformDbToWebSearchProvider(rawProvider[0])
  }, [rawProvider])

  if (!updatedAt || !provider) {
    return {
      provider: null,
      isLoading: true,
      updateProvider
    }
  }

  return {
    provider,
    isLoading: false,
    updateProvider
  }
}

/**
 * Hook for managing websearch settings
 *
 * Now uses PreferenceService instead of Redux for better performance
 * and persistence.
 */
export function useWebsearchSettings() {
  // Get preferences using usePreference hooks
  const [searchWithDates, setSearchWithDatesRaw] = usePreference('websearch.search_with_time')
  const [overrideSearchService, setOverrideSearchServiceRaw] = usePreference('websearch.override_search_service')
  const [searchCount, setSearchCountRaw] = usePreference('websearch.max_results')
  const [contentLimit, setContentLimitRaw] = usePreference('websearch.content_limit')

  // Wrapper setters with validation (keeping same API as before)
  const setSearchWithDates = async (value: boolean) => {
    await setSearchWithDatesRaw(value)
  }

  const setOverrideSearchServiceSetting = async (value: boolean) => {
    await setOverrideSearchServiceRaw(value)
  }

  const setSearchCountSetting = async (value: number) => {
    if (typeof value === 'number' && !isNaN(value) && value >= 1 && value <= 20) {
      await setSearchCountRaw(Math.round(value))
    }
  }

  const setContentLimitSetting = async (value: number | undefined) => {
    if (value === undefined || (typeof value === 'number' && !isNaN(value) && value > 0)) {
      await setContentLimitRaw(value)
    }
  }

  return {
    // State
    searchWithDates,
    overrideSearchService,
    searchCount,
    contentLimit,
    // Actions (now async)
    setSearchWithDates,
    setOverrideSearchService: setOverrideSearchServiceSetting,
    setSearchCount: setSearchCountSetting,
    setContentLimit: setContentLimitSetting
  }
}
