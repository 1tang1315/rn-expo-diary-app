/**
 * 消息控制器
 */
import { BaseController } from './BaseController';
import { MessageService } from '@/core/service/MessageService';
import { Response } from '@/core/response';

export class MessageController extends BaseController {
  constructor() {
    super(new MessageService());
  }

  /**
   * 获取特定对话的所有消息
   * @param {number} conversationId - 对话ID
   * @returns {Promise<Object>} 统一格式的响应
   */
  async getByConversationId(conversationId) {
    try {
      const data = await this.service.getByConversationId(conversationId);
      return Response.success(data, '获取成功');
    } catch (error) {
      console.error('获取消息失败:', error);
      return Response.error(500, '获取消息失败');
    }
  }

  /**
   * 清空对话中的所有消息
   * @param {number} conversationId - 对话ID
   * @returns {Promise<Object>} 统一格式的响应
   */
  async clearByConversationId(conversationId) {
    try {
      const success = await this.service.clearByConversationId(conversationId);
      return Response.success({ success }, success ? '清空成功' : '清空失败');
    } catch (error) {
      console.error('清空消息失败:', error);
      return Response.error(500, '清空消息失败');
    }
  }
}
