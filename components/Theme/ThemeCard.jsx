import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeCard({ style, children, ...rest }) {
  const { theme } = useTheme();
  
  return (
    <View
      style={[
        {
          borderColor: theme.colors.borderColor,
          backgroundColor: theme.colors.card
        },
        style
      ]}
      {...rest}
    >{children}</View>
  );
}
