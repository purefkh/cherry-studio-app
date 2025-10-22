import React from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, Pressable } from 'react-native'
import { Image, Text, YStack } from '@/componentsV2'
import FastSquircleView from 'react-native-fast-squircle'

const WelcomeContent = () => {
  const { t } = useTranslation()

  return (
    <Pressable className="flex-1 justify-center items-center h-full w-full" onPress={() => Keyboard.dismiss()}>
      <YStack className="justify-center items-center">
        <FastSquircleView
          style={{
            width: 144,
            height: 144,
            borderRadius: 35,
            overflow: 'hidden'
          }}
          cornerSmoothing={0.6}>
          <Image className="w-full h-full" source={require('@/assets/images/favicon.png')} />
        </FastSquircleView>
        <Text className="text-[18px] font-bold text-primary mt-5">{t('chat.title')}</Text>
      </YStack>
    </Pressable>
  )
}

export default WelcomeContent
