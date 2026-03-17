import CircularProgressRing from "@/components/chart/CircularProgressRing";
import ThemeText from "@/components/theme/ThemeText";
import ThemeTouchableOpacity from "@/components/theme/ThemeTouchableOpacity";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const ScoreRowCard = ({
  label,
  icon,
  score = 0,
  change = 0,
  maxValue = 100,
  onPress
}) => {
  const ringSize = 50;
  const strokeWidth = 5;
  
  const getEvaluation = (score) => {
    const percentage = (score / maxValue) * 100;
    if(percentage >= 90) return { text: '优', desc: '继续保持', color: '#4CAF50' };
    if(percentage >= 80) return { text: '良', desc: '再接再厉', color: '#2196F3' };
    if(percentage >= 60) return { text: '中', desc: '继续努力', color: '#FF9800' };
    return { text: '差', desc: '及时整改', color: '#F44336' };
  };
  
  const evaluation = getEvaluation(score);
  
  return (
    <ThemeTouchableOpacity style={styles.gridContainer} onPress={onPress}>
      <View style={styles.gridHeader}>
        <View style={styles.gridHeaderLeft}>
          <Text style={styles.gridIcon}>{icon}</Text>
          <Text style={styles.gridTitle}>{label}</Text>
        </View>
        <Text style={styles.gridLink}>查看详情 &gt;</Text>
      </View>
      
      <View style={styles.gridContent}>
        <View style={styles.gridLeft}>
          <CircularProgressRing
            value={score}
            maxValue={maxValue}
            size={ringSize}
            strokeWidth={strokeWidth}
            title=""
            description=""
            centerContent={
              <ThemeText style={styles.gridRingScore}>
                {score}
              </ThemeText>
            }
            containerStyle={styles.ringContainer}
            cardStyle={styles.ringCard}
          />
        </View>
        <View style={styles.gridRight}>
          <View style={styles.evaluationContainer}>
            <View style={[styles.evaluationTag, { backgroundColor: evaluation.color }]}>
              <Text style={styles.evaluationText}>{evaluation.text}</Text>
            </View>
            <Text style={[styles.evaluationDescription, { color: evaluation.color }]}>{evaluation.desc}</Text>
          </View>
          <Text style={[
            styles.gridDetailText,
            change > 0 ? styles.positive : (change < 0 ? styles.negative : styles.neutral)
          ]}>
            较昨日 {change > 0 ? '↑' : (change < 0 ? '↓' : '— ')} {change !== 0 ? Math.abs(change) : '持平'}
          </Text>
        </View>
      </View>
    </ThemeTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  ringContainer: {},
  ringCard: {
    marginTop: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  positive: { color: '#4CAF50' },
  negative: { color: '#F44336' },
  neutral: { color: '#999' },
  
  gridContainer: { width: '49%', height: 110 },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridIcon: { fontSize: 14, marginRight: 4 },
  gridTitle: { fontSize: 14, fontWeight: '600' },
  gridLink: { fontSize: 12, color: '#999' },
  gridContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: "space-between"
  },
  gridLeft: {
    flex: 1,
  },
  gridRight: {
    flex: 1,
    paddingLeft: 5,
    justifyContent: 'flex-end',
  },
  evaluationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  evaluationTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  evaluationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  evaluationDescription: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  gridRingScore: { fontSize: 14, fontWeight: '700' },
  gridDetailText: { fontSize: 11, color: '#999', marginBottom: 2, lineHeight: 16 },
});

export default ScoreRowCard;
