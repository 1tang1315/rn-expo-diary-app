import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeText({ style, children, ...rest }) {
  const { theme } = useTheme();
  
  return (
    <Text
      numberOfLines={1}
      ellipsizeMode="tail"
      style={[
        {
          flex: 1,
          color: theme.colors.text,
          fontSize: 14,
          weight: 400,
        },
        style
      ]}
      {...rest}
    >{children}</Text>
  );
}
