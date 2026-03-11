import { EventService } from '../EventService';
import { calculateExerciseScore } from '@/utils/exerciseScoreUtils';

export class ExerciseService {
  /**
   * 获取指定日期的运动评分数据
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Promise<Object>} 运动评分数据
   */
  static async getExerciseScoreData(startDate, endDate) {
    try {
      const eventService = new EventService();
      const events = await eventService.getByDateRange(startDate, endDate);
      const completedEvents = events.filter((event) => event.status === 'completed');
      const exerciseScoreResult = calculateExerciseScore(completedEvents);

      return {
        totalScore: exerciseScoreResult.totalScore,
        details: exerciseScoreResult
      };
    } catch (error) {
      console.error('获取运动评分数据失败:', error);
      throw error;
    }
  }
}