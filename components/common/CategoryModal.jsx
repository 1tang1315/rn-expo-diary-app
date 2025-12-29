import React from 'react';
import {
  Text, ScrollView, StyleSheet
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Icon from '@/components/common/Icon';
import ThemeTouchableOpacity from "@/components/theme/ThemeTouchableOpacity";
import BaseModal from "@/components/common/BaseModal";

/**
 * 基于BaseModal的分类选择弹窗组件
 * @props {boolean} visible - 弹窗显示状态
 * @props {Function} onClose - 关闭弹窗回调
 * @props {string} selectedCategory - 当前选中的分类ID
 * @props {Array} categories - 分类列表数据
 * @props {Function} onSelect - 选择分类后的回调
 */
const CategoryModal = ({
  visible,
  onClose,
  selectedCategory,
  categories,
  onSelect
}) => {
  const { theme } = useTheme();
  
  // 选择分类并关闭弹窗
  const handleSelect = (categoryId) => {
    onSelect(categoryId);
    onClose(); // 选择后自动关闭弹窗
  };
  
  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title="选择分类"
      showFooter={false}
      style={styles.categoryModalContent}
    >
      {/* 分类列表内容 */}
      <ScrollView
        style={[
          styles.categoryList,
          {
            backgroundColor: theme.colors.innerCard
          }
        ]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: 8
        }}
      >
        {categories
          .filter(tab => !tab.isFixed) // 排除"全部"分类
          .map(category => (
            <ThemeTouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                selectedCategory === category.id && {
                  borderWidth: 1,
                  borderColor: theme.colors.interactive,
                  backgroundColor: theme.colors.innerCard
                }
              ]}
              onPress={() => handleSelect(category.id)}
            >
              <Icon
                lib="MaterialIcons"
                name={category.icon}
                size={20}
                color={selectedCategory === category.id ? theme.colors.interactive : theme.colors.interactiveLight}
              />
              <Text style={[
                styles.categoryItemText,
                { color: theme.colors.interactiveLight },
                selectedCategory === category.id && {
                  fontWeight: '500',
                  color: theme.colors.interactive
                }
              ]}>
                {category.name}
              </Text>
              {selectedCategory === category.id && (
                <Icon
                  lib="MaterialIcons"
                  name="check"
                  size={18}
                  color={theme.colors.interactive}
                />
              )}
            </ThemeTouchableOpacity>
          ))}
      </ScrollView>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  categoryModalContent: {
    maxHeight: '60%',
    minHeight: '60%'
  },
  categoryList: {
    flexGrow: 1,
    padding: 1,
    borderRadius: 10
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    justifyContent: 'space-between'
  },
  categoryItemText: {
    flexGrow: 1,
    marginLeft: 8,
    fontSize: 16,
    height: 16,
    lineHeight: 16
  }
});

export default CategoryModal;