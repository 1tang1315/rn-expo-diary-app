import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeView({ style, children, ...rest }) {
  const { theme } = useTheme();
  
  return (
    <View
      style={[
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.background
        },
        style
      ]}
      {...rest}
    >{children}</View>
  );
}
