import dayjs from 'dayjs';
import { BaseController } from '@/core/controller/BaseController';
import { Response } from '@/core/response';
import { DashboardService } from '@/core/service/DashboardService';
import { ScoreService } from '@/core/service/ScoreService';

const normalizeDate = (date, fallback) => {
  if (!date) return fallback;
  const parsed = dayjs(date);
  return parsed.isValid() ? parsed.toDate() : fallback;
};

export class ScoreController extends BaseController {
  constructor() {
    super();
  }

  async getDashboard(params = {}) {
    try {
      const startDate = normalizeDate(params.startDate, dayjs().startOf('day').toDate());
      const endDate = normalizeDate(params.endDate, dayjs().endOf('day').toDate());
      const dashboard = await DashboardService.getDashboard(startDate, endDate);
      return Response.success(dashboard, '获取分析看板成功');
    } catch (error) {
      console.error('获取分析看板失败:', error);
      return Response.error(500, '获取分析看板失败');
    }
  }

  async getScoreData(params = {}) {
    return this.getDashboard(params);
  }

  async getScoreDetailData(params = {}) {
    try {
      const type = params.type || 'overall';
      const startDate = normalizeDate(params.startDate, dayjs().startOf('day').toDate());
      const endDate = normalizeDate(params.endDate, dayjs().endOf('day').toDate());

      const detail = await ScoreService.getScoreDetailData(type, startDate, endDate);
      return Response.success(detail, '获取评分详情成功');
    } catch (error) {
      console.error('获取评分详情失败:', error);
      return Response.error(500, '获取评分详情失败');
    }
  }

  async getScoreTrend(params = {}) {
    try {
      const days = Number(params.days ?? 7);
      const trend = await ScoreService.getScoreTrend(days);
      return Response.success(trend, '获取评分趋势成功');
    } catch (error) {
      console.error('获取评分趋势失败:', error);
      return Response.error(500, '获取评分趋势失败');
    }
  }
}
