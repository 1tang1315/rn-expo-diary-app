import { EventService } from '../EventService';

export class DietService {
  /**
   * 获取指定日期的饮食评分数据
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Promise<Object>} 饮食评分数据
   */
  static async getDietScoreData(startDate, endDate) {
    try {
      // 创建EventService实例
      const eventService = new EventService();
      
      // 获取指定日期范围内的饮食事件
      const events = await eventService.getByDateRange(startDate, endDate);

      // 过滤饮食事件
      const dietEvents = events.filter(event => 
        event.category === 'diet' && event.status === 'completed'
      );

      // 计算饮食评分（示例实现，实际应该根据具体业务逻辑计算）
      let totalScore = 82; // 默认值
      
      if (dietEvents.length > 0) {
        // 这里可以根据实际的饮食事件数据计算评分
        // 例如：根据饮食类型、营养均衡度等因素
        totalScore = Math.min(100, Math.max(0, totalScore));
      }

      return {
        totalScore
      };
    } catch (error) {
      console.error('获取饮食评分数据失败:', error);
      throw error;
    }
  }
}