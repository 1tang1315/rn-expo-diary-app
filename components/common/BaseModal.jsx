import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, TouchableWithoutFeedback
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import ThemeCard from '@/components/theme/ThemeCard';
import ThemeTitleText from '@/components/theme/ThemeTitleText';
import Icon from '@/components/common/Icon';
import ThemeButton from '@/components/theme/ThemeButton';

/**
 * 通用弹窗容器组件
 * @props {boolean} visible - 弹窗显示状态
 * @props {Function} onClose - 关闭弹窗回调
 * @props {string} title - 弹窗标题
 * @props {React.ReactNode} children - 弹窗内容
 * @props {Function} onConfirm - 确认/保存按钮点击回调
 * @props {string} confirmText - 确认/保存按钮文字（默认：保存）
 * @props {string} cancelText - 取消按钮文字（默认：取消）
 * @props {boolean} showDelete - 是否显示删除按钮
 * @props {Function} onDelete - 删除按钮点击回调
 * @props {string} deleteText - 删除按钮文字（默认：删除）
 * @props {boolean} showHeader - 是否显示弹窗头部（默认：true）
 * @props {boolean} showFooter - 是否显示弹窗底部按钮区（默认：true）
 * @props {Object} style - 自定义样式
 */
const BaseModal = ({
  visible,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = '保存',
  cancelText = '取消',
  showDelete = false,
  onDelete,
  deleteText = '删除',
  showHeader = true,
  showFooter = true,
  style
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
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
              <ThemeCard
                margin={0}
                borderRadius={0}
                style={[styles.modalContent, style]}
              >
                {/* 弹窗头部 */}
                {showHeader && (
                  <View style={styles.modalHeader}>
                    <ThemeTitleText style={styles.modalTitle}>
                      {title}
                    </ThemeTitleText>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                      <Icon lib="MaterialIcons" name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* 弹窗内容区 - 可滚动，自适应剩余空间 */}
                <View style={[
                  styles.contentContainer,
                  { backgroundColor: theme.colors.innerCard }
                ]}>
                  {children}
                </View>
                
                {/* 弹窗底部按钮 */}
                {showFooter && (
                  <View style={styles.modalFooterContainer}>
                    <View style={styles.modalFooter}>
                      {showDelete && (
                        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                          <Text style={styles.deleteButtonText}>{deleteText}</Text>
                        </TouchableOpacity>
                      )}
                      <ThemeButton
                        style={styles.cancelButton}
                        onPress={onClose}
                        title={cancelText}
                        active={false}
                        textStyle={styles.cancelButtonText}
                      />
                      <ThemeButton
                        style={styles.saveButton}
                        onPress={onConfirm}
                        title={confirmText}
                      />
                    </View>
                  </View>
                )}
              </ThemeCard>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // 弹窗基础样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    maxHeight: '85%',
    minHeight: '85%',
    padding: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  closeButton: {
    padding: 4
  },
  // 内容容器
  contentContainer: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    overflow: 'hidden'
  },
  // 底部按钮容器
  modalFooterContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingBottom: 5
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  cancelButtonText: {
    fontWeight: '500'
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  deleteButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F44336'
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '500'
  }
});

export default BaseModal;