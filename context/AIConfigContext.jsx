import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AIConfigContext = createContext();

// 默认配置
const defaultConfig = {
  apiKey: '',
  model: 'Qwen/Qwen3-8B',
  apiBaseUrl: 'https://api.siliconflow.cn/v1'
};

const defaultPresetModels = [
  'Qwen/Qwen3-8B',
  'Qwen/Qwen3-VL-30B-A3B-Instruct',
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
  'deepseek-ai/DeepSeek-V3.1-Terminus',
  'internlm/internlm2_5-7b-chat',
  'THUDM/glm-4-9b-chat'
];

export const AIConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(defaultConfig);
  const [presetModels, setPresetModels] = useState(defaultPresetModels);
  const [isLoading, setIsLoading] = useState(true);
  
  // 初始化：从本地加载配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedApiKey = await AsyncStorage.getItem('AI_DIARY_API_KEY');
        const savedModel = await AsyncStorage.getItem('AI_DIARY_MODEL');
        const savedApiBaseUrl = await AsyncStorage.getItem('AI_DIARY_API_BASE_URL');
        const savedPresets = await AsyncStorage.getItem('AI_DIARY_PRESET_MODELS');
        
        // 合并加载的配置
        setConfig(prev => ({
          ...prev,
          apiKey: savedApiKey || prev.apiKey,
          model: savedModel || prev.model,
          apiBaseUrl: savedApiBaseUrl || prev.apiBaseUrl
        }));
        
        if (savedPresets) {
          setPresetModels(JSON.parse(savedPresets));
        }
      } catch (err) {
        console.error('加载 AI 配置失败：', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConfig().then();
  }, []);
  
  // 更新并保存单个配置项
  const updateConfigItem = async (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    await AsyncStorage.setItem(`AI_DIARY_${key.toUpperCase()}`, value);
  };
  
  // 更新整个配置对象
  const updateConfig = async (newConfig) => {
    setConfig(newConfig);
    await AsyncStorage.setItem('AI_DIARY_API_KEY', newConfig.apiKey);
    await AsyncStorage.setItem('AI_DIARY_MODEL', newConfig.model);
    await AsyncStorage.setItem('AI_DIARY_API_BASE_URL', newConfig.apiBaseUrl);
  };
  
  // 更新预设模型列表
  const updatePresetModels = async (newModels) => {
    setPresetModels(newModels);
    await AsyncStorage.setItem('AI_DIARY_PRESET_MODELS', JSON.stringify(newModels));
  };
  
  // 将常用的更新操作也封装起来
  const addAndSetModel = async (newModel) => {
    if (!newModel.trim()) return;
    // 移除旧的，添加到最前面，保持最多6个
    const updatedModels = [...new Set([newModel, ...presetModels])].slice(0, 6);
    await updatePresetModels(updatedModels);
    // 同时更新当前选中的模型
    await updateConfigItem('model', newModel);
  };
  
  const value = {
    aiConfig: config,
    presetModels,
    isLoading,
    updateConfigItem,
    updateConfig,
    updatePresetModels,
    addAndSetModel, // 封装好的添加并设置模型的方法
  };
  
  return (
    <AIConfigContext.Provider value={value}>
      {children}
    </AIConfigContext.Provider>
  );
};

// 自定义 Hook，方便组件使用
export const useAIConfig = () => useContext(AIConfigContext);