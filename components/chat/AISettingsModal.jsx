import React, { useState, useEffect } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, ScrollView, StyleSheet, TouchableWithoutFeedback, View, Platform,
  ActivityIndicator
} from 'react-native';
import { useTheme } from "@/context/ThemeContext";
import { useAIConfig } from "@/context/AIConfigContext";
import ThemeTextInput from "@/components/Theme/ThemeTextInput";
import ThemeSubTitleText from "@/components/Theme/ThemeSubTitleText";
import ThemeView from "@/components/Theme/ThemeView";
import ThemeTitleText from "@/components/Theme/ThemeTitleText";
import ThemeButton from "@/components/Theme/ThemeButton";

const AISettingsModal = ({
  visible,
  onClose
}) => {
  const { theme } = useTheme();
  // 从 Context 中获取配置和更新方法
  const { aiConfig, presetModels, addAndSetModel, updateConfig } = useAIConfig();
  
  const [localConfig, setLocalConfig] = useState(aiConfig);
  
  // 当 modal 打开或 context 中的 aiConfig 变化时，同步本地状态
  useEffect(() => {
    if (visible) {
      setLocalConfig(aiConfig);
    }
  }, [visible, aiConfig]);
  
  // 处理输入框变化
  const handleInputChange = (key, value) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };
  
  // 处理预设模型点击
  const handleModelPress = (model) => {
    handleInputChange('model', model);
  };
  
  const handleSave = async () => {
    try {
      // 1. 更新预设模型列表（将当前输入的模型添加到列表最前面）
      await addAndSetModel(localConfig.model);
      
      // 2. 保存完整配置
      await updateConfig(localConfig);
      
      Alert.alert('成功', '配置已保存');
      onClose();
    } catch(err) {
      console.error('保存配置失败：', err);
      Alert.alert('错误', '保存配置失败，请重试');
    }
  };
  
  // 加载指示器
  if (useAIConfig().isLoading && visible) {
    return (
      <Modal visible={visible} transparent={true}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
        </View>
      </Modal>
    );
  }
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <ThemeView style={styles.modalContent}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingContainer}
              >
                <ThemeTitleText style={styles.modalTitle}>AI 配置设置</ThemeTitleText>
                
                <ScrollView
                  style={[
                    styles.scrollViewContent,
                    {
                      padding: 10,
                      borderRadius: 10,
                      backgroundColor: theme.colors.innerCard,
                    }
                  ]}
                  showsVerticalScrollIndicator={false}
                >
                  {/* API密钥输入 */}
                  <ThemeSubTitleText style={styles.settingLabel}>API 密钥</ThemeSubTitleText>
                  <ThemeTextInput
                    style={styles.modalInput}
                    placeholder="输入 Silicon Flow API 密钥"
                    value={localConfig.apiKey}
                    onChangeText={(val) => handleInputChange('apiKey', val)}
                    multiline={true}
                    maxHeight={80}
                  />
                  
                  {/* 模型选择区域 */}
                  <ThemeSubTitleText style={styles.settingLabel}>模型名称</ThemeSubTitleText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.modelPresetContainer}
                    contentContainerStyle={styles.modelPresetContent}
                  >
                    {presetModels.map((model) => (
                      <ThemeButton
                        style={styles.modelPresetBtn}
                        title={model}
                        key={model}
                        active={localConfig.model === model}
                        onPress={() => handleModelPress(model)}
                      />
                    ))}
                  </ScrollView>
                  
                  <ThemeTextInput
                    style={styles.modalInput}
                    placeholder="例如：Qwen/Qwen3-8B"
                    value={localConfig.model}
                    onChangeText={(val) => handleInputChange('model', val)}
                  />
                  
                  {/* API基础地址输入 */}
                  <ThemeSubTitleText style={styles.settingLabel}>API 基础地址</ThemeSubTitleText>
                  <ThemeTextInput
                    style={styles.modalInput}
                    placeholder="例如：https://api.siliconflow.cn/v1"
                    value={localConfig.apiBaseUrl}
                    onChangeText={(val) => handleInputChange('apiBaseUrl', val)}
                  />
                </ScrollView>
                
                <View style={styles.modalBtnContainer}>
                  <ThemeButton
                    style={styles.modalBtn}
                    title="取消"
                    active={false}
                    onPress={onClose}
                  />
                  <ThemeButton
                    title="保存"
                    style={styles.modalBtn}
                    onPress={handleSave}
                  />
                </View>
              </KeyboardAvoidingView>
            </ThemeView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    maxWidth: 350,
    maxHeight: '60%',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  keyboardAvoidingContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  scrollViewContent: {
    flexGrow: 1
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center'
  },
  settingLabel: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    fontSize: 14,
  },
  modalInput: {
    minHeight: 44,
    lineHeight: 20,
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  modelPresetContainer: {
    marginBottom: 16
  },
  modelPresetContent: {
    gap: 8,
    paddingVertical: 4,
  },
  modelPresetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 0,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36
  },
  modalBtnContainer: {
    paddingTop: 10,
    gap: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  }
});

export default AISettingsModal;