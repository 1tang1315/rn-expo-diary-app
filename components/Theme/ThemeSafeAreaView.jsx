import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { getLuminance, useTheme } from '@/context/ThemeContext';

export default function ThemeSafeAreaView({ style, children, ...rest }) {
  const { theme } = useTheme();
  // 计算背景色亮度并判断状态栏样式
  const backgroundLuminance = getLuminance(theme.colors.background);
  // 亮度 > 0.5 为浅色背景 → 状态栏用深色；反之用浅色
  const statusBarStyle = backgroundLuminance > 0.5 ? 'dark-content' : 'light-content';
  
  useEffect(() => {
    // 第二个参数 animated: true 平滑过渡
    StatusBar.setBarStyle(statusBarStyle, true);
    StatusBar.setBackgroundColor('transparent', true);
  }, [statusBarStyle]);
  
  return (
    <>
      <StatusBar
        key={`status-bar-${statusBarStyle}`}
        style={statusBarStyle}
        translucent={true}
        backgroundColor="transparent"
      />

      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
          style
        ]}
        {...rest}
        edges={['top']}
      >{children}</SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
  }
});
