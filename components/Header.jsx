import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import dayjs from "dayjs";

const Header = ({ selectedDate, onToday }) => {
  // 日期格式化
  const formatCurrentDate = () => {
    // 转换为dayjs对象，确保正确处理传入的日期
    const date = dayjs(selectedDate);
    // 格式化日期部分：年-月-日
    const datePart = date.format('YYYY年MM月DD日');
    // 获取星期几（中文）
    const weekday = date.format('ddd');
    return `${datePart} ${weekday}`;
  };
  
  // 右侧按钮点击事件
  const handleSync = () => {
    console.log('同步日记数据');
    // 实际应用中可添加同步逻辑和加载状态
  };
  
  const handleSearch = () => {
    console.log('打开搜索功能');
  };
  
  const handleSetting = () => {
    console.log('打开设置页面');
  };
  
  return (
    <View style={styles.headerContainer}>
      {/* 左侧日期显示 */}
      <Text style={styles.headerDate}>{formatCurrentDate()}</Text>
      
      <TouchableOpacity onPress={onToday} activeOpacity={0.8}>
        <Ionicons name="today-outline" size={22} color="#000" />
      </TouchableOpacity>
      
      {/* 右侧功能按钮组 */}
      <View style={styles.headerRightButtons}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSync}
          activeOpacity={0.8}
        >
          <Ionicons name="sync-outline" size={22} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSearch}
          activeOpacity={0.8}
        >
          <Ionicons name="search-outline" size={22} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSetting}
          activeOpacity={0.8}
        >
          <Ionicons name="settings-outline" size={22} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 24, // 适配状态栏
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
    fontSize: 16,
    color: '#000',
    elevation: 2,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
  },
  headerDate: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 20,
  },
});

export default Header;
