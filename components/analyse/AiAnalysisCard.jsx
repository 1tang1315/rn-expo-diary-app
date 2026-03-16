import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import ThemeCard from '@/components/theme/ThemeCard';
import ThemeText from '@/components/theme/ThemeText';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * AiAnalysisCard
 *
 * 展示 AI 行为分析：
 * - reportText：原始 Markdown 分析报告（优先展示）
 * - overview / review / suggestions / positive：结构化板块（兼容旧版）
 *
 * 期望的 analysis 结构（来自 AnalysisService 标准化结果）：
 * {
 *   reportText?: string,   // Markdown 报告全文，用于 AI 分析报告展示
 *   overview: { state, keyFactors[] },
 *   review: [], suggestions: [], positive: []
 * }
 */
export default function AiAnalysisCard({ analysis }) {
  const { theme } = useTheme();

  if (!analysis) return null;

  const reportText = analysis.reportText || '';
  const overview = analysis.overview || {};
  const review = Array.isArray(analysis.review) ? analysis.review : [];
  const suggestions = Array.isArray(analysis.suggestions) ? analysis.suggestions : [];
  const positive = Array.isArray(analysis.positive) ? analysis.positive : [];

  const hasStructuredContent = review.length || suggestions.length || positive.length;
  const hasReport = reportText.trim().length > 0;

  return (
    <ThemeCard>
      <View style={styles.header}>
        <Text style={styles.icon}>🤖</Text>
        <ThemeText style={styles.title}>AI 智能分析</ThemeText>
      </View>

      {/* 原始 Markdown 分析报告（AI 返回的 reportText） */}
      {hasReport && (
        <View style={styles.reportBlock}>
          <MarkdownRenderer content={reportText} style={styles.reportMarkdown} />
        </View>
      )}

      {/* 总体验证：今日状态 + 关键因素（无 reportText 或兼容旧数据时展示） */}
      {!hasReport && (
        <ThemeText style={styles.summary}>
          {overview.state || '暂无整体状态描述'}
        </ThemeText>
      )}
      {overview.keyFactors && overview.keyFactors.length > 0 && (
        <View style={styles.block}>
          <ThemeText style={styles.blockTitle}>关键因素</ThemeText>
          {overview.keyFactors.map((factor, idx) => (
            <ThemeText key={idx} style={styles.blockItemText}>
              {idx + 1}. {factor}
            </ThemeText>
          ))}
        </View>
      )}

      {!hasReport && !hasStructuredContent && (
        <ThemeText style={styles.emptyText}>暂无详细分析数据</ThemeText>
      )}

      {/* 一、今日复盘 */}
      {review.length > 0 && (
        <View style={styles.section}>
          <ThemeText style={styles.sectionTitle}>今日复盘</ThemeText>
          {review.map((item, index) => (
            <View key={index} style={styles.sectionItem}>
              <ThemeText style={styles.sectionItemTitle}>
                {index + 1}. {item.title || '未命名复盘点'}
              </ThemeText>
              {item.evidence && item.evidence.length > 0 && (
                <View style={styles.subBlock}>
                  <ThemeText style={styles.subBlockTitle}>证据</ThemeText>
                  {item.evidence.map((ev, i) => (
                    <ThemeText key={i} style={styles.subBlockText}>
                      - {ev}
                    </ThemeText>
                  ))}
                </View>
              )}
              {item.analysis ? (
                <View style={styles.subBlock}>
                  <ThemeText style={styles.subBlockTitle}>分析</ThemeText>
                  <ThemeText style={styles.subBlockText}>
                    {item.analysis}
                  </ThemeText>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {/* 二、改进建议 */}
      {suggestions.length > 0 && (
        <View style={styles.section}>
          <ThemeText style={styles.sectionTitle}>改进建议</ThemeText>
          {suggestions.map((item, index) => (
            <View key={index} style={styles.sectionItem}>
              <ThemeText style={styles.sectionItemTitle}>
                {index + 1}. {item.title || '未命名建议'}
              </ThemeText>
              {item.reason ? (
                <ThemeText style={styles.subBlockText}>
                  原因：{item.reason}
                </ThemeText>
              ) : null}
              {Array.isArray(item.actions) && item.actions.length > 0 && (
                <View style={styles.subBlock}>
                  <ThemeText style={styles.subBlockTitle}>可执行行动</ThemeText>
                  {item.actions.map((act, i) => (
                    <ThemeText key={i} style={styles.subBlockText}>
                      - {act}
                    </ThemeText>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* 三、正向反馈 */}
      {positive.length > 0 && (
        <View style={styles.section}>
          <ThemeText style={styles.sectionTitle}>正向反馈</ThemeText>
          {positive.map((item, index) => (
            <View key={index} style={styles.sectionItem}>
              <ThemeText style={styles.sectionItemTitle}>
                {index + 1}. {item.behavior || '积极行为'}
              </ThemeText>
              {Array.isArray(item.evidence) && item.evidence.length > 0 && (
                <View style={styles.subBlock}>
                  {item.evidence.map((ev, i) => (
                    <ThemeText key={i} style={styles.subBlockText}>
                      - {ev}
                    </ThemeText>
                  ))}
                </View>
              )}
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
  reportBlock: {
    marginBottom: 12
  },
  reportMarkdown: {
    fontSize: 14,
    lineHeight: 22
  },
  summary: {
    fontSize: 14,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  block: {
    marginTop: 8,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  blockItemText: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionItem: {
    marginBottom: 10,
  },
  sectionItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  subBlock: {
    marginTop: 4,
  },
  subBlockTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  subBlockText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
