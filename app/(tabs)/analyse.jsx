import { analyseApi as scoreApi } from "@/api/analyse";
import AiAnalysisCard from "@/components/analyse/AiAnalysisCard";
import CategoryEventList from "@/components/analyse/CategoryEventList";
import OverallScoreCard from "@/components/analyse/OverallScoreCard";
import ScoreRowCard from "@/components/analyse/ScoreRowCard";
import RadarChart from "@/components/chart/RadarChart";
import RingChart from "@/components/chart/RingChart";
import AIStreamText from "@/components/common/AIStreamText";
import CategoryTab from "@/components/common/CategoryTab";
import TimeRangePicker from "@/components/common/TimeRangePicker";
import ThemeSafeAreaView from "@/components/theme/ThemeSafeAreaView";
import dayjs from "dayjs";
import { useFocusEffect, useRouter } from "expo-router";
import { AsyncStorage } from "expo-sqlite/kv-store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Clipboard from "expo-clipboard";

const categoryColors = {
  sleep: '#4e6ef2',
  mood: '#f2a93b',
  emotion: '#f2a93b',
  productivity: '#33c9ff',
  sport: '#ff5c5c',
  exercise: '#ff5c5c',
  diet: '#5cc972',
  balance: '#9a5cff',
  default: '#cccccc'
};

export default function Analyse() {
  // region  start(折叠代码注释)
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
    scoreChanges: {
      sleepChange: 0,
      dietChange: 0,
      sportChange: 0,
      productivityChange: 0,
      emotionChange: 0,
      balanceChange: 0
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
  const [selectedCategory, setSelectedCategory] = useState('total');
  const [breakdownData, setBreakdownData] = useState([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview | ai
  const [aiStreamKey, setAiStreamKey] = useState(0);
  const [aiContentFinalized, setAiContentFinalized] = useState(true);

  const categories = useMemo(() => [
    { id: 'total', name: '总', isFixed: true },
    { id: 'sleep', name: '睡眠', icon: 'bed' },
    { id: 'mood', name: '情绪', icon: 'mood' },
    { id: 'productivity', name: '效率', icon: 'rocket' },
    { id: 'exercise', name: '运动', icon: 'directions-run' },
    { id: 'diet', name: '饮食', icon: 'restaurant' },
    { id: 'balance', name: '平衡', icon: 'balance' },
  ], []);
  
  
  useEffect(() => {
    const fetchData = async () => {
      if(selectedCategory === 'total') {
        setBreakdownData([]);
        return;
      }
      
      // 使用后端 AI 返回的维度子评分构成
      const dimKey =
        selectedCategory === 'mood'
          ? 'emotion'
          : selectedCategory === 'exercise'
          ? 'sport'
          : selectedCategory;
      const dim = (dashboardData.dimensions || {})[dimKey];
      if (!dim || !Array.isArray(dim.subDimensions)) {
        setBreakdownData([]);
        return;
      }

      setBreakdownLoading(true);
      const palette = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
      const data = dim.subDimensions.map((item, index) => ({
        value: item.score || 0,
        label: item.label,
        color: palette[index % palette.length]
      }));
      setBreakdownData(data);
      setBreakdownLoading(false);
    };
    
    fetchData();
  }, [selectedCategory, currentDateRange]);
  
  const handleDateChange = useCallback(async ({ startDate, endDate, type }) => {
    setCurrentDateRange({ startDate, endDate });
    
    try {
      const scoreResult = await scoreApi.getDashboard({ startDate, endDate });
      
      if(scoreResult) {
        setDashboardData(scoreResult);
      }
      
    } catch(error) {
      console.error('Error getting data:', error);
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
      '运动': 'sport',
      '效率': 'productivity',
      '情绪': 'emotion',
      '平衡': 'balance'
    };
    const key = dimKeyMap[baseLabel];
    const dim = (dashboardData.dimensions || {})[key];
    if (dim) {
      setSelectedDimension({
        label: baseLabel,
        score: dim.score || 0,
        ratio: dim.ratio || 0,
        change: dim.change ?? 0,
        reason: dim.reason || '',
        subDimensions: Array.isArray(dim.subDimensions) ? dim.subDimensions : []
      });
      setDetailModalVisible(true);
    }
  }, [dashboardData]);
  
  const analysisData = useMemo(() => {
    const { scores = {}, scoreChanges = {} } = dashboardData || {};
    const dimensions = dashboardData.dimensions || {};
    const items = [
      { key: 'sleep', label: '睡眠', icon: '😴', score: scores.sleepScore || 0, change: scoreChanges.sleepChange || 0, ratio: dimensions.sleep?.ratio },
      { key: 'diet', label: '饮食', icon: '🥗', score: scores.dietScore || 0, change: scoreChanges.dietChange || 0, ratio: dimensions.diet?.ratio },
      { key: 'sport', label: '运动', icon: '🏃', score: scores.sportScore || 0, change: scoreChanges.sportChange || 0, ratio: dimensions.sport?.ratio },
      {
        key: 'productivity',
        label: '效率',
        icon: '🚀',
        score: scores.productivityScore || 0,
        change: scoreChanges.productivityChange || 0,
        ratio: dimensions.productivity?.ratio
      },
      {
        key: 'emotion',
        label: '情绪',
        icon: '😊',
        score: scores.emotionScore || 0,
        change: scoreChanges.emotionChange || 0,
        ratio: dimensions.emotion?.ratio
      },
      {
        key: 'balance',
        label: '平衡',
        icon: '⚖️',
        score: scores.balanceScore || 0,
        change: scoreChanges.balanceChange || 0,
        ratio: dimensions.balance?.ratio
      },
    ];
    
    const sortedByScore = [...items].sort((a, b) => b.score - a.score);
    const sortedByChange = [...items].sort((a, b) => b.change - a.change);
    
    const totalScoreSum = items.reduce((sum, item) => sum + (item.score || 0), 0);
    
    return {
      items: items.map(item => ({
        ...item,
        ratio: typeof item.ratio === 'number'
          ? item.ratio
          : (totalScoreSum ? Math.round(((item.score || 0) / totalScoreSum) * 100) : 0)
      })),
      best: sortedByScore[0],
      worst: sortedByScore[sortedByScore.length - 1],
      fastest: sortedByChange[0],
      focus: sortedByChange[sortedByChange.length - 1]
    };
  }, [dashboardData]);
  
  const ringChartProps = useMemo(() => {
    if(selectedCategory === 'total') {
      const data = analysisData.items.map(item => ({
        value: item.score || 0,
        label: item.label,
        color: categoryColors[item.key] || categoryColors.default
      }));
      return {
        data,
        centerLabel: dashboardData.totalScore || 0,
        centerSubLabel: '总分'
      };
    } else {
      let scoreKey = selectedCategory + 'Score';
      if(selectedCategory === 'mood') scoreKey = 'emotionScore';
      if(selectedCategory === 'exercise') scoreKey = 'sportScore';
      
      const score = dashboardData.scores?.[scoreKey] || 0;
      const categoryName = categories.find(c => c.id === selectedCategory)?.name || '';
      
      return {
        data: breakdownData,
        centerLabel: score,
        centerSubLabel: `${categoryName}得分`
      };
    }
  }, [selectedCategory, analysisData, breakdownData, dashboardData, categories]);
  
  // endregion  end(折叠代码注释)
  return (
    <ThemeSafeAreaView>
      <TimeRangePicker onRangeChange={handleDateChange} />
      
      {/* 顶部 Tab：评分看板 / AI 分析 */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'overview' && styles.tabButtonActive
          ]}
          onPress={() => setActiveTab('overview')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'overview' && styles.tabButtonTextActive
            ]}
          >
            评分看板
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'ai' && styles.tabButtonActive
          ]}
          onPress={() => {
            setActiveTab('ai');
          }}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'ai' && styles.tabButtonTextActive
            ]}
          >
            AI 分析
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'ai' ? (
        <View style={{ flex: 1 }}>
          <AIStreamText
            key={aiStreamKey}
            content={{
              thought:
                dashboardData.rawAnalysis?.overview?.state ||
                dashboardData.aiAdvice?.summary ||
                '',
              output:
                dashboardData.rawAnalysis?.reportText ||
                dashboardData.reportText ||
                (dashboardData.aiAdvice?.suggestions || [])
                  .map((text) => `- ${text}`)
                  .join('\n') ||
                '暂无 AI 分析内容'
            }}
            speed={30}
            isContentFinalized={aiContentFinalized}
          />
          <View style={styles.aiActionsContainer}>
            <TouchableOpacity
              style={styles.aiActionButtonSecondary}
              onPress={() => {
                setAiContentFinalized(false);
                setAiStreamKey((k) => k + 1);
                setTimeout(() => setAiContentFinalized(true), 300);
              }}
            >
              <Text style={styles.aiActionSecondaryText}>重新播放本次分析</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.aiActionButtonPrimary}
              onPress={async () => {
                const text =
                  dashboardData.rawAnalysis?.reportText ||
                  dashboardData.reportText ||
                  dashboardData.aiAdvice?.summary ||
                  '';
                if (!text) {
                  Alert.alert('提示', '暂无可复制的内容');
                  return;
                }
                await Clipboard.setStringAsync(text);
                Alert.alert('提示', 'AI 分析内容已复制');
              }}
            >
              <Text style={styles.aiActionPrimaryText}>复制 AI 分析全文</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // 原有评分看板面板
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <OverallScoreCard
            score={dashboardData.totalScore || 0}
            summary={dashboardData.aiAdvice?.summary || "暂无分析数据"}
            analysis={{
              best: { label: analysisData.best.label, value: analysisData.best.score },
              worst: { label: analysisData.worst.label, value: analysisData.worst.score },
              fastest: { label: analysisData.fastest.label, value: analysisData.fastest.change },
              focus: { label: analysisData.focus.label, value: analysisData.focus.change }
            }}
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
                  ratio={item.ratio}
                  change={item.change}
                  onPress={onPress}
                  layout="grid"
                />
              );
            })}
          </View>
          
          <RadarChart
            data={analysisData.items.map(item => ({ label: item.label, value: item.score || 0 }))}
            maxValue={100}
            title="健康维度评分"
          />
          
          <View style={styles.sectionContainer}>
            <CategoryTab
              categories={categories}
              currentTab={selectedCategory}
              setCurrentTab={setSelectedCategory}
            />
            
            <RingChart
              data={ringChartProps.data}
              centerLabel={ringChartProps.centerLabel}
              centerSubLabel={ringChartProps.centerSubLabel}
              title={selectedCategory === 'total' ? "评分构成" : `${categories.find(c => c.id === selectedCategory)?.name || ''}评分拆解`}
              hideLegend={false}
              loading={breakdownLoading}
            />
            
            <CategoryEventList category={selectedCategory} />
          </View>
          
          <AiAnalysisCard analysis={dashboardData.aiAdvice} />
          
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
                      <Text style={styles.modalSectionTitle}>基础信息</Text>
                      <Text style={styles.modalText}>
                        分数：{selectedDimension.score} 分（占比：{selectedDimension.ratio || 0}%）
                      </Text>
                      <Text style={styles.modalText}>
                        与昨日比较：{selectedDimension.change > 0 ? `+${selectedDimension.change}` : selectedDimension.change}
                      </Text>

                      <Text style={[styles.modalSectionTitle, { marginTop: 12 }]}>
                        得分原因
                      </Text>
                      <Text style={styles.modalText}>
                        {selectedDimension.reason || '暂无详细原因'}
                      </Text>

                      {selectedDimension.subDimensions?.length ? (
                        <>
                          <Text style={[styles.modalSectionTitle, { marginTop: 12 }]}>
                            子维度构成
                          </Text>
                          {selectedDimension.subDimensions.map((sd) => (
                            <Text
                              key={sd.key || sd.label}
                              style={styles.modalText}
                            >
                              {sd.label}：{sd.score} 分（占比：{sd.ratio || 0}%）
                            </Text>
                          ))}
                        </>
                      ) : null}
                    </ScrollView>
                  </>
                )}
              </View>
            </View>
          </Modal>
        </ScrollView>
      )}
    </ThemeSafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 10
  },
  tabHeader: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden'
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabButtonActive: {
    backgroundColor: '#ffffff'
  },
  tabButtonText: {
    fontSize: 14,
    color: '#888'
  },
  tabButtonTextActive: {
    color: '#333',
    fontWeight: '600'
  },
  gridContainer: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
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
  },
  aiActionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 6
  },
  aiActionButtonSecondary: {
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  aiActionSecondaryText: {
    fontSize: 14,
    color: '#555'
  },
  aiActionButtonPrimary: {
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center'
  },
  aiActionPrimaryText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500'
  }
});