import { Dispatch } from '@reduxjs/toolkit'
import { Directory, File, Paths } from 'expo-file-system'
import dayjs from 'dayjs'
import { unzip, zip } from 'react-native-zip-archive'

import { DEFAULT_BACKUP_STORAGE, DEFAULT_DOCUMENTS_STORAGE } from '@/constants/storage'
import { getSystemAssistants } from '@/config/assistants'
import { loggerService } from '@/services/LoggerService'
import { preferenceService } from '@/services/PreferenceService'
import { Assistant, Topic } from '@/types/assistant'
import { ExportIndexedData, ExportReduxData, ImportIndexedData, ImportReduxData, Setting } from '@/types/databackup'
import { FileMetadata } from '@/types/file'
import { Message } from '@/types/message'

import {
  assistantDatabase,
  messageBlockDatabase,
  messageDatabase,
  providerDatabase,
  topicDatabase,
  websearchProviderDatabase
} from '@database'
import { assistantService } from './AssistantService'
import { topicService } from './TopicService'
const logger = loggerService.withContext('Backup Service')

export type RestoreStepId = 'restore_settings' | 'restore_messages'

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'error'

export type ProgressUpdate = {
  step: RestoreStepId
  status: StepStatus
  error?: string
}

type OnProgressCallback = (update: ProgressUpdate) => void

async function restoreIndexedDbData(data: ExportIndexedData, onProgress: OnProgressCallback, dispatch: Dispatch) {
  onProgress({ step: 'restore_messages', status: 'in_progress' })

  // Batch import topics directly to database for performance
  await topicDatabase.upsertTopics(data.topics)
  await messageDatabase.upsertMessages(data.messages)

  // Filter message_blocks to only include those with valid message_id references
  const validMessageIds = new Set(data.messages.map(msg => msg.id))
  const validBlocks = data.message_blocks.filter(block => validMessageIds.has(block.messageId))
  const filteredCount = data.message_blocks.length - validBlocks.length

  if (filteredCount > 0) {
    logger.warn(`Filtered out ${filteredCount} message block(s) with invalid message_id references during restore`)
  }

  await messageBlockDatabase.upsertBlocks(validBlocks)

  // Invalidate caches after bulk import to ensure consistency
  topicService.invalidateCache()
  assistantService.invalidateCache()

  if (data.settings) {
    const avatarSetting = data.settings.find(setting => setting.id === 'image://avatar')

    if (avatarSetting) {
      await preferenceService.set('user.avatar', avatarSetting.value)
    }
  }

  onProgress({ step: 'restore_messages', status: 'completed' })
}

async function restoreReduxData(data: ExportReduxData, onProgress: OnProgressCallback, dispatch: Dispatch) {
  onProgress({ step: 'restore_settings', status: 'in_progress' })
  await providerDatabase.upsertProviders(data.llm.providers)
  const allSourceAssistants = [data.assistants.defaultAssistant, ...data.assistants.assistants]

  // default assistant为built_in, 其余为external
  const assistants = allSourceAssistants.map(
    (assistant, index) =>
      ({
        ...assistant,
        type: index === 0 ? 'system' : 'external'
      }) as Assistant
  )
  await assistantDatabase.upsertAssistants(assistants)
  await websearchProviderDatabase.upsertWebSearchProviders(data.websearch.providers)
  await new Promise(resolve => setTimeout(resolve, 200)) // Delay between steps

  await preferenceService.set('user.name', data.settings.userName)
  onProgress({ step: 'restore_settings', status: 'completed' })
}

export async function restore(
  backupFile: Omit<FileMetadata, 'md5'>,
  onProgress: OnProgressCallback,
  dispatch: Dispatch
) {
  if (!DEFAULT_DOCUMENTS_STORAGE.exists) {
    DEFAULT_DOCUMENTS_STORAGE.create({ intermediates: true, overwrite: true })
  }

  let unzipPath: string | undefined

  try {
    const extractedDirPath = Paths.join(DEFAULT_DOCUMENTS_STORAGE, backupFile.name.replace('.zip', ''))
    await unzip(backupFile.path, extractedDirPath)
    unzipPath = extractedDirPath

    const dataFile = new File(extractedDirPath, 'data.json')

    const { reduxData, indexedData } = transformBackupData(dataFile.textSync())

    await restoreReduxData(reduxData, onProgress, dispatch)
    await restoreIndexedDbData(indexedData, onProgress, dispatch)
  } catch (error) {
    logger.error('restore error: ', error)
    throw error
  } finally {
    if (unzipPath) {
      try {
        new Directory(unzipPath).delete()
      } catch (cleanupError) {
        logger.error('Failed to cleanup temporary directory: ', cleanupError)
      }
    }
  }
}

function transformBackupData(data: string): { reduxData: ExportReduxData; indexedData: ExportIndexedData } {
  const orginalData = JSON.parse(data)
  const localStorage = orginalData.localStorage

  const persistDataString = localStorage['persist:cherry-studio']

  const rawReduxData = JSON.parse(persistDataString)

  const reduxData: ImportReduxData = {
    assistants: JSON.parse(rawReduxData.assistants),
    llm: JSON.parse(rawReduxData.llm),
    websearch: JSON.parse(rawReduxData.websearch),
    settings: JSON.parse(rawReduxData.settings)
  }

  const topicsFromRedux = reduxData.assistants.assistants
    .flatMap(a => a.topics)
    .concat(reduxData.assistants.defaultAssistant.topics)

  const indexedDb: ImportIndexedData = orginalData.indexedDB

  const allMessages = indexedDb.topics.flatMap(t => t.messages)

  const messagesByTopicId = allMessages.reduce<Record<string, Message[]>>((acc, message) => {
    const { topicId } = message

    if (!acc[topicId]) {
      acc[topicId] = []
    }

    acc[topicId].push(message)
    return acc
  }, {})

  // 4. 遍历 redux 中的 topics，并将分组后的 messages 附加到每个 topic 上
  const topicsWithMessages = topicsFromRedux.map(topic => {
    const correspondingMessages = messagesByTopicId[topic.id] || []

    return {
      ...topic,
      messages: correspondingMessages
    }
  })

  return {
    reduxData: reduxData,
    indexedData: {
      topics: topicsWithMessages,
      message_blocks: indexedDb.message_blocks,
      messages: allMessages,
      settings: indexedDb.settings
    }
  }
}

async function getAllData(): Promise<string> {
  try {
    const [providers, webSearchProviders, assistants, topics, messages, messageBlocks] = await Promise.all([
      providerDatabase.getAllProviders(),
      websearchProviderDatabase.getAllWebSearchProviders(),
      assistantService.getExternalAssistants(),
      topicService.getTopics(),
      messageDatabase.getAllMessages(),
      messageBlockDatabase.getAllBlocks()
    ])

    // Get preferences for backup
    const userName = await preferenceService.get('user.name')
    const userAvatar = await preferenceService.get('user.avatar')
    const searchWithTime = await preferenceService.get('websearch.search_with_time')
    const maxResults = await preferenceService.get('websearch.max_results')
    const overrideSearchService = await preferenceService.get('websearch.override_search_service')
    const contentLimit = await preferenceService.get('websearch.content_limit')

    let defaultAssistant: Assistant | null = null

    try {
      defaultAssistant = await assistantService.getAssistant('default')
    } catch (error) {
      logger.warn('Failed to load default assistant from service, falling back to system config.', error)
    }

    if (!defaultAssistant) {
      const systemAssistants = getSystemAssistants()
      defaultAssistant = systemAssistants.find(assistant => assistant.id === 'default') || systemAssistants[0] || null
    }

    const topicsByAssistantId = topics.reduce<Record<string, Topic[]>>((accumulator, topic) => {
      if (!accumulator[topic.assistantId]) {
        accumulator[topic.assistantId] = []
      }

      accumulator[topic.assistantId].push(topic)
      return accumulator
    }, {})

    const defaultAssistantPayload: Assistant = defaultAssistant
      ? {
          ...defaultAssistant,
          topics: topicsByAssistantId[defaultAssistant.id] ?? defaultAssistant.topics ?? []
        }
      : {
          id: 'default',
          name: 'Default Assistant',
          prompt: '',
          topics: topicsByAssistantId['default'] ?? [],
          type: 'system'
        }

    const assistantsWithTopics = assistants.map(assistant => ({
      ...assistant,
      topics: topicsByAssistantId[assistant.id] ?? assistant.topics ?? []
    }))

    const assistantsPayload = {
      defaultAssistant: defaultAssistantPayload,
      assistants: assistantsWithTopics
    }

    const llmPayload = {
      providers
    }

    const websearchPayload = {
      searchWithTime,
      maxResults,
      overrideSearchService,
      contentLimit,
      providers: webSearchProviders
    }

    const settingsPayload = {
      userName
    }

    const persistDataString = JSON.stringify({
      assistants: JSON.stringify(assistantsPayload),
      llm: JSON.stringify(llmPayload),
      websearch: JSON.stringify(websearchPayload),
      settings: JSON.stringify(settingsPayload)
    })

    const localStorage: Record<string, string> = {
      'persist:cherry-studio': persistDataString
    }

    const messagesByTopic = messages.reduce<Record<string, Message[]>>((accumulator, message) => {
      if (!accumulator[message.topicId]) {
        accumulator[message.topicId] = []
      }

      accumulator[message.topicId].push(message)
      return accumulator
    }, {})

    const indexedSettings: Setting[] = userAvatar
      ? [
          {
            id: 'image://avatar',
            value: userAvatar
          }
        ]
      : []

    const indexedDB: ImportIndexedData = {
      topics: topics.map(topic => ({
        id: topic.id,
        messages: messagesByTopic[topic.id] ?? []
      })),
      message_blocks: messageBlocks,
      settings: indexedSettings
    }

    const backupData = JSON.stringify({
      time: Date.now(),
      version: 5,
      indexedDB,
      localStorage: localStorage
    })

    return backupData
  } catch (error) {
    logger.error('Error occurred during backup', error)
    throw error
  }
}

async function zipBackupData(backupData: string) {
  if (!DEFAULT_BACKUP_STORAGE.exists) {
    DEFAULT_BACKUP_STORAGE.create({ intermediates: true, idempotent: true })
  }

  const tempDirectory = new Directory(DEFAULT_BACKUP_STORAGE, `tmp-${Date.now()}`)
  tempDirectory.create({ intermediates: true })

  try {
    const dataFile = new File(tempDirectory, 'data.json')

    if (dataFile.exists) {
      dataFile.delete()
    }

    dataFile.write(backupData)

    const filename = `cherry-studio.${dayjs().format('YYYYMMDDHHmm')}.zip`
    const zipFile = new File(DEFAULT_BACKUP_STORAGE, filename)

    if (zipFile.exists) {
      zipFile.delete()
    }

    await zip([dataFile.uri], zipFile.uri)

    return zipFile.uri
  } catch (error) {
    logger.error('Failed to create backup zip:', error)
    throw error
  } finally {
    try {
      tempDirectory.delete()
    } catch (cleanupError) {
      logger.error('Failed to cleanup temporary backup directory:', cleanupError)
    }
  }
}

export async function backup() {
  // 1. 获取备份数据 json格式
  // 主要备份 providers websearchProviders assistants
  // topics messages message_blocks settings
  const backupData = await getAllData()
  // 2. 保存到zip中
  const backupFile = await zipBackupData(backupData)
  // 3. 返回文件路径
  return backupFile
}
