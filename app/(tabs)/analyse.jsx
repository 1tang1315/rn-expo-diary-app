import { analyseApi, eventApi } from "@/api";
import OverallScoreCard from "@/components/analyse/OverallScoreCard";
import ScoreRowCard from "@/components/analyse/ScoreRowCard";
import { LineChart, RadarChart } from "@/components/chart";
import Calendar from "@/components/common/Calendar";
import EmptyContainer from "@/components/common/EmptyContainer";
import Header from "@/components/common/Header";
import LoadingContainer from "@/components/common/LoadingContainer";
import MarkdownRenderer from "@/components/common/MarkdownRenderer";
import ThemeCard from "@/components/theme/ThemeCard";
import ThemeSafeAreaView from "@/components/theme/ThemeSafeAreaView";
import { useTheme } from "@/context/ThemeContext";
import { autoGenerateYesterdayAnalysis } from "@/utils/autoGenerateAnalysisUtils.js";
import dayjs from "dayjs";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ThemeTouchableOpacity from "@/components/theme/ThemeTouchableOpacity";

export default function Analyse() {
  const router = useRouter();
  const { theme } = useTheme();
  // region  start(折叠代码注释)
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
    scoreChanges: {
      sleepChange: 0,
      dietChange: 0,
      sportChange: 0,
      productivityChange: 0,
      emotionChange: 0,
      balanceChange: 0
    },
    dimensions: {},
    overallSummary: {}
  });
  
  const [hasEvents, setHasEvents] = useState(true);
  const [hasDashboardData, setHasDashboardData] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs().subtract(1, "day"));
  const isTodayOrFuture = useCallback((date) => {
    return dayjs(date).isSame(dayjs(), "day") || dayjs(date).isAfter(dayjs(), "day");
  }, []);

  const canSelectAnalysisDate = useCallback((date) => {
    if(isTodayOrFuture(date)) {
      const isToday = dayjs(date).isSame(dayjs(), "day");
      const dateLabel = dayjs(date).format("MM月DD日");
      const message = isToday
        ? "今天还没结束，AI 分析会在明天可用。先专注记录，明天再来查看吧。"
        : `${dateLabel} 还没到，未来日期暂不支持分析。请在当天结束后再来查看。`;

      Alert.alert("暂不可查看", message, [{ text: "我知道了", style: "cancel" }]);
      return false;
    }
    return true;
  }, [isTodayOrFuture]);

  const handleRestrictedDateSelect = useCallback((date) => {
    if(!canSelectAnalysisDate(date)) return;
    setSelectedDate(date);
    handleDateChange(date).then();
  }, [canSelectAnalysisDate, handleDateChange]);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState(null);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [trendRange, setTrendRange] = useState(7); // 趋势图天数: 7, 14, 30

  // 获取趋势数据（支持7/14/30天）
  const fetchTrendData = useCallback(async (currentDate, days = 7) => {
    try {
      const endDate = currentDate;
      const startDate = currentDate.subtract(days - 1, 'day');

      const trend = await analyseApi.getScoreTrend({
        startDate: startDate.toDate(),
        endDate: endDate.toDate()
      });

      // 补齐没有数据的日期（后端已过滤掉score为0的日期）
      const filledTrend = [];
      for(let i = 0; i < days; i++) {
        const date = startDate.add(i, 'day');
        const dateStr = date.format('YYYY-MM-DD');
        const existingData = trend?.find(t => t.date === dateStr);

        if(existingData) {
          filledTrend.push(existingData);
        } else {
          filledTrend.push({
            date: dateStr,
            totalScore: 0,
            sleepScore: 0,
            dietScore: 0,
            exerciseScore: 0,
            efficiencyScore: 0,
            balanceScore: 0,
            emotionScore: 0
          });
        }
      }

      setTrendData(filledTrend);
    } catch(error) {
      console.error('Error fetching trend data:', error);
    }
  }, []);
  
  const handleDateChange = useCallback(async (date) => {
    try {
      const startDate = date.startOf('day').toDate();
      const endDate = date.endOf('day').toDate();
      
      // 先查询事件数据
      const events = await eventApi.getByDateRangeAndCategory({ startDate, endDate });
      const hasEventsData = Array.isArray(events) && events.length > 0;
      setHasEvents(hasEventsData);
      
      if(hasEventsData) {
        // 有事件数据，再查询dashboard数据
        const scoreResult = await analyseApi.getDashboard({ startDate, endDate });
        
        if(scoreResult) {
          setDashboardData(scoreResult);
          // 检查是否有dashboard数据
          const hasAnyDashboardData = scoreResult.totalScore > 0 ||
            Object.values(scoreResult.scores || {}).some(score => score > 0);
          setHasDashboardData(hasAnyDashboardData);
        } else {
          setHasDashboardData(false);
        }
      } else {
        setHasDashboardData(false);
      }
      
      // 同时获取趋势数据
      await fetchTrendData(date, trendRange);
      
    } catch(error) {
      console.error('Error getting data:', error);
      setHasEvents(false);
      setHasDashboardData(false);
    }
  }, [fetchTrendData, trendRange]);
  
  useFocusEffect(
    useCallback(() => {
      autoGenerateYesterdayAnalysis().then(() => {
        handleDateChange(selectedDate).then();
      });
      fetchTrendData(selectedDate, trendRange).then();
    }, [handleDateChange, selectedDate, fetchTrendData, trendRange])
  );
  
  // 跳转到详情页
  const handleStatPress = useCallback((item) => {
    // 映射标签到维度 key
    // 兼容「睡眠评分」这类文案，先去掉结尾的「评分」
    const baseLabel = (item.label || '').replace(/评分$/, '');
    const dimKeyMap = {
      '睡眠': 'sleep',
      '饮食': 'diet',
      '运动': 'exercise',
      '效率': 'efficiency',
      '情绪': 'emotion',
      '平衡': 'balance'
    };
    const key = dimKeyMap[baseLabel];
    const dim = (dashboardData.dimensions || {})[key];
    if(dim) {
      setSelectedDimension({
        label: baseLabel,
        score: dim.score || 0,
        text: dim.text || '',
        change: item.change || 0
      });
      setDetailModalVisible(true);
    }
  }, [dashboardData]);
  
  // 处理总结文本点击
  const handleSummaryPress = useCallback(() => {
    const total = dashboardData.dimensions?.total;
    if(total) {
      setSelectedSummary({
        text: total.text || ''
      });
      setSummaryModalVisible(true);
    }
  }, [dashboardData]);
  
  const analysisData = useMemo(() => {
    const { scores = {}, scoreChanges = {} } = dashboardData || {};
    
    const items = [
      { key: 'sleep', label: '睡眠', icon: '😴', score: scores.sleepScore || 0, change: scoreChanges.sleepChange || 0 },
      { key: 'diet', label: '饮食', icon: '🥗', score: scores.dietScore || 0, change: scoreChanges.dietChange || 0 },
      { key: 'sport', label: '运动', icon: '🏃', score: scores.sportScore || 0, change: scoreChanges.sportChange || 0 },
      {
        key: 'productivity',
        label: '效率',
        icon: '🚀',
        score: scores.productivityScore || 0,
        change: scoreChanges.productivityChange || 0
      },
      {
        key: 'emotion',
        label: '情绪',
        icon: '😊',
        score: scores.emotionScore || 0,
        change: scoreChanges.emotionChange || 0
      },
      {
        key: 'balance',
        label: '平衡',
        icon: '⚖️',
        score: scores.balanceScore || 0,
        change: scoreChanges.balanceChange || 0
      },
    ];
    
    const sortedByScore = [...items].sort((a, b) => b.score - a.score);
    const sortedByChange = [...items].sort((a, b) => b.change - a.change);
    
    return {
      items,
      best: sortedByScore[0],
      worst: sortedByScore[sortedByScore.length - 1],
      fastest: sortedByChange[0],
      focus: sortedByChange[sortedByChange.length - 1]
    };
  }, [dashboardData]);
  
  // 格式化趋势数据为 LineChart 所需的格式
  const trendChartData = useMemo(() => {
    if(!trendData || trendData.length === 0) return [];
    
    return trendData.map(item => ({
      label: dayjs(item.date).format('DD'),
      value: item.totalScore || 0,
      color: theme.colors.primary
    }));
  }, [trendData, theme.colors.primary]);
  
  
  // endregion  end(折叠代码注释)
  const handleAiAnalysisPress = useCallback(() => {
    router.push({
      pathname: "/ai-analysis",
      params: {
        startDate: selectedDate.format("YYYY-MM-DD"),
        endDate: selectedDate.format("YYYY-MM-DD")
      }
    });
  }, [router, selectedDate]);
  
  return (
    <ThemeSafeAreaView>
      <ThemeCard>
        <Header
          selectedDate={selectedDate}
          onToday={() => handleRestrictedDateSelect(dayjs().subtract(1, "day"))}
          onDateChange={handleRestrictedDateSelect}
        />
        <Calendar
          value={selectedDate}
          canSelectDate={canSelectAnalysisDate}
          onChange={handleRestrictedDateSelect}
        />
      </ThemeCard>
      
      {!hasEvents ? (
        <EmptyContainer
          iconName="calendar-plus-o"
          text="当前事件数据为空"
        />
      ) : !hasDashboardData ? (
        <View style={styles.emptyContainer}>
          <LoadingContainer text="AI 分析生成中..." />
          <TouchableOpacity
            style={[
              {
                backgroundColor: theme.colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8
              }
            ]}
            onPress={handleAiAnalysisPress}
          >
            <Text style={[
              {
                color: theme.colors.textInverse,
                fontSize: 14,
                fontWeight: '600'
              }
            ]}>查看 AI 分析</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <OverallScoreCard
            score={dashboardData.totalScore || 0}
            summary={dashboardData.dimensions.total?.text?.split('总结')[1]?.trim() || ""}
            onAiAnalysisPress={handleAiAnalysisPress}
            onPress={handleSummaryPress}
          />
          
          <View style={styles.gridContainer}>
            {analysisData.items.map((item) => {
              const onPress = () => handleStatPress({ label: item.label + '评分' });
              return (
                <ScoreRowCard
                  key={item.key}
                  label={item.label}
                  icon={item.icon}
                  score={item.score}
                  change={item.change}
                  onPress={onPress}
                />
              );
            })}
          </View>
          
          <RadarChart
            data={analysisData.items.map(item => ({ label: item.label, value: item.score || 0 }))}
            maxValue={100}
            title="健康维度评分"
          />
          
          <ThemeCard>
            <View style={styles.trendChartHeader}>
              <Text style={[styles.trendChartTitle, { color: theme.colors.text }]}>
                {trendRange}天评分趋势
              </Text>
              <View style={styles.trendRangeButtons}>
                {[7, 14, 30].map(days => (
                  <ThemeTouchableOpacity
                    key={days}
                    style={[
                      styles.trendRangeBtn,
                      { backgroundColor: trendRange === days ? theme.colors.primary : 'transparent' }
                    ]}
                    onPress={() => {
                      setTrendRange(days);
                      fetchTrendData(selectedDate, days).then();
                    }}
                  >
                    <Text style={[
                      styles.trendRangeBtnText,
                      { color: trendRange === days ? theme.colors.textInverse : theme.colors.text }
                    ]}>
                      {days}天
                    </Text>
                  </ThemeTouchableOpacity>
                ))}
              </View>
            </View>
            
            <LineChart
              data={trendChartData}
              width={340}
              height={200}
              itemWidth={50}
              pointRadius={6}
              lineWidth={2}
              showArea={true}
              showPoints={true}
              showValues={true}
              curveType="curve"
            />
          </ThemeCard>
          
          <ThemeCard>
            <MarkdownRenderer content={dashboardData.overallSummary} />
          </ThemeCard>
        </ScrollView>
      )}
      
      {/* 维度得分详情弹窗（查看 AI 给出的原因 + 子维度构成） */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setDetailModalVisible(false);
          setSelectedDimension(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.card
            }
          ]}>
            {selectedDimension && (
              <>
                <View style={[
                  styles.modalHeader,
                  {
                    borderBottomColor: theme.colors.border
                  }
                ]}>
                  <Text style={[
                    styles.modalTitle,
                    {
                      color: theme.colors.text
                    }
                  ]}>
                    {selectedDimension.label}得分详情
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setDetailModalVisible(false);
                      setSelectedDimension(null);
                    }}
                  >
                    <Text style={[
                      {
                        fontSize: 14,
                        color: theme.colors.primary
                      }
                    ]}>关闭</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  style={styles.modalScrollView}
                  showsVerticalScrollIndicator={false}
                >
                  <MarkdownRenderer content={selectedDimension.text || '暂无详细分析'} />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
      
      {/* 总结详情弹窗（使用 Markdown 渲染） */}
      <Modal
        visible={summaryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setSummaryModalVisible(false);
          setSelectedSummary(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.card
            }
          ]}>
            {selectedSummary && (
              <>
                <View style={[
                  styles.modalHeader,
                  {
                    borderBottomColor: theme.colors.border
                  }
                ]}>
                  <Text style={[
                    styles.modalTitle,
                    {
                      color: theme.colors.text
                    }
                  ]}>
                    综合评估详情
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSummaryModalVisible(false);
                      setSelectedSummary(null);
                    }}
                  >
                    <Text style={[
                      {
                        fontSize: 14,
                        color: theme.colors.primary
                      }
                    ]}>关闭</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  style={styles.modalScrollView}
                  showsVerticalScrollIndicator={false}
                >
                  <MarkdownRenderer content={selectedSummary.text || '暂无详细分析'} />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ThemeSafeAreaView>
  );
}

// 样式定义
const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 8,
    rowGap: 8
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  modalScrollView: {
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4
  },
  trendChartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4
  },
  trendChartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  trendRangeButtons: {
    flexDirection: 'row',
    gap: 4
  },
  trendRangeBtn: {
    minHeight: 20,
    borderWidth: 1
  },
  trendRangeBtnText: {
    fontSize: 12,
    fontWeight: '500'
  },
});
