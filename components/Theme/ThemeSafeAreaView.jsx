import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeSafeAreaView({ style, children, ...rest }) {
  const { theme } = useTheme();
  
  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        style
      ]}
      {...rest}
    >{children}</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
