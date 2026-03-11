import { DietService } from '@/back/services';
import { BaseController } from '@/back/controllers';

export class DietController extends BaseController {
  /**
   * 获取饮食评分数据
   * @param {Object} params - 参数对象
   * @param {Date} params.startDate - 开始日期
   * @param {Date} params.endDate - 结束日期
   * @returns {Promise<Object>} 饮食评分数据
   */
  static async getDietScoreData(params) {
    return this.handleAsync(async () => {
      const { startDate, endDate } = params;
      return await DietService.getDietScoreData(startDate, endDate);
    }, '获取饮食评分数据失败');
  }
}