import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import ThemeSafeAreaView from "@/components/Theme/ThemeSafeAreaView";
import Icon from "@/components/common/Icon";
import Ionicons from '@expo/vector-icons/Ionicons';
import { getAllCloudDriveConfigs } from '@/db/cloudSyncDb';
import { getCurrentUserId } from '@/db/userDB';
import { DRIVE_CONFIGS } from '@/db/services/CloudSyncService';
import ThemeCard from "@/components/Theme/ThemeCard";
import AISettingsModal from "@/components/chat/AISettingsModal";
import { useNavigation } from '@react-navigation/native';
import ThemeTitleText from "@/components/Theme/ThemeTitleText";
import ThemeButton from "@/components/Theme/ThemeButton";
import ThemePartingLine from "@/components/Theme/ThemePartingLine";
import ThemeSubTitleText from "@/components/Theme/ThemeSubTitleText";
import { Link, useFocusEffect } from "expo-router";
import { useAIConfig } from "@/context/AIConfigContext";

const MODE_LIST = [
  {
    key: 'light',
    label: '浅色'
  },
  {
    key: 'dark',
    label: '深色'
  },
  {
    key: 'blue',
    label: '蓝色'
  },
  {
    key: 'green',
    label: '绿色'
  },
  {
    key: 'purple',
    label: '紫色'
  }
];


export default function Mine() {
  const {
    mode,
    theme,
    primaryColor,
    setThemeMode,
    setPrimaryColor,
    PRESET_COLORS,
  } = useTheme();
  
  // 云盘相关状态
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // AI配置相关状态
  const [showAISettings, setShowAISettings] = useState(false);
  const { aiConfig } = useAIConfig();
  
  // 导航钩子
  const navigation = useNavigation();
  
  // 初始化云盘数据
  const initCloudDrives = useCallback(async () => {
    try {
      const uid = await getCurrentUserId();
      await fetchDrives(uid);
    } catch(error) {
      console.error('初始化云盘设置失败:', error);
      Alert.alert('云盘错误', '无法加载云盘配置，请重试');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      initCloudDrives().then();
    }, [initCloudDrives])
  );
  
  
  
  // 刷新云盘列表
  const fetchDrives = async (uid) => {
    if(!uid) return;
    const driveConfigs = await getAllCloudDriveConfigs(uid);
    setDrives(driveConfigs);
  };
  
  // 跳转到云盘编辑页面
  const navigateToAddCloudDrive = () => {
    navigation.navigate('cloud-drive-settings');
  };
  
  const getDriveIcon = (drive) => {
    switch(drive.drive_type) {
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
  
  // 格式化API密钥显示（隐藏中间部分）
  const formatApiKey = (key) => {
    if(!key) return '未设置';
    return key.slice(0, 6) + '****' + key.slice(-4);
  };
  
  return (
    <ThemeSafeAreaView>
      <ScrollView>
        {/* AI设置卡片 */}
        <ThemeCard style={styles.card}>
          <View style={styles.row}>
            <ThemeTitleText>AI 配置</ThemeTitleText>
            
            {/* 修改按钮 */}
            <ThemeButton
              style={styles.editButton}
              title="修改"
              onPress={() => setShowAISettings(true)}
            ></ThemeButton>
          </View>
          
          <ThemePartingLine></ThemePartingLine>
          
          {/* 显示已配置的参数 */}
          <View style={styles.aiConfigDetails}>
            <View style={styles.aiConfigItem}>
              <ThemeSubTitleText style={styles.aiConfigLabel}>API 密钥:</ThemeSubTitleText>
              <Text style={[styles.aiConfigValue, { color: theme.colors.text }]}>
                {formatApiKey(aiConfig.apiKey)}
              </Text>
            </View>
            
            <View style={styles.aiConfigItem}>
              <ThemeSubTitleText style={styles.aiConfigLabel}>模型:</ThemeSubTitleText>
              <Text style={[styles.aiConfigValue, { color: theme.colors.text }]}>
                {aiConfig.model}
              </Text>
            </View>
            
            <View style={styles.aiConfigItem}>
              <ThemeSubTitleText style={styles.aiConfigLabel}>API 基础地址:</ThemeSubTitleText>
              <Text style={[styles.aiConfigValue, { color: theme.colors.text }]}>{aiConfig.apiBaseUrl}</Text>
            </View>
            
            <View style={styles.aiConfigItem}>
              <ThemeSubTitleText style={styles.aiConfigLabel}>硅基流动官网:</ThemeSubTitleText>
              <Link
                href="https://siliconflow.cn/"
                style={[
                  styles.aiConfigValue,
                  {
                    color: theme.colors.interactive,
                    textDecorationLine: 'underline'
                  }
                ]}
              >https://siliconflow.cn/</Link>
            </View>
          </View>
        </ThemeCard>
        
        {/* AI配置弹窗 */}
        <AISettingsModal
          visible={showAISettings}
          onClose={() => setShowAISettings(false)}
        />
        
        {/* 云盘设置卡片 */}
        <ThemeCard style={styles.card}>
          <View style={styles.row}>
            <ThemeTitleText>云盘设置</ThemeTitleText>
            
            {/* 修改按钮 */}
            <ThemeButton
              style={styles.editButton}
              title="修改"
              onPress={navigateToAddCloudDrive}
            ></ThemeButton>
          </View>
          
          <ThemePartingLine></ThemePartingLine>
          
          {/* 云盘列表显示 */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.interactive} />
            </View>
          ) : drives.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>尚未配置云盘</Text>
              <Text
                style={[styles.emptySubtext, { color: theme.colors.subText }]}>点击修改添加云盘以启用数据同步功能</Text>
            </View>
          ) : (
            <View style={styles.driveList}>
              {drives.map((item) => (
                <View key={item.id.toString()} style={[styles.driveItemSummary, {borderColor: theme.colors.interactive}]}>
                  <View style={styles.driveIconContainer}>
                    {getDriveIcon(item)}
                  </View>
                  <View style={styles.driveInfoSummary}>
                    <Text style={[styles.driveName, { color: theme.colors.text }]}>
                      {DRIVE_CONFIGS[item.drive_type]?.displayName || item.drive_type}
                    </Text>
                    <Text style={[styles.driveAccount, { color: theme.colors.subText }]}>
                      账号: {item.account}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ThemeCard>
        
        <ThemeCard style={styles.card}>
          <ThemeTitleText style={{marginBottom: 10}}>主题设置</ThemeTitleText>
          
          <ThemePartingLine></ThemePartingLine>
          
          {/* 主题风格 */}
          <Text style={[styles.subTitle, { color: theme.colors.text }]}>主题风格</Text>
          <View style={styles.colorRow}>
            {MODE_LIST?.map(m => (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.modeBtn, {
                    borderColor: mode === m.key ? theme.colors.interactive : theme.colors.border,
                  }
                ]}
                onPress={() => setThemeMode(m.key)}
              >
                <Text style={{ color: mode === m.key ? theme.colors.interactive : theme.colors.text }}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <ThemePartingLine></ThemePartingLine>
          
          {/* 主色调选择 */}
          <Text style={[styles.subTitle, { color: theme.colors.text }]}>主色调</Text>
          <View style={styles.colorRow}>
            {PRESET_COLORS?.map(color => (
              <TouchableOpacity
                key={color}
                style={[styles.colorBtn, { backgroundColor: color }]}
                onPress={() => setPrimaryColor(color)}
              >
                {primaryColor === color && (
                  <Icon lib="MaterialIcons" name="check" size={20} color="white" style={styles.colorCheck} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ThemeCard>
      </ScrollView>
    </ThemeSafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  label: {
    fontSize: 16,
    fontWeight: '600'
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  
  modeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 6
  },
  
  // 主色选择按钮样式
  colorBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.2,
  },
  colorCheck: {
    textShadowColor: '#000',
    textShadowOffset: {
      width: 0,
      height: 1
    },
    textShadowRadius: 1,
  },
  
  // 云盘相关样式
  driveItemSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  driveInfoSummary: {
    marginLeft: 12,
    flex: 1,
  },
  driveList: {
    flex: 1,
  },
  driveItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  driveIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  driveName: {
    fontSize: 16,
    fontWeight: '600',
  },
  driveAccount: {
    fontSize: 14,
    marginTop: 2,
  },

  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  
  loadingContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiConfigDetails: {
    flex: 1
  },
  aiConfigItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  aiConfigLabel: {
    width: 100,
    marginRight: 15,
    fontSize: 14,
  },
  aiConfigValue: {
    flex: 1,
    height: 16,
    lineHeight: 16,
    fontSize: 14,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6
  }
});