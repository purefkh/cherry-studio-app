import { useNavigation } from '@react-navigation/native'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import WebView from 'react-native-webview'

import { ArrowLeft } from '@/componentsV2/icons/LucideIcon'
import { HeaderBar, SafeAreaContainer } from '@/componentsV2'
import { HomeNavigationProps } from '@/types/naviagate'
import { useAppDispatch, useAppSelector } from '@/store'
import { setHtmlPreviewContent } from '@/store/runtime'

export default function HtmlPreviewScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<HomeNavigationProps>()
  const dispatch = useAppDispatch()
  const htmlContent = useAppSelector(state => state.runtime.htmlPreviewContent)

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
        <WebView
          source={{ html: fullHtmlContent }}
          style={{ flex: 1 }}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scalesPageToFit={true}
        />
      </View>
    </SafeAreaContainer>
  )
}
