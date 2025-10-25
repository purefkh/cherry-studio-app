import { WebSearchProvider } from '@/types/websearch'
import {
  getAllWebSearchProviders as _getAllWebSearchProviders,
  getWebSearchProviderById as _getWebSearchProviderById,
  getWebSearchProviderByIdSync as _getWebSearchProviderByIdSync,
  upsertWebSearchProviders as _upsertWebSearchProviders,
  deleteWebSearchProvider as _deleteWebSearchProvider
} from '@db/queries/websearchProviders.queries'

export async function upsertWebSearchProviders(providers: WebSearchProvider[]) {
  return _upsertWebSearchProviders(providers)
}

export async function getAllWebSearchProviders() {
  return _getAllWebSearchProviders()
}

export async function getWebSearchProviderById(providerId: string) {
  return _getWebSearchProviderById(providerId)
}

export function getWebSearchProviderByIdSync(providerId: string) {
  return _getWebSearchProviderByIdSync(providerId)
}

export async function deleteWebSearchProvider(providerId: string) {
  return _deleteWebSearchProvider(providerId)
}

export const websearchProviderDatabase = {
  upsertWebSearchProviders,
  getAllWebSearchProviders,
  getWebSearchProviderById,
  getWebSearchProviderByIdSync,
  deleteWebSearchProvider
}
