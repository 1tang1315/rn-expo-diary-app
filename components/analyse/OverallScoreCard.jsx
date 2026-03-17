import CircularProgressRing from "@/components/chart/CircularProgressRing";
import ThemeButton from "@/components/theme/ThemeButton";
import ThemeCard from "@/components/theme/ThemeCard";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const OverallScoreCard = ({ 
  score = 0,
  title = "综合评分",
  summary = "整体健康状态良好，请继续保持。",
  suggestions = [],
  onAiAnalysisPress,
  onPress,
  maxValue = 100,
  change = 0
}) => {
  const { theme } = useTheme();
  const hasAiContent = summary || (suggestions && suggestions.length > 0);

  const getEvaluation = (score) => {
    const percentage = (score / maxValue) * 100;
    if (percentage >= 90) return { text: '优', desc: '继续保持', color: '#4CAF50' };
    if (percentage >= 80) return { text: '良', desc: '再接再厉', color: '#2196F3' };
    if (percentage >= 60) return { text: '中', desc: '继续努力', color: '#FF9800' };
    return { text: '差', desc: '及时整改', color: '#F44336' };
  };

  const evaluation = getEvaluation(score);

  return (
    <ThemeCard margin={0} paddingBottom={0}>
      <View style={styles.content}>
        <CircularProgressRing
          value={score}
          maxValue={100}
          size={110}
          strokeWidth={10}
          title={title}
          cardStyle={styles.ringCard}
        />
        
        <View style={styles.summaryCard}>
          {summary ? (
            <>
              <Text 
                style={[
                  styles.summaryContent, 
                  { color: theme.colors.text, height: 30 }
                ]} 
                numberOfLines={3} 
                ellipsizeMode="tail"
                onPress={onPress}
              >
                {summary}
              </Text>
              
              <View style={styles.evaluationContainer}>
                <View style={[styles.evaluationTag, { backgroundColor: evaluation.color }]}>
                  <Text style={styles.evaluationText}>{evaluation.text}</Text>
                </View>
                <Text style={[styles.evaluationDescription, { color: evaluation.color }]}>{evaluation.desc}</Text>
              </View>
              
              <Text style={[
                styles.changeText,
                change > 0 ? styles.positive : (change < 0 ? styles.negative : styles.neutral)
              ]}>
                较昨日 {change > 0 ? '↑' : (change < 0 ? '↓' : '— ')} {change !== 0 ? Math.abs(change) : '持平'}
              </Text>
              
              <ThemeButton
                style={{marginBottom: 8}}
                onPress={onAiAnalysisPress}
                title="AI健康分析"
              />
            </>
          ) : null}
          {!hasAiContent ? (
            <Text style={[
              styles.summaryContent, 
              { color: theme.colors.text }
            ]}>暂无分析数据</Text>
          ) : null}
        </View>
      </View>
    </ThemeCard>
  );
};

const styles = StyleSheet.create({
  content: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  leftSide: {
    marginRight: 16,
    alignItems: "center",
    justifyContent: "flex-start"
  },
  ringCard: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0
  },
  summaryCard: {
    flex: 1,
    marginLeft: 8
  },
  sectionLabelMargin: {
    marginTop: 10
  },
  summaryContent: {
    fontSize: 11,
    opacity: 0.9,
    lineHeight: 16,
    marginBottom: 12
  },
  clickableText: {
    color: '#007AFF',
    textDecorationLine: 'underline'
  },
  evaluationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'flex-start'
  },
  evaluationTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  evaluationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  evaluationDescription: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 6
  },
  changeText: {
    fontSize: 11,
    marginBottom: 8,
    lineHeight: 16
  },
  positive: {
    color: '#4CAF50'
  },
  negative: {
    color: '#F44336'
  },
  neutral: {
    color: '#999'
  }
});

export default OverallScoreCard;
