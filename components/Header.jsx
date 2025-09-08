import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import dayjs from "dayjs";
import { CloudSyncService } from '@/db/services/CloudSyncService';
import CloudDriveTypeSelector from '@/components/cloud/CloudDriveTypeSelector';
import CloudDriveConfigForm from '@/components/cloud/CloudDriveConfigForm';
import { getAllCloudDriveConfigs } from "@/db/cloudSyncDb";

const Header = ({ selectedDate, onToday, userId = 1 }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDriveSelector, setShowDriveSelector] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [selectedDriveType, setSelectedDriveType] = useState('');
  
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
    <View style={styles.headerContainer}>
      <Text style={styles.headerDate}>{formatCurrentDate()}</Text>
      <TouchableOpacity onPress={onToday} activeOpacity={0.8}>
        <Ionicons name="today-outline" size={22} color="#000" />
      </TouchableOpacity>
      <View style={styles.headerRightButtons}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSync}
          activeOpacity={0.8}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Ionicons name="sync-outline" size={22} color="#000" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="search-outline" size={22} color="#000" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="settings-outline" size={22} color="#000" />
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
    </View>
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
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerDate: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontWeight: '600'
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerButton: { marginLeft: 20 },
});

export default Header;
