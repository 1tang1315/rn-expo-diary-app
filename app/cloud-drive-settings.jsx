import CloudDriveConfigForm from '@/components/cloud/CloudDriveConfigForm';
import CloudDriveTypeSelector from '@/components/cloud/CloudDriveTypeSelector';
import ThemeSafeAreaView from "@/components/theme/ThemeSafeAreaView";
import { useCloudDrive } from '@/context/CloudDriveContext';
import { DRIVE_CONFIGS } from '@/core/service/CloudSyncService';
import CloudSyncApi from '@/api/CloudSyncApi';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CloudDriveSettings = () => {
  const { cloudDriveConfig, isLoading, deleteDriveConfig } = useCloudDrive();
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [selectedDriveType, setSelectedDriveType] = useState(null);
  const [syncingDriveId, setSyncingDriveId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 选择云盘类型后显示配置表单
  const handleSelectDriveType = (type) => {
    setSelectedDriveType(type);
    setShowTypeSelector(false);
    setShowConfigForm(true);
  };
  
  // 配置成功后刷新列表
  const handleConfigSuccess = () => {
    setShowConfigForm(false);
  };
  
  // 删除云盘配置
  const handleDeleteDrive = async (id, driveType) => {
    const driveConfig = DRIVE_CONFIGS[driveType] || { displayName: driveType };
    Alert.alert(
      '确认删除',
      `确定要删除${driveConfig.displayName}的配置吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDriveConfig(id);
            } catch (error) {
              console.error('删除云盘配置失败:', error);
              Alert.alert('错误', '删除配置失败，请重试');
            }
          }
        }
      ]
    );
  };
  
  // 测试云盘连接
  const testDriveConnection = async (drive) => {
    try {
      setLoading(true);
      const result = await CloudSyncApi.testConnection(drive);
      
      if (result.success) {
        Alert.alert('测试成功', result.message, [{ text: '确定' }]);
      } else {
        Alert.alert('测试失败', result.message, [{ text: '重试' }]);
      }
    } catch (error) {
      console.error('测试连接失败:', error);
      Alert.alert('错误', error.message || '测试连接时发生错误');
    } finally {
      setLoading(false);
    }
  };
  
  // 同步单个云盘
  const syncDrive = async (drive) => {
    try {
      setSyncingDriveId(drive.id);
      await CloudSyncApi.syncAllAuto([drive]);
      Alert.alert('同步成功', `${DRIVE_CONFIGS[drive.drive_type]?.displayName || drive.drive_type}同步完成`);
    } catch (error) {
      console.error('同步失败:', error);
      Alert.alert('同步失败', error.message || '同步过程中发生错误');
    } finally {
      setSyncingDriveId(null);
    }
  };
  
  // 渲染云盘列表项
  const renderDriveItem = ({ item }) => {
    const driveConfig = DRIVE_CONFIGS[item.drive_type] || {
      displayName: item.drive_type,
      icon: 'cloud-outline',
      color: '#999'
    };
    
    // 根据云盘类型获取对应图标
    const getDriveIcon = () => {
      switch (item.drive_type) {
        case 'nutstore':
          return <Ionicons name="cloud-circle-outline" size={24} color="#3498db" />;
        case 'dropbox':
          return <Ionicons name="cloud-outline" size={24} color="#0061FE" />;
        case 'onedrive':
          return <Ionicons name="cloud-done-outline" size={24} color="#0078D4" />;
        case 'baidu':
          return <Ionicons name="cloud-download-outline" size={24} color="#2D82FF" />;
        default:
          return <Ionicons name="cloud-outline" size={24} color="#999" />;
      }
    };
    
    return (
      <View style={styles.driveItem}>
        <View style={styles.driveIconContainer}>
          {getDriveIcon()}
        </View>
        
        <View style={styles.driveInfo}>
          <Text style={styles.driveName}>{driveConfig.displayName}</Text>
          <Text style={styles.driveAccount}>{item.account}</Text>
          <Text style={styles.drivePath}>路径: {item.root_path}</Text>
        </View>
        
        <View style={styles.driveActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedDriveType(item.drive_type);
              setShowConfigForm(true);
            }}
          >
            <Ionicons name="pencil-outline" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => testDriveConnection(item)}
            disabled={loading}
          >
            <Ionicons name="wifi-outline" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => syncDrive(item)}
            disabled={syncingDriveId === item.id}
          >
            {syncingDriveId === item.id ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <Ionicons name="sync-outline" size={20} color="#666" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteDrive(item.id, item.drive_type)}
          >
            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }
  
  const { driveConfigs } = cloudDriveConfig;
  
  return (
    <ThemeSafeAreaView style={styles.container}>
      <Text style={styles.title}>云盘设置</Text>
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowTypeSelector(true)}
      >
        <Ionicons name="add" size={20} color="white" style={styles.addIcon} />
        <Text style={styles.addText}>添加云盘</Text>
      </TouchableOpacity>
      
      {driveConfigs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cloud-offline-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>尚未配置云盘</Text>
          <Text style={styles.emptySubtext}>添加云盘以启用数据同步功能</Text>
        </View>
      ) : (
        <FlatList
          data={driveConfigs}
          renderItem={renderDriveItem}
          keyExtractor={item => item.id.toString()}
          style={styles.driveList}
        />
      )}
      
      {/* 云盘类型选择器 */}
      <CloudDriveTypeSelector
        visible={showTypeSelector}
        onClose={() => setShowTypeSelector(false)}
        onSelectDrive={handleSelectDriveType}
      />
      
      {/* 云盘配置表单 */}
      <CloudDriveConfigForm
        visible={showConfigForm}
        onClose={() => setShowConfigForm(false)}
        driveType={selectedDriveType}
        onConfigSuccess={handleConfigSuccess}
      />
    </ThemeSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  addIcon: {
    marginRight: 10,
  },
  addText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  driveList: {
    flex: 1,
  },
  driveItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  driveIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  driveInfo: {
    flex: 1,
    marginLeft: 10,
  },
  driveName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  driveAccount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  drivePath: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  driveActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CloudDriveSettings;