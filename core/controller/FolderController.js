/**
 * 文件夹控制器类，处理文件夹相关的请求
 */
import { BaseController } from '@/core/controller';
import { Response } from '@/core/response';
import { idParamSchema } from '@/core/schemas';
import { FolderService } from '@/core/service';
import { validateParams } from '@/core/utils';
import { parseInt } from "lodash/string";

export class FolderController extends BaseController {
  constructor() {
    super(new FolderService());
  }

  /**
   * 创建文件夹
   * @param {Object} data - 文件夹数据
   * @returns {Promise<Object>} 统一格式的响应
   */
  async create(data) {
    try {
      if (!data || !data.name) {
        return Response.error(400, '文件夹名称不能为空');
      }

      const id = await this.service.create(data);
      const newData = await this.service.getById(id);
      return Response.success(newData, '创建成功');
    } catch (error) {
      console.error('创建文件夹失败:', error);
      return Response.error(500, error.message || '创建文件夹失败');
    }
  }

  /**
   * 更新文件夹
   * @param {number|string} id - 文件夹ID
   * @param {Object} data - 文件夹数据
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

      if (!data || !data.name) {
        return Response.error(400, '文件夹名称不能为空');
      }

      const success = await this.service.update(numericId, data);
      return Response.success({ success }, success ? '更新成功' : '更新失败');
    } catch (error) {
      console.error('更新文件夹失败:', error);
      return Response.error(500, error.message || '更新文件夹失败');
    }
  }
}
