/**
 * 储物服务类，处理储物相关的业务逻辑
 */
import { StorageMapper } from '@/core/mapper';
import { BaseService } from '@/core/service';
import { snakeToCamelObject } from '@/core/utils';
import { deleteLocalImage } from '@/db/imageDB';

export class StorageService extends BaseService {
  constructor() {
    super(new StorageMapper());
  }

  /**
   * 根据日期范围获取储物项
   * @param {string} startDate - 开始日期，格式：YYYY-MM-DD
   * @param {string} endDate - 结束日期，格式：YYYY-MM-DD
   * @param {string} sortOrder - 排序方向，'asc' 或 'desc'
   * @returns {Promise<Array>} 转换后的对象数组
   */
  async getByDateRange(startDate, endDate, sortOrder = 'asc') {
    const results = await this.mapper.getByDateRange(startDate, endDate ?? startDate, sortOrder);
    return results.map(result => snakeToCamelObject(result));
  }

  /**
   * 按关键词搜索储物项
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Array>} 转换后的对象数组
   */
  async searchByKeyword(keyword) {
    const searchTerm = `%${keyword}%`;
    const results = await this.mapper.searchByKeyword(keyword, searchTerm);
    return results.map(result => snakeToCamelObject(result));
  }

  /**
   * 获取所有储物项（支持排序）
   * @param {string} sortField - 排序字段
   * @param {string} sortOrder - 排序方向
   * @returns {Promise<Array>} 转换后的对象数组
   */
  async getAllWithSort(sortField = 'name', sortOrder = 'asc') {
    const results = await this.mapper.getAllWithSort(sortField, sortOrder);
    return results.map(result => snakeToCamelObject(result));
  }

  /**
   * 删除储物项（重写父类方法，添加图片删除逻辑）
   * @param {number} id - 储物项 ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
    // 先获取储物项信息，检查是否有图片
    const storageItem = await this.getById(id);
    const imagePath = storageItem?.image;

    // 调用父类方法进行软删除
    const result = await super.delete(id);

    // 如果删除成功且存在图片路径，删除本地图片
    if (result && imagePath) {
      await deleteLocalImage(imagePath);
    }

    return result;
  }
}
