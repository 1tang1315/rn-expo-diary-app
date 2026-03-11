import { ScoreService } from '@/core/service/ScoreService';

export class DashboardService {
  static async getDashboard(startDate, endDate) {
    return ScoreService.getDashboardData(startDate, endDate);
  }
}
