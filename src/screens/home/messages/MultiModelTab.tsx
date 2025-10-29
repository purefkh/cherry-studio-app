import { MotiView } from 'moti'
import React, { FC, useState } from 'react'
import { View } from 'react-native'
import { XStack } from '@/componentsV2'
import { cn, Tabs } from 'heroui-native'

import { Assistant } from '@/types/assistant'
import { AssistantMessageStatus, GroupedMessage, MessageBlock } from '@/types/message'
import { MultiModalIcon } from '@/componentsV2/icons'
import MessageItem from './Message'
import MessageFooter from './MessageFooter'

interface MultiModelTabProps {
  assistant: Assistant
  messages: GroupedMessage[]
  messageBlocks: Record<string, MessageBlock[]>
}

const MultiModelTab: FC<MultiModelTabProps> = ({ assistant, messages, messageBlocks }) => {
  const [currentTab, setCurrentTab] = useState('0')

  if (!messages || messages.length === 0) {
    return null
  }

  return (
    <View className="flex-1">
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <Tabs.ScrollView>
          <Tabs.List aria-label="Model tabs" className="bg-transparent">
            <Tabs.Indicator />
            <XStack className="gap-[5px]">
              {messages.map((_message, index) => {
                const tabValue = index.toString()
                return (
                  <Tabs.Trigger key={tabValue} value={tabValue}>
                    <XStack className="gap-1 items-center justify-center">
                      {_message.useful && <MultiModalIcon size={14} />}
                      <Tabs.Label
                        className={cn(
                          'text-xs',
                          currentTab === tabValue ? 'text-green-100 dark:text-green-dark-100' : undefined
                        )}>
                        @{_message.model?.name}({_message.model?.provider})
                      </Tabs.Label>
                    </XStack>
                  </Tabs.Trigger>
                )
              })}
            </XStack>
          </Tabs.List>
        </Tabs.ScrollView>
      </Tabs>

      <View className="flex-1">
        {messages.map((message, index) => (
          <View key={index} className={currentTab === index.toString() ? 'flex-1' : 'hidden'}>
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{
                translateY: 0,
                opacity: 1
              }}
              exit={{ opacity: 1, translateY: -10 }}
              transition={{
                type: 'timing'
              }}>
              <MessageItem message={message} assistant={assistant} isMultiModel={true} messageBlocks={messageBlocks} />
              {/* 输出过程中不显示footer */}
              {message.status !== AssistantMessageStatus.PROCESSING && (
                <MessageFooter assistant={assistant} message={message} isMultiModel={true} />
              )}
            </MotiView>
          </View>
        ))}
      </View>
    </View>
  )
}

export default MultiModelTab
