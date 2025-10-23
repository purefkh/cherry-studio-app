import React, { useEffect, useMemo, useState } from 'react' // 引入 useMemo
import { useTranslation } from 'react-i18next'

import { useToast } from '@/hooks/useToast'
import { getCurrentTopicId } from '@/hooks/useTopic'
import { getDefaultAssistant } from '@/services/AssistantService'
import { loggerService } from '@/services/LoggerService'
import { deleteMessagesByTopicId } from '@/services/MessagesService'
import { createNewTopic, renameTopic } from '@/services/TopicService'
import { useAppDispatch } from '@/store'
import { setCurrentTopicId } from '@/store/topic'
import { Topic } from '@/types/assistant'
import { DateGroupKey, getTimeFormatForGroup, groupItemsByDate, TimeFormat } from '@/utils/date'
import { TopicItem } from '../TopicItem'
import Text from '@/componentsV2/base/Text'
import YStack from '@/componentsV2/layout/YStack'
import { useDialog } from '@/hooks/useDialog'
import { FlashList } from '@shopify/flash-list'
import { topicDatabase } from '@/database'

const logger = loggerService.withContext('GroupTopicList')

interface GroupedTopicListProps {
  topics: Topic[]
  enableScroll: boolean
  handleNavigateChatScreen?: (topicId: string) => void
}

// ListItem 类型定义现在使用导入的 TimeFormat
type ListItem = { type: 'header'; title: string } | { type: 'topic'; topic: Topic; timeFormat: TimeFormat }

export function TopicList({ topics, enableScroll, handleNavigateChatScreen }: GroupedTopicListProps) {
  const { t } = useTranslation()
  const [localTopics, setLocalTopics] = useState<Topic[]>([])
  const dispatch = useAppDispatch()
  const toast = useToast()
  const dialog = useDialog()

  useEffect(() => {
    setLocalTopics(topics)
  }, [topics])

  const listData = useMemo(() => {
    const groupedTopics = groupItemsByDate(topics, topic => new Date(topic.updatedAt))

    const groupOrder: DateGroupKey[] = ['today', 'yesterday', 'thisWeek', 'lastWeek', 'lastMonth', 'older']
    const groupTitles: Record<DateGroupKey, string> = {
      today: t('common.today'),
      yesterday: t('common.yesterday'),
      thisWeek: t('common.this_week'),
      lastWeek: t('common.last_week'),
      lastMonth: t('common.last_month'),
      older: t('common.older')
    }

    const data: ListItem[] = []

    groupOrder.forEach(key => {
      const topicList = groupedTopics[key]

      if (topicList.length > 0) {
        data.push({ type: 'header', title: groupTitles[key] })

        const format = getTimeFormatForGroup(key)

        topicList.forEach(topic => {
          data.push({ type: 'topic', topic, timeFormat: format })
        })
      }
    })

    return data
  }, [topics, t])

  const handleDelete = async (topicId: string) => {
    dialog.open({
      type: 'error',
      title: t('message.delete_topic'),
      content: t('message.delete_topic_confirmation'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      onConFirm: async () => {
        try {
          const updatedTopics = localTopics.filter(topic => topic.id !== topicId)
          setLocalTopics(updatedTopics)

          await deleteMessagesByTopicId(topicId)
          await topicDatabase.deleteTopicById(topicId)

          toast.show(t('message.topic_deleted'))

          if (topicId === getCurrentTopicId()) {
            const nextTopic =
              updatedTopics.length > 0
                ? updatedTopics.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
                : null

            if (nextTopic) {
              dispatch(setCurrentTopicId(nextTopic.id))
              handleNavigateChatScreen?.(nextTopic.id)
              logger.info('navigateToChatScreen after delete', nextTopic)
            } else {
              const defaultAssistant = await getDefaultAssistant()
              const newTopic = await createNewTopic(defaultAssistant)
              dispatch(setCurrentTopicId(newTopic.id))
              handleNavigateChatScreen?.(newTopic.id)
              logger.info('navigateToChatScreen with new topic', newTopic)
            }
          }
        } catch (error) {
          logger.error('Error deleting topic:', error)
        }
      }
    })
  }

  const handleRename = async (topicId: string, newName: string) => {
    try {
      await renameTopic(topicId, newName)

      const updatedTopics = localTopics.map(topic =>
        topic.id === topicId ? { ...topic, name: newName, updatedAt: Date.now() } : topic
      )
      setLocalTopics(updatedTopics)

      logger.info('Topic renamed successfully', topicId, newName)
    } catch (error) {
      logger.error('Error renaming topic:', error)
      throw error
    }
  }

  const renderItem = ({ item, index }: { item: ListItem; index: number }) => {
    switch (item.type) {
      case 'header':
        return (
          <Text
            className="text-text-primary dark:text-text-primary-dark font-bold"
            style={{ paddingTop: index !== 0 ? 20 : 0 }}>
            {item.title}
          </Text>
        )
      case 'topic':
        return (
          <TopicItem
            topic={item.topic}
            timeFormat={item.timeFormat}
            onDelete={handleDelete}
            onRename={handleRename}
            handleNavigateChatScreen={handleNavigateChatScreen}
          />
        )
      default:
        return null
    }
  }

  return (
    <FlashList
      data={listData}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      scrollEnabled={enableScroll}
      keyExtractor={(item, index) => {
        if (item.type === 'header') {
          return `header-${item.title}-${index}`
        }

        return item.topic.id
      }}
      ItemSeparatorComponent={() => <YStack className="h-2.5" />}
      contentContainerStyle={{ paddingHorizontal: 20 }}
    />
  )
}
