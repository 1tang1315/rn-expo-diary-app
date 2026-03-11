const pickLowScoreProblems = (scores = {}) => {
  const mapping = [
    { key: 'sleepScore', label: '睡眠' },
    { key: 'dietScore', label: '饮食' },
    { key: 'sportScore', label: '运动' },
    { key: 'productivityScore', label: '效率' },
    { key: 'emotionScore', label: '情绪' },
    { key: 'balanceScore', label: '平衡' }
  ];

  return mapping
    .filter((item) => Number(scores[item.key] || 0) < 60)
    .map((item) => `${item.label}分偏低，需要优先改进`);
};

const pickSuggestions = ({ statistics = {}, scores = {} }) => {
  const suggestions = [];

  if (Number(statistics.sleepDuration || 0) < 420) {
    suggestions.push('建议把睡眠时长稳定在7-9小时，优先固定入睡时间。');
  }
  if (Number(statistics.sportDuration || 0) < 30) {
    suggestions.push('建议增加至少30分钟中等强度运动，优先安排在固定时段。');
  }
  if (Number(statistics.mealCount || 0) < 2) {
    suggestions.push('饮食记录偏少，建议保持至少2-3次规律进食并补充蛋白质。');
  }
  if (Number(scores.productivityScore || 0) < 65) {
    suggestions.push('效率分偏低，建议拆分任务并使用25分钟专注+5分钟休息节奏。');
  }
  if (Number(scores.emotionScore || 0) < 65) {
    suggestions.push('情绪波动较大，建议每天预留10分钟放松或情绪记录。');
  }

  if (!suggestions.length) {
    suggestions.push('当前整体状态较稳定，建议继续保持并观察周趋势变化。');
  }

  return suggestions.slice(0, 5);
};

export class AnalysisAiService {
  generateDailyAdvice({ statistics = {}, scores = {}, events = [] }, focusType = 'overall') {
    const problems = pickLowScoreProblems(scores);
    const suggestions = pickSuggestions({ statistics, scores });
    const completedEvents = events.filter((event) => event.status === 'completed').length;
    const summary = `今日完成事件${completedEvents}条，综合分${scores.totalScore || 0}分，重点关注${focusType === 'overall' ? '整体平衡' : focusType}。`;

    return {
      summary,
      problems: problems.length ? problems : ['未发现明显短板，建议关注持续性。'],
      suggestions
    };
  }

  generateWeeklyReport(payload, focusType = 'overall') {
    const dailyAdvice = this.generateDailyAdvice(payload, focusType);
    return {
      summary: `本周总结：${dailyAdvice.summary}`,
      problems: dailyAdvice.problems,
      suggestions: dailyAdvice.suggestions
    };
  }
}
