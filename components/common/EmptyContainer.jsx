import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const EmptyContainer = ({
  icon,
  IconComponent = FontAwesome,
  text = "暂无数据",
  model = 'txt'
}) => {
  return (
    <View style={[styles.container, model === 'box' && styles.boxContainer]}>
      {icon && (
        <IconComponent
          name={icon}
          size={48}
          color="#a0aec0"
        />
      )}
      <Text style={styles.text}>
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
    color: '#718096',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 24,
  },
});

export default EmptyContainer;