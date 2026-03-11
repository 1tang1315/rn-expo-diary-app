import { StatisticsController } from '@/core/controller';
import { formatDate } from "@/utils/formatTimeUtils";
import { handleResponse } from '@/utils/requestUtils';
import { BaseApi } from './BaseApi';

/**
 * 统计 API 类，封装统计控制器的方法
 */
class StatisticsApi extends BaseApi {
  constructor() {
    super(new StatisticsController());
  }

  /**
   * 获取统计数据
   * @param {Object|string|Date|Object} params
   * @returns {Promise<any>} 统计数据
   */
  async getStatistics(params = {}) {
    // 处理前端可能直接传入日期的情况
    let processedParams = {};
    if (typeof params === 'string') {
      processedParams = {
        startDate: formatDate(params)
      };
    } else if (params instanceof Date) {
      processedParams = {
        startDate: formatDate(params)
      };
    } else if (typeof params === 'object' && params !== null) {
      // 检查是否是 Moment.js 对象（通过检查是否有 toISOString 方法）
      if (params.toISOString) {
        processedParams = {
          startDate: formatDate(params)
        };
      } else {
        processedParams = {
          startDate: formatDate(params.startDate),
          endDate: formatDate(params.endDate),
          category: params.category || 'all'
        };
      }
    }
    
    return await handleResponse(await this.controller.getStatistics(processedParams));
  }

  /**
   * 获取统计数据，按视图类型处理
   * @param {Object} params - 查询参数
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 处理后的统计数据
   */
  async getStatsData(params = {}, options = {}) {
    // 处理前端可能直接传入日期的情况
    let processedParams = {};
    if (typeof params === 'string') {
      processedParams = {
        startDate: formatDate(params)
      };
    } else if (params instanceof Date) {
      processedParams = {
        startDate: formatDate(params)
      };
    } else if (typeof params === 'object' && params !== null) {
      // 检查是否是 Moment.js 对象（通过检查是否有 toISOString 方法）
      if (params.toISOString) {
        processedParams = {
          startDate: formatDate(params)
        };
      } else {
        processedParams = {
          startDate: formatDate(params.startDate),
          endDate: formatDate(params.endDate),
          category: params.category || 'all',
          viewType: params.viewType || 'week'
        };
      }
    }
    
    return await handleResponse(await this.controller.getStatsData(processedParams), options);
  }
}

export const statisticsApi = new StatisticsApi();