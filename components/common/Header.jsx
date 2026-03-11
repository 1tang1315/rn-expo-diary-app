import CloudDriveConfigForm from '@/components/cloud/CloudDriveConfigForm';
import CloudDriveTypeSelector from '@/components/cloud/CloudDriveTypeSelector';
import Icon from "@/components/common/Icon";
import SettingsMenu from '@/components/common/SettingsMenu';
import ThemeTitleText from "@/components/theme/ThemeTitleText";
import { useTheme } from '@/context/ThemeContext';
import CloudSyncApi from '@/api/CloudSyncApi';
import dayjs from "dayjs";
import { useNavigation } from "expo-router";
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { useCloudDrive } from "@/context/CloudDriveContext";

const Header = ({ selectedDate, onToday, userId = 1 }) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { cloudDriveConfig } = useCloudDrive();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDriveSelector, setShowDriveSelector] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [selectedDriveType, setSelectedDriveType] = useState('');
  
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  
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
      
      if (!hasConfig) {
        setShowDriveSelector(true);
        setIsSyncing(false);
        return;
      }
      
      await CloudSyncApi.syncAllAuto(cloudDriveConfig.driveConfigs);
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
    <View style={styles.headerContainer}>
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
