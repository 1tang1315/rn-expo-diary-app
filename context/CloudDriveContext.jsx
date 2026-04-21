import { AsyncStorage } from "expo-sqlite/kv-store";
import React, { createContext, useContext, useEffect, useState } from 'react';

const CloudDriveContext = createContext();

// 默认配置
const defaultCloudDriveConfig = {
  driveConfigs: [],
  selectedDriveId: null
};

// 云盘类型
const DRIVE_TYPES = [
  { value: 'nutstore', label: '坚果云盘' },
  { value: 'dropbox', label: 'Dropbox' },
  { value: 'onedrive', label: 'OneDrive' },
  { value: 'baidu', label: '百度网盘' }
];

export const CloudDriveProvider = ({ children }) => {
  const [cloudDriveConfig, setCloudDriveConfig] = useState(defaultCloudDriveConfig);
  const [isLoading, setIsLoading] = useState(true);
  
  // 初始化：从本地加载配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedConfig = await AsyncStorage.getItem('CLOUD_DRIVE_CONFIG');
        if (savedConfig) {
          setCloudDriveConfig(JSON.parse(savedConfig));
        }
      } catch (err) {
        console.error('加载云盘配置失败：', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConfig().then();
  }, []);
  
  // 更新并保存配置
  const updateCloudDriveConfig = async (newConfig) => {
    setCloudDriveConfig(newConfig);
    await AsyncStorage.setItem('CLOUD_DRIVE_CONFIG', JSON.stringify(newConfig));
  };
  
  // 添加云盘配置
  const addCloudDriveConfig = async (driveConfig) => {
    const updatedConfigs = [...cloudDriveConfig.driveConfigs, {
      id: Date.now().toString(),
      ...driveConfig,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }];
    await updateCloudDriveConfig({
      ...cloudDriveConfig,
      driveConfigs: updatedConfigs,
      selectedDriveId: updatedConfigs[0].id
    });
  };
  
  // 更新云盘配置
  const updateDriveConfig = async (driveId, updatedConfig) => {
    const updatedConfigs = cloudDriveConfig.driveConfigs.map(config => 
      config.id === driveId 
        ? { ...config, ...updatedConfig, updated_at: new Date().toISOString() } 
        : config
    );
    await updateCloudDriveConfig({
      ...cloudDriveConfig,
      driveConfigs: updatedConfigs
    });
  };
  
  // 删除云盘配置
  const deleteDriveConfig = async (driveId) => {
    const updatedConfigs = cloudDriveConfig.driveConfigs.filter(config => config.id !== driveId);
    await updateCloudDriveConfig({
      driveConfigs: updatedConfigs,
      selectedDriveId: updatedConfigs.length > 0 ? updatedConfigs[0].id : null
    });
  };
  
  // 选择默认云盘
  const selectDefaultDrive = async (driveId) => {
    await updateCloudDriveConfig({
      ...cloudDriveConfig,
      selectedDriveId: driveId
    });
  };
  
  const value = {
    cloudDriveConfig,
    isLoading,
    DRIVE_TYPES,
    updateCloudDriveConfig,
    addCloudDriveConfig,
    updateDriveConfig,
    deleteDriveConfig,
    selectDefaultDrive
  };
  
  return (
    <CloudDriveContext.Provider value={value}>
      {children}
    </CloudDriveContext.Provider>
  );
};

// 自定义 Hook，方便组件使用
export const useCloudDrive = () => useContext(CloudDriveContext);