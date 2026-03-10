/**
 * 笔记控制器类，处理笔记相关的请求
 */
import { NoteService } from '@/core/service';
import { BaseController } from '@/core/controller';
import { Response } from '@/core/response';
import { validateParams } from '@/core/utils';
import { idParamSchema } from '@/core/schemas';
import { parseInt } from "lodash/string";

export class NoteController extends BaseController {
  constructor() {
    super(new NoteService());
  }

  /**
   * 根据文件夹 ID 获取笔记列表
   * @param {number|null} folderId - 文件夹 ID
   * @returns {Promise<Object>} 统一格式的响应
   */
  async getByFolderId(folderId) {
    try {
      const data = await this.service.getByFolderId(folderId);
      return Response.success(data, '获取成功');
    } catch (error) {
      console.error('获取笔记列表失败:', error);
      return Response.error(500, '获取笔记列表失败');
    }
  }

  /**
   * 批量删除笔记
   * @param {number[]} noteIds - 笔记 ID 数组
   * @returns {Promise<Object>} 统一格式的响应
   */
  async deleteBatch(noteIds) {
    try {
      if (!noteIds || noteIds.length === 0) {
        return Response.error(400, '请选择要删除的笔记');
      }
      const success = await this.service.deleteBatch(noteIds);
      return Response.success({ success }, success ? '删除成功' : '删除失败');
    } catch (error) {
      console.error('批量删除笔记失败:', error);
      return Response.error(500, '批量删除笔记失败');
    }
  }

  /**
   * 搜索笔记
   * @param {string} query - 搜索关键词
   * @param {number|null} folderId - 可选，指定文件夹 ID
   * @returns {Promise<Object>} 统一格式的响应
   */
  async searchNotes(query, folderId = null) {
    try {
      if (!query || !query.trim()) {
        return Response.error(400, '搜索关键词不能为空');
      }
      const data = await this.service.search(query.trim(), folderId);
      return Response.success(data, '搜索成功');
    } catch (error) {
      console.error('搜索笔记失败:', error);
      return Response.error(500, '搜索笔记失败');
    }
  }

  /**
   * 检查日记是否存在
   * @param {string} dateStr - 日期字符串
   * @returns {Promise<Object>} 统一格式的响应
   */
  async checkDiaryExists(dateStr) {
    try {
      const exists = await this.service.checkDiaryExists(dateStr);
      return Response.success({ exists }, '查询成功');
    } catch (error) {
      console.error('检查日记存在失败:', error);
      return Response.error(500, '检查日记存在失败');
    }
  }

  /**
   * 创建笔记
   * @param {Object} data - 笔记数据
   * @returns {Promise<Object>} 统一格式的响应
   */
  async create(data) {
    try {
      const id = await this.service.createWithFolderValidation(data);
      const newData = await this.service.getById(id);
      return Response.success(newData, '创建成功');
    } catch (error) {
      console.error('创建笔记失败:', error);
      return Response.error(500, error.message || '创建笔记失败');
    }
  }

  /**
   * 更新笔记
   * @param {number|string} id - 笔记 ID
   * @param {Object} data - 笔记数据
   * @returns {Promise<Object>} 统一格式的响应
   */
  async update(id, data) {
    try {
      // 转换ID为数字类型
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      const idValidationResult = validateParams({ id: numericId }, idParamSchema);
      if (!idValidationResult.isValid) {
        return Response.error(400, idValidationResult.errors.join('; '));
      }
      const success = await this.service.updateWithFolderValidation(numericId, data);
      return Response.success({ success }, success ? '更新成功' : '更新失败');
    } catch (error) {
      console.error('更新笔记失败:', error);
      return Response.error(500, error.message || '更新笔记失败');
    }
  }
}
