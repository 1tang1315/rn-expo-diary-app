import dayjs from 'dayjs';
import { Response } from '@/core/response';
import { ScoreService } from '@/core/service/ScoreService';
import { AnalysisService } from '@/core/service/AnalysisService';
import { StatisticsService } from '@/core/service/StatisticsService';

const normalizeDate = (date, fallback) => {
  if (!date) return fallback;
  const parsed = dayjs(date);
  return parsed.isValid() ? parsed.toDate() : fallback;
};

export class AnalysisController {
  constructor() {
    this.analysisService = new AnalysisService();
    this.statisticsService = new StatisticsService();
  }

  async getScoreTrend(params = {}) {
    try {
      const days = Number(params.days ?? 7);
      const trend = await ScoreService.getScoreTrend(days);
      return Response.success(trend, '获取趋势成功');
    } catch (error) {
      console.error('获取趋势失败:', error);
      return Response.error(500, '获取趋势失败');
    }
  }

  async getTimeDistribution(params = {}) {
    try {
      const startDate = normalizeDate(params.startDate, dayjs().startOf('day').toDate());
      const endDate = normalizeDate(params.endDate, dayjs().endOf('day').toDate());
      const statistics = await this.statisticsService.getRangeStatistics(startDate, endDate);
      const data = this.analysisService.getTimeDistribution(statistics);
      return Response.success(data, '获取时间分布成功');
    } catch (error) {
      console.error('获取时间分布失败:', error);
      return Response.error(500, '获取时间分布失败');
    }
  }

  async getCategoryStatistics(params = {}) {
    try {
      const startDate = normalizeDate(params.startDate, dayjs().startOf('day').toDate());
      const endDate = normalizeDate(params.endDate, dayjs().endOf('day').toDate());
      const events = await this.statisticsService.getEventsByDateRange(startDate, endDate);
      const data = this.analysisService.getCategoryStatistics(events);
      return Response.success(data, '获取分类统计成功');
    } catch (error) {
      console.error('获取分类统计失败:', error);
      return Response.error(500, '获取分类统计失败');
    }
  }

  async getWeeklySummary(params = {}) {
    try {
      const days = Number(params.days ?? 7);
      const trend = await ScoreService.getScoreTrend(days);
      const summary = this.analysisService.getWeeklySummary(trend);
      return Response.success(summary, '获取周总结成功');
    } catch (error) {
      console.error('获取周总结失败:', error);
      return Response.error(500, '获取周总结失败');
    }
  }
}
