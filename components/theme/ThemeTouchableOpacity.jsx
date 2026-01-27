import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeTouchableOpacity({
  style,
  children,
  ...rest
}) {
  const { theme } = useTheme();
  
  const combinedStyle = StyleSheet.flatten([
    {
      padding: 10,
      color: theme.colors.textInverse,
      borderRadius: 10,
      borderColor: theme.colors.interactive,
      backgroundColor: theme.colors.card
    },
    style,
  ]);
  
  return (
    <TouchableOpacity
      style={combinedStyle}
      activeOpacity={0.8}
      {...rest}
    >
      {children}
    </TouchableOpacity>
  );
}