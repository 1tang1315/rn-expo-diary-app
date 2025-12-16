import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import TimeRangePicker from "@/components/common/TimeRangePicker";
import CheckStat from "@/components/habit-tracking/CheckStat";
import ThemeSafeAreaView from "@/components/Theme/ThemeSafeAreaView";
import ThemeView from "@/components/Theme/ThemeView";
import StatsCard from "@/components/habit-tracking/StatsCard";
import dayjs from "dayjs";
import { getEventsByDateRange } from "@/db/eventDB";
import { useFocusEffect } from "expo-router";
import ThemeCard from "@/components/Theme/ThemeCard";

const HabitTracking = () => {
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('week');
  const [dateRange, setDateRange] = useState({});
  
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
    
    const data = await getEventsByDateRange(startDate, endDate);
    setStatsData(data);
    setLoading(false);
  }, []);
  
  // 初始加载
  useFocusEffect(
    useCallback(() => {
      const defaultStart = dayjs().startOf('week');
      const defaultEnd = dayjs().endOf('week');
      handleDateChange({
        startDate: defaultStart.toDate(),
        endDate: defaultEnd.toDate(),
        type: 'week'
      }).then();
    }, [handleDateChange])
  );
  
  return (
    <ThemeSafeAreaView>
      <ThemeView style={styles.container}>
        {/* 统计卡片 */}
        <StatsCard />
        
        {/* 打卡统计 */}
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
      </ThemeView>
    </ThemeSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0
  },
  checkStatContainer: {
    flex: 1,
    padding: 10
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default HabitTracking;