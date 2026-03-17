import { analyseApi, eventApi } from "@/api";
import OverallScoreCard from "@/components/analyse/OverallScoreCard";
import ScoreRowCard from "@/components/analyse/ScoreRowCard";
import RadarChart from "@/components/chart/RadarChart";
import EmptyContainer from "@/components/common/EmptyContainer";
import LoadingContainer from "@/components/common/LoadingContainer";
import MarkdownRenderer from "@/components/common/MarkdownRenderer";
import TimeRangePicker from "@/components/common/TimeRangePicker";
import ThemeCard from "@/components/theme/ThemeCard";
import ThemeSafeAreaView from "@/components/theme/ThemeSafeAreaView";
import dayjs from "dayjs";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Analyse() {
  const router = useRouter();
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

  const [loading, setLoading] = useState(false);
  const [hasEvents, setHasEvents] = useState(true);
  const [hasDashboardData, setHasDashboardData] = useState(true);
  const [currentDateRange, setCurrentDateRange] = useState({});
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState(null);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);

  
  const handleDateChange = useCallback(async ({ startDate, endDate, type }) => {
    setCurrentDateRange({ startDate, endDate });
    setLoading(true);
    
    try {
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
    } finally {
      setLoading(false);
    }
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      const defaultStart = dayjs().startOf('day');
      const defaultEnd = dayjs().endOf('day');
      handleDateChange({
        startDate: defaultStart.toDate(),
        endDate: defaultEnd.toDate(),
        type: 'day'
      }).then();
    }, [handleDateChange])
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
    const dimensions = dashboardData.dimensions || {};
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
    const { startDate, endDate } = currentDateRange;
    if (startDate && endDate) {
      router.push({
        pathname: "/ai-analysis",
        params: {
          startDate: dayjs(startDate).format("YYYY-MM-DD"),
          endDate: dayjs(endDate).format("YYYY-MM-DD")
        }
      });
    } else {
      router.push("/ai-analysis");
    }
  }, [router, currentDateRange]);

  return (
    <ThemeSafeAreaView>
      <TimeRangePicker onRangeChange={handleDateChange} />

      {!hasEvents ? (
        <EmptyContainer 
          iconName="calendar-plus-o" 
          text="当前事件数据为空"
        />
      ) : !hasDashboardData ? (
        <View style={styles.emptyContainer}>
          <LoadingContainer text="AI 分析生成中..." />
          <TouchableOpacity 
            style={styles.aiButton} 
            onPress={handleAiAnalysisPress}
          >
            <Text style={styles.aiButtonText}>查看 AI 分析</Text>
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
          <View style={styles.modalContent}>
            {selectedDimension && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedDimension.label}得分详情
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setDetailModalVisible(false);
                      setSelectedDimension(null);
                    }}
                  >
                    <Text style={styles.modalCloseText}>关闭</Text>
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
          <View style={styles.modalContent}>
            {selectedSummary && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    综合评估详情
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSummaryModalVisible(false);
                      setSelectedSummary(null);
                    }}
                  >
                    <Text style={styles.modalCloseText}>关闭</Text>
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
  aiButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#f0f0f0'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  modalCloseText: {
    fontSize: 14,
    color: '#007AFF'
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
  }
});