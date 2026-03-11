import {
  buildExerciseCalculationProcess,
  buildScoreBundle,
  buildSleepCalculationProcess,
  enumerateDates,
  formatDate,
  getDayRange,
  getPreviousDayRange
} from '@/core/utils';
import { ScoreMapper } from '@/core/mapper';
import { EventService } from '@/core/service/EventService';
import { StatisticsService } from '@/core/service/StatisticsService';
import { AnalysisService } from '@/core/service/AnalysisService';
import { AnalysisAiService } from '@/core/service/AnalysisAiService';

class ScoreDomainService {
  constructor() {
    this.scoreMapper = new ScoreMapper();
    this.eventService = new EventService();
    this.statisticsService = new StatisticsService();
    this.analysisService = new AnalysisService();
    this.analysisAiService = new AnalysisAiService();
  }

  async getEventsByDateRange(startDate, endDate) {
    return this.eventService.getByDateRangeAndCategory(formatDate(startDate), formatDate(endDate), 'all', 'asc');
  }

  async buildBundle(startDate, endDate) {
    const rangeStart = formatDate(startDate);
    const rangeEnd = formatDate(endDate);
    const events = await this.getEventsByDateRange(rangeStart, rangeEnd);
    const statistics = await this.statisticsService.getRangeStatistics(rangeStart, rangeEnd);

    const previous = getPreviousDayRange(startDate);
    const previousDayEvents = await this.getEventsByDateRange(previous.start, previous.end);

    return {
      events,
      ...buildScoreBundle({
        statistics,
        events,
        previousDayEvents
      })
    };
  }

  toLegacyScoreData(bundle) {
    return {
      overall: { totalScore: bundle.scores.totalScore },
      sleep: bundle.components.sleep,
      mood: bundle.components.mood,
      diet: bundle.components.diet,
      exercise: bundle.components.exercise,
      productivity: bundle.components.productivity,
      balance: bundle.components.balance,
      scores: bundle.scores,
      statistics: bundle.statistics
    };
  }

  async cacheDailyScore(date, scores) {
    await this.scoreMapper.upsertDailyScore({
      date: formatDate(date),
      sleepScore: scores.sleepScore,
      dietScore: scores.dietScore,
      sportScore: scores.sportScore,
      productivityScore: scores.productivityScore,
      emotionScore: scores.emotionScore,
      balanceScore: scores.balanceScore,
      totalScore: scores.totalScore
    });
  }

  async getScoreData(startDate, endDate) {
    const bundle = await this.buildBundle(startDate, endDate);
    if (formatDate(startDate) === formatDate(endDate)) {
      await this.cacheDailyScore(startDate, bundle.scores);
    }
    return this.toLegacyScoreData(bundle);
  }

  async getDashboardData(startDate, endDate) {
    const bundle = await this.buildBundle(startDate, endDate);

    if (formatDate(startDate) === formatDate(endDate)) {
      await this.cacheDailyScore(startDate, bundle.scores);
    }

    const aiAdvice = this.analysisAiService.generateDailyAdvice({
      statistics: bundle.statistics,
      scores: bundle.scores,
      events: bundle.events
    });

    const charts = {
      timeDistribution: this.analysisService.getTimeDistribution(bundle.statistics),
      categoryStatistics: this.analysisService.getCategoryStatistics(bundle.events)
    };

    const completedEvents = bundle.events.filter((event) => event.status === 'completed');
    const eventSummary = {
      totalEvents: bundle.events.length,
      completedEvents: completedEvents.length,
      categoryCount: [...new Set(completedEvents.map((event) => event.category))].length
    };

    return {
      totalScore: bundle.scores.totalScore,
      scores: bundle.scores,
      charts,
      eventSummary,
      aiAdvice,
      statistics: bundle.statistics
    };
  }

  buildDetailData(type, bundle, startDate, endDate) {
    const dateLabel = `${formatDate(startDate)}~${formatDate(endDate)}`;
    const aiAdvice = this.analysisAiService.generateDailyAdvice(
      { statistics: bundle.statistics, scores: bundle.scores, events: bundle.events },
      type
    );

    const base = {
      charts: {
        timeDistribution: this.analysisService.getTimeDistribution(bundle.statistics),
        categoryStatistics: this.analysisService.getCategoryStatistics(bundle.events)
      },
      aiAdvice,
      suggestions: aiAdvice.suggestions
    };

    if (type === 'sleep') {
      const details = bundle.components.sleep.details;
      return {
        ...base,
        score: bundle.components.sleep.totalScore,
        totalScore: bundle.components.sleep.totalScore,
        breakdown: [
          { label: '睡眠时长', value: details.durationScore || 0 },
          { label: '入睡时间', value: details.bedtimeScore || 0 },
          { label: '连续性', value: details.continuityScore || 0 },
          { label: '稳定性', value: details.stabilityScore || 0 }
        ],
        events: bundle.components.sleep.events,
        calculationProcess: buildSleepCalculationProcess(dateLabel, details)
      };
    }

    if (type === 'exercise') {
      const details = bundle.components.exercise.details;
      return {
        ...base,
        score: bundle.components.exercise.totalScore,
        totalScore: bundle.components.exercise.totalScore,
        breakdown: [
          { label: '能量消耗', value: details.energyScore || 0 },
          { label: '运动时长', value: details.durationScore || 0 },
          { label: '连续性', value: details.continuityScore || 0 }
        ],
        tags: details.tags || [],
        level: details.level || '未知',
        events: bundle.events.filter((event) => event.category === 'exercise' || event.category === 'sports'),
        calculationProcess: buildExerciseCalculationProcess(dateLabel, details)
      };
    }

    if (type === 'diet') {
      return {
        ...base,
        score: bundle.components.diet.totalScore,
        totalScore: bundle.components.diet.totalScore,
        breakdown: [
          { label: '饮食规律', value: Math.round(bundle.components.diet.totalScore * 0.55) },
          { label: '饮食频次', value: Math.round(bundle.components.diet.totalScore * 0.45) }
        ],
        events: bundle.events.filter((event) => event.category === 'diet')
      };
    }

    if (type === 'mood') {
      return {
        ...base,
        score: bundle.components.mood.totalScore,
        totalScore: bundle.components.mood.totalScore,
        breakdown: [
          { label: '积极情绪', value: bundle.components.mood.details.positiveCount * 10 },
          { label: '负面控制', value: Math.max(0, 50 - bundle.components.mood.details.negativeCount * 10) },
          { label: '情绪稳定', value: 30 + bundle.components.mood.details.neutralCount * 5 }
        ],
        events: bundle.events.filter((event) => event.category === 'mood')
      };
    }

    if (type === 'productivity') {
      return {
        ...base,
        score: bundle.components.productivity.totalScore,
        totalScore: bundle.components.productivity.totalScore,
        breakdown: [
          { label: '专注时长', value: Math.round(bundle.components.productivity.totalScore * 0.7) },
          { label: '执行连续性', value: Math.round(bundle.components.productivity.totalScore * 0.3) }
        ],
        events: bundle.events.filter((event) => ['study', 'work'].includes(event.category))
      };
    }

    if (type === 'balance') {
      return {
        ...base,
        score: bundle.components.balance.totalScore,
        totalScore: bundle.components.balance.totalScore,
        breakdown: [
          { label: '睡眠', value: bundle.scores.sleepScore },
          { label: '饮食', value: bundle.scores.dietScore },
          { label: '运动', value: bundle.scores.sportScore },
          { label: '效率', value: bundle.scores.productivityScore },
          { label: '情绪', value: bundle.scores.emotionScore }
        ],
        events: bundle.events
      };
    }

    return {
      ...base,
      score: bundle.scores.totalScore,
      totalScore: bundle.scores.totalScore,
      breakdown: [
        { label: '睡眠评分', value: bundle.scores.sleepScore },
        { label: '饮食评分', value: bundle.scores.dietScore },
        { label: '运动评分', value: bundle.scores.sportScore },
        { label: '效率评分', value: bundle.scores.productivityScore },
        { label: '情绪评分', value: bundle.scores.emotionScore },
        { label: '平衡评分', value: bundle.scores.balanceScore }
      ],
      events: bundle.events
    };
  }

  async getScoreDetailData(type, startDate, endDate) {
    const bundle = await this.buildBundle(startDate, endDate);
    return this.buildDetailData(type, bundle, startDate, endDate);
  }

  async getOrComputeDailyRow(date) {
    const day = formatDate(date);
    const cached = await this.scoreMapper.getByDate(day);
    if (cached) return cached;

    const range = getDayRange(day);
    const bundle = await this.buildBundle(range.start, range.end);
    await this.cacheDailyScore(day, bundle.scores);

    return {
      date: day,
      sleep_score: bundle.scores.sleepScore,
      diet_score: bundle.scores.dietScore,
      sport_score: bundle.scores.sportScore,
      productivity_score: bundle.scores.productivityScore,
      emotion_score: bundle.scores.emotionScore,
      balance_score: bundle.scores.balanceScore,
      total_score: bundle.scores.totalScore
    };
  }

  async getScoreTrend(days = 7) {
    const today = new Date();
    const end = formatDate(today);
    const start = formatDate(new Date(today.getTime() - (Math.max(1, days) - 1) * 24 * 60 * 60 * 1000));
    const dates = enumerateDates(start, end);
    const rows = [];

    for (const date of dates) {
      // eslint-disable-next-line no-await-in-loop
      const row = await this.getOrComputeDailyRow(date);
      rows.push(row);
    }

    return this.analysisService.getScoreTrend(rows);
  }
}

const scoreDomainService = new ScoreDomainService();

export class ScoreService {
  static async getScoreData(startDate, endDate) {
    return scoreDomainService.getScoreData(startDate, endDate);
  }

  static async getDashboardData(startDate, endDate) {
    return scoreDomainService.getDashboardData(startDate, endDate);
  }

  static async getScoreDetailData(type, startDate, endDate) {
    return scoreDomainService.getScoreDetailData(type, startDate, endDate);
  }

  static async getScoreTrend(days) {
    return scoreDomainService.getScoreTrend(days);
  }

  static async cacheDailyScore(date) {
    const range = getDayRange(date);
    const bundle = await scoreDomainService.buildBundle(range.start, range.end);
    await scoreDomainService.cacheDailyScore(date, bundle.scores);
    return bundle.scores;
  }
}
