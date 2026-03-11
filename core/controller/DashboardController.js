import dayjs from 'dayjs';
import { Response } from '@/core/response';
import { DashboardService } from '@/core/service/DashboardService';

const normalizeDate = (date, fallback) => {
  if (!date) return fallback;
  const parsed = dayjs(date);
  return parsed.isValid() ? parsed.toDate() : fallback;
};

export class DashboardController {
  async getDashboard(params = {}) {
    try {
      const startDate = normalizeDate(params.startDate, dayjs().startOf('day').toDate());
      const endDate = normalizeDate(params.endDate, dayjs().endOf('day').toDate());
      const data = await DashboardService.getDashboard(startDate, endDate);
      return Response.success(data, '获取Dashboard成功');
    } catch (error) {
      console.error('获取Dashboard失败:', error);
      return Response.error(500, '获取Dashboard失败');
    }
  }
}
