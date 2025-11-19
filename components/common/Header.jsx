import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import dayjs from "dayjs";
import { CloudSyncService } from '@/db/services/CloudSyncService';
import CloudDriveTypeSelector from '@/components/cloud/CloudDriveTypeSelector';
import CloudDriveConfigForm from '@/components/cloud/CloudDriveConfigForm';
import { getAllCloudDriveConfigs } from "@/db/cloudSyncDb";
import SettingsMenu from '@/components/common/SettingsMenu';
import { useNavigation } from "expo-router";
import { useTheme } from '@/context/ThemeContext';
import ThemeView from "@/components/Theme/ThemeView";
import Icon from "@/components/common/Icon";
import ThemeTitleText from "@/components/Theme/ThemeTitleText";

const Header = ({ selectedDate, onToday, userId = 1 }) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDriveSelector, setShowDriveSelector] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [selectedDriveType, setSelectedDriveType] = useState('');
  
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  
  const formatCurrentDate = () => {
    const date = dayjs(selectedDate);
    return `${date.format('YYYY年MM月DD日')} ${date.format('ddd')}`;
  };
  
  const checkConfig = async () => {
    const configs = await getAllCloudDriveConfigs(userId);
    return configs && configs.length > 0;
  };
  
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const hasConfig = await checkConfig();
      
      if (!hasConfig) {
        setShowDriveSelector(true);
        setIsSyncing(false);
        return;
      }
      
      const cloudSyncService = new CloudSyncService();
      await cloudSyncService.syncAllAuto();
      Alert.alert("同步成功");
    } catch (err) {
      console.error("同步失败", err);
      
      if (err.code === 'NO_CONFIG') {
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
  
  return (
    <ThemeView style={styles.headerContainer}>
      {/* 时间 日期 */}
      <ThemeTitleText>{formatCurrentDate()}</ThemeTitleText>
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
            <ActivityIndicator size="small" color={theme.colors.primary} />
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
        userId={userId}
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
              console.log('处理关于我们');
              break;
            case 'help':
              console.log('处理帮助中心');
              break;
            default:
              break;
          }
        }}
      />
    </ThemeView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0'
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerButton: { marginLeft: 20 }
});

export default Header;
