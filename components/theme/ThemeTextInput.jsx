import React from 'react';
import { TextInput } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeTextInput({ style, ...rest }) {
  const { theme } = useTheme();
  
  // 基础主题样式
  const baseStyle = {
    minHeight: 30,
    lineHeight: 30,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 4,
    fontSize: 16,
    color: theme.colors.interactive,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.interactive,
    selectionColor: theme.colors.interactive
  };
  
  return (
    <TextInput
      placeholderTextColor={theme.colors.subText}
      style={[baseStyle, style]}
      {...rest}
    />
  );
}