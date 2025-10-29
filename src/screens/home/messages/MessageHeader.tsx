import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { ModelIcon } from '@/componentsV2/icons'
import { Text, XStack } from '@/componentsV2'
import { Message } from '@/types/message'
import { storage } from '@/utils'
import { getBaseModelName } from '@/utils/naming'

interface MessageHeaderProps {
  message: Message
}

const MessageHeader: React.FC<MessageHeaderProps> = ({ message }) => {
  const { t } = useTranslation()
  const currentLanguage = storage.getString('language')
  return (
    <View>
      {message.model && (
        <XStack className="gap-2 items-center">
          <ModelIcon model={message.model} />
          <Text className="text-base">{getBaseModelName(message.model?.name)}</Text>
          <Text>|</Text>
          <Text className="text-base text-text-secondary dark:text-text-secondary-dark">
            {t(`provider.${message.model?.provider}`)}
          </Text>
          <Text className="text-xs text-text-secondary dark:text-text-secondary-dark">
            {new Date(message.createdAt).toLocaleTimeString(currentLanguage, {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </Text>
        </XStack>
      )}
    </View>
  )
}

export default React.memo(MessageHeader)
