/**
 * 笔记服务类，处理笔记相关的业务逻辑
 */
import { NoteMapper } from '@/core/mapper';
import { BaseService } from '@/core/service';
import { snakeToCamelObject } from '@/core/utils';

export class NoteService extends BaseService {
  constructor() {
    super(new NoteMapper());
  }

  /**
   * 根据文件夹 ID 获取笔记列表
   * @param {number|null} folderId - 文件夹 ID，null 表示获取未分类笔记
   * @returns {Promise<Array>} 转换后的笔记列表
   */
  async getByFolderId(folderId) {
    const results = await this.mapper.getByFolderId(folderId);
    return results.map(result => snakeToCamelObject(result));
  }

  /**
   * 批量删除笔记
   * @param {number[]} noteIds - 笔记 ID 数组
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteBatch(noteIds) {
    return await this.mapper.deleteBatch(noteIds);
  }

  /**
   * 搜索笔记
   * @param {string} query - 搜索关键词
   * @param {number|null} folderId - 可选，指定文件夹 ID 进行搜索
   * @returns {Promise<Array>} 匹配的笔记列表
   */
  async search(query, folderId = null) {
    const results = await this.mapper.search(query, folderId);
    return results.map(result => snakeToCamelObject(result));
  }

  /**
   * 检查指定日期的日记是否存在
   * @param {string} dateStr - 日期字符串
   * @returns {Promise<boolean>} 是否存在
   */
  async checkDiaryExists(dateStr) {
    return await this.mapper.checkDiaryExists(dateStr);
  }

  /**
   * 创建笔记（带文件夹验证）
   * @param {Object} data - 笔记数据
   * @returns {Promise<number>} 新创建的笔记 ID
   */
  async createWithFolderValidation(data) {
    if (data.folderId) {
      const folderExists = await this.mapper.folderExists(data.folderId);
      if (!folderExists) {
        throw new Error(`指定的文件夹 (ID: ${data.folderId}) 不存在`);
      }
    }
    return await this.create(data);
  }

  /**
   * 更新笔记（带文件夹验证）
   * @param {number} id - 笔记 ID
   * @param {Object} data - 笔记数据
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateWithFolderValidation(id, data) {
    if (data.folderId) {
      const folderExists = await this.mapper.folderExists(data.folderId);
      if (!folderExists) {
        throw new Error(`指定的文件夹 (ID: ${data.folderId}) 不存在`);
      }
    }
    return await this.update(id, data);
  }
}
