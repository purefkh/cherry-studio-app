import React, { forwardRef } from 'react'
import { Text as RNText, TextProps as RNTextProps } from 'react-native'
import { cn } from 'heroui-native'

export interface TextProps extends RNTextProps {
  className?: string
}

const Text = forwardRef<RNText, TextProps>(({ className = '', ...rest }, ref) => {
  const composed = cn('text-base text-text-primary dark:text-text-primary-dark', className)

  return <RNText ref={ref} className={composed} {...rest} />
})

Text.displayName = 'Text'

export default Text
