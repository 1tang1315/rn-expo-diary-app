import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * 时间线面板的浮动添加按钮
 * @props {Function} onPress - 点击回调（触发打开添加弹窗）
 */
const AddEventButton = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.floatingAddButton}
      onPress={onPress}
      accessibilityLabel="添加新日程"
    >
      <MaterialIcons name="add" size={24} color="white" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingAddButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
  }
});

export default AddEventButton;