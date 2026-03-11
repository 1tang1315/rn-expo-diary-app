import { ScoreController } from '@/core/controller';
import { formatDate } from "@/core/utils";
import { handleResponse } from '@/utils/requestUtils';
import { BaseApi } from './BaseApi';

/**
 * 评分 API 类，封装评分控制器的方法
 */
class ScoreApi extends BaseApi {
  constructor() {
    super(new ScoreController());
  }

  /**
   * 获取评分数据
   * @param {Object} params - 查询参数
   * @param {Date} params.startDate - 开始日期
   * @param {Date} params.endDate - 结束日期
   * @returns {Promise<any>} 评分数据
   */
  async getScoreData(params = {}) {
    return this.getDashboard(params);
  }

  /**
   * 获取分析看板数据
   * @param {Object} params - 查询参数
   * @param {Date} params.startDate - 开始日期
   * @param {Date} params.endDate - 结束日期
   * @returns {Promise<any>} 看板数据
   */
  async getDashboard(params = {}) {
    const processedParams = {
      startDate: formatDate(params.startDate),
      endDate: formatDate(params.endDate)
    };

    return await handleResponse(await this.controller.getDashboard(processedParams));
  }

  /**
   * 获取评分详细数据
   * @param {Object} params - 查询参数
   * @param {string} params.type - 评分类型
   * @param {Date} params.startDate - 开始日期
   * @param {Date} params.endDate - 结束日期
   * @returns {Promise<any>} 评分详细数据
   */
  async getScoreDetailData(params = {}) {
    const processedParams = {
      type: params.type || 'sleep',
      startDate: formatDate(params.startDate),
      endDate: formatDate(params.endDate)
    };
    
    return await handleResponse(await this.controller.getScoreDetailData(processedParams));
  }

  /**
   * 获取评分趋势
   * @param {number} days - 天数
   * @returns {Promise<any>} 评分趋势数据
   */
  async getScoreTrend(days = 7) {
    return await handleResponse(await this.controller.getScoreTrend({ days }));
  }
}

export const scoreApi = new ScoreApi();