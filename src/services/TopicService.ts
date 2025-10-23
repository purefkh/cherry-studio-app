import { t } from 'i18next'

import { loggerService } from '@/services/LoggerService'
import { Assistant, Topic } from '@/types/assistant'
import { uuid } from '@/utils'

import { topicDatabase } from '@database'
const logger = loggerService.withContext('Topic Service')

export async function createNewTopic(assistant: Assistant): Promise<Topic> {
  const newTopic: Topic = {
    id: uuid(),
    assistantId: assistant.id,
    name: t('topics.new_topic'),
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  logger.info('createNewTopic', newTopic.id)
  await topicDatabase.upsertTopics(newTopic)
  return newTopic
}

/**
 * rank topic by createdAt time
 * @returns Topic
 */
export async function getNewestTopic(): Promise<Topic | null> {
  const newestTopic = await topicDatabase.getNewestTopic()

  if (!newestTopic) {
    return null
  }

  return newestTopic
}

export async function renameTopic(topicId: string, newName: string): Promise<void> {
  try {
    const topic = await topicDatabase.getTopicById(topicId)

    if (!topic) {
      throw new Error(`Topic with ID ${topicId} not found`)
    }

    const updatedTopic: Topic = {
      ...topic,
      name: newName.trim(),
      updatedAt: Date.now()
    }
    await topicDatabase.upsertTopics([updatedTopic])

    logger.info('renameTopic', topicId, newName)
  } catch (error) {
    logger.error('Failed to rename topic:', error)
    throw error
  }
}
