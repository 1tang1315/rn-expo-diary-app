/**
 * 消息 API
 */
import { BaseApi } from './BaseApi';
import { MessageController } from '@/core/controller/MessageController';
import { handleResponse } from '@/utils/requestUtils';

export class MessageApi extends BaseApi {
  constructor() {
    super(new MessageController());
  }

  /**
   * 获取特定对话的所有消息
   * @param {number} conversationId - 对话ID
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 消息列表
   */
  async getByConversationId(conversationId, options = {}) {
    return await handleResponse(await this.controller.getByConversationId(conversationId), options);
  }

  /**
   * 清空对话中的所有消息
   * @param {number} conversationId - 对话ID
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 清空结果
   */
  async clearByConversationId(conversationId, options = {}) {
    return await handleResponse(await this.controller.clearByConversationId(conversationId), options);
  }
}

export const messageApi = new MessageApi();
