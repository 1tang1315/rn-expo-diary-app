import { handleResponse } from '@/utils/requestUtils';

/**
 * 基础 API 类，封装基础控制器的方法
 */
export class BaseApi {
  constructor(controller) {
    this.controller = controller;
  }

  /**
   * 根据ID获取记录
   * @param {number} id - 记录ID
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 记录数据
   */
  async getById(id, options = {}) {
    return await handleResponse(this.controller.getById(id), options);
  }

  /**
   * 获取所有记录
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 记录列表
   */
  async getAll(options = {}) {
    return await handleResponse(this.controller.getAll(), options);
  }

  /**
   * 创建记录
   * @param {Object} data - 记录数据
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 创建的记录
   */
  async create(data, options = {}) {
    return await handleResponse(await this.controller.create(data), options);
  }

  /**
   * 更新记录
   * @param {number} id - 记录ID
   * @param {Object} data - 记录数据
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 更新结果
   */
  async update(id, data, options = {}) {
    return await handleResponse(await this.controller.update(id, data), options);
  }

  /**
   * 删除记录
   * @param {number} id - 记录ID
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 删除结果
   */
  async delete(id, options = {}) {
    return await handleResponse(await this.controller.delete(id), options);
  }
}