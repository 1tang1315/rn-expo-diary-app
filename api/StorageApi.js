import { StorageController } from '@/core/controller';
import { formatDate } from "@/utils/formatTimeUtils";
import { handleResponse } from '@/utils/requestUtils';
import { BaseApi } from './BaseApi';

/**
 * 储物 API 类，封装储物控制器的方法
 */
class StorageApi extends BaseApi {
  constructor() {
    super(new StorageController());
  }

  /**
   * 根据日期范围获取储物项
   * @param {Object|string|Date} params - 日期范围参数
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 储物项列表
   */
  async getByDateRange(params = {}, options = {}) {
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
      processedParams = {
        startDate: formatDate(params.startDate),
        endDate: formatDate(params.endDate),
        sortOrder: params.sortOrder
      };
    }
    
    return await handleResponse(await this.controller.getByDateRange(processedParams), options);
  }

  /**
   * 获取所有储物项（支持排序）
   * @param {Object} params - 排序参数
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 储物项列表
   */
  async getAllWithSort(params = {}, options = {}) {
    return await handleResponse(await this.controller.getAllWithSort(params), options);
  }

  /**
   * 搜索储物项
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 搜索结果
   */
  async searchStorage(keyword, options = {}) {
    return await handleResponse(await this.controller.searchStorage(keyword), options);
  }
}

export const storageApi = new StorageApi();
