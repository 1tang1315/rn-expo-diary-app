import { scoreApi } from "@/api/ScoreApi";
import AiAnalysisCard from "@/components/analyse/AiAnalysisCard";
import ScoreRowCard from "@/components/analyse/ScoreRowCard";
import OverallScoreCard from "@/components/analyse/OverallScoreCard";
import Icon from "@/components/common/Icon";
import MarkdownRenderer from "@/components/common/MarkdownRenderer";
import TimeRangePicker from "@/components/common/TimeRangePicker";
import ThemeCard from "@/components/theme/ThemeCard";
import ThemeSafeAreaView from "@/components/theme/ThemeSafeAreaView";
import ThemeSubTitleText from "@/components/theme/ThemeSubTitleText";
import ThemeText from "@/components/theme/ThemeText";
import { exerciseScoringRules, sleepScoringRules } from "@/constants/scoringRules";
import { useTheme } from "@/context/ThemeContext";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

export default function AnalyseDetail() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  
  const { type = 'sleep', startDate, endDate } = params;
  const canShowRules = type === 'sleep' || type === 'exercise';
  const rulesContent = type === 'exercise' ? exerciseScoringRules : sleepScoringRules;
  
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [showProcess, setShowProcess] = useState(false);
  
  // 映射类型到中文标签（使用 useMemo 缓存，避免每次渲染都创建新对象）
  const typeMap = useMemo(() => ({
    sleep: '睡眠评分',
    mood: '情绪评分',
    diet: '饮食评分',
    exercise: '运动评分',
    productivity: '效率评分',
    balance: '平衡评分',
    overall: '综合评分'
  }), []);
  
  const handleDateChange = useCallback(async ({ startDate, endDate }) => {
    setLoading(true);
    
    try {
      const result = await scoreApi.getScoreDetailData({ 
        type, 
        startDate, 
        endDate 
      });
      
      if (result) {
        setDetailData(result);
      } else {
        console.error('Failed to get detail data: No data returned');
      }
    } catch (error) {
      console.error('Error getting detail data:', error);
    } finally {
      setLoading(false);
    }
  }, [type]);

  const analysisData = useMemo(() => {
    if (!detailData?.breakdown?.length) {
      return {
        best: { label: '-', value: 0 },
        worst: { label: '-', value: 0 },
        fastest: { label: '-', value: 0 },
        focus: { label: '-', value: 0 }
      };
    }
    
    const sorted = [...detailData.breakdown].sort((a, b) => b.value - a.value);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    
    return {
      best: { label: best.label, value: best.value },
      worst: { label: worst.label, value: worst.value },
      fastest: { label: '-', value: 0 },
      focus: { label: worst.label, value: worst.value }
    };
  }, [detailData]);
  
  useEffect(() => {
    if (startDate && endDate) {
      handleDateChange({
        startDate: new Date(decodeURIComponent(startDate)),
        endDate: new Date(decodeURIComponent(endDate))
      });
    } else {
      const defaultStart = dayjs().startOf('day');
      const defaultEnd = dayjs().endOf('day');
      handleDateChange({
        startDate: defaultStart.toDate(),
        endDate: defaultEnd.toDate()
      });
    }
  }, [handleDateChange, startDate, endDate]);
  
  const getIconForLabel = (label) => {
    if (label.includes('时长')) return '⏰';
    if (label.includes('入睡')) return '🛌';
    if (label.includes('连续')) return '🔄';
    if (label.includes('稳定')) return '📊';
    if (label.includes('能量') || label.includes('消耗')) return '🔥';
    return '📝';
  };

  const getMaxScoreForLabel = (label) => {
      // Sleep rules
      if (label.includes('睡眠时长') || label === '时长得分') return 40;
      if (label.includes('入睡') || label === '入睡时间得分') return 25;
      if (label.includes('睡眠连续') || label === '连续性得分') return 20;
      if (label.includes('作息稳定') || label === '稳定性得分') return 15;
      
      // Exercise rules
      if (label.includes('能量') || label === '能量消耗得分') return 60;
      if (label.includes('运动时长') || label === '运动时长得分') return 25;
      if (label.includes('运动连续') || label === '运动连续性得分') return 15;
      
      return 100; 
  };
  
  return (
    <ThemeSafeAreaView>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Icon lib="Ionicons" name="arrow-back" color={theme.colors.subText} size={24} />
        </TouchableOpacity>
        <ThemeSubTitleText style={styles.headerTitle}>{typeMap[type] || type}详情</ThemeSubTitleText>
      </View>
      
      <TimeRangePicker onRangeChange={handleDateChange} />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ThemeCard style={styles.loadingCard}>
            <ThemeText>加载中...</ThemeText>
          </ThemeCard>
        ) : detailData ? (
          <>
            <OverallScoreCard
              title="总评分"
              score={detailData.totalScore}
              summary={detailData.aiAdvice?.summary || '暂无总结'}
              analysis={analysisData}
            />
            
            {detailData.breakdown && detailData.breakdown.length > 0 && (
              <View style={styles.breakdownSection}>
                <View style={styles.sectionHeader}>
                  <ThemeSubTitleText style={styles.sectionTitle}>分数构成</ThemeSubTitleText>
                  {canShowRules && (
                    <TouchableOpacity 
                      style={styles.processButton}
                      onPress={() => setShowProcess(true)}
                    >
                      <Icon lib="Ionicons" name="information-circle-outline" color={theme.colors.subText} size={20} />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.gridContainer}>
                  {detailData.breakdown.map((item, index) => (
                    <ScoreRowCard
                      key={index}
                      label={item.label}
                      icon={getIconForLabel(item.label)}
                      score={item.value}
                      maxValue={getMaxScoreForLabel(item.label)}
                      ratio={0}
                      change={0}
                      onPress={() => {}}
                    />
                  ))}
                </View>
              </View>
            )}
            
            <AiAnalysisCard analysis={detailData.aiAdvice} />
            
            {/* 计算规则和过程通过模态框展示 */}
          </>
        ) : (
          <ThemeCard style={styles.errorCard}>
            <ThemeText>暂无数据</ThemeText>
          </ThemeCard>
        )}
        
        {/* 底部空白，确保内容完全可见 */}
        <View style={styles.bottomSpace} />
      </ScrollView>
      
      {/* 计算规则模态框 */}
      <Modal
        visible={showRules}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRules(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemeSubTitleText style={styles.modalTitle}>{typeMap[type] || type}计算规则</ThemeSubTitleText>
              <TouchableOpacity onPress={() => setShowRules(false)}>
                <Icon lib="Ionicons" name="close" color={theme.colors.subText} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <MarkdownRenderer content={rulesContent} />
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* 计算过程模态框 */}
      <Modal
        visible={showProcess}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProcess(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemeSubTitleText style={styles.modalTitle}>计算过程</ThemeSubTitleText>
              <TouchableOpacity onPress={() => setShowProcess(false)}>
                <Icon lib="Ionicons" name="close" color={theme.colors.subText} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {detailData && detailData.calculationProcess ? (
                <MarkdownRenderer content={detailData.calculationProcess} />
              ) : (
                <MarkdownRenderer content={
                  type === 'exercise'
                    ? `# ${dayjs().format('YYYY-MM-DD')}日运动评分计算

## 第一步：识别有效运动行为（MET≥3）
暂无运动数据

## 第二步：逐维度计算得分

### 1. 能量消耗得分（60分）
active_kcal=0kcal → 能量消耗得分=0分

### 2. 运动时长得分（25分）
exercise_time=0分钟 → 运动时长得分=0分

### 3. 运动连续性得分（15分）
longest_session=0分钟 → 连续性得分=0分

## 第三步：总得分计算
总得分=能量消耗得分+运动时长得分+连续性得分
总得分=0+0+0=**0分**`
                    : `# ${dayjs().format('YYYY-MM-DD')}日睡眠评分计算

## 第一步：确定${dayjs().format('YYYY-MM-DD')}日有效睡眠事件
暂无睡眠数据

## 第二步：逐维度计算得分

### 1. 睡眠时长得分（40分）
无睡眠数据 → 时长得分=0分

### 2. 入睡时间得分（25分）
无睡眠数据 → 入睡时间得分=0分

### 3. 睡眠连续性得分（20分）
无睡眠数据 → 连续性得分=0分

### 4. 作息稳定性得分（15分）
无睡眠数据 → 稳定性得分=0分

## 第三步：总得分计算
总得分=时长得分+入睡时间得分+连续性得分+稳定性得分
总得分=0+0+0+0=**0分**

## 最终评分汇总
- 时长得分：0
- 入睡时间得分：0
- 连续性得分：0
- 稳定性得分：0
- 总得分：0`
                } />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemeSafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  backButton: {
    position: 'absolute',
    left: 16,
    marginRight: 12,
    padding: 8,
    zIndex: 1
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600'
  },
  headerCard: {
    marginTop: 10
  },
  rulesButton: {
    height: 30,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  rulesButtonText: {
    fontSize: 14,
    color: '#007AFF'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionTitle: {
    marginBottom: 0
  },
  processButton: {
    padding: 4
  },
  description: {
    fontSize: 14,
    lineHeight: 20
  },
  loadingCard: {
    marginTop: 10,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center'
  },
  breakdownSection: {
    marginTop: 10,
    paddingHorizontal: 4
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  breakdownCard: {
    marginTop: 10
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  breakdownLabel: {
    fontSize: 14
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '500'
  },
  suggestionsCard: {
    marginTop: 10
  },
  suggestionItem: {
    fontSize: 14,
    lineHeight: 20,
    marginVertical: 4
  },
  errorCard: {
    marginTop: 10,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center'
  },
  rulesCard: {
    marginTop: 10
  },
  processCard: {
    marginTop: 10
  },
  bottomSpace: {
    height: 40
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  modalScrollView: {
    padding: 16
  }
});