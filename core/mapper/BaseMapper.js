/**
 * 基础仓库类，提供通用的CRUD操作
 */
import { getDB } from '@/core/db';

export class BaseMapper {
  constructor(tableName) {
    this.tableName = tableName;
  }

  /**
   * 获取数据库连接
   * @returns {Promise<Object>} 数据库连接
   */
  async getDB() {
    return await getDB();
  }

  /**
   * 根据ID获取记录
   * @param {number} id - 记录ID
   * @returns {Promise<Object|null>} 数据库查询结果或null
   */
  async getById(id) {
    const db = await this.getDB();
    return await db.getFirstAsync(
      `SELECT * FROM ${this.tableName} WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
  }

  /**
   * 获取所有记录
   * @returns {Promise<Array>} 数据库查询结果数组
   */
  async getAll() {
    const db = await this.getDB();
    return await db.getAllAsync(
      `SELECT * FROM ${this.tableName} WHERE deleted_at IS NULL`
    );
  }

  /**
   * 创建记录
   * @param {Object} data - 要插入的数据对象
   * @returns {Promise<number>} 新创建的记录ID
   */
  async create(data) {
    const db = await this.getDB();
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(',');
    const values = fields.map(key => data[key]);

    const result = await db.runAsync(
      `INSERT INTO ${this.tableName} (${fields.join(',')}) VALUES (${placeholders})`,
      values
    );
    return result.lastInsertRowId;
  }

  /**
   * 更新记录
   * @param {number} id - 记录ID
   * @param {Object} data - 要更新的数据对象
   * @returns {Promise<boolean>} 是否更新成功
   */
  async update(id, data) {
    const db = await this.getDB();
    const fields = Object.keys(data);
    const setClause = fields.map(field => `${field} = ?`).join(',');
    const values = fields.map(key => data[key]);
    values.push(id);

    const result = await db.runAsync(
      `UPDATE ${this.tableName} SET ${setClause} WHERE id = ? AND deleted_at IS NULL`,
      values
    );
    return result.changes > 0;
  }

  /**
   * 软删除记录
   * @param {number} id - 记录ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
    const db = await this.getDB();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `UPDATE ${this.tableName} SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
      [now, now, id]
    );
    return result.changes > 0;
  }
}