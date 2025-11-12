import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const SettingsScreen = () => {
  // 获取当前主题
  const { colors } = useTheme();
  
  // 状态管理
  const [darkMode, setDarkMode] = useState(false);
  const [cloudSync, setCloudSync] = useState(true);
  const [aiFeatures, setAiFeatures] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);
  const [storageLocation, setStorageLocation] = useState('personal');
  const [aiModel, setAiModel] = useState('balanced');
  
  // 从存储加载设置
  useEffect(() => {
    const loadSettings = async () => {
      const savedDarkMode = await SecureStore.getItemAsync('darkMode');
      const savedCloudSync = await SecureStore.getItemAsync('cloudSync');
      const savedThemeColor = await SecureStore.getItemAsync('themeColor');
      
      const savedAiFeatures = await SecureStore.getItemAsync('aiFeatures');
      const savedAutoBackup = await SecureStore.getItemAsync('autoBackup');
      const savedStorage = await SecureStore.getItemAsync('storageLocation');
      const savedAiModel = await SecureStore.getItemAsync('aiModel');
      
      if (savedDarkMode) setDarkMode(savedDarkMode === 'true');
      if (savedCloudSync) setCloudSync(savedCloudSync === 'true');
      if (savedThemeColor) {
        setThemeColor(savedThemeColor);
        setSelectedThemeColor(savedThemeColor);
      }
      if (savedAiFeatures) setAiFeatures(savedAiFeatures === 'true');
      if (savedAutoBackup) setAutoBackup(savedAutoBackup === 'true');
      if (savedStorage) setStorageLocation(savedStorage);
      if (savedAiModel) setAiModel(savedAiModel);
    };
    
    loadSettings().then();
  }, []);
  
  // 保存设置
  const saveSetting = async (key, value) => {
    await SecureStore.setItemAsync(key, value.toString());
  };
  
  // 渲染开关类型设置项
  const renderSwitchSetting = (title, description, value, onValueChange, icon) => (
    <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
      <Ionicons name={icon} size={24} color={colors.primary} style={styles.settingIcon} />
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {description && (
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.background}
      />
    </View>
  );
  
  // 渲染选项选择设置项
  const renderOptionSetting = (title, description, options, selectedValue, onSelect, icon, customOnPress) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: colors.card }]}
      onPress={customOnPress || (() => showOptionsDialog(title, options, onSelect))}
    >
      <Ionicons name={icon} size={24} color={colors.primary} style={styles.settingIcon} />
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
          {options.find(opt => opt.value === selectedValue)?.label || description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
  
  // 渲染链接式设置项
  const renderLinkSetting = (title, description, onPress, icon) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: colors.card }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={24} color={colors.primary} style={styles.settingIcon} />
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {description && (
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
  
  // 显示选项对话框
  const showOptionsDialog = (title, options, onSelect) => {
    Alert.alert(
      title,
      null,
      options.map(option => ({
        text: option.label,
        onPress: () => onSelect(option.value)
      })),
      { cancelable: true }
    );
  };
  
  // 主题
  const [themeColor, setThemeColor] = useState('blue');
  const [themeColorModalVisible, setThemeColorModalVisible] = useState(false);
  const [selectedThemeColor, setSelectedThemeColor] = useState('blue');
  
  const themeColorLabels = {
    blue: '蓝色',
    green: '绿色',
    red: '红色',
    purple: '紫色'
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollContainer}>
        {/* 个人信息卡片 */}
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={64} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>用户名</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>user@example.com</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>编辑</Text>
          </TouchableOpacity>
        </View>
        
        {/* 主题设置 */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>主题设置</Text>
        {renderSwitchSetting(
          '深色模式',
          '切换应用的深色/浅色显示模式',
          darkMode,
          (value) => {
            setDarkMode(value);
            saveSetting('darkMode', value);
            Alert.alert('提示', '主题更改将在下次启动时生效');
          },
          'moon'
        )}
        {renderOptionSetting(
          '主题颜色',
          themeColorLabels[themeColor] || '选择应用的主色调',
          [
            { label: '蓝色', value: 'blue' },
            { label: '绿色', value: 'green' },
            { label: '红色', value: 'red' },
            { label: '紫色', value: 'purple' }
          ],
          themeColor,
          () => {}, // 占位，实际通过弹窗触发
          'color-palette',
          () => {
            setSelectedThemeColor(themeColor);
            setThemeColorModalVisible(true);
          }
        )}
        {renderLinkSetting(
          '字体设置',
          '调整应用内文字大小和样式',
          () => Alert.alert('提示', '字体设置功能即将上线'),
          'text'
        )}
        
        {/* 网盘设置 */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>网盘设置</Text>
        {renderSwitchSetting(
          '云同步',
          '开启后自动同步文件到云端',
          cloudSync,
          (value) => {
            setCloudSync(value);
            saveSetting('cloudSync', value);
          },
          'cloud-sync'
        )}
        {renderSwitchSetting(
          '自动备份',
          '每日自动备份重要文件',
          autoBackup,
          (value) => {
            setAutoBackup(value);
            saveSetting('autoBackup', value);
          },
          'cloud-upload'
        )}
        {renderOptionSetting(
          '默认存储位置',
          '选择新文件的保存位置',
          [
            { label: '个人网盘', value: 'personal' },
            { label: '家庭共享', value: 'family' },
            { label: '仅本地', value: 'local' }
          ],
          storageLocation,
          (value) => {
            setStorageLocation(value);
            saveSetting('storageLocation', value);
          },
          'folder'
        )}
        {renderLinkSetting(
          '存储空间',
          '查看和管理你的存储空间',
          () => Alert.alert('存储空间', '已使用: 2.4GB / 10GB'),
          'hard-drive'
        )}
        
        {/* AI设置 */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>AI设置</Text>
        {renderSwitchSetting(
          'AI功能',
          '开启或关闭所有AI相关功能',
          aiFeatures,
          (value) => {
            setAiFeatures(value);
            saveSetting('aiFeatures', value);
          },
          'cog'
        )}
        {renderOptionSetting(
          'AI模型',
          '选择使用的AI模型',
          [
            { label: '平衡模式', value: 'balanced' },
            { label: '性能优先', value: 'performance' },
            { label: '省电模式', value: 'efficient' }
          ],
          aiModel,
          (value) => {
            setAiModel(value);
            saveSetting('aiModel', value);
          },
          'brain'
        )}
        {renderLinkSetting(
          'AI隐私设置',
          '管理AI功能的隐私选项',
          () => Alert.alert('提示', 'AI隐私设置功能即将上线'),
          'shield'
        )}
      </ScrollView>
      
      {/* 主题颜色选择弹窗 */}
      <Modal
        visible={themeColorModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setThemeColorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>主题颜色</Text>
            
            {/* 颜色选择块区域 */}
            <View style={styles.colorOptionContainer}>
              {[
                { value: 'blue', color: '#2196f3' },
                { value: 'green', color: '#4caf50' },
                { value: 'red', color: '#f44336' },
                { value: 'purple', color: '#9c27b0' }
              ].map(item => (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.colorOption, selectedThemeColor === item.value && styles.selectedColorOption]}
                  onPress={() => setSelectedThemeColor(item.value)}
                >
                  <View style={[styles.colorBlock, { backgroundColor: item.color }]} />
                </TouchableOpacity>
              ))}
            </View>
            
            {/* 底部按钮区域 */}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setThemeColorModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  setThemeColor(selectedThemeColor);
                  saveSetting('themeColor', selectedThemeColor).then();
                  setThemeColorModalVisible(false);
                }}
              >
                <Text style={styles.confirmButtonText}>确认</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2196f3',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  settingIcon: {
    width: 24,
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    width: '80%',
    gap: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#ffffff'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center'
  },
  colorOptionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16
  },
  colorOption: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
    borderRadius: '50%'
  },
  colorBlock: {
    width: 30,
    height: 30,
    borderRadius: '50%'
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: '#2196f3',
    borderRadius: 10
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center'
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333333'
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2196f3',
    alignItems: 'center'
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#ffffff'
  }
});

export default SettingsScreen;