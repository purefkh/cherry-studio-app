import { SYSTEM_MODELS } from '@/config/models/default'
import {
  DEFAULT_CONTEXTCOUNT,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  MAX_CONTEXT_COUNT,
  UNLIMITED_CONTEXT_COUNT
} from '@/constants'
import i18n from '@/i18n'
import { loggerService } from '@/services/LoggerService'
import { Assistant, AssistantSettings, Topic } from '@/types/assistant'
import { uuid } from '@/utils'

import { assistantDatabase } from '@database'
const logger = loggerService.withContext('Assistant Service')

export async function getDefaultAssistant(): Promise<Assistant> {
  return await assistantDatabase.getAssistantById('default')
}

export function getDefaultTopic(assistantId: string): Topic {
  return {
    id: uuid(),
    assistantId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    name: i18n.t('chat.default.topic.name'),
    isLoading: false
  }
}

export function getDefaultModel() {
  // todo
  return SYSTEM_MODELS.cherryin[0]
}

export const getAssistantSettings = (assistant: Assistant): AssistantSettings => {
  const contextCount = assistant?.settings?.contextCount ?? DEFAULT_CONTEXTCOUNT

  const getAssistantMaxTokens = () => {
    if (assistant.settings?.enableMaxTokens) {
      const maxTokens = assistant.settings.maxTokens

      if (typeof maxTokens === 'number') {
        return maxTokens > 0 ? maxTokens : DEFAULT_MAX_TOKENS
      }

      return DEFAULT_MAX_TOKENS
    }

    return undefined
  }

  return {
    contextCount: contextCount === MAX_CONTEXT_COUNT ? UNLIMITED_CONTEXT_COUNT : contextCount,
    temperature: assistant?.settings?.temperature ?? DEFAULT_TEMPERATURE,
    enableTemperature: assistant?.settings?.enableTemperature ?? true,
    topP: assistant?.settings?.topP ?? 1,
    enableTopP: assistant?.settings?.enableTopP ?? true,
    enableMaxTokens: assistant?.settings?.enableMaxTokens ?? false,
    maxTokens: getAssistantMaxTokens(),
    streamOutput: assistant?.settings?.streamOutput ?? true,
    toolUseMode: assistant?.settings?.toolUseMode ?? 'prompt',
    defaultModel: assistant?.defaultModel ?? undefined,
    reasoning_effort: assistant?.settings?.reasoning_effort ?? undefined,
    customParameters: assistant?.settings?.customParameters ?? []
  }
}

export async function createAssistant() {
  const newAssistant: Assistant = {
    id: uuid(),
    emoji: '⭐',
    name: i18n.t('settings.assistant.title'),
    prompt: '',
    topics: [],
    type: 'external'
  }

  await assistantDatabase.upsertAssistants([newAssistant])
  return newAssistant
}
