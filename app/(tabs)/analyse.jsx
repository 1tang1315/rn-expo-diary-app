import { analyseApi as scoreApi } from "@/api/analyse";
import AiAnalysisCard from "@/components/analyse/AiAnalysisCard";
import OverallScoreCard from "@/components/analyse/OverallScoreCard";
import ScoreRowCard from "@/components/analyse/ScoreRowCard";
import RadarChart from "@/components/chart/RadarChart";
import RingChart from "@/components/chart/RingChart";
import CategoryEventList from "@/components/analyse/CategoryEventList";
import CategoryTab from "@/components/common/CategoryTab";
import TimeRangePicker from "@/components/common/TimeRangePicker";
import ThemeSafeAreaView from "@/components/theme/ThemeSafeAreaView";
import dayjs from "dayjs";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

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
      
      if(!currentDateRange.startDate || !currentDateRange.endDate) return;
      
      setBreakdownLoading(true);
      try {
        const result = await scoreApi.getScoreDetailData({
          type: selectedCategory === 'mood' ? 'mood' : selectedCategory === 'exercise' ? 'exercise' : selectedCategory,
          startDate: currentDateRange.startDate,
          endDate: currentDateRange.endDate
        });
        
        if(result && result.breakdown) {
          const palette = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
          const data = result.breakdown.map((item, index) => ({
            value: item.value,
            label: item.label,
            color: palette[index % palette.length]
          }));
          setBreakdownData(data);
        } else {
          setBreakdownData([]);
        }
      } catch(error) {
        console.error('Error fetching breakdown:', error);
        setBreakdownData([]);
      } finally {
        setBreakdownLoading(false);
      }
    };
    
    fetchData();
  }, [selectedCategory, currentDateRange]);
  
  const handleDateChange = useCallback(async ({ startDate, endDate, type }) => {
    setCurrentDateRange({ startDate, endDate });
    
    try {
      const scoreResult = await scoreApi.getDashboard({ startDate, endDate });
      
      if(scoreResult) {
        // Inject fake AI data for demonstration
        scoreResult.aiAdvice = {
          summary: "根据近期数据分析，您的整体状态保持良好。睡眠评分稳步提升，显示出更好的作息规律。但在运动方面略显不足，建议增加适量有氧运动以平衡久坐带来的影响。",
          suggestions: [
            "保持每晚 7-8 小时的优质睡眠，睡前一小时尽量减少蓝光接触。",
            "建议每周至少进行 3 次 30 分钟以上的有氧运动，如慢跑或快走。",
            "工作效率较高，建议保持番茄工作法节奏，每工作 45 分钟休息 5 分钟。",
            "饮食方面注意增加深色蔬菜摄入，保持营养均衡，多喝水。"
          ]
        };
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
    if(type) {
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
    
    const totalScoreSum = items.reduce((sum, item) => sum + (item.score || 0), 0);
    
    return {
      items: items.map(item => ({
        ...item,
        ratio: totalScoreSum ? Math.round(((item.score || 0) / totalScoreSum) * 100) : 0
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
      </ScrollView>
    </ThemeSafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 10
  },
  gridContainer: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
});