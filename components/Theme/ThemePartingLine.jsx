import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function ThemePartingLine({
  style,
  children,
  ...rest
}) {
  const { theme } = useTheme();
  
  return (
    <View
      style={[
        {
          marginVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.interactive,
        },
        style
      ]}
      {...rest}
    >{children}</View>
  );
}
