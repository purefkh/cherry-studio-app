import { useNavigation } from '@react-navigation/native'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import WebView from 'react-native-webview'

import { ArrowLeft } from '@/componentsV2/icons/LucideIcon'
import { HeaderBar, SafeAreaContainer, Text } from '@/componentsV2'
import { HomeNavigationProps } from '@/types/naviagate'
import { useAppDispatch, useAppSelector } from '@/store'
import { setHtmlPreviewContent } from '@/store/runtime'

export default function HtmlPreviewScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<HomeNavigationProps>()
  const dispatch = useAppDispatch()
  const htmlContent = useAppSelector(state => state.runtime.htmlPreviewContent)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    return () => {
      dispatch(setHtmlPreviewContent(null))
    }
  }, [dispatch])

  const handleBack = () => {
    navigation.goBack()
  }

  const fullHtmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
  </style>
</head>
<body>
${htmlContent || ''}
</body>
</html>
  `.trim()

  return (
    <SafeAreaContainer className="flex-1">
      <HeaderBar
        title={t('html_preview.title')}
        leftButton={{
          icon: <ArrowLeft size={24} />,
          onPress: handleBack
        }}
      />
      <View className="flex-1">
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text className="text-base mt-3">{t('html_preview.loading')}</Text>
          </View>
        )}
        <WebView
          source={{ html: fullHtmlContent }}
          style={{ flex: 1 }}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scalesPageToFit={true}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
        />
      </View>
    </SafeAreaContainer>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1
  }
})
