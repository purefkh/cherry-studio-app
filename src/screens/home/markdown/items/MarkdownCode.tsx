import React from 'react'
import { ViewStyle, TextStyle, View, Alert } from 'react-native'
import CodeHighlighter from 'react-native-code-highlighter'
import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'

import { IconButton, Image, Text, XStack } from '@/componentsV2'
import { Copy, Eye } from '@/componentsV2/icons/LucideIcon'
import { getCodeLanguageIcon } from '@/utils/icons/codeLanguage'
import { markdownColors } from '../MarkdownStyles'
import { HomeNavigationProps } from '@/types/naviagate'
import { useAppDispatch } from '@/store'
import { setHtmlPreviewContent } from '@/store/runtime'

const MAX_HTML_SIZE_MB = 2
const MAX_HTML_SIZE_BYTES = MAX_HTML_SIZE_MB * 1024 * 1024

interface MarkdownCodeProps {
  text: string
  language?: string
  isDark: boolean
  onCopy: (content: string) => void
  containerStyle?: ViewStyle
  textStyle?: TextStyle
}

export const MarkdownCode: React.FC<MarkdownCodeProps> = ({
  text,
  language = 'text',
  isDark,
  onCopy,
  containerStyle,
  textStyle
}) => {
  const currentColors = isDark ? markdownColors.dark : markdownColors.light
  const lang = language || 'text'
  const navigation = useNavigation<HomeNavigationProps>()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const handlePreview = () => {
    const sizeInBytes = new Blob([text]).size

    if (sizeInBytes > MAX_HTML_SIZE_BYTES) {
      Alert.alert(
        t('html_preview.title'),
        t('html_preview.file_too_large', { maxSize: MAX_HTML_SIZE_MB })
      )
    }

    dispatch(setHtmlPreviewContent(text))
    navigation.navigate('HtmlPreviewScreen')
  }

  const isHtml = lang.toLowerCase() === 'html'

  return (
    <View className="gap-2 px-3 pt-0 pb-3 rounded-3 mt-2" style={containerStyle}>
      <XStack className="py-2 justify-between items-center border-b" style={{ borderColor: currentColors.codeBorder }}>
        <XStack className="gap-2 flex-1 items-center">
          {getCodeLanguageIcon(lang) && <Image source={getCodeLanguageIcon(lang)} className="w-5 h-5" />}
          <Text className="text-base">{lang.toUpperCase()}</Text>
        </XStack>
        <XStack className="gap-2">
          {isHtml && <IconButton icon={<Eye size={16} color="$gray60" />} onPress={handlePreview} />}
          <IconButton icon={<Copy size={16} color="$gray60" />} onPress={() => onCopy(text)} />
        </XStack>
      </XStack>
      <CodeHighlighter
        customStyle={{ backgroundColor: 'transparent' }}
        scrollViewProps={{
          contentContainerStyle: {
            backgroundColor: 'transparent'
          },
          showsHorizontalScrollIndicator: false
        }}
        textStyle={{
          ...textStyle,
          fontSize: 12,
          fontFamily: 'JetbrainMono',
          userSelect: 'none'
        }}
        hljsStyle={isDark ? atomOneDark : atomOneLight}
        language={lang}
        wrapLines={true}
        wrapLongLines={true}
        lineProps={{ style: { flexWrap: 'wrap' } }}>
        {text}
      </CodeHighlighter>
    </View>
  )
}

export default MarkdownCode
