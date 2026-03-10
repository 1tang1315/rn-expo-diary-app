/**
 * 消息服务层
 */
import { getDB } from '@/core/db';
import { MessageMapper } from '@/core/mapper/MessageMapper';
import { camelToSnakeObject, getLocalDateTimeByDayjs, snakeToCamelObject } from '@/core/utils';
import { BaseService } from './BaseService';

export class MessageService extends BaseService {
  constructor() {
    super(new MessageMapper());
  }

  /**
   * 创建消息并更新对话的更新时间
   * @param {Object} data - 消息数据
   * @returns {Promise<number>} 新创建的消息ID
   */
  async create(data) {
    const db = await getDB();
    const now = getLocalDateTimeByDayjs();

    return await db.withTransactionAsync(async () => {
      // 设置时间
      data.updatedAt = now;
      data.createdAt = now;

      // 转换为下划线命名
      const po = camelToSnakeObject(data);

      // 过滤字段
      const filteredPo = this.filterPOFields(po);

      // 插入消息
      const messageId = await this.mapper.create(filteredPo);

      // 更新对话的更新时间
      await db.runAsync(
        `UPDATE conversations SET updated_at = ? WHERE id = ?`,
        [now, data.conversationId]
      );

      return messageId;
    });
  }

  /**
   * 获取特定对话的所有消息
   * @param {number} conversationId - 对话ID
   * @returns {Promise<Array>} 消息列表
   */
  async getByConversationId(conversationId) {
    const pos = await this.mapper.getByConversationId(conversationId);
    return pos.map(po => snakeToCamelObject(po));
  }

  /**
   * 删除消息（使用软删除）
   * @param {number} id - 消息ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
    const message = await this.getById(id);
    if (!message) return false;

    const db = await getDB();
    const now = getLocalDateTimeByDayjs();

    return await db.withTransactionAsync(async () => {
      const success = await super.delete(id);
      if (success) {
        // 更新对话的更新时间
        await db.runAsync(
          `UPDATE conversations SET updated_at = ? WHERE id = ?`,
          [now, message.conversationId]
        );
      }
      return success;
    });
  }

  /**
   * 清空对话中的所有消息（使用软删除）
   * @param {number} conversationId - 对话ID
   * @returns {Promise<boolean>} 是否清空成功
   */
  async clearByConversationId(conversationId) {
    const db = await getDB();
    const now = getLocalDateTimeByDayjs();

    return await db.withTransactionAsync(async () => {
      const success = await this.mapper.softDeleteByConversationId(conversationId);
      if (success) {
        // 更新对话的更新时间
        await db.runAsync(
          `UPDATE conversations SET updated_at = ? WHERE id = ?`,
          [now, conversationId]
        );
      }
      return success;
    });
  }
}
