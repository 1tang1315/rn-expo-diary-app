import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from "@/components/common/Icon";
import { useTheme } from "@/context/ThemeContext";

const EmptyContainer = ({
  iconLib="FontAwesome",
  iconName,
  text = "暂无数据",
  model = 'txt'
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, model === 'box' && styles.boxContainer]}>
      {iconName && (
        <Icon lib={iconLib} name={iconName} size={48} />
      )}
      <Text style={[styles.text, { color: theme.colors.interactive }]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  boxContainer: {
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
    padding: 24
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 24,
  },
});

export default EmptyContainer;