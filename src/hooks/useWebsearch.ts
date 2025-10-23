/**
 * useWebsearch - React Hook for managing web search preferences
 *
 * Provides access to all web search configuration options with
 * automatic synchronization across components.
 *
 * @example Basic Usage
 * ```typescript
 * function SearchSettings() {
 *   const {
 *     searchWithTime,
 *     maxResults,
 *     overrideSearchService,
 *     contentLimit,
 *     setMaxResults
 *   } = useWebsearch()
 *
 *   return (
 *     <input
 *       type="number"
 *       value={maxResults}
 *       onChange={(e) => setMaxResults(Number(e.target.value))}
 *     />
 *   )
 * }
 * ```
 */

import { usePreference } from './usePreference'

export function useWebsearch() {
  const [searchWithTime, setSearchWithTime] = usePreference('websearch.search_with_time')
  const [maxResults, setMaxResults] = usePreference('websearch.max_results')
  const [overrideSearchService, setOverrideSearchService] = usePreference('websearch.override_search_service')
  const [contentLimit, setContentLimit] = usePreference('websearch.content_limit')

  return {
    searchWithTime,
    maxResults,
    overrideSearchService,
    contentLimit,
    setSearchWithTime,
    setMaxResults,
    setOverrideSearchService,
    setContentLimit
  }
}
