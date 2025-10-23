import React from 'react';
import {
  Modal, View, Text, Button,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import dayjs from 'dayjs';
import { insertDiary, updateDiary } from '@/db/notesDB';
import AIStreamText from "@/components/common/AIStreamText";

/**
 * 日记预览&覆盖确认弹窗
 * @props {boolean} visible - 弹窗显示状态
 * @props {string} targetDate - 日记日期（YYYY-MM-DD）
 * @props {string} newDiaryContent - 新生成的日记内容
 * @props {boolean} hasExistingDiary - 是否已有旧日记（用于显示覆盖提示）
 * @props {boolean} isLoading - 操作加载状态（防止重复点击）
 * @props {() => void} onCancel - 取消回调（关闭弹窗）
 * @props {() => void} onAfterConfirm - 覆盖成功后的回调（如刷新列表、关闭弹窗）
 */
const DiaryPreviewModal = ({
  visible,
  targetDate,
  newDiaryContent,
  hasExistingDiary = false,
  isLoading = false,
  onCancel,
  onAfterConfirm,
  isContentFinalized={isContentFinalized}
}) => {
  // 处理“覆盖”操作
  const handleOverwrite = async () => {
    await updateDiary(targetDate, newDiaryContent);
    Alert.alert('成功', hasExistingDiary ? '日记已覆盖更新' : '日记已保存');
  };
  
  // 处理“保存”操作（无旧日记时）
  const handleSave = async () => {
    try {
      // 直接调用原有的 insertDiary（如果是新生成且无旧日记）
      const insertResult = await insertDiary(targetDate, newDiaryContent);
      if (insertResult.success) {
        Alert.alert('成功', '日记已保存');
        onAfterConfirm?.();
      } else {
        Alert.alert('失败', insertResult.message || '保存日记时出错');
      }
    } catch (error) {
      Alert.alert('失败', `操作异常: ${error.message}`);
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
      onDismiss={onCancel} // 弹窗消失时触发取消（如滑动关闭）
    >
      <View style={styles.modalOverlay} onPress={onCancel}>
        <View style={styles.modalContent} onPress={e => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>日记预览</Text>
            <Text style={styles.modalSubtitle}>
              {dayjs(targetDate).format('YYYY年MM月DD日 dddd')}
            </Text>
          </View>
          
          {hasExistingDiary && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>⚠️ 该日期已存在日记，确认后将覆盖原内容</Text>
            </View>
          )}
          
          {/* 日记内容显示区 */}
          <View style={styles.contentContainer}>
            { !newDiaryContent ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>日记生成中...</Text>
              </View>
            ) : (
              <AIStreamText
                content={newDiaryContent}
                isContentFinalized={isContentFinalized}
              />
            )}
          </View>
          
          <View style={styles.buttonContainer}>
            <Button title="取消" onPress={onCancel} disabled={isLoading} color="#666" />
            <Button
              title={hasExistingDiary ? "确认覆盖" : "确认保存"}
              onPress={hasExistingDiary ? async () => {
                await updateDiary(targetDate, newDiaryContent);
                Alert.alert('成功', '日记已覆盖更新');
                onAfterConfirm?.();
              } : async () => {
                const insertResult = await insertDiary(targetDate, newDiaryContent);
                if (insertResult.success) {
                  Alert.alert('成功', '日记已保存');
                  onAfterConfirm?.();
                } else {
                  Alert.alert('失败', insertResult.message || '保存日记时出错');
                }
              }}
              disabled={isLoading || !newDiaryContent}
              color={hasExistingDiary ? "#ff4444" : "#2196F3"}
            />
          </View>
          
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#2196F3" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    elevation: 5,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  warningBanner: {
    padding: 12,
    backgroundColor: '#fff8e1',
    borderBottomWidth: 1,
    borderBottomColor: '#ffe082',
  },
  warningText: {
    fontSize: 14,
    color: '#ff8f00',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fafafa',
  },
  diaryText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
});

export default DiaryPreviewModal;