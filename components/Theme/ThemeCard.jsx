import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { getBoxStyles } from "@/utils/ThemeUtils";

export default function ThemeCard({
  style, children, padding, margin,
  innerCard = false, ...rest
}) {
  const { theme } = useTheme();
  
  const cardBackgroundColor = innerCard
    ? theme.colors.innerCard
    : theme.colors.card;
  
  return (
    <View
      style={[
        {
          marginBottom: 10,
          padding: 10,
          borderRadius: 10,
          borderColor: theme.colors.border,
          backgroundColor: cardBackgroundColor,
          ...getBoxStyles('padding', padding),
          ...getBoxStyles('margin', margin)
        },
        style
      ]}
      {...rest}
    >{children}</View>
  );
}
