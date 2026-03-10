/**
 * 对话数据访问层
 */
import { BaseMapper } from './BaseMapper';

export class ConversationMapper extends BaseMapper {
  constructor() {
    super('conversations');
  }

  /**
   * 获取所有对话，按更新时间降序排序
   * @returns {Promise<Array>} 对话列表
   */
  async getAll() {
    const db = await this.getDB();
    return await db.getAllAsync(
      `SELECT * FROM ${this.tableName} WHERE deleted_at IS NULL ORDER BY updated_at DESC`
    );
  }
}
