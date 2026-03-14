import { analyseApi } from "@/api/analyse";
import CategoryEventList from "@/components/analyse/CategoryEventList";
import OverallScoreCard from "@/components/analyse/OverallScoreCard";
import ScoreRowCard from "@/components/analyse/ScoreRowCard";
import RingChart from "@/components/chart/RingChart";
import Icon from "@/components/common/Icon";
import LoadingContainer from "@/components/common/LoadingContainer";
import AIStreamText from "@/components/common/AIStreamText";
import MarkdownRenderer from "@/components/common/MarkdownRenderer";
import TimeRangePicker from "@/components/common/TimeRangePicker";
import ThemeCard from "@/components/theme/ThemeCard";
import ThemeSafeAreaView from "@/components/theme/ThemeSafeAreaView";
import ThemeSubTitleText from "@/components/theme/ThemeSubTitleText";
import ThemeText from "@/components/theme/ThemeText";

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
  
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentRange, setCurrentRange] = useState({ startDate: null, endDate: null });
  const [detailMarkdown, setDetailMarkdown] = useState('');
  const [aiStreamContent, setAiStreamContent] = useState({ thought: '', output: '' });
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiOverviewSummary, setAiOverviewSummary] = useState('');
  
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
    setCurrentRange({ startDate, endDate });
    
    try {
      // 通用：分别获取总分、各维度、事件，由前端组合；AI 建议通过 SleepService 调用大模型生成
      const [summary, breakdownRes, eventsRes] = await Promise.all([
        analyseApi.getScoreSummary({ type, startDate, endDate }),
        analyseApi.getBreakdown({ type, startDate, endDate }),
        analyseApi.getEvents({ type, startDate, endDate })
      ]);

      const combined = {
        totalScore: summary?.totalScore ?? 0,
        breakdown: breakdownRes?.items ?? breakdownRes?.breakdown ?? [],
        events: eventsRes?.events ?? [],
        aiAdvice: null
      };

      setDetailData(combined);
      setAiOverviewSummary('');

      // 统一通过 analyseApi 生成 AI 建议（流式）与一句话总结
      const startDateStr = dayjs(startDate).format('YYYY-MM-DD');
      const endDateStr = endDate ? dayjs(endDate).format('YYYY-MM-DD') : startDateStr;
      try {
        setAiStreaming(true);
        setAiStreamContent({ thought: '', output: '' });

        analyseApi
          .generateAiAdvice(
            { type, startDate: startDateStr, endDate: endDateStr },
            {
              onThought: (partialThought) => {
                setAiStreamContent(prev => ({ ...prev, thought: partialThought }));
              },
              onOutput: (partialOutput) => {
                setAiStreamContent(prev => ({ ...prev, output: partialOutput }));
              }
            }
          )
          .finally(() => setAiStreaming(false));

        analyseApi
          .generateOverviewSummary({ type, startDate: startDateStr, endDate: endDateStr })
          .then((res) => setAiOverviewSummary(res?.summary || ''))
          .catch((err) => console.error('生成总评一句话总结失败:', err));
      } catch (e) {
        console.error('生成 AI 建议失败:', e);
        setAiStreaming(false);
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

    const items = detailData.breakdown;

    // 维度对比：按当前得分（百分制优先，其次 value）排序，取最佳/最差维度
    const sortedByScore = [...items].sort((a, b) => {
      const aScore = typeof a.percentScore === 'number' ? a.percentScore : (a.value ?? 0);
      const bScore = typeof b.percentScore === 'number' ? b.percentScore : (b.value ?? 0);
      return bScore - aScore;
    });

    const best = sortedByScore[0];
    const worst = sortedByScore[sortedByScore.length - 1];

    // 与昨日对比：按 changePercent 排序，找出提升最快和需要关注的维度
    const itemsWithChange = items.filter(
      (item) => typeof item.changePercent === 'number'
    );

    let fastest = { label: '-', value: 0 };
    let focus = { label: '-', value: 0 };

    if (itemsWithChange.length > 0) {
      const sortedByChange = [...itemsWithChange].sort(
        (a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0)
      );

      const fastestItem = sortedByChange[0];
      const focusItem = sortedByChange[sortedByChange.length - 1];

      fastest = {
        label: fastestItem.label,
        value: fastestItem.changePercent ?? 0
      };

      focus = {
        label: focusItem.label,
        value: focusItem.changePercent ?? 0
      };
    } else {
      // 没有昨日对比数据时，回退为按当前分数的最佳/最差
      fastest = { label: best.label, value: 0 };
      focus = { label: worst.label, value: 0 };
    }

    return {
      best: {
        label: best.label,
        value:
          typeof best.percentScore === 'number'
            ? best.percentScore
            : best.value ?? 0
      },
      worst: {
        label: worst.label,
        value:
          typeof worst.percentScore === 'number'
            ? worst.percentScore
            : worst.value ?? 0
      },
      fastest,
      focus
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
  
  // 准备圆形图数据
  const ringChartProps = useMemo(() => {
    if (!detailData?.breakdown?.length) {
      return {
        data: [],
        centerLabel: 0,
        centerSubLabel: '总分'
      };
    }
    
    const palette = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    const data = detailData.breakdown.map((item, index) => ({
      value: item.value,
      label: item.label,
      color: palette[index % palette.length]
    }));
    
    return {
      data,
      centerLabel: detailData.totalScore,
      centerSubLabel: '总分'
    };
  }, [detailData]);
  
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
      
      {loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <LoadingContainer />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {detailData ? (
            <>
              <OverallScoreCard
                title="总评分"
                score={detailData.totalScore}
                summary={aiOverviewSummary || (aiStreaming ? '正在生成总结...' : '暂无总结')}
                analysis={analysisData}
              />
              
              {detailData.breakdown && detailData.breakdown.length > 0 && (
                <View style={styles.breakdownSection}>
                  <View style={styles.gridContainer}>
                    {detailData.breakdown.map((item, index) => {
                      // 睡眠：使用百分制得分（0-100），环形进度条更直观
                      const isSleep = type === 'sleep';
                      const score = isSleep
                        ? (item.percentScore ?? item.originScore ?? item.value ?? 0)
                        : (item.value ?? 0);
                      const maxValue = isSleep
                        ? 100
                        : (item.maxScore ?? getMaxScoreForLabel(item.label));
                      const ratio = item.ratio ?? 0; // 占比百分数

                      return (
                        <ScoreRowCard
                          key={index}
                          label={item.label}
                          icon={getIconForLabel(item.label)}
                          score={score}
                          maxValue={maxValue}
                          ratio={ratio}
                          change={item.changePercent ?? 0}
                          onPress={async () => {
                            setSelectedItem(item);
                            // 统一通过后端按维度获取 Markdown 详情
                            if (currentRange.startDate) {
                              try {
                                const detail = await analyseApi.getBreakdownDetail({
                                  type,
                                  startDate: currentRange.startDate,
                                  endDate: currentRange.endDate,
                                  key: item.key || item.label
                                });
                                setDetailMarkdown(detail?.detailText || item.detailText || '');
                              } catch (e) {
                                console.error('Error getting breakdown detail:', e);
                                setDetailMarkdown(item.detailText || '');
                              }
                            } else {
                              setDetailMarkdown(item.detailText || '');
                            }
                            setShowDetail(true);
                          }}
                        />
                      );
                    })}
                  </View>
                </View>
              )}
              
              <RingChart
                data={ringChartProps.data}
                centerLabel={ringChartProps.centerLabel}
                centerSubLabel={ringChartProps.centerSubLabel}
                title={`${typeMap[type] || type}评分构成`}
                hideLegend={false}
                loading={loading}
              />
              
              <CategoryEventList category={type} events={detailData.events} />

              <View style={{ minHeight: 120 }}>
                <AIStreamText
                  content={aiStreamContent}
                  speed={30}
                  isContentFinalized={!aiStreaming}
                />
              </View>
            </>
          ) : (
            <ThemeCard style={styles.errorCard}>
              <ThemeText>暂无数据</ThemeText>
            </ThemeCard>
          )}
        </ScrollView>
      )}
      
      {/* 详情模态框 */}
      <Modal
        visible={showDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowDetail(false);
          setSelectedItem(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemeSubTitleText style={styles.modalTitle}>
                {selectedItem ? `${selectedItem.label}详情` : '详情'}
              </ThemeSubTitleText>
              <TouchableOpacity onPress={() => {
                setShowDetail(false);
                setSelectedItem(null);
              }}>
                <Icon lib="Ionicons" name="close" color={theme.colors.subText} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              {selectedItem ? (
                <MarkdownRenderer content={
                  detailMarkdown || selectedItem.detailText || `## 得分情况
- 得分：${selectedItem.value ?? 0}分
- 满分：${selectedItem.maxScore ?? 100}分

## 说明
根据相关指标计算得分。`
                } />
              ) : (
                <MarkdownRenderer content={`# 详情

暂无详细信息`} />
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
  breakdownSection: {
    marginTop: 8
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
    padding: 10,
    marginBottom: 10
  }
});