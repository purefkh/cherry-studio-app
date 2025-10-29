import React, { FC } from 'react'
import { View } from 'react-native'

import { Assistant } from '@/types/assistant'
import { AssistantMessageStatus, GroupedMessage, MessageBlock } from '@/types/message'

import MessageItem from './Message'
import MessageHeader from './MessageHeader'
import MessageFooter from './MessageFooter'
import MultiModelTab from './MultiModelTab'

interface MessageGroupProps {
  assistant: Assistant
  item: [string, GroupedMessage[]]
  messageBlocks: Record<string, MessageBlock[]>
}

const MessageGroup: FC<MessageGroupProps> = ({ assistant, item, messageBlocks }) => {
  const [key, messagesInGroup] = item

  const renderUserMessage = () => {
    return <MessageItem message={messagesInGroup[0]} assistant={assistant} messageBlocks={messageBlocks} />
  }

  const renderAssistantMessages = () => {
    if (messagesInGroup.length === 1) {
      return (
        <View className="gap-2">
          <View className="px-4">
            <MessageHeader message={messagesInGroup[0]} />
          </View>
          <MessageItem message={messagesInGroup[0]} assistant={assistant} messageBlocks={messageBlocks} />
          {/* 输出过程中不显示footer */}
          {messagesInGroup[0].status !== AssistantMessageStatus.PROCESSING && (
            <MessageFooter assistant={assistant} message={messagesInGroup[0]} />
          )}
        </View>
      )
    }

    return (
      <View className="gap-2">
        {/*<MessageHeader assistant={assistant} message={messagesInGroup[0]} />*/}
        <MultiModelTab assistant={assistant} messages={messagesInGroup} messageBlocks={messageBlocks} />
      </View>
    )
  }

  return (
    <View>
      {key.includes('user') && renderUserMessage()}
      {key.includes('assistant') && renderAssistantMessages()}
    </View>
  )
}

export default MessageGroup
