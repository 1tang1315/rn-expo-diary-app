/**
 * 事件服务类，处理事件相关的业务逻辑
 */
import { EventMapper } from '@/core/mapper';
import { BaseService } from '@/core/service';
import { snakeToCamelObject } from '@/core/utils';

export class EventService extends BaseService {
  constructor() {
    super(new EventMapper());
  }

  /**
   * 根据日期范围获取事件
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Promise<Array>} 转换后的对象数组
   */
  async getByDateRange(startDate, endDate) {
    // 转换日期对象为YYYY-MM-DD格式字符串
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    const results = await this.mapper.getByDateRangeAndCategory(start, end, 'all', 'desc');
    return results.map(result => snakeToCamelObject(result));
  }

  /**
   * 根据日期范围和分类获取事件
   * @param {string} startDate - 开始日期，格式：YYYY-MM-DD
   * @param {string} endDate - 结束日期，格式：YYYY-MM-DD
   * @param {string} category - 事件分类，'all' 表示所有分类
   * @param {string} sortOrder - 排序方向，'asc' 或 'desc'
   * @returns {Promise<Array>} 转换后的对象数组
   */
  async getByDateRangeAndCategory(startDate, endDate, category = 'all', sortOrder = 'desc') {
    const results = await this.mapper.getByDateRangeAndCategory(startDate, endDate ?? startDate, category, sortOrder);
    return results.map(result => snakeToCamelObject(result));
  }

  /**
   * 按关键词搜索事件
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Array>} 转换后的对象数组
   */
  async searchByKeyword(keyword) {
    // 数据处理：处理搜索关键词
    const searchTerm = `%${keyword}%`;
    const results = await this.mapper.searchByKeyword(keyword, searchTerm);
    return results.map(result => snakeToCamelObject(result));
  }

  /**
   * 按分类获取常用标题
   * @param {string} category - 事件分类
   * @param {number} limit - 最多返回数量
   * @returns {Promise<Array>} 常用标题数组
   */
  async getCommonTitlesByCategory(category, limit = 5) {
    const results = await this.mapper.getCommonTitlesByCategory(category, limit) ?? [];
    // 数据处理：提取标题
    return results.map(item => item.title);
  }

  /**
   * 获取事件统计数据
   * @returns {Promise<Object>} 统计数据
   */
  async getTotalStats() {
    const rawStats = await this.mapper.getTotalStats();
    // 数据处理：格式化统计数据
    const totalEvents = rawStats.totalEvents || 0;
    const totalRecords = rawStats.totalRecords || 0;
    const totalDuration = rawStats.totalHours
      ? `${rawStats.totalHours.toFixed(1)}小时`
      : '0小时';
    const recordDays = `${rawStats.recordDays || 0}天`;

    return {
      totalEvents: `${totalEvents}个`,
      totalRecords: `${totalRecords}次`,
      totalDuration,
      recordDays
    };
  }

  /**
   * 更新事件状态
   * @param {number} id - 事件ID
   * @param {string} status - 新状态
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateStatus(id, status) {
    const event = await this.getById(id);
    if (!event) {
      return false;
    }

    event.status = status;
    return await this.update(id, event);
  }

  /**
   * 按条件筛选搜索事件（支持搜索类型、日期范围、排序方式）
   * @param {Object} options - 筛选选项
   * @param {string} options.keyword - 搜索关键词
   * @param {'title' | 'description' | 'both'} options.searchType - 搜索类型：标题/描述/全部
   * @param {string} options.startDate - 开始日期，格式：YYYY-MM-DD
   * @param {string} options.endDate - 结束日期，格式：YYYY-MM-DD
   * @param {'asc' | 'desc'} options.sortOrder - 排序方式：升序/降序
   * @returns {Promise<Array>} 匹配的事件数组
   */
  async getByFilters(options) {
    const results = await this.mapper.getByFilters(options);
    return results.map(result => snakeToCamelObject(result));
  }
}