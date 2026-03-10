import { NoteController } from '@/core/controller';
import { handleResponse } from '@/utils/requestUtils';
import { BaseApi } from './BaseApi';

/**
 * 笔记 API 类，封装笔记控制器的方法
 */
class NoteApi extends BaseApi {
  constructor() {
    super(new NoteController());
  }

  /**
   * 根据文件夹 ID 获取笔记列表
   * @param {number|null} folderId - 文件夹 ID，null 表示获取未分类笔记
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 笔记列表
   */
  async getByFolderId(folderId, options = {}) {
    return await handleResponse(await this.controller.getByFolderId(folderId), options);
  }

  /**
   * 批量删除笔记
   * @param {number[]} noteIds - 笔记 ID 数组
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 删除结果
   */
  async deleteBatch(noteIds, options = {}) {
    return await handleResponse(await this.controller.deleteBatch(noteIds), options);
  }

  /**
   * 搜索笔记
   * @param {string} query - 搜索关键词
   * @param {number|null} folderId - 可选，指定文件夹 ID
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 搜索结果
   */
  async searchNotes(query, folderId = null, options = {}) {
    return await handleResponse(await this.controller.searchNotes(query, folderId), options);
  }

  /**
   * 检查日记是否存在
   * @param {string} dateStr - 日期字符串
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 检查结果
   */
  async checkDiaryExists(dateStr, options = {}) {
    return await handleResponse(await this.controller.checkDiaryExists(dateStr), options);
  }
}

export const noteApi = new NoteApi();
