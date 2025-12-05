import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { getBoxStyles } from "@/utils/ThemeUtils";

export default function ThemeView({ style, children, padding, margin, borderRadius, ...rest }) {
  const { theme } = useTheme();
  
  return (
    <View
      style={[
        {
          padding: 10,
          borderRadius: 10,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.background,
          ...getBoxStyles('padding', padding),
          ...getBoxStyles('margin', margin),
          ...getBoxStyles('borderRadius', borderRadius)
        },
        style
      ]}
      {...rest}
    >{children}</View>
  );
}
