import { EventController } from '@/core/controller';
import { formatDate } from "@/utils/formatTimeUtils";
import { handleResponse } from '@/utils/requestUtils';
import { BaseApi } from './BaseApi';

/**
 * 事件 API 类，封装事件控制器的方法
 */
class EventApi extends BaseApi {
  constructor() {
    super(new EventController());
  }

  /**
   * 根据日期范围和分类获取事件
   * @param {Object|string|Date|Object} params
   * @returns {Promise<any>} 事件列表
   */
  async getByDateRangeAndCategory(params = {}) {
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
          sortOrder: params.sortOrder
        };
      }
    }
    
    return await handleResponse(await this.controller.getByDateRangeAndCategory(processedParams));
  }
  
  /**
   * 获取常用标题
   * @param {string} category - 事件分类
   * @param {number} limit - 最多返回数量
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 常用标题数组
   */
  async getCommonTitles(category, limit = 5, options = {}) {
    return await handleResponse(await this.controller.getCommonTitles(category, limit), options);
  }

  /**
   * 更新事件状态
   * @param {number} id - 事件ID
   * @param {string} status - 新状态
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 更新结果
   */
  async updateStatus(id, status, options = {}) {
    return await handleResponse(await this.controller.updateStatus(id, status), options);
  }

  /**
   * 搜索事件
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 搜索结果
   */
  async searchEvents(keyword, options = {}) {
    return handleResponse(this.controller.searchEvents(keyword), options);
  }

  /**
   * 获取事件统计数据
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 统计数据
   */
  async getTotalStats(options = {}) {
    return await handleResponse(await this.controller.getTotalStats(), options);
  }
}

export const eventApi = new EventApi();