import { BaseController } from '@/core/controller';
import { Response } from '@/core/response';
import { AnalyseService } from '@/core/service/analyse';

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
   * 生成 AI 分析报告（流式，直接返回原始 AI 输出）
   * @param {Object} params - { startDate, endDate, forceRefresh }
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @param {boolean} params.forceRefresh - 是否强制刷新（忽略缓存）
   * @param {Object} callbacks - { onThought, onOutput }
   * @returns {Promise<{code: number, success: boolean, message: string, data: *}>}
   */
  async generateAiReport(params = {}, callbacks = {}) {
    try {
      const { startDate, endDate, forceRefresh = false } = params;
      if (!startDate) {
        return Response.error(400, '开始日期为必填参数');
      }
      return await this.service.generateAiReportStream({ startDate, endDate, forceRefresh }, callbacks);
    } catch (error) {
      console.error('生成 AI 分析报告失败:', error);
      return Response.error(500, error.message || '生成 AI 分析报告失败');
    }
  }
}

