import React from "react";
import { StyleSheet, View } from "react-native";
import CircularProgressRing from "@/components/chart/CircularProgressRing";
import ThemeCard from "@/components/theme/ThemeCard";
import ThemeText from "@/components/theme/ThemeText";

const OverallScoreCard = ({ 
  score = 0, 
  summary = "整体健康状态良好，请继续保持。",
  analysis = {
    best: { label: '-', value: 0 },
    worst: { label: '-', value: 0 },
    fastest: { label: '-', value: 0 },
    focus: { label: '-', value: 0 }
  }
}) => {
  return (
    <ThemeCard margin={0} paddingBottom={0}>
      <View style={styles.content}>
        <View style={styles.leftSide}>
          <CircularProgressRing
            value={score}
            maxValue={100}
            size={110}
            strokeWidth={10}
            title="综合评分"
            cardStyle={styles.ringCard}
          />
        </View>
        <View style={styles.summaryCard}>
          <ThemeText style={styles.summaryContent} numberOfLines={3}>
            {summary}
          </ThemeText>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <ThemeText style={styles.summaryItemTitle}>最佳维度</ThemeText>
              <ThemeText style={styles.summaryItemValue}>{analysis.best.label} {analysis.best.value}</ThemeText>
            </View>
            <View style={styles.summaryItem}>
              <ThemeText style={styles.summaryItemTitle}>待提升</ThemeText>
              <ThemeText style={styles.summaryItemValue}>{analysis.worst.label} {analysis.worst.value}</ThemeText>
            </View>
            <View style={styles.summaryItem}>
              <ThemeText style={styles.summaryItemTitle}>进步最快</ThemeText>
              <ThemeText style={styles.summaryItemValue}>{analysis.fastest.label} {analysis.fastest.value > 0 ? '+' : ''}{analysis.fastest.value}</ThemeText>
            </View>
            <View style={styles.summaryItem}>
              <ThemeText style={styles.summaryItemTitle}>重点关注</ThemeText>
              <ThemeText style={styles.summaryItemValue}>{analysis.focus.label} {analysis.focus.value}</ThemeText>
            </View>
          </View>
        </View>
      </View>
    </ThemeCard>
  );
};

const styles = StyleSheet.create({
  content: {
    flexDirection: "row",
    alignItems: "center"
  },
  leftSide: {
    marginRight: 16
  },
  ringCard: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0
  },
  summaryCard: {
    flex: 1
  },
  summaryContent: {
    fontSize: 12,
    opacity: 0.9
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  summaryItem: {
    width: "48%",
    padding: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 8
  },
  summaryItemTitle: {
    fontSize: 10,
    opacity: 0.7,
    marginBottom: 2
  },
  summaryItemValue: {
    fontSize: 12,
    fontWeight: "600"
  }
});

export default OverallScoreCard;
