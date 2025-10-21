import { CameraView, useCameraPermissions, PermissionStatus } from 'expo-camera'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Container, Text, XStack, YStack } from '@/componentsV2'
import { ScanQrCode } from '@/componentsV2/icons/LucideIcon'
import { loggerService } from '@/services/LoggerService'

import { Overlay } from './Overlay'
import { Spinner } from 'heroui-native'
import { useDialog } from '@/hooks/useDialog'
import { useNavigation } from '@react-navigation/native'
const logger = loggerService.withContext('QRCodeScanner')

interface QRCodeScannerProps {
  onQRCodeScanned: (ip: string) => void
}

export function QRCodeScanner({ onQRCodeScanned }: QRCodeScannerProps) {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const dialog = useDialog()
  const [permission, requestPermission] = useCameraPermissions()
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)

  useEffect(() => {
    if (permission?.status === PermissionStatus.DENIED) {
      dialog.open({
        type: 'error',
        title: t('common.error_occurred'),
        content: t('settings.data.landrop.scan_qr_code.permission_denied'),
        showCancel: false,
        onConFirm: () => navigation.goBack()
      })
      return
    }

    const getPermission = async () => {
      if (!permission?.granted && !isRequestingPermission) {
        setIsRequestingPermission(true)
        await requestPermission()
        setIsRequestingPermission(false)
      }
    }

    if (permission === null || !permission?.granted) {
      getPermission()
    }
  }, [permission, requestPermission, isRequestingPermission, dialog, t, navigation])

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    try {
      const qrData = JSON.parse(data)

      if (qrData && qrData.host && qrData.port) {
        const ip = `${qrData.host}:${qrData.port}`
        onQRCodeScanned(ip)
      }
    } catch (error) {
      logger.error('Failed to parse QR code data:', error)
    }
  }

  if (permission === null || isRequestingPermission) {
    return (
      <Container>
        <YStack className="flex-1 items-center justify-center">
          <Spinner />
          <Text className="mt-2">
            {t('settings.data.landrop.scan_qr_code.requesting_permission') || 'Requesting camera permission...'}
          </Text>
        </YStack>
      </Container>
    )
  }

  if (!permission.granted) {
    return (
      <Container className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </Container>
    )
  }

  return (
    <Container>
      <XStack className="gap-1 items-center">
        <ScanQrCode />
        <Text>{t('settings.data.landrop.scan_qr_code.description')}</Text>
      </XStack>
      <CameraView
        style={{
          width: '100%',
          height: '100%'
          // aspectRatio: 1,
          // maxHeight: '70%'
        }}
        facing="back"
        onBarcodeScanned={handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr']
        }}
      />
      <Overlay />
    </Container>
  )
}
