import { ImpactFeedbackStyle } from 'expo-haptics'
import { isEmpty } from 'lodash'
import { useEffect, useState } from 'react'
import { Keyboard } from 'react-native'

import { isReasoningModel } from '@/config/models'
import { useMessageOperations } from '@/hooks/useMessageOperation'
import { loggerService } from '@/services/LoggerService'
import { sendMessage as _sendMessage, getUserMessage } from '@/services/MessagesService'
import { topicService } from '@/services/TopicService'
import { Assistant, Model, Topic } from '@/types/assistant'
import { FileMetadata } from '@/types/file'
import { MessageInputBaseParams } from '@/types/message'
import { haptic } from '@/utils/haptic'

const logger = loggerService.withContext('Message Input')

export const useMessageInputLogic = (topic: Topic, assistant: Assistant) => {
  const [text, setText] = useState('')
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [mentions, setMentions] = useState<Model[]>([])
  const { pauseMessages } = useMessageOperations(topic)

  const isReasoning = isReasoningModel(assistant.model)

  useEffect(() => {
    setMentions(assistant.defaultModel ? [assistant.defaultModel] : [])
  }, [assistant.defaultModel])

  const sendMessage = async () => {
    if (isEmpty(text.trim())) {
      haptic(ImpactFeedbackStyle.Rigid)
      return
    }

    haptic(ImpactFeedbackStyle.Medium)

    setText('')
    setFiles([])
    Keyboard.dismiss()
    await topicService.updateTopic(topic.id, { isLoading: true })

    try {
      const baseUserMessage: MessageInputBaseParams = { assistant, topic, content: text }

      if (files.length > 0) {
        baseUserMessage.files = files
      }

      const { message, blocks } = getUserMessage(baseUserMessage)

      if (mentions.length > 0) {
        message.mentions = mentions
      }

      await _sendMessage(message, blocks, assistant, topic.id)
    } catch (error) {
      logger.error('Error sending message:', error)
    }
  }

  const onPause = async () => {
    haptic(ImpactFeedbackStyle.Medium)

    try {
      await pauseMessages()
    } catch (error) {
      logger.error('Error pause message:', error)
    }
  }

  return {
    text,
    setText,
    files,
    setFiles,
    mentions,
    setMentions,
    isReasoning,
    sendMessage,
    onPause
  }
}
