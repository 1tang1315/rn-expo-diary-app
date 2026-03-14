import { BaseController } from '@/core/controller';
import { Response } from '@/core/response';
import { dateRangeParamsSchema } from '@/core/schemas';
import { validateParams } from '@/core/utils';
import { SleepService } from '@/core/service/analyse/SleepService';

const sleepDetailParamsSchema = {
  type: 'object',
  properties: {
    startDate: dateRangeParamsSchema.properties.startDate,
    endDate: dateRangeParamsSchema.properties.endDate
  },
  required: ['startDate']
};

export class SleepController extends BaseController {
  constructor() {
    super(new SleepService());
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
   * 睡眠专用：获取总评分
   */
  async getSleepScoreSummary(params = {}) {
    try {
      const validationResult = validateParams(params, sleepDetailParamsSchema);
      if (!validationResult.isValid) {
        return Response.error(400, validationResult.errors.join('; '));
      }

      const { startDate } = params;
      const data = await this.service.getSleepScoreSummary({ startDate });
      return Response.success(data, '获取睡眠总评分成功');
    } catch (error) {
      console.error('获取睡眠总评分失败:', error);
      return Response.error(500, '获取睡眠总评分失败');
    }
  }

  /**
   * 睡眠专用：获取各维度概览（不包含 detailText）
   */
  async getSleepBreakdown(params = {}) {
    try {
      const validationResult = validateParams(params, sleepDetailParamsSchema);
      if (!validationResult.isValid) {
        return Response.error(400, validationResult.errors.join('; '));
      }

      const { startDate } = params;
      const data = await this.service.getSleepBreakdown({ startDate });
      return Response.success(data, '获取睡眠维度概览成功');
    } catch (error) {
      console.error('获取睡眠维度概览失败:', error);
      return Response.error(500, '获取睡眠维度概览失败');
    }
  }

  /**
   * 睡眠专用：获取单个维度的 Markdown 详情
   */
  async getSleepBreakdownDetail(params = {}) {
    try {
      const { startDate, key } = params;
      if (!startDate || !key) {
        return Response.error(400, 'startDate 和 key 为必填参数');
      }
      const data = await this.service.getSleepBreakdownDetail({ startDate, key });
      return Response.success(data, '获取睡眠维度详情成功');
    } catch (error) {
      console.error('获取睡眠维度详情失败:', error);
      return Response.error(500, '获取睡眠维度详情失败');
    }
  }

  /**
   * 睡眠专用：获取事件列表
   */
  async getSleepEvents(params = {}) {
    try {
      const validationResult = validateParams(params, sleepDetailParamsSchema);
      if (!validationResult.isValid) {
        return Response.error(400, validationResult.errors.join('; '));
      }

      const { startDate } = params;
      const data = await this.service.getSleepEvents({ startDate });
      return Response.success(data, '获取睡眠事件列表成功');
    } catch (error) {
      console.error('获取睡眠事件列表失败:', error);
      return Response.error(500, '获取睡眠事件列表失败');
    }
  }

  /**
   * 睡眠专用：获取 AI 建议
   */
  async getSleepAdvice(params = {}) {
    try {
      const validationResult = validateParams(params, sleepDetailParamsSchema);
      if (!validationResult.isValid) {
        return Response.error(400, validationResult.errors.join('; '));
      }

      const { startDate } = params;
      const data = await this.service.getSleepAdvice({ startDate });
      return Response.success(data, '获取睡眠 AI 建议成功');
    } catch (error) {
      console.error('获取睡眠 AI 建议失败:', error);
      return Response.error(500, '获取睡眠 AI 建议失败');
    }
  }
}

