import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * 分类选择弹窗独立组件
 * @props {boolean} visible - 弹窗显示状态
 * @props {Function} onClose - 关闭弹窗回调
 * @props {string} selectedCategory - 当前选中的分类ID
 * @props {Array} categories - 分类列表数据
 * @props {Function} onSelect - 选择分类后的回调
 */
const CategoryModal = ({ visible, onClose, selectedCategory, categories, onSelect }) => {
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
            <View style={styles.categoryModalContent}>
              {/* 弹窗头部 */}
              <View style={styles.categoryModalHeader}>
                <Text style={styles.categoryModalTitle}>选择分类</Text>
                <TouchableOpacity style={styles.categoryModalClose} onPress={onClose}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              {/* 分类列表 */}
              <ScrollView
                style={styles.categoryList}
                showsVerticalScrollIndicator={false}
              >
                {categories
                  .filter(tab => !tab.isFixed) // 排除"全部"分类
                  .map(category => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryItem,
                        selectedCategory === category.id && styles.selectedCategoryItem
                      ]}
                      onPress={() => onSelect(category.id)}
                    >
                      <MaterialIcons
                        name={category.icon}
                        size={20}
                        color={selectedCategory === category.id ? "#2196F3" : "#666"}
                        style={styles.categoryItemIcon}
                      />
                      <Text style={[
                        styles.categoryItemText,
                        selectedCategory === category.id && styles.selectedCategoryItemText
                      ]}>
                        {category.name}
                      </Text>
                      {selectedCategory === category.id && (
                        <MaterialIcons name="check" size={18} color="#2196F3" />
                      )}
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// 弹窗专属样式（从原styles提取）
const styles = StyleSheet.create({
  categoryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  categoryModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '60%'
  },
  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  categoryModalClose: {
    padding: 4
  },
  categoryList: {
    flexGrow: 1,
    marginBottom: 16
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    justifyContent: 'space-between'
  },
  selectedCategoryItem: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3'
  },
  categoryItemIcon: {
    marginRight: 12
  },
  categoryItemText: {
    fontSize: 16,
    color: '#333',
    flexGrow: 1
  },
  selectedCategoryItemText: {
    color: '#2196F3',
    fontWeight: '500'
  }
});

export default CategoryModal;