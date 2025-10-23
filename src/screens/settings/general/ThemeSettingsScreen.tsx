import React from 'react'
import { useTranslation } from 'react-i18next'

import { Container, HeaderBar, PressableRow, SafeAreaContainer, Text, XStack, YStack } from '@/componentsV2'
import { themeOptions } from '@/config/theme'
import { useSettings } from '@/hooks/useSettings'

export default function ThemeSettingsScreen() {
  const { t } = useTranslation()
  const { theme: currentTheme, setTheme: setCurrentTheme } = useSettings()

  return (
    <SafeAreaContainer className="flex-1">
      <HeaderBar title={t('settings.general.theme.title')} />
      <Container>
        <YStack className="flex-1 gap-3 px-4">
          {themeOptions.map(opt => (
            <PressableRow
              key={opt.value}
              onPress={() => setCurrentTheme(opt.value).catch(console.error)}
              className="bg-ui-card-background dark:bg-ui-card-background-dark p-4 rounded-xl">
              <XStack className="items-center">
                <Text className="text-base">{t(opt.label)}</Text>
              </XStack>

              <XStack
                className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                  currentTheme === opt.value
                    ? 'border-gray-900 dark:border-gray-100'
                    : 'border-gray-400 dark:border-gray-600'
                }`}>
                {currentTheme === opt.value && (
                  <XStack className="w-2.5 h-2.5 rounded-full bg-gray-900 dark:bg-gray-100" />
                )}
              </XStack>
            </PressableRow>
          ))}
        </YStack>
      </Container>
    </SafeAreaContainer>
  )
}
