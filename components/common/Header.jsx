import CloudSyncApi from '@/api/CloudSyncApi';
import CloudDriveConfigForm from '@/components/cloud/CloudDriveConfigForm';
import CloudDriveTypeSelector from '@/components/cloud/CloudDriveTypeSelector';
import Icon from "@/components/common/Icon";
import SettingsMenu from '@/components/common/SettingsMenu';
import { useCloudDrive } from "@/context/CloudDriveContext";
import { useTheme } from '@/context/ThemeContext';
import dayjs from "dayjs";
import { useNavigation } from "expo-router";
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert, Platform,
  StyleSheet, Text,
  TouchableOpacity,
  View
} from 'react-native';
import RNDateTimePicker from "@react-native-community/datetimepicker";

const Header = ({ selectedDate, onToday, onDateChange, userId = 1 }) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { cloudDriveConfig } = useCloudDrive();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDriveSelector, setShowDriveSelector] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [selectedDriveType, setSelectedDriveType] = useState('');
  
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // 获取日期选择器配置
  const getPickerConfig = {
    value: selectedDate.toDate(),
    mode: 'date',
    display: Platform.OS === 'ios' ? 'inline' : 'spinner',
    minimumDate: new Date(1900, 0, 1), // 最小日期
    maximumDate: new Date(), // 禁止选择未来日期
  };
  
  const formatCurrentDate = () => {
    const date = dayjs(selectedDate);
    return `${date.format('YYYY年MM月DD日')} ${date.format('ddd')}`;
  };
  
  const checkConfig = () => {
    const { driveConfigs } = cloudDriveConfig;
    return driveConfigs && driveConfigs.length > 0;
  };
  
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const hasConfig = checkConfig();
      
      if(!hasConfig) {
        setShowDriveSelector(true);
        setIsSyncing(false);
        return;
      }
      
      await CloudSyncApi.syncAllAuto(cloudDriveConfig.driveConfigs);
      Alert.alert("同步成功");
    } catch(err) {
      console.error("同步失败", err);
      
      if(err.code === 'NO_CONFIG') {
        Alert.alert(
          "未配置网盘",
          "请先配置网盘账号和同步路径",
          [
            { text: "取消", style: "cancel" },
            { text: "去配置", onPress: () => setShowDriveSelector(true) }
          ]
        );
      } else {
        Alert.alert("同步失败", err.message || "未知错误");
      }
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleSelectDrive = (driveType) => {
    setSelectedDriveType(driveType);
    setShowConfigForm(true);
  };
  
  const handleConfigSuccess = async () => {
    setShowConfigForm(false);
    await handleSync();
  };
  
  const handleShowDatePicker = () => {
    setShowDatePicker(true);
  };
  
  const handleDateChange = (event, newDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if(!newDate) return;
    
    // 转换为dayjs对象并触发日期变更
    const selectedDay = dayjs(newDate);
    // 这里需要触发父组件的日期变更逻辑
    if(typeof onDateChange === 'function') {
      onDateChange(selectedDay);
    }
  };
  
  return (
    <View style={styles.headerContainer}>
      {/* 时间 日期 */}
      <TouchableOpacity
        onPress={handleShowDatePicker}
        activeOpacity={0.8}
      >
        <Text style={{
          color: theme.colors.interactive,
          fontSize: 16,
          fontWeight: 600
        }}>
          {formatCurrentDate()}
        </Text>
      </TouchableOpacity>
      
      {/* 回到今日 */}
      <TouchableOpacity onPress={onToday} activeOpacity={0.8}>
        <Icon lib="Ionicons" name="today-outline" />
      </TouchableOpacity>
      
      <View style={styles.headerRightButtons}>
        {/* 同步 */}
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSync}
          activeOpacity={0.8}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <Icon lib="Ionicons" name="sync-outline" />
          )}
        </TouchableOpacity>
        
        {/* 搜索 */}
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('search-page')}
        >
          <Icon lib="Ionicons" name="search-outline" />
        </TouchableOpacity>
        
        {/* 设置 */}
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowSettingsMenu(true)}
          activeOpacity={0.8}
        >
          <Icon lib="Ionicons" name="settings-outline" />
        </TouchableOpacity>
      </View>
      
      <CloudDriveTypeSelector
        visible={showDriveSelector}
        onClose={() => setShowDriveSelector(false)}
        onSelectDrive={handleSelectDrive}
      />
      
      <CloudDriveConfigForm
        visible={showConfigForm}
        onClose={() => setShowConfigForm(false)}
        driveType={selectedDriveType}
        onConfigSuccess={handleConfigSuccess}
      />
      
      <SettingsMenu
        visible={showSettingsMenu}
        onClose={() => setShowSettingsMenu(false)}
        onSelectOption={(optionId) => {
          switch(optionId) {
            case 'account':
              console.log('处理账户设置');
              // 导航到账户设置页面等逻辑
              break;
            case 'cloud':
              navigation.navigate('cloud-drive-settings');
              break;
            case 'notifications':
              console.log('处理通知设置');
              break;
            case 'data-generation':
              navigation.navigate('data-generation-page');
              break;
            case 'about':
              navigation.navigate('about-us');
              break;
            case 'help':
              console.log('处理帮助中心');
              break;
            default:
              break;
          }
        }}
      />
      
      {/* 日期选择器 - 统一使用date模式 */}
      {showDatePicker && (
        <RNDateTimePicker
          {...getPickerConfig}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerButton: { marginLeft: 20 }
});

export default Header;
