import { statisticsApi } from "@/api/StatisticsApi";
import TimeRangePicker from "@/components/common/TimeRangePicker";
import CheckStat from "@/components/habit-tracking/CheckStat";
import StatsCard from "@/components/habit-tracking/StatsCard";
import ThemeCard from "@/components/theme/ThemeCard";
import ThemeSafeAreaView from "@/components/theme/ThemeSafeAreaView";
import { AsyncStorage } from "expo-sqlite/kv-store";
import dayjs from "dayjs";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const HabitTracking = () => {
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('week');
  const [dateRange, setDateRange] = useState({});
  const dateRangeRef = React.useRef(dateRange);
  
  // 更新ref以跟踪最新的dateRange
  useEffect(() => {
    dateRangeRef.current = dateRange;
  }, [dateRange]);
  
  // 从持久化存储加载状态
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const savedState = await AsyncStorage.getItem('habitTrackingState');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          setViewType(parsedState.viewType || 'week');
          if (parsedState.dateRange) {
            setDateRange({
              startDate: new Date(parsedState.dateRange.startDate),
              endDate: new Date(parsedState.dateRange.endDate)
            });
          }
        }
      } catch (error) {
        console.error('加载保存的状态失败:', error);
      }
    };
    
    loadSavedState();
  }, []);
  
  // 保存状态到持久化存储
  useEffect(() => {
    const saveState = async () => {
      try {
        await AsyncStorage.setItem('habitTrackingState', JSON.stringify({
          viewType,
          dateRange: dateRange.startDate && dateRange.endDate ? {
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString()
          } : {}
        }));
      } catch (error) {
        console.error('保存状态失败:', error);
      }
    };
    
    if (dateRange.startDate && dateRange.endDate) {
      saveState();
    }
  }, [viewType, dateRange]);
  
  // 处理日期范围变化
  const handleDateChange = useCallback(async ({
    startDate,
    endDate,
    type
  }) => {
    setLoading(true);
    setDateRange({
      startDate,
      endDate
    });
    setViewType(type);
    
    const data = await statisticsApi.getHabitTrackingData({ startDate, endDate });
    setStatsData(data);
    setLoading(false);
  }, []);
  
  // 初始加载
  useFocusEffect(
    useCallback(() => {
      // 只有当dateRange为空时才设置默认值
      if (!dateRangeRef.current.startDate || !dateRangeRef.current.endDate) {
        const defaultStart = dayjs().startOf('week');
        const defaultEnd = dayjs().endOf('week');
        handleDateChange({
          startDate: defaultStart.toDate(),
          endDate: defaultEnd.toDate(),
          type: 'week'
        }).then();
      }
    }, [handleDateChange])
  );
  
  return (
    <ThemeSafeAreaView>
      {/* 统计卡片 */}
      <StatsCard />
      
      <ThemeCard style={styles.checkStatContainer}>
        <TimeRangePicker onRangeChange={handleDateChange} />
        
        {loading ? (
          <View style={styles.loading}>
            <Text>加载数据中...</Text>
          </View>
        ) : (
          <CheckStat
            data={statsData}
            viewType={viewType}
            dateRange={dateRange}
          />
        )}
      </ThemeCard>
    </ThemeSafeAreaView>
  );
};

const styles = StyleSheet.create({
  checkStatContainer: {
    flex: 1
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default HabitTracking;