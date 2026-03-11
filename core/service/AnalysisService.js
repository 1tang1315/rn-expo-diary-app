import { getMinutesBetween } from '@/core/utils';

export class AnalysisService {
  getTimeDistribution(statistics = {}) {
    return [
      { label: '睡眠', value: Number(statistics.sleepDuration || 0) },
      { label: '运动', value: Number(statistics.sportDuration || 0) },
      { label: '学习', value: Number(statistics.studyDuration || 0) },
      { label: '娱乐', value: Number(statistics.entertainmentDuration || 0) }
    ];
  }

  getCategoryStatistics(events = []) {
    const statsMap = new Map();

    events
      .filter((event) => event.status === 'completed')
      .forEach((event) => {
        const category = event.category || 'unknown';
        if (!statsMap.has(category)) {
          statsMap.set(category, { category, totalMinutes: 0, eventCount: 0 });
        }
        const item = statsMap.get(category);
        item.eventCount += 1;
        item.totalMinutes += getMinutesBetween(event.startDatetime ?? event.start_datetime, event.endDatetime ?? event.end_datetime);
      });

    return Array.from(statsMap.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
  }

  getScoreTrend(dailyScores = []) {
    return dailyScores.map((item) => ({
      date: item.date,
      totalScore: Number(item.totalScore ?? item.total_score ?? 0),
      sleepScore: Number(item.sleepScore ?? item.sleep_score ?? 0),
      dietScore: Number(item.dietScore ?? item.diet_score ?? 0),
      sportScore: Number(item.sportScore ?? item.sport_score ?? 0),
      productivityScore: Number(item.productivityScore ?? item.productivity_score ?? 0),
      emotionScore: Number(item.emotionScore ?? item.emotion_score ?? 0),
      balanceScore: Number(item.balanceScore ?? item.balance_score ?? 0)
    }));
  }

  getWeeklySummary(dailyScores = []) {
    if (!dailyScores.length) {
      return {
        avgTotalScore: 0,
        bestDay: null,
        lowestDay: null
      };
    }

    const normalized = this.getScoreTrend(dailyScores);
    const avgTotalScore = Math.round(
      normalized.reduce((sum, item) => sum + item.totalScore, 0) / normalized.length
    );

    const bestDay = normalized.reduce((best, current) => (current.totalScore > best.totalScore ? current : best), normalized[0]);
    const lowestDay = normalized.reduce((lowest, current) => (current.totalScore < lowest.totalScore ? current : lowest), normalized[0]);

    return {
      avgTotalScore,
      bestDay,
      lowestDay
    };
  }
}
