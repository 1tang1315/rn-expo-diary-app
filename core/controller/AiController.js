/**
 * AI日记控制器
 */
import { Response } from '@/core/response';

export class AiController {
  constructor(aiDiaryService) {
    this.service = aiDiaryService;
  }

  /**
   * 生成日记内容
   * @param {string} prompt - 提示词
   * @param {object} callbacks - 回调函数
   * @returns {Promise<Object>} 统一格式的响应
   */
  async generateContent(prompt, callbacks) {
    try {
      const data = await this.service.generateContent(prompt, callbacks);
      return Response.success(data, '生成成功');
    } catch (error) {
      console.error('生成内容失败:', error);
      return Response.error(500, this.service.handleApiError(error));
    }
  }

  /**
   * 生成对话标题
   * @param {string} userFirstMsg - 用户第一条消息
   * @returns {Promise<Object>} 统一格式的响应
   */
  async updateConversationTitle(userFirstMsg) {
    try {
      const title = await this.service.updateConversationTitle(userFirstMsg);
      return Response.success({ title }, '生成标题成功');
    } catch (error) {
      console.error('生成标题失败:', error);
      return Response.error(500, this.service.handleApiError(error));
    }
  }

  /**
   * 获取模型列表
   * @returns {Promise<Object>} 统一格式的响应
   */
  async getModels() {
    try {
      const models = await this.service.getModels();
      return Response.success(models, '获取模型列表成功');
    } catch (error) {
      console.error('获取模型列表失败:', error);
      return Response.error(500, '获取模型列表失败');
    }
  }

  /**
   * 暂停AI请求
   * @returns {Promise<Object>} 统一格式的响应
   */
  pauseRequest() {
    try {
      this.service.pauseRequest();
      return Response.success({}, '暂停成功');
    } catch (error) {
      console.error('暂停请求失败:', error);
      return Response.error(500, '暂停请求失败');
    }
  }

  /**
   * 恢复AI请求
   * @param {object} callbacks - 回调函数
   * @returns {Promise<Object>} 统一格式的响应
   */
  async resumeRequest(callbacks) {
    try {
      const data = await this.service.resumeRequest(callbacks);
      return Response.success(data, '恢复成功');
    } catch (error) {
      console.error('恢复请求失败:', error);
      return Response.error(500, '恢复请求失败');
    }
  }
}
