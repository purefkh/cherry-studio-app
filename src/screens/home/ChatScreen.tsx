import { DrawerNavigationProp } from '@react-navigation/drawer'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { ImpactFeedbackStyle } from 'expo-haptics'
import { ActivityIndicator, Platform, View } from 'react-native'
import { PanGestureHandler, State } from 'react-native-gesture-handler'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { YStack, SafeAreaContainer } from '@/componentsV2'
import { MessageInputContainer } from '@/componentsV2/features/ChatScreen/MessageInput/MessageInputContainer'

import { useAssistant } from '@/hooks/useAssistant'
import { useBottom } from '@/hooks/useBottom'
import { useTopic } from '@/hooks/useTopic'
import { useAppSelector } from '@/store'
import { haptic } from '@/utils/haptic'

import ChatContent from './ChatContent'
import { ChatScreenHeader } from '@/componentsV2/features/ChatScreen/Header'
import { loggerService } from '@/services/LoggerService'
import React, { useEffect } from 'react'

const logger = loggerService.withContext('ChatScreen')

const ChatScreen = () => {
  const navigation = useNavigation<DrawerNavigationProp<any>>()
  const topicId = useAppSelector(state => state.topic.currentTopicId)

  const { topic, isLoading } = useTopic(topicId ?? '')
  const { assistant, isLoading: assistantLoading } = useAssistant(topic?.assistantId || '')
  const specificBottom = useBottom()

  // 处理侧滑手势
  const handleSwipeGesture = (event: any) => {
    const { translationX, velocityX, state } = event.nativeEvent

    // 检测向右滑动
    if (state === State.END) {
      // 全屏可侧滑触发：滑动距离大于20且速度大于100，或者滑动距离大于80
      const hasGoodDistance = translationX > 20
      const hasGoodVelocity = velocityX > 100
      const hasExcellentDistance = translationX > 80

      if ((hasGoodDistance && hasGoodVelocity) || hasExcellentDistance) {
        haptic(ImpactFeedbackStyle.Medium)
        navigation.dispatch(DrawerActions.openDrawer())
      }
    }
  }

  useEffect(() => {
    logger.info('ChatScreen useEffect1')
    logger.info('ChatScreen useEffect2')
    logger.info('ChatScreen useEffect3')
    logger.info('ChatScreen useEffect4')
  }, [])

  if (!topic || isLoading || !assistant || assistantLoading) {
    return (
      <SafeAreaContainer style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </SafeAreaContainer>
    )
  }

  return (
    <SafeAreaContainer style={{ paddingBottom: 0 }}>
      <PanGestureHandler
        onGestureEvent={handleSwipeGesture}
        onHandlerStateChange={handleSwipeGesture}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-20, 20]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? -20 : -specificBottom}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <YStack className="flex-1">
            <ChatScreenHeader topic={topic} />

            <View
              style={{
                flex: 1
              }}>
              {/* ChatContent use key to re-render screen content */}
              {/* if remove key, change topic will not re-render */}
              <ChatContent key={topicId} topic={topic} assistant={assistant} />
            </View>
            <MessageInputContainer topic={topic} />
          </YStack>
        </KeyboardAvoidingView>
      </PanGestureHandler>
    </SafeAreaContainer>
  )
}

export default ChatScreen
