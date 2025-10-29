import { BlurView } from 'expo-blur'
import React, { memo } from 'react'
import { Platform, Pressable, View } from 'react-native'

import { Text, XStack, YStack } from '@/componentsV2'
import { useTheme } from 'heroui-native'
import { Assistant } from '@/types/assistant'
import { formateEmoji } from '@/utils/formats'
import EmojiAvatar from './EmojiAvatar'
import GroupTag from './GroupTag'

interface AssistantItemCardProps {
  assistant: Assistant
  onAssistantPress: (assistant: Assistant) => void
}

const AssistantItemCard = ({ assistant, onAssistantPress }: AssistantItemCardProps) => {
  const { isDark } = useTheme()

  const emojiOpacity = Platform.OS === 'android' ? (isDark ? 0.1 : 0.9) : isDark ? 0.2 : 0.4

  const handlePress = () => {
    onAssistantPress(assistant)
  }

  return (
    <View className="p-1.5 w-full">
      <Pressable
        onPress={handlePress}
        className="h-[230px] bg-ui-card-background dark:bg-ui-card-background-dark rounded-2xl overflow-hidden active:bg-gray-20 dark:active:bg-gray-20"
        style={{ height: 230 }}>
        {/* Background blur emoji */}
        <XStack className="w-full h-1/2 absolute top-0 left-0 right-0 flex-wrap">
          {Array.from({ length: 8 }).map((_, index) => (
            <View key={index} className="w-1/4 scale-150 items-center justify-center">
              <Text className="text-[40px]" style={{ opacity: emojiOpacity }}>
                {formateEmoji(assistant.emoji)}
              </Text>
            </View>
          ))}
        </XStack>

        {/* BlurView layer */}
        <BlurView
          intensity={90}
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : 'none'}
          tint={isDark ? 'dark' : 'light'}
          style={{
            position: 'absolute',
            inset: 0
          }}
        />

        <YStack className="flex-1 gap-2 items-center rounded-2xl py-4 px-3.5">
          <EmojiAvatar emoji={assistant.emoji} size={90} borderWidth={5} borderColor={isDark ? '#333333' : '#f7f7f7'} />
          <Text
            className="text-base text-center text-text-primary dark:text-text-primary-dark"
            numberOfLines={1}
            ellipsizeMode="tail">
            {assistant.name}
          </Text>
          <YStack className="flex-1 justify-between items-center">
            <Text
              className="text-text-secondary dark:text-text-secondary-dark text-xs leading-[14px]"
              numberOfLines={3}
              ellipsizeMode="tail">
              {assistant.description}
            </Text>
            <XStack className="gap-2.5 flex-wrap h-[18px] justify-center overflow-hidden">
              {assistant.group &&
                assistant.group.map((group, index) => (
                  <GroupTag
                    key={index}
                    group={group}
                    className="text-[10px] bg-green-10 dark:bg-green-dark-10 text-green-100 dark:text-green-dark-100 border-[0.5px] border-green-20 dark:border-green-dark-20"
                  />
                ))}
            </XStack>
          </YStack>
        </YStack>
      </Pressable>
    </View>
  )
}

export default memo(AssistantItemCard)
