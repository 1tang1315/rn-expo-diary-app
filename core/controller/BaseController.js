/**
 * 基础控制器类，提供通用的请求处理逻辑
 */
import { baseCreateSchema, baseUpdateSchema, idParamSchema } from '@/core/schemas';
import { validateParams } from '@/core/utils';
import { Response } from '@/core/response';

export class BaseController {
  constructor(service) {
    this.service = service;
  }

  /**
   * 根据ID获取记录
   * @param {number} id - 记录ID
   * @returns {Promise<Object>} 统一格式的响应
   */
  async getById(id) {
    try {
      // 验证参数
      const validationResult = validateParams({ id }, idParamSchema);
      if (!validationResult.isValid) {
        return Response.error(400, validationResult.errors.join('; '));
      }
      const data = await this.service.getById(id);
      return Response.success(data, '获取成功');
    } catch (error) {
      console.error('获取记录失败:', error);
      return Response.error(500, '获取记录失败');
    }
  }

  /**
   * 获取所有记录
   * @returns {Promise<Object>} 统一格式的响应
   */
  async getAll() {
    try {
      const data = await this.service.getAll();
      return Response.success(data, '获取成功');
    } catch (error) {
      console.error('获取记录列表失败:', error);
      return Response.error(500, '获取记录列表失败');
    }
  }

  /**
   * 创建记录
   * @param {Object} data - 记录数据
   * @returns {Promise<Object>} 统一格式的响应
   */
  async create(data) {
    try {
      // 验证参数
      const validationResult = validateParams(data, baseCreateSchema);
      if (!validationResult.isValid) {
        return Response.error(400, validationResult.errors.join('; '));
      }
      const id = await this.service.create(data);
      const newData = await this.service.getById(id);
      return Response.success(newData, '创建成功');
    } catch (error) {
      console.error('创建记录失败:', error);
      return Response.error(500, '创建记录失败');
    }
  }

  /**
   * 更新记录
   * @param {number} id - 记录ID
   * @param {Object} data - 记录数据
   * @returns {Promise<Object>} 统一格式的响应
   */
  async update(id, data) {
    try {
      // 验证ID参数
      const idValidationResult = validateParams({ id }, idParamSchema);
      if (!idValidationResult.isValid) {
        return Response.error(400, idValidationResult.errors.join('; '));
      }
      // 验证数据参数
      const dataValidationResult = validateParams(data, baseUpdateSchema);
      if (!dataValidationResult.isValid) {
        return Response.error(400, dataValidationResult.errors.join('; '));
      }
      const success = await this.service.update(id, data);
      return Response.success({ success }, success ? '更新成功' : '更新失败');
    } catch (error) {
      console.error('更新记录失败:', error);
      return Response.error(500, '更新记录失败');
    }
  }

  /**
   * 删除记录
   * @param {number} id - 记录ID
   * @returns {Promise<Object>} 统一格式的响应
   */
  async delete(id) {
    try {
      // 验证参数
      const validationResult = validateParams({ id }, idParamSchema);
      if (!validationResult.isValid) {
        return Response.error(400, validationResult.errors.join('; '));
      }
      const success = await this.service.delete(id);
      return Response.success({ success }, success ? '删除成功' : '删除失败');
    } catch (error) {
      console.error('删除记录失败:', error);
      return Response.error(500, '删除记录失败');
    }
  }
}
