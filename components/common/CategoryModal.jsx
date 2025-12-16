import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import ThemeTitleText from "@/components/theme/ThemeTitleText";
import Icon from "@/components/common/Icon";
import { useTheme } from "@/context/ThemeContext";
import ThemeTouchableOpacity from "@/components/theme/ThemeTouchableOpacity";
import ThemeCard from "@/components/theme/ThemeCard";

/**
 * 分类选择弹窗独立组件
 * @props {boolean} visible - 弹窗显示状态
 * @props {Function} onClose - 关闭弹窗回调
 * @props {string} selectedCategory - 当前选中的分类ID
 * @props {Array} categories - 分类列表数据
 * @props {Function} onSelect - 选择分类后的回调
 */
const CategoryModal = ({
  visible, onClose, selectedCategory, categories, onSelect
}) => {
  const { theme } = useTheme();
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.categoryModalOverlay}>
          <TouchableWithoutFeedback>
            <ThemeCard
              margin={0}
              borderRadius={0}
              style={styles.categoryModalContent}
            >
              {/* 弹窗头部 */}
              <View style={styles.categoryModalHeader}>
                <ThemeTitleText style={styles.categoryModalTitle}>选择分类</ThemeTitleText>
                <TouchableOpacity style={styles.categoryModalClose} onPress={onClose}>
                  <Icon lib="MaterialIcons" name="close" size={24} />
                </TouchableOpacity>
              </View>
              
              {/* 分类列表 */}
              <ScrollView
                style={[
                  styles.categoryList,
                  {
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: theme.colors.innerCard
                  }
                ]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{paddingBottom: 10}}
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
                      onPress={() => onSelect(category.id)}
                    >
                      <Icon
                        lib="MaterialIcons"
                        name={category.icon}
                        size={20}
                        color={ selectedCategory === category.id ? theme.colors.interactive : theme.colors.interactiveLight }
                      />
                      <Text style={[
                        styles.categoryItemText,
                        {color: theme.colors.interactiveLight},
                        selectedCategory === category.id && {
                          fontWeight: '500',
                          color: theme.colors.interactive
                        }
                      ]}>
                        {category.name}
                      </Text>
                      {selectedCategory === category.id && (
                        <Icon lib="MaterialIcons" name="check" size={18} />
                      )}
                    </ThemeTouchableOpacity>
                  ))}
              </ScrollView>
            </ThemeCard>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// 弹窗专属样式
const styles = StyleSheet.create({
  categoryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  categoryModalContent: {
    maxHeight: '60%',
    padding: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10
  },
  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  categoryModalTitle: {
    fontSize: 18
  },
  categoryModalClose: {
    padding: 4
  },
  categoryList: {
    flexGrow: 1
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
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