import StatsCard from "@/components/chart/StatsCard";
import TimeRangePicker from "@/components/common/TimeRangePicker";
import ThemeCard from "@/components/theme/ThemeCard";
import ThemeSafeAreaView from "@/components/theme/ThemeSafeAreaView";
import ThemeText from "@/components/theme/ThemeText";
import { scoreApi } from "@/api/ScoreApi";
import dayjs from "dayjs";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { StyleSheet } from "react-native";

export default function Analyse() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState({
    totalScore: 0,
    scores: {
      sleepScore: 0,
      dietScore: 0,
      sportScore: 0,
      productivityScore: 0,
      emotionScore: 0,
      balanceScore: 0
    },
    eventSummary: {
      totalEvents: 0,
      completedEvents: 0,
      categoryCount: 0
    },
    aiAdvice: {
      summary: '',
      suggestions: []
    }
  });
  const [currentDateRange, setCurrentDateRange] = useState({});
  
  const handleDateChange = useCallback(async ({ startDate, endDate }) => {
    setCurrentDateRange({ startDate, endDate });
    
    try {
      const result = await scoreApi.getDashboard({ startDate, endDate });
      if (result) {
        setDashboardData(result);
      } else {
        console.error('Failed to get score data: No data returned');
      }
    } catch (error) {
      console.error('Error getting score data:', error);
    }
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      const defaultStart = dayjs().startOf('day');
      const defaultEnd = dayjs().endOf('day');
      handleDateChange({
        startDate: defaultStart.toDate(),
        endDate: defaultEnd.toDate()
      });
    }, [handleDateChange])
  );
  
  const handleStatPress = useCallback((item) => {
    // 映射标签到类型
    const typeMap = {
      '综合评分': 'overall',
      '睡眠评分': 'sleep',
      '情绪评分': 'mood',
      '饮食评分': 'diet',
      '运动评分': 'exercise',
      '效率评分': 'productivity',
      '平衡评分': 'balance'
    };
    
    const type = typeMap[item.label];
    if (type) {
      router.push({
        pathname: 'analyse-detail',
        params: {
          type,
          startDate: encodeURIComponent(currentDateRange.startDate?.toISOString() || new Date().toISOString()),
          endDate: encodeURIComponent(currentDateRange.endDate?.toISOString() || new Date().toISOString())
        }
      });
    }
  }, [router, currentDateRange]);
  
  return (
    <ThemeSafeAreaView>
      <TimeRangePicker onRangeChange={handleDateChange} />
      
      <StatsCard
        stats={[
          { label: '综合评分', value: dashboardData.totalScore, unit: '分' },
          { label: '睡眠评分', value: dashboardData.scores.sleepScore, unit: '分' },
          { label: '情绪评分', value: dashboardData.scores.emotionScore, unit: '分' },
          { label: '饮食评分', value: dashboardData.scores.dietScore, unit: '分' },
          { label: '运动评分', value: dashboardData.scores.sportScore, unit: '分' },
          { label: '效率评分', value: dashboardData.scores.productivityScore, unit: '分' },
          { label: '平衡评分', value: dashboardData.scores.balanceScore, unit: '分' }
        ]}
        onStatPress={handleStatPress}
      />

      <ThemeCard style={styles.summaryCard}>
        <ThemeText>事件总数：{dashboardData.eventSummary.totalEvents}</ThemeText>
        <ThemeText>已完成：{dashboardData.eventSummary.completedEvents}</ThemeText>
        <ThemeText>涉及分类：{dashboardData.eventSummary.categoryCount}</ThemeText>
        <ThemeText style={styles.aiSummary}>
          AI总结：{dashboardData.aiAdvice.summary || '暂无分析'}
        </ThemeText>
      </ThemeCard>
    </ThemeSafeAreaView>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    marginTop: 10
  },
  aiSummary: {
    marginTop: 8
  }
});