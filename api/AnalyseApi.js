import { BaseApi } from "@/api/BaseApi";
import { AnalyseController } from '@/core/controller';
import { formatDate } from "@/core/utils";
import { handleResponse } from '@/utils/requestUtils';

/**
 * 分析 API
 */
class AnalyseApi extends BaseApi {
  constructor() {
    super(new AnalyseController());
  }

  /**
   * 获取分析看板数据
   * @param {Object} params - 查询参数
   * @param {Date} params.startDate - 开始日期
   * @param {Date} params.endDate - 结束日期
   * @returns {Promise<any>} 看板数据
   */
  async getDashboard(params = {}) {
    const startDate = params.startDate ? formatDate(params.startDate) : null;
    const endDate = params.endDate ? formatDate(params.endDate) : null;

    if (!startDate) {
      return {
        totalScore: 0,
        scores: {
          sleepScore: 0,
          dietScore: 0,
          sportScore: 0,
          productivityScore: 0,
          emotionScore: 0,
          balanceScore: 0
        },
        scoreChanges: {
          sleepChange: 0,
          dietChange: 0,
          sportChange: 0,
          productivityChange: 0,
          emotionChange: 0,
          balanceChange: 0
        },
        dimensions: {},
        aiAdvice: {
          summary: '暂无分析数据',
          suggestions: []
        }
      };
    }

    try {
      const res = await this.controller.getDashboard({ startDate, endDate });
      return await handleResponse(res);
    } catch (error) {
      console.error('Error getting dashboard:', error);
      return {
        totalScore: 0,
        scores: {
          sleepScore: 0,
          dietScore: 0,
          sportScore: 0,
          productivityScore: 0,
          emotionScore: 0,
          balanceScore: 0
        },
        scoreChanges: {
          sleepChange: 0,
          dietChange: 0,
          sportChange: 0,
          productivityChange: 0,
          emotionChange: 0,
          balanceChange: 0
        },
        dimensions: {},
        aiAdvice: {
          summary: '暂无分析数据',
          suggestions: []
        }
      };
    }
  }

  /**
   * 生成 AI 分析报告
   * @param {Object} params - 查询参数
   * @param {Date} params.startDate - 开始日期
   * @param {Date} params.endDate - 结束日期
   * @param {boolean} params.forceRefresh - 是否强制刷新（忽略缓存）
   * @param {Object} callbacks - 回调函数
   * @param {Function} callbacks.onThought - 思考回调
   * @param {Function} callbacks.onOutput - 输出回调
   * @returns {Promise<{ thought: string, output: string }>} AI 分析报告
   */
  async generateAiReport(params = {}, callbacks = {}) {
    const startDate = params.startDate ? formatDate(params.startDate) : null;
    const endDate = params.endDate ? formatDate(params.endDate) : null;
    const forceRefresh = params.forceRefresh || false;

    if (!startDate) {
      return {
        thought: '',
        output: '开始日期为必填参数'
      };
    }

    try {
      const res = await this.controller.generateAiReport({ startDate, endDate, forceRefresh }, callbacks);
      return res;
    } catch (error) {
      console.error('Error generating AI report:', error);
      return {
        thought: '',
        output: error.message || '生成 AI 分析报告失败'
      };
    }
  }
}

export const analyseApi = new AnalyseApi();