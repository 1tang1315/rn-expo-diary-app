/**
 * 消息数据访问层
 */
import { BaseMapper } from './BaseMapper';

export class MessageMapper extends BaseMapper {
  constructor() {
    super('messages');
  }

  /**
   * 获取特定对话的所有消息，按创建时间升序排列
   * @param {number} conversationId - 对话ID
   * @returns {Promise<Array>} 消息列表
   */
  async getByConversationId(conversationId) {
    const db = await this.getDB();
    return await db.getAllAsync(
      `SELECT * FROM ${this.tableName} 
       WHERE conversation_id = ? AND deleted_at IS NULL 
       ORDER BY created_at ASC`,
      [conversationId]
    );
  }

  /**
   * 硬删除消息
   * @param {number} id - 消息ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async hardDelete(id) {
    const db = await this.getDB();
    const result = await db.runAsync(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return result.changes > 0;
  }

  /**
   * 硬删除对话中的所有消息
   * @param {number} conversationId - 对话ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async hardDeleteByConversationId(conversationId) {
    const db = await this.getDB();
    const result = await db.runAsync(
      `DELETE FROM ${this.tableName} WHERE conversation_id = ?`,
      [conversationId]
    );
    return result.changes > 0;
  }

  /**
   * 软删除对话中的所有消息
   * @param {number} conversationId - 对话ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async softDeleteByConversationId(conversationId) {
    const db = await this.getDB();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `UPDATE ${this.tableName} SET deleted_at = ?, updated_at = ? WHERE conversation_id = ? AND deleted_at IS NULL`,
      [now, now, conversationId]
    );
    return result.changes > 0;
  }
}
