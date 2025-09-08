import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Alert, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  addCloudDriveConfig,
  getCloudDriveConfigsByType,
  updateCloudDriveConfig
} from '@/db/cloudSyncDb';
import { CloudSyncService, DRIVE_CONFIGS } from '@/db/services/CloudSyncService';

const CloudDriveConfigForm = ({
  visible,
  onClose,
  driveType,
  onConfigSuccess,
  userId
}) => {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [rootPath, setRootPath] = useState('RNExpoDiaryApp');
  const [loading, setLoading] = useState(false);
  const [pathError, setPathError] = useState(null);
  
  // 初始化：加载已有配置
  useEffect(() => {
    const loadExistingConfig = async () => {
      if(!driveType || !userId) return;
      
      try {
        const configs = await getCloudDriveConfigsByType(userId, driveType);
        
        if(configs.length > 0) {
          // 显示第一个配置（可根据需求调整为列表选择）
          const config = configs[0];
          setAccount(config.account || '');
          setRootPath(config.root_path || 'RNExpoDiaryApp');
        } else {
          setAccount('');
          setPassword('');
          setRootPath('RNExpoDiaryApp');
        }
      } catch(error) {
        console.error('加载配置失败:', error);
        Alert.alert('初始化失败', '无法加载已有配置，请重试');
      }
    };
    loadExistingConfig();
  }, [driveType, userId]);
  
  // 验证路径格式
  const validateRootPath = (path) => {
    const trimmed = path.trim();
    if(!trimmed) {
      setPathError('存储路径不能为空');  // 非空错误文本
      return false;
    }
    if(/[\\:*?"<>|]/.test(trimmed)) {
      setPathError('路径包含不支持的特殊字符');  // 非空错误文本
      return false;
    }
    setPathError(null);  // 关键：验证通过时设为null，而非空字符串
    return true;
  };
  
  const handleSubmit = async () => {
    // 基础验证
    if(!account || !password) {
      Alert.alert('提示', '请输入账号和密码');
      return;
    }
    
    // 路径验证
    if(!validateRootPath(rootPath)) return;
    
    setLoading(true);
    try {
      const normalizedRootPath = rootPath.trim().replace(/^\/+|\/+$/g, '');
      const driveConfig = DRIVE_CONFIGS[driveType];
      
      if(!driveConfig) {
        Alert.alert('错误', '不支持的网盘类型');
        return;
      }
      
      // 保存配置
      let configId;
      const existingConfigs = await getCloudDriveConfigsByType(userId, driveType);
      
      if(existingConfigs.length > 0) {
        // 更新第一个同类型配置
        await updateCloudDriveConfig(existingConfigs[0].id, {
          account,
          credential: password,
          root_path: normalizedRootPath
        });
        configId = existingConfigs[0].id;
      } else {
        configId = await addCloudDriveConfig({
          user_id: userId,
          drive_type: driveType,
          account,
          credential: password,
          root_path: normalizedRootPath
        });
      }
      
      // 测试连接
      const cloudSyncService = new CloudSyncService();
      const testResult = await cloudSyncService.testConnection({
        id: configId,
        user_id: userId,
        drive_type: driveType,
        account,
        credential: password,
        root_path: normalizedRootPath
      });
      
      if(testResult.success) {
        Alert.alert(
          '配置成功',
          `已成功连接到${driveConfig.displayName}，即将开始首次同步`,
          [{ text: '确定' }]
        );
        
        // 调用同步服务
        setTimeout(() => {
          cloudSyncService.syncAllAuto()
            .then(() => console.log('首次同步成功'))
            .catch(err => console.warn('首次同步失败:', err));
        }, 1000);
        
        onConfigSuccess?.({
          id: configId,
          drive_type: driveType
        });
        onClose();
      } else {
        console.log("testResult.message", testResult.message);
        Alert.alert(
          '连接失败',
          `无法连接到${driveConfig.displayName}：\n${testResult.message}`,
          [{ text: '重试' }]
        );
      }
    } catch(error) {
      console.error('保存配置失败:', error);
      // 数据库错误特殊处理
      if(error.message.includes('finalizing statement')) {
        Alert.alert('保存失败', '配置保存失败，请检查数据库连接或重试');
      } else {
        Alert.alert('错误', error.message || '保存配置时发生错误');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 确保driveConfig始终有有效值
  const driveConfig = DRIVE_CONFIGS[driveType] || {
    displayName: driveType || '未知网盘',
    note: ''
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* 头部区域 */}
          <View style={styles.header}>
            <Text style={styles.title}>{driveConfig.displayName}配置</Text>
            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {/* 提示信息 */}
          {driveConfig.note && (
            <View style={styles.noteContainer}>
              <Text style={styles.note}>{driveConfig.note}</Text>
            </View>
          )}
          
          {/* 表单区域 */}
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="账号/用户名"
              value={account}
              onChangeText={setAccount}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              disabled={loading}
            />
            
            <TextInput
              style={styles.input}
              placeholder="密码/令牌"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="next"
              disabled={loading}
            />
            
            <TextInput
              style={[styles.input, pathError ? styles.errorInput : null]}
              placeholder="文件存储路径"
              value={rootPath}
              onChangeText={(text) => {
                setRootPath(text);
                validateRootPath(text);
              }}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              disabled={loading}
            />
            
            <Text style={styles.pathHint}>
              默认路径: RNExpoDiaryApp
            </Text>
            
            {pathError && (
              <Text style={styles.errorText}>{pathError}</Text>
            )}
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitText}>连接并测试</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4, // 增加点击区域
  },
  noteContainer: {
    marginBottom: 15,
  },
  note: {
    color: '#e74c3c',
    fontSize: 13,
    padding: 8,
    backgroundColor: '#fef0f0',
    borderRadius: 4,
  },
  formContainer: {
    marginTop: 10,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  errorInput: {
    borderColor: '#e74c3c',
  },
  pathHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
    marginLeft: 15,
  },
  errorText: {
    fontSize: 12,
    color: '#e74c3c',
    marginBottom: 15,
    marginLeft: 15,
  },
  submitButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CloudDriveConfigForm;