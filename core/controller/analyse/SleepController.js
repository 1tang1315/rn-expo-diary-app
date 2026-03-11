import { SleepService } from '@/back/services';
import { BaseController } from '@/back/controllers';

export class SleepController extends BaseController {
  /**
   * 获取睡眠评分数据
   * @param {Object} params - 参数对象
   * @param {Date} params.startDate - 开始日期
   * @param {Date} params.endDate - 结束日期
   * @returns {Promise<Object>} 睡眠评分数据
   */
  static async getSleepScoreData(params) {
    return this.handleAsync(async () => {
      const { startDate, endDate } = params;
      return await SleepService.getSleepScoreData(startDate, endDate);
    }, '获取睡眠评分数据失败');
  }
}