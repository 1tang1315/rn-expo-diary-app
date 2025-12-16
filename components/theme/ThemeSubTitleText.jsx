import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeSubTitleText({ style, children, ...rest }) {
  const { theme } = useTheme();
  
  return (
    <Text
      numberOfLines={1}
      ellipsizeMode="tail"
      style={[
        {
          fontSize: 14,
          fontWeight: '500',
          color: theme.colors.subText
        },
        style
      ]}
      {...rest}
    >{children}</Text>
  );
}
