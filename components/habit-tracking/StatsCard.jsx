import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import ThemeCard from "@/components/theme/ThemeCard";
import ThemeText from "@/components/theme/ThemeText";
import ThemeSubTitleText from "@/components/theme/ThemeSubTitleText";
import { eventApi } from "@/api";

const StatsCard = ({ stats = [] }) => {
  const [realStats, setRealStats] = useState([]);
  
  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { totalEvents, totalRecords, totalDuration, recordDays } = await eventApi.getTotalStats();
        setRealStats([
          { label: '事件总数', value: totalEvents },
          { label: '记录次数', value: totalRecords },
          { label: '总时长', value: totalDuration },
          { label: '记录天数', value: recordDays },
        ]);
      } catch (error) {
        console.error('获取统计数据失败:', error);
        // 失败时使用默认值
        setRealStats([
          { label: '事件总数', value: '0个' },
          { label: '记录次数', value: '0次' },
          { label: '总时长', value: '0小时' },
          { label: '记录天数', value: '0天' },
        ]);
      }
    };
    
    fetchStats().then();
  }, []);
  
  const renderStats = realStats.length > 0
    ? realStats
    : (stats.length > 0 ? stats : [
      { label: '事件总数', value: '0个' },
      { label: '记录次数', value: '0次' },
      { label: '总时长', value: '0小时' },
      { label: '记录天数', value: '0天' },
    ]);
  
  return (
    <View style={styles.cardContainer}>
      {renderStats.map((item, index) => (
        <ThemeCard key={index} style={styles.statItem}>
          <ThemeText style={styles.statValue}>{item.value}</ThemeText>
          <ThemeSubTitleText style={styles.statLabel}>{item.label}</ThemeSubTitleText>
        </ThemeCard>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '49%',
    height: 70
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700'
  },
  statLabel: {
    fontSize: 12
  },
});

export default StatsCard;