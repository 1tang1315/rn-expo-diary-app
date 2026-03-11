/**
 * AI日记 API
 */
import { AiController } from '@/core/controller/AiController';
import { AiService } from '@/core/service/AiService';
import { handleResponse } from '@/utils/requestUtils';
import { BaseApi } from './BaseApi';
import Promise from "lodash/_Promise";

export class AiApi extends BaseApi {
  constructor(apiKey, model, apiBaseUrl) {
    if (apiKey) {
      const aiDiaryService = new AiService(apiKey, model, apiBaseUrl);
      super(new AiController(aiDiaryService));
    } else {
      // 不初始化服务，避免缺少凭据错误
      super(null);
    }
  }

  /**
   * 生成日记内容
   * @param {string} prompt - 提示词
   * @param {object} callbacks - 回调函数
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 生成结果
   */
  async generateContent(prompt, callbacks, options = {}) {
    if (!this.controller) {
      return await handleResponse(Promise.resolve({ success: false, message: 'AI服务未初始化，请先配置API密钥' }), options);
    }
    return await handleResponse(await this.controller.generateContent(prompt, callbacks), options);
  }

  /**
   * 生成对话标题
   * @param {string} userFirstMsg - 用户第一条消息
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 生成的标题
   */
  async updateConversationTitle(userFirstMsg, options = {}) {
    if (!this.controller) {
      return await handleResponse(Promise.resolve({ success: false, message: 'AI服务未初始化，请先配置API密钥' }), options);
    }
    return await handleResponse(await this.controller.updateConversationTitle(userFirstMsg), options);
  }

  /**
   * 获取模型列表
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 模型列表
   */
  async getModels(options = {}) {
    if (!this.controller) {
      return await handleResponse(Promise.resolve({ success: false, message: 'AI服务未初始化，请先配置API密钥' }), options);
    }
    return await handleResponse(await this.controller.getModels(), options);
  }

  /**
   * 暂停AI请求
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 暂停结果
   */
  async pauseRequest(options = {}) {
    if(!this.controller) {
      return await handleResponse(Promise.resolve({
        success: false,
        message: 'AI服务未初始化，请先配置API密钥'
      }), options);
    }
    return await handleResponse(this.controller.pauseRequest(), options);
  }

  /**
   * 恢复AI请求
   * @param {object} callbacks - 回调函数
   * @param {Object} options - 配置选项
   * @returns {Promise<any>} 恢复结果
   */
  async resumeRequest(callbacks, options = {}) {
    if (!this.controller) {
      return await handleResponse(Promise.resolve({ success: false, message: 'AI服务未初始化，请先配置API密钥' }), options);
    }
    return await handleResponse(await this.controller.resumeRequest(callbacks), options);
  }
}

// 默认导出（可根据需要传入配置）
export const aiDiaryApi = new AiApi();
export const aiApi = new AiApi();
