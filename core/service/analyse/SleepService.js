import { calculateSleepScore } from '@/utils/sleepScoreUtils';
import dayjs from 'dayjs';
import { EventService } from '../EventService';

export class SleepService {
  /**
   * 获取指定日期的睡眠评分数据
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Promise<Object>} 睡眠评分数据
   */
  static async getSleepScoreData(startDate, endDate) {
    try {
      // 创建EventService实例
      const eventService = new EventService();
      
      // 计算前一天的日期范围
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - 1);
      previousStartDate.setHours(0, 0, 0, 0);

      const previousEndDate = new Date(previousStartDate);
      previousEndDate.setHours(23, 59, 59, 999);

      // 并行获取当天和前一天的数据
      const [currentData, previousData] = await Promise.all([
        eventService.getByDateRange(startDate, endDate),
        eventService.getByDateRange(previousStartDate, previousEndDate)
      ]);

      // 过滤当天的睡眠事件（只包含结束时间在当天的）
      const currentSleepEvents = currentData.filter(event => {
        if (event.category !== 'sleep' || event.status !== 'completed') {
          return false;
        }
        const endDate = dayjs(event.end_datetime);
        const eventEndDate = endDate.format('YYYY-MM-DD');
        const currentDate = dayjs(startDate).format('YYYY-MM-DD');
        return eventEndDate === currentDate;
      });

      // 过滤前一天的睡眠事件（只包含结束时间在前一天的）
      const previousSleepEvents = previousData.filter(event => {
        if (event.category !== 'sleep' || event.status !== 'completed') {
          return false;
        }
        const endDate = dayjs(event.end_datetime);
        const eventEndDate = endDate.format('YYYY-MM-DD');
        const previousDate = dayjs(previousStartDate).format('YYYY-MM-DD');
        return eventEndDate === previousDate;
      });

      // 计算睡眠评分
      const sleepScoreResult = calculateSleepScore(currentSleepEvents, previousSleepEvents);

      return {
        totalScore: sleepScoreResult.totalScore,
        details: sleepScoreResult,
        events: currentSleepEvents
      };
    } catch (error) {
      console.error('获取睡眠评分数据失败:', error);
      throw error;
    }
  }
}