import { commonTitlesSchema, dateRangeParamsSchema, eventFilterParamsSchema, eventSearchSchema, eventStatusUpdateSchema } from '@/core/schemas';
import { validateParams } from '@/core/utils';
import { Response } from '@/core/response';
import { EventService } from '@/core/service';
import { BaseController } from '@/core/controller';

export class EventController extends BaseController {
  constructor() {
    super(new EventService());
  }

  /**
   * 根据日期范围和分类获取事件
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 统一格式的响应
   */
  async getByDateRangeAndCategory(params = {}) {
    try {
      // 验证参数
      const validationResult = validateParams(params, dateRangeParamsSchema);
      if (!validationResult.isValid) {
        return Response.error(400, validationResult.errors.join('; '));
      }

      const { startDate, endDate, category = 'all', sortOrder } = params;

      let data;
      if (!startDate) {
        data = await this.service.getAll();
      } else {
        data = await this.service.getByDateRangeAndCategory(startDate, endDate, category, sortOrder);
      }

      return Response.success(data, '获取成功');
    } catch (error) {
      console.error('获取事件失败:', error);
      return Response.error(500, '获取事件失败');
    }
  }

  /**
   * 更新事件状态
   * @param {number} id - 事件ID
   * @param {string} status - 新状态
   * @returns {Promise<Object>} 是否更新成功
   */
  async updateStatus(id, status) {
    // 验证参数
    const validationResult = validateParams({ id, status }, eventStatusUpdateSchema);
    if (!validationResult.isValid) {
      return Response.error(400, validationResult.errors.join('; '));
    }
    const result = await this.service.updateStatus(id, status);
    return Response.success(result, '更新成功');
  }

  /**
   * 搜索事件
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Array>} 搜索结果
   */
  async searchEvents(keyword) {
    // 验证参数
    const validationResult = validateParams({ keyword }, eventSearchSchema);
    if (!validationResult.isValid) {
      return Response.error(400, validationResult.errors.join('; '));
    }
    const result = await this.service.searchByKeyword(keyword);
    return Response.success(result, '搜索成功');
  }

  /**
   * 获取常用标题
   * @param {string} category - 事件分类
   * @param {number} limit - 最多返回数量
   * @returns {Promise<{code: number, success: boolean, message: string, data: *}>} 常用标题数组
   */
  async getCommonTitles(category, limit = 5) {
    // 验证参数
    const validationResult = validateParams({ category, limit }, commonTitlesSchema);
    if (!validationResult.isValid) {
      return Response.error(400, validationResult.errors.join('; '));
    }
    const result = await this.service.getCommonTitlesByCategory(category, limit);
    return Response.success(result, '获取成功');
  }

  /**
   * 获取事件统计数据
   * @returns {Promise<Object>} 统计数据
   */
  async getTotalStats() {
    const result = await this.service.getTotalStats();
    return Response.success(result, '获取成功');
  }

  /**
   * 按条件筛选搜索事件（支持搜索类型、日期范围、排序方式）
   * @param {Object} params - 筛选选项
   * @returns {Promise<Object>} 统一格式的响应
   */
  async getByFilters(params = {}) {
    try {
      // 验证参数
      const validationResult = validateParams(params, eventFilterParamsSchema);
      if (!validationResult.isValid) {
        return Response.error(400, validationResult.errors.join('; '));
      }

      const data = await this.service.getByFilters(params);
      return Response.success(data, '获取成功');
    } catch (error) {
      console.error('筛选事件失败:', error);
      return Response.error(500, '筛选事件失败');
    }
  }
}