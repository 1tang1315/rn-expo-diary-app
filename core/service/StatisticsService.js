/**
 * 统计服务类，处理统计相关的业务逻辑
 */
import { EventMapper } from '@/core/mapper';
import { BaseService } from '@/core/service';
import { snakeToCamelObject } from '@/core/utils';
import { getTotalMinutes } from '@/utils/formatTimeUtils';
import { getCategoryName } from '@/utils/categoryUtils';
import { statisticsColors as colors } from '@/constants/commonConstans';

export class StatisticsService extends BaseService {
  constructor() {
    super(new EventMapper());
  }

  /**
   * 获取统计数据
   * @param {string} startDate - 开始日期，格式：YYYY-MM-DD
   * @param {string} endDate - 结束日期，格式：YYYY-MM-DD
   * @param {string} category - 事件分类，'all' 表示所有分类
   * @returns {Promise<Object>} 统计数据
   */
  async getStatistics(startDate, endDate, category = 'all') {
    // 获取事件数据
    const events = await this.mapper.getByDateRangeAndCategory(startDate, endDate ?? startDate, category);
    const camelEvents = events.map(event => snakeToCamelObject(event));
    
    // 处理统计数据
    return this.processStatistics(camelEvents, category === 'all');
  }

  /**
   * 处理统计数据
   * @param {Array} data - 事件数据
   * @param {boolean} groupByCategory - 是否按分类分组
   * @returns {Object} 处理后的统计数据
   */
  processStatistics(data, groupByCategory = false) {
    // 确保data是数组
    const safeData = Array.isArray(data) ? data : [];
    
    const completedEvents = safeData.filter(item => item.status === 'completed');
    
    const groupedData = {};
    completedEvents.forEach(item => {
      const key = groupByCategory
        ? getCategoryName(item.category) // all时用分类名称作为key
        : (item.title && item.title.trim() !== '' ? item.title : getCategoryName(item.category));
      
      // 计算时长（分钟）
      const durationMinutes = getTotalMinutes(item.startDatetime, item.endDatetime);
      
      // 第一次groupedData[key]没有, 进行初始化
      if (!groupedData[key]) {
        groupedData[key] = {
          durationMinutes: 0,
          useCount: 0
        };
      }
      // groupedData有了, 进行累加
      groupedData[key].durationMinutes += durationMinutes > 0 ? durationMinutes : 0;
      groupedData[key].useCount += 1;
    });
    
    const chartData = Object.keys(groupedData).map((key, index) => ({
      label: key,
      value: groupedData[key].durationMinutes,
      color: colors[index % colors.length],
      useCount: groupedData[key].useCount
    }));
    
    const totalMinutes = completedEvents.reduce((sum, e) => {
      const duration = getTotalMinutes(e.startDatetime, e.endDatetime);
      return sum + (duration > 0 ? duration : 0);
    }, 0);
    
    return { chartData, totalMinutes, completedEvents };
  }
}