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
import { ConnectionInfo } from '@/types/network'
const logger = loggerService.withContext('QRCodeScanner')

interface QRCodeScannerProps {
  onQRCodeScanned: (connectionInfo: ConnectionInfo) => void
}

export function QRCodeScanner({ onQRCodeScanned }: QRCodeScannerProps) {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const dialog = useDialog()
  const [permission, requestPermission] = useCameraPermissions()
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

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
    if (isProcessing) {
      return // 防止重复扫描
    }

    try {
      setIsProcessing(true)
      const qrData = JSON.parse(data)

      // Handle new format with multiple IP candidates
      if (qrData && qrData.type === 'cherry-studio-app' && qrData.candidates && qrData.selectedHost && qrData.port) {
        logger.info(`QR code parsed: ${qrData.candidates.length} candidates, selected: ${qrData.selectedHost}`)
        onQRCodeScanned(qrData as ConnectionInfo)
      } else {
        setIsProcessing(false)
      }
    } catch (error) {
      logger.error('Failed to parse QR code data:', error)
      setIsProcessing(false)
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
        onBarcodeScanned={isProcessing ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr']
        }}
      />
      <Overlay />
      {isProcessing && (
        <YStack
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <Spinner />
          <Text className="mt-4 text-white text-lg">
            {t('settings.data.landrop.scan_qr_code.processing') || 'Processing QR code...'}
          </Text>
        </YStack>
      )}
    </Container>
  )
}
