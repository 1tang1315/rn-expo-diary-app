import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeTitleText({ style, children, ...rest }) {
  const { theme } = useTheme();
  
  return (
    <Text
      numberOfLines={1}
      ellipsizeMode="tail"
      style={[
        {
          flex: 1,
          fontSize: 16,
          fontWeight: '600',
          color: theme.colors.interactive
        },
        style
      ]}
      {...rest}
    >{children}</Text>
  );
}
