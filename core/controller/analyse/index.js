import { BaseController } from '@/core/controller';
import { Response } from '@/core/response';
import { dateRangeParamsSchema } from '@/core/schemas';
import { AnalyseService } from '@/core/service/analyse';
import { validateParams } from '@/core/utils';

const sleepDetailParamsSchema = {
  type: 'object',
  properties: {
    startDate: dateRangeParamsSchema.properties.startDate,
    endDate: dateRangeParamsSchema.properties.endDate
  },
  required: ['startDate']
};

const categoryEventsParamsSchema = {
  type: 'object',
  properties: {
    startDate: dateRangeParamsSchema.properties.startDate,
    endDate: dateRangeParamsSchema.properties.endDate,
    category: {
      type: 'string',
      description: '事件分类'
    }
  },
  required: ['startDate', 'category']
};

export class AnalyseController extends BaseController {
  constructor() {
    super(new AnalyseService());
  }
  
  /**
   * 获取综合看板数据（AI 评分）
   * @param {Object} params
   * @param {string} params.startDate - 开始日期，格式：YYYY-MM-DD
   * @param {string} params.endDate - 结束日期，格式：YYYY-MM-DD
   * @returns {Promise<Object>} 统一响应
   */
  async getDashboard(params = {}) {
    try {
      const { startDate, endDate } = params;
      if (!startDate) {
        return Response.error(400, '开始日期为必填参数');
      }
      
      const data = await this.service.getDashboard({ startDate, endDate });
      return Response.success(data, '获取看板数据成功');
    } catch (error) {
      console.error('获取看板数据失败:', error);
      return Response.error(500, '获取看板数据失败');
    }
  }

  /**
   * 获取睡眠评分详情
   * @param {Object} params - 查询参数
   * @param {string} params.startDate - 目标日期，格式：YYYY-MM-DD
   * @returns {Promise<Object>} 统一格式的响应
   */
  async getSleepDetail(params = {}) {
    try {
      const validationResult = validateParams(params, sleepDetailParamsSchema);
      if (!validationResult.isValid) {
        return Response.error(400, validationResult.errors.join('; '));
      }

      const { startDate } = params;
      const data = await this.service.getSleepDetail({ startDate });
      return Response.success(data, '获取睡眠评分详情成功');
    } catch (error) {
      console.error('获取睡眠评分详情失败:', error);
      return Response.error(500, '获取睡眠评分详情失败');
    }
  }

  /**
   * 获取指定分类的事件数据
   * @param {Object} params - 查询参数
   * @param {string} params.startDate - 开始日期，格式：YYYY-MM-DD
   * @param {string} params.endDate - 结束日期，格式：YYYY-MM-DD
   * @param {string} params.category - 事件分类
   * @returns {Promise<Object>} 统一格式的响应
   */
  async getCategoryEvents(params = {}) {
    try {
      const validationResult = validateParams(params, categoryEventsParamsSchema);
      if (!validationResult.isValid) {
        return Response.error(400, validationResult.errors.join('; '));
      }

      const { startDate, endDate, category } = params;
      const data = await this.service.getCategoryEvents({ startDate, endDate, category });
      return Response.success(data, '获取分类事件数据成功');
    } catch (error) {
      console.error('获取分类事件数据失败:', error);
      return Response.error(500, '获取分类事件数据失败');
    }
  }

  /**
   * 获取指定类型的评分详情
   * @param {Object} params - 查询参数
   * @param {string} params.type - 评分类型
   * @param {string} params.startDate - 开始日期，格式：YYYY-MM-DD
   * @param {string} params.endDate - 结束日期，格式：YYYY-MM-DD
   * @returns {Promise<Object>} 统一格式的响应
   */
  async getScoreDetail(params = {}) {
    try {
      const { type, startDate, endDate } = params;

      if (!type || !startDate) {
        return Response.error(400, '类型和开始日期为必填参数');
      }

      const data = await this.service.getScoreDetail({ type, startDate, endDate });
      return Response.success(data, '获取评分详情成功');
    } catch (error) {
      console.error('获取评分详情失败:', error);
      return Response.error(500, '获取评分详情失败');
    }
  }
}

export { SleepController } from './SleepController';

