import Text from '@/componentsV2/base/Text'
import YStack from '@/componentsV2/layout/YStack'
import React from 'react'
import { useTranslation } from 'react-i18next'

export const EmptyModelView: React.FC = () => {
  const { t } = useTranslation()

  return (
    <YStack className="gap-12 w-full items-center">
      <YStack className="gap-3">
        <Text className="text-3xl font-bold text-center text-text-primary dark:text-text-primary-dark">
          {t('settings.models.empty.label')}
        </Text>
      </YStack>
    </YStack>
  )
}
