import { scoreApi } from "@/api/ScoreApi";
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
  
  return (
    <ThemeSafeAreaView>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Icon lib="Ionicons" name="arrow-back" color={theme.colors.subText} size={24} />
        </TouchableOpacity>
        <ThemeSubTitleText style={styles.headerTitle}>{typeMap[type] || type}详情</ThemeSubTitleText>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
        <TimeRangePicker onRangeChange={handleDateChange} />
        
        <ThemeCard style={styles.headerCard}>
          <ThemeText style={styles.description}>
            这里显示{typeMap[type] || type}的详细信息，包括分数构成、建议等
          </ThemeText>
          {canShowRules && (
            <TouchableOpacity 
              style={styles.rulesButton}
              onPress={() => setShowRules(true)}
            >
              <ThemeText style={styles.rulesButtonText}>查看计算规则</ThemeText>
            </TouchableOpacity>
          )}
        </ThemeCard>
        
        {loading ? (
          <ThemeCard style={styles.loadingCard}>
            <ThemeText>加载中...</ThemeText>
          </ThemeCard>
        ) : detailData ? (
          <>
            <ThemeCard style={styles.scoreCard}>
              <ThemeSubTitleText style={styles.scoreLabel}>总分</ThemeSubTitleText>
              <ThemeText style={styles.scoreValue}>{detailData.totalScore}分</ThemeText>
            </ThemeCard>
            
            {detailData.breakdown && detailData.breakdown.length > 0 && (
              <ThemeCard style={styles.breakdownCard}>
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
                {detailData.breakdown.map((item, index) => (
                  <View key={index} style={styles.breakdownItem}>
                    <ThemeText style={styles.breakdownLabel}>{item.label}</ThemeText>
                    <ThemeText style={styles.breakdownValue}>{item.value}分</ThemeText>
                  </View>
                ))}
              </ThemeCard>
            )}
            
            <ThemeCard style={styles.suggestionsCard}>
              <ThemeSubTitleText style={styles.sectionTitle}>AI分析</ThemeSubTitleText>
              <ThemeText style={styles.suggestionItem}>
                {detailData.aiAdvice?.summary || '暂无总结'}
              </ThemeText>
              {(detailData.aiAdvice?.problems || []).map((item, index) => (
                <ThemeText key={`problem-${index}`} style={styles.suggestionItem}>- 问题：{item}</ThemeText>
              ))}
              {(detailData.aiAdvice?.suggestions || []).map((item, index) => (
                <ThemeText key={`suggestion-${index}`} style={styles.suggestionItem}>- 建议：{item}</ThemeText>
              ))}
            </ThemeCard>
            
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
  scoreCard: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 20
  },
  scoreLabel: {
    marginBottom: 10
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700'
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