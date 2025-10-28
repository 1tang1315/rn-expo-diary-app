import OpenAI from 'openai';
import EventSource from "react-native-sse";

export default class AiDiaryService {
  constructor({ apiKey, model, apiBaseUrl } = {}) {
    this.API_KEY = apiKey;
    this.MODEL = model;
    this.API_BASE_URL = apiBaseUrl;
    
    this.openai = new OpenAI({
      apiKey: this.API_KEY,
      baseURL: this.API_BASE_URL,
      dangerouslyAllowBrowser: true,
    });
    
    this.sseInstance = null; // 保存当前SSE连接实例
    this.isPaused = false;   // 标记是否已暂停
    this.currentState = {    // 记录当前请求状态（用于后续恢复）
      fullThought: "",
      fullOutput: "",
      lastPrompt: ""
    };
  }
  
  /**
   * 处理 API 错误，返回用户友好的提示
   * @param {Error} error - 原始错误对象
   * @returns {string} 错误提示
   */
  handleApiError(error) {
    console.error('AI生成失败：', error);
    const msg = error.message || '';
    if (msg.includes('quota') || msg.includes('额度')) return '免费额度已用完，请更换API密钥';
    if (msg.includes('401')) return 'API密钥无效，请检查配置';
    if (msg.includes('network')) return '网络连接失败，请检查网络';
    if (msg.includes('model')) return '模型不存在或不支持，请更换模型';
    return '生成失败，请重试';
  }
  
  /**
   * 暂停AI请求
   * @returns {void}
   */
  pauseRequest() {
    // 避免重复暂停
    if (this.isPaused || !this.sseInstance) return;
    
    // 标记为已暂停
    this.isPaused = true;
    // 关闭当前SSE连接（中断流式推送）
    this.sseInstance.close();
    // 清空SSE实例引用
    this.sseInstance = null;
  }
  
  /**
   * 生成标准日记提示词
   * @param startDate
   * @param endDate
   * @param eventsText
   * @param prompt
   * @returns {string} 生成的提示词
   */
  generateDiaryPrompt(startDate, endDate, eventsText, prompt) {
    const date = endDate ? `${startDate}-${endDate}` : startDate;
    
    return `请根据事件数据和要求生成一篇中文个人日记：
* 日期：\`${date}\`
* 事件数据：\`${eventsText}\`
* 要求: \`${prompt}\`
`;
  }
  
  /**
   * 调用大模型生成内容
   * @param {string} prompt - 提示词
   * @param {object} callbacks - 回调函数
   * @returns {Promise<{ thought: string, output: string }>}
   */
  async generateContent(prompt, { onThought = () => {}, onOutput = () => {} } = {}) {
    // 重置暂停状态
    this.isPaused = false;
    this.currentState.fullThought = '';
    this.currentState.fullOutput = '';
    
    // 记录当前请求的prompt（用于恢复）
    this.currentState.lastPrompt = prompt;
    
    return new Promise((resolve, reject) => {
      // 创建SSE连接，并赋值给类属性（方便外部关闭）
      this.sseInstance = new EventSource(`${this.API_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.API_KEY}`,
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          stream: true,
        }),
      });
      
      // 处理SSE消息（流式数据）
      this.sseInstance.addEventListener("message", (event) => {
        // 若已暂停，直接忽略后续数据
        if (this.isPaused) return;
        
        if (event.data === "[DONE]") {
          this.sseInstance.close();
          this.sseInstance = null; // 清空实例
          resolve({
            thought: this.currentState.fullThought,
            output: this.currentState.fullOutput
          });
          return;
        }
        
        try {
          const json = JSON.parse(event.data);
          const delta = json.choices?.[0]?.delta;
          
          // 更新思考内容
          if (delta?.reasoning_content) {
            this.currentState.fullThought += delta.reasoning_content;
            onThought?.(this.currentState.fullThought);
          }
          
          // 更新输出内容
          if (delta?.content) {
            this.currentState.fullOutput += delta.content;
            onOutput?.(this.currentState.fullOutput);
          }
        } catch (err) {
          console.warn("解析流数据失败:", err, "原始数据:", event.data);
        }
      });
      
      // 处理SSE错误
      this.sseInstance.addEventListener("error", (event) => {
        // 若为“主动暂停关闭”，不触发reject（避免错误提示）
        if (this.isPaused) {
          this.sseInstance = null;
          return;
        }
        
        console.error("SSE连接出错:", event);
        this.sseInstance?.close();
        this.sseInstance = null;
        reject(new Error("生成内容时发生网络错误，请检查API连接。"));
      });
    });
  }
  
  /**
   * 根据用户首条消息和AI首条回复生成对话标题
   * @param {string} userFirstMsg - 用户第一条消息
   * @param {string} aiFirstReply - AI第一条回复
   * @returns {Promise<string>} 生成的标题
   */
  async updateConversationTitle(userFirstMsg, aiFirstReply) {
    try {
      const prompt = `
      请根据以下用户初始问题和AI首次回复，生成一个简洁准确的中文对话标题（8-20字）：
      用户初始问题：${userFirstMsg}
      AI首次回复：${aiFirstReply}
      要求：
      1. 包含核心关键词
      2. 不使用"聊天记录""对话内容"等模糊表述
      3. 若无明确主题，返回"日常交流"`;
      
      const response = await this.openai.chat.completions.create({
        model: this.MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 30,
        stream: false
      });
      
      return response.choices?.[0]?.message?.content?.trim() || "未命名对话";
    } catch (error) {
      console.error('生成标题失败：', error);
      return this.handleApiError(error) || "标题生成失败";
    }
  }
  
  /**
   * 恢复暂停的请求（基于当前状态续接）
   * @param {object} callbacks - 回调函数
   * @returns {Promise<{ thought: string, output: string }>}
   */
  async resumeRequest({ onThought, onOutput }) {
    // 若未暂停或无历史状态，直接返回
    if (!this.isPaused || !this.currentState.lastPrompt) {
      console.warn("无可用的暂停状态，无法恢复");
      return Promise.resolve({
        thought: this.currentState.fullThought,
        output: this.currentState.fullOutput
      });
    }
    
    // 基于历史prompt和已接收内容，重新发起请求（需服务端支持“续流”）
    // 注：服务端需支持根据“已生成内容”续接，否则会重新生成完整内容
    return this.generateContent(this.currentState.lastPrompt, {
      onThought: (newThought) => {
        // 回调中合并历史内容（若服务端重新生成，需去重）
        onThought?.(newThought);
      },
      onOutput: (newOutput) => {
        onOutput?.(newOutput);
      }
    });
  }
  
  /**
   * 获取硅基流动模型列表
   * @returns {Promise<Array>} 模型数组
   */
  async getModels() {
    try {
      const resp = await this.openai.request({ method: 'GET', path: '/models' });
      return resp.data || [];
    } catch (err) {
      console.error('获取模型失败:', err);
      return [];
    }
  }
}