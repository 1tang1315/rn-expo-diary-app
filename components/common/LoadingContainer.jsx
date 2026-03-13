import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import ThemeText from "@/components/theme/ThemeText";
import { useTheme } from "@/context/ThemeContext";

const LoadingContainer = ({
  text = "加载中...",
  model = 'default',
  height
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={[
      styles.container,
      model === 'box' && {
        borderRadius: 10,
        backgroundColor: theme.colors.innerCard
      },
      height && { height }
    ]}>
      <ActivityIndicator size="small" color={theme.colors.primary} style={styles.spinner} />
      <ThemeText style={styles.text}>{text}</ThemeText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  spinner: {
    marginBottom: 10
  },
  text: {
    fontSize: 14,
    opacity: 0.7
  }
});

export default LoadingContainer;
