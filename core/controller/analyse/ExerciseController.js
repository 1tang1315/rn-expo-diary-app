import { ExerciseService } from '@/back/services';
import { BaseController } from '@/back/controllers';

export class ExerciseController extends BaseController {
  /**
   * 获取运动评分数据
   * @param {Object} params - 参数对象
   * @param {Date} params.startDate - 开始日期
   * @param {Date} params.endDate - 结束日期
   * @returns {Promise<Object>} 运动评分数据
   */
  static async getExerciseScoreData(params) {
    return this.handleAsync(async () => {
      const { startDate, endDate } = params;
      return await ExerciseService.getExerciseScoreData(startDate, endDate);
    }, '获取运动评分数据失败');
  }
}