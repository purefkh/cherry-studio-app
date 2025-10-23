import { desc, eq } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useMemo } from 'react'

import { loggerService } from '@/services/LoggerService'
import store from '@/store'
import { Topic } from '@/types/assistant'

import { db } from '@db'
import { transformDbToTopic } from '@db/mappers'
import { topicDatabase } from '@database'
import { topics as topicSchema } from '@db/schema'

const logger = loggerService.withContext('useTopic')

export function getCurrentTopicId(): string {
  return store.getState().topic.currentTopicId
}

export function useTopic(topicId: string) {
  const query = db.select().from(topicSchema).where(eq(topicSchema.id, topicId))

  // add deps https://stackoverflow.com/questions/79258085/drizzle-orm-uselivequery-doesnt-detect-parameters-change
  const { data: rawTopic, updatedAt } = useLiveQuery(query, [topicId])
  logger.debug('rawTopic', rawTopic)

  const updateTopic = async (topic: Topic) => {
    await topicDatabase.upsertTopics([topic])
  }

  const processedTopic = useMemo(() => {
    if (!rawTopic || rawTopic.length === 0) return null
    return transformDbToTopic(rawTopic[0])
  }, [rawTopic])

  // 当删除最后一个topic时会返回 rawTopic.length === 0, 需要返回加载状态
  if (!updatedAt || !processedTopic) {
    return {
      topic: null,
      isLoading: true,
      updateTopic
    }
  }

  return {
    topic: processedTopic,
    isLoading: false,
    updateTopic
  }
}

export function useTopics() {
  const query = db
    .select({
      id: topicSchema.id,
      assistant_id: topicSchema.assistant_id,
      name: topicSchema.name,
      created_at: topicSchema.created_at,
      updated_at: topicSchema.updated_at,
      isLoading: topicSchema.isLoading
    })
    .from(topicSchema)
    .orderBy(desc(topicSchema.created_at))
  const { data: rawTopics, updatedAt } = useLiveQuery(query)

  const processedTopics = useMemo(() => {
    if (!rawTopics) return []
    return rawTopics.map(transformDbToTopic)
  }, [rawTopics])

  if (!updatedAt) {
    return {
      topics: [],
      isLoading: true
    }
  }

  return {
    topics: processedTopics,
    isLoading: false
  }
}

export function useNewestTopic(): { topic: Topic | null; isLoading: boolean } {
  const query = db.select().from(topicSchema).orderBy(desc(topicSchema.created_at)).limit(1)

  const { data: rawTopics, updatedAt } = useLiveQuery(query)

  const processedTopic = useMemo(() => {
    if (!rawTopics || rawTopics.length === 0) return null
    return transformDbToTopic(rawTopics[0])
  }, [rawTopics])

  if (!updatedAt) {
    return {
      topic: null,
      isLoading: true
    }
  }

  return {
    topic: processedTopic,
    isLoading: false
  }
}
