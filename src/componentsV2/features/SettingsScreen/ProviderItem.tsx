import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SFSymbol } from 'sf-symbols-typescript'

import { useDialog } from '@/hooks/useDialog'
import { useToast } from '@/hooks/useToast'
import { deleteProvider } from '@/services/ProviderService'
import { Provider } from '@/types/assistant'
import { ProvidersNavigationProps } from '@/types/naviagate'
import { Edit3, Trash2, ProviderIcon } from '@/componentsV2/icons'
import XStack from '@/componentsV2/layout/XStack'
import RowRightArrow from '@/componentsV2/layout/Row/RowRightArrow'
import Text from '@/componentsV2/base/Text'
import ContextMenu from '@/componentsV2/base/ContextMenu'

interface ProviderItemProps {
  provider: Provider
  mode?: 'enabled' | 'checked' // Add mode prop to distinguish display modes
  onEdit?: (provider: Provider) => void
}

export const ProviderItem: React.FC<ProviderItemProps> = ({ provider, mode = 'enabled', onEdit }) => {
  const { t } = useTranslation()
  const navigation = useNavigation<ProvidersNavigationProps>()
  const dialog = useDialog()
  const toast = useToast()

  // Determine display conditions and text based on mode
  const shouldShowStatus = mode === 'enabled' ? provider.enabled : provider.apiKey
  const statusText = mode === 'enabled' ? t('settings.provider.enabled') : t('settings.provider.added')

  const handleEdit = () => {
    onEdit?.(provider)
  }

  const handleDelete = () => {
    dialog.open({
      type: 'error',
      title: t('settings.provider.delete.title'),
      content: t('settings.provider.delete.content'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      onConFirm: async () => {
        try {
          await deleteProvider(provider.id)
          toast.show(t('settings.provider.provider_deleted'))
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : t('common.unknown_error')
          toast.show(t('common.error_occurred') + '\n' + errorMessage)
        }
      }
    })
  }

  const handlePress = () => {
    navigation.navigate('ProviderSettingsScreen', { providerId: provider.id })
  }

  const providerRow = (
    <XStack className="justify-between items-center py-3 px-4">
      <XStack className="gap-2 items-center">
        <ProviderIcon provider={provider} />
        <Text className="text-lg text-text-primary dark:text-text-primary-dark">
          {t(`provider.${provider.id}`, { defaultValue: provider.name })}
        </Text>
      </XStack>
      <XStack className="gap-2.5 items-center">
        {shouldShowStatus && (
          <Text className="py-0.5 px-2 rounded-lg border-[0.5px] bg-green-10 border-green-20 text-green-100 text-sm dark:bg-green-dark-10 dark:border-green-dark-20 dark:text-green-dark-100">
            {statusText}
          </Text>
        )}
        <RowRightArrow />
      </XStack>
    </XStack>
  )

  const contextMenuList = [
    {
      title: t('common.edit'),
      onSelect: handleEdit,
      iOSIcon: 'pencil' as SFSymbol,
      androidIcon: <Edit3 size={16} />
    },
    {
      title: t('common.delete'),
      onSelect: handleDelete,
      destructive: true,
      iOSIcon: 'trash' as SFSymbol,
      androidIcon: <Trash2 size={16} color="red" />,
      color: 'red'
    }
  ]

  return (
    <ContextMenu list={contextMenuList} onPress={handlePress} disableContextMenu={provider.isSystem}>
      {providerRow}
    </ContextMenu>
  )
}
