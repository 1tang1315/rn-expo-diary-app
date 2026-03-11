/**
 * 统计控制器类，处理统计相关的请求
 */
import { StatisticsService } from '@/core/service';
import { BaseController } from '@/core/controller';
import { Response } from '@/core/response';
import { snakeToCamelObject } from '@/core/utils';

export class StatisticsController extends BaseController {
  constructor() {
    super(new StatisticsService());
  }

  /**
   * 获取统计数据
   * @param {Object} params - 参数
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @param {string} params.category - 事件分类
   * @returns {Promise<Object>} 统计数据
   */
  async getStatistics(params) {
    try {
      const { startDate, endDate, category = 'all' } = params;
      const data = await this.service.getStatistics(startDate, endDate, category);
      return Response.success(data, '获取统计数据成功');
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return Response.error(500, '获取统计数据失败');
    }
  }

  /**
   * 获取统计数据，按视图类型处理
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 统一格式的响应
   */
  async getStatsData(params = {}) {
    try {
      const { startDate, endDate, category = 'all', viewType = 'week' } = params;
      
      // 获取事件数据
      const events = await this.service.mapper.getByDateRangeAndCategory(startDate, endDate, category);
      const camelEvents = events.map(event => snakeToCamelObject(event));
      
      // 处理统计数据
      const statsData = this.service.processStatsData(camelEvents, viewType, { startDate, endDate });
      
      return Response.success(statsData, '获取成功');
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return Response.error(500, '获取统计数据失败');
    }
  }
}