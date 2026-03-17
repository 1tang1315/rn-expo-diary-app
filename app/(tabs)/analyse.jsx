import { analyseApi, eventApi } from "@/api";
import OverallScoreCard from "@/components/analyse/OverallScoreCard";
import ScoreRowCard from "@/components/analyse/ScoreRowCard";
import RadarChart from "@/components/chart/RadarChart";
import Calendar from "@/components/common/Calendar";
import EmptyContainer from "@/components/common/EmptyContainer";
import Header from "@/components/common/Header";
import LoadingContainer from "@/components/common/LoadingContainer";
import MarkdownRenderer from "@/components/common/MarkdownRenderer";
import ThemeCard from "@/components/theme/ThemeCard";
import ThemeSafeAreaView from "@/components/theme/ThemeSafeAreaView";
import { useTheme } from "@/context/ThemeContext";
import dayjs from "dayjs";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState(null);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);
  
  const handleDateChange = useCallback(async (date) => {
    try {
      const startDate = date.startOf('day').toDate();
      const endDate = date.endOf('day').toDate();
      
      // 先查询事件数据
      const events = await eventApi.getByDateRangeAndCategory({ startDate, endDate });
      const hasEventsData = Array.isArray(events) && events.length > 0;
      setHasEvents(hasEventsData);
      
      if (hasEventsData) {
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
      
    } catch(error) {
      console.error('Error getting data:', error);
      setHasEvents(false);
      setHasDashboardData(false);
    }
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      handleDateChange(selectedDate).then();
    }, [handleDateChange, selectedDate])
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
    if (dim) {
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
    if (total) {
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
          onToday={() => setSelectedDate(dayjs())}
          onDateChange={(date) => {
            setSelectedDate(date);
            handleDateChange(date);
          }}
        />
        <Calendar
          value={selectedDate}
          onChange={(d) => {
            setSelectedDate(d);
            handleDateChange(d);
          }}
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
});
