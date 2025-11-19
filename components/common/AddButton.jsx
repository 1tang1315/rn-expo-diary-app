import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from "@/context/ThemeContext";

/**
 * 添加按钮
 * @props {Function} onPress - 点击回调（触发打开添加弹窗）
 */
const AddButton = ({ onPress }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.floatingAddButton,
        { backgroundColor: theme.colors.interactive }
      ]}
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
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5
  }
});

export default AddButton;