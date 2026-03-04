/**
 * 基础服务类，提供通用的业务逻辑处理
 */
import { camelToSnakeObject, getLocalDateTimeByDayjs, snakeToCamelObject } from '@/core/utils';

export class BaseService {
  constructor(mapper) {
    this.mapper = mapper;
  }

  /**
   * 根据ID获取记录
   * @param {number} id - 记录ID
   * @returns {Promise<Object|null>} 转换后的对象或null
   */
  async getById(id) {
    const po = await this.mapper.getById(id);
    return po ? snakeToCamelObject(po) : null;
  }

  /**
   * 获取所有记录
   * @returns {Promise<Array>} 转换后的对象数组
   */
  async getAll() {
    const pos = await this.mapper.getAll();
    return pos.map(po => snakeToCamelObject(po));
  }

  /**
   * 创建记录
   * @param {Object} data - 前端请求数据
   * @returns {Promise<number>} 新创建的记录ID
   */
  async create(data) {
    // 数据处理：设置时间
    const now = getLocalDateTimeByDayjs();
    data.updatedAt = now;
    data.createdAt = now;

    // 转换为下划线命名
    const po = camelToSnakeObject(data);

    // 数据处理：过滤字段
    const filteredPo = this.filterPOFields(po);
    return this.mapper.create(filteredPo);
  }

  /**
   * 更新记录
   * @param {number} id - 记录ID
   * @param {Object} data - 前端请求数据
   * @returns {Promise<boolean>} 是否更新成功
   */
  async update(id, data) {
    // 数据处理：设置更新时间
    const now = getLocalDateTimeByDayjs();
    data.updatedAt = now;

    // 转换为下划线命名
    const po = camelToSnakeObject(data);

    // 数据处理：过滤字段
    const filteredPo = this.filterPOFields(po);
    return await this.mapper.update(id, filteredPo);
  }

  /**
   * 删除记录
   * @param {number} id - 记录ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
    // 数据处理：设置删除时间
    const now = getLocalDateTimeByDayjs();
    const data = { deletedAt: now };

    // 转换为下划线命名
    const po = camelToSnakeObject(data);

    return await this.mapper.delete(id, po);
  }

  /**
   * 过滤PO字段
   * @param {Object} po - PO对象
   * @returns {Object} 过滤后的PO对象
   */
  filterPOFields(po) {
    const filtered = {};
    Object.keys(po).forEach(key => {
      if (key !== 'id' && po[key] !== null) {
        filtered[key] = po[key];
      }
    });
    return filtered;
  }
}