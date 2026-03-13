import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import ThemeCard from '@/components/theme/ThemeCard';
import ThemeText from '@/components/theme/ThemeText';
import { useTheme } from '@/context/ThemeContext';

export default function AiAnalysisCard({ analysis }) {
  const { theme } = useTheme();

  if (!analysis) return null;

  return (
    <ThemeCard>
      <View style={styles.header}>
        <Text style={styles.icon}>🤖</Text>
        <ThemeText style={styles.title}>AI 智能分析</ThemeText>
      </View>
      
      <ThemeText style={[styles.summary]}>
        {analysis.summary || "暂无分析数据"}
      </ThemeText>

      {analysis.problems && analysis.problems.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ThemeText style={styles.subtitle}>存在的问题：</ThemeText>
          {analysis.problems.map((problem, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Text style={[styles.bullet, { color: theme.colors.error }]}>!</Text>
              <ThemeText style={[styles.suggestionText, { color: theme.colors.text }]}>
                {problem}
              </ThemeText>
            </View>
          ))}
        </View>
      )}
      
      {analysis.suggestions && analysis.suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ThemeText style={styles.subtitle}>建议与规划：</ThemeText>
          {analysis.suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Text style={[styles.bullet, { color: theme.colors.primary }]}>•</Text>
              <ThemeText style={[styles.suggestionText, { color: theme.colors.text }]}>
                {suggestion}
              </ThemeText>
            </View>
          ))}
        </View>
      )}
    </ThemeCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  icon: {
    fontSize: 20,
    marginRight: 5,
    textAlignVertical: 'top'
  },
  title: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: 'bold'
  },
  summary: {
    fontSize: 14,
    marginBottom: 10,
  },
  suggestionsContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    marginRight: 8,
    fontWeight: 'bold',
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
