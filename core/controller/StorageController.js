import { storageSearchSchema, storageDateRangeSchema, storageSortSchema } from '@/core/schemas';
import { validateParams } from '@/core/utils';
import { Response } from '@/core/response';
import { StorageService } from '@/core/service';
import { BaseController } from '@/core/controller';

export class StorageController extends BaseController {
  constructor() {
    super(new StorageService());
  }

  /**
   * 根据日期范围获取储物项
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 统一格式的响应
   */
  async getByDateRange(params = {}) {
    try {
      const validationResult = validateParams(params, storageDateRangeSchema);
      if (!validationResult.isValid) {
        return Response.error(400, validationResult.errors.join('; '));
      }

      const { startDate, endDate, sortOrder } = params;

      let data;
      if (!startDate) {
        data = await this.service.getAll();
      } else {
        data = await this.service.getByDateRange(startDate, endDate, sortOrder);
      }

      return Response.success(data, '获取成功');
    } catch (error) {
      console.error('获取储物项失败:', error);
      return Response.error(500, '获取储物项失败');
    }
  }

  /**
   * 搜索储物项
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Object>} 统一格式的响应
   */
  async searchStorage(keyword) {
    const validationResult = validateParams({ keyword }, storageSearchSchema);
    if (!validationResult.isValid) {
      return Response.error(400, validationResult.errors.join('; '));
    }
    const result = await this.service.searchByKeyword(keyword);
    return Response.success(result, '搜索成功');
  }

  /**
   * 获取所有储物项（支持排序）
   * @param {Object} params - 排序参数
   * @returns {Promise<Object>} 统一格式的响应
   */
  async getAllWithSort(params = {}) {
    try {
      const validationResult = validateParams(params, storageSortSchema);
      if (!validationResult.isValid) {
        return Response.error(400, validationResult.errors.join('; '));
      }

      const { sortField, sortOrder } = params;
      const data = await this.service.getAllWithSort(sortField, sortOrder);
      return Response.success(data, '获取成功');
    } catch (error) {
      console.error('获取储物项列表失败:', error);
      return Response.error(500, '获取储物项列表失败');
    }
  }
}
