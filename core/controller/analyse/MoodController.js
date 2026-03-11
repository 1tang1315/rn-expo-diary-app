import { MoodService } from '@/back/services';
import { BaseController } from '@/back/controllers';

export class MoodController extends BaseController {
  /**
   * 获取情绪评分数据
   * @param {Object} params - 参数对象
   * @param {Date} params.startDate - 开始日期
   * @param {Date} params.endDate - 结束日期
   * @returns {Promise<Object>} 情绪评分数据
   */
  static async getMoodScoreData(params) {
    return this.handleAsync(async () => {
      const { startDate, endDate } = params;
      return await MoodService.getMoodScoreData(startDate, endDate);
    }, '获取情绪评分数据失败');
  }
}