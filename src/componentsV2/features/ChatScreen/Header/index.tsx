import { DrawerNavigationProp } from '@react-navigation/drawer'
import { DrawerActions, ParamListBase, useNavigation } from '@react-navigation/native'
import React from 'react'

import { XStack, IconButton } from '@/componentsV2'
import { Menu } from '@/componentsV2/icons/LucideIcon'
import { useAssistant } from '@/hooks/useAssistant'
import { Topic } from '@/types/assistant'

import { NewTopicButton } from './NewTopicButton'
import { AssistantSelection } from './AssistantSelection'

interface HeaderBarProps {
  topic: Topic
}

export const ChatScreenHeader = ({ topic }: HeaderBarProps) => {
  const navigation = useNavigation<DrawerNavigationProp<ParamListBase>>()
  const { assistant, isLoading } = useAssistant(topic.assistantId)

  const handleMenuPress = () => {
    navigation.dispatch(DrawerActions.openDrawer())
  }

  if (isLoading || !assistant) {
    return null
  }

  return (
    <XStack className="items-center h-11 justify-between px-3.5">
      <XStack className="items-center min-w-10">
        <IconButton onPress={handleMenuPress} icon={<Menu size={24} />} />
      </XStack>
      <XStack className="flex-1 justify-center items-center">
        <AssistantSelection assistant={assistant} topic={topic} />
      </XStack>
      <XStack className="items-center min-w-10 justify-end">
        <NewTopicButton assistant={assistant} />
      </XStack>
    </XStack>
  )
}
