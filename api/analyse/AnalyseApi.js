import { BaseApi } from "@/api/BaseApi";
import { AnalyseController, SleepController } from '@/core/controller';
import { SleepService } from '@/core/service/analyse/SleepService';
import { formatDate } from "@/core/utils";
import { handleResponse } from '@/utils/requestUtils';

/**
 * 分析 API
 */
class AnalyseApi extends BaseApi {
  constructor() {
    super(new AnalyseController());
    this.sleepController = new SleepController();
    this.sleepService = new SleepService();
  }

  /**
   * 获取评分数据（兼容旧方法，内部走 getDashboard）
   * @param {Object} params - 查询参数
   * @param {Date} params.startDate - 开始日期
   * @param {Date} params.endDate - 结束日期
   * @returns {Promise<any>} 评分数据
   */
  async getScoreData(params = {}) {
    return this.getDashboard(params);
  }

  /**
   * 获取分析看板数据
   * @param {Object} params - 查询参数
   * @param {Date} params.startDate - 开始日期
   * @param {Date} params.endDate - 结束日期
   * @returns {Promise<any>} 看板数据
   */
  async getDashboard(params = {}) {
    const startDate = params.startDate ? formatDate(params.startDate) : null;
    const endDate = params.endDate ? formatDate(params.endDate) : null;
    
    if (!startDate) {
      return {
        totalScore: 0,
        scores: {
          sleepScore: 0,
          dietScore: 0,
          sportScore: 0,
          productivityScore: 0,
          emotionScore: 0,
          balanceScore: 0
        },
        scoreChanges: {
          sleepChange: 0,
          dietChange: 0,
          sportChange: 0,
          productivityChange: 0,
          emotionChange: 0,
          balanceChange: 0
        },
        dimensions: {},
        aiAdvice: {
          summary: '暂无分析数据',
          suggestions: []
        }
      };
    }
    
    try {
      const res = await this.controller.getDashboard({ startDate, endDate });
      return await handleResponse(res);
    } catch (error) {
      console.error('Error getting dashboard:', error);
      return {
        totalScore: 0,
        scores: {
          sleepScore: 0,
          dietScore: 0,
          sportScore: 0,
          productivityScore: 0,
          emotionScore: 0,
          balanceScore: 0
        },
        scoreChanges: {
          sleepChange: 0,
          dietChange: 0,
          sportChange: 0,
          productivityChange: 0,
          emotionChange: 0,
          balanceChange: 0
        },
        dimensions: {},
        aiAdvice: {
          summary: '暂无分析数据',
          suggestions: []
        }
      };
    }
  }

  /**
   * 获取评分详细数据
   * @param {Object} params - 查询参数
   * @param {string} params.type - 评分类型
   * @param {Date} params.startDate - 开始日期
   * @param {Date} params.endDate - 结束日期
   * @returns {Promise<any>} 评分详细数据
   */
  async getScoreDetailData(params = {}) {
    const type = params.type || 'sleep';
    const startDate = params.startDate ? formatDate(params.startDate) : null;
    const endDate = params.endDate ? formatDate(params.endDate) : null;

    if (startDate) {
      try {
        return await handleResponse(
          await this.controller.getScoreDetail({ type, startDate, endDate })
        );
      } catch (error) {
        console.error('Error getting score detail:', error);
        // 如果接口调用失败，返回默认数据结构
        return {
          totalScore: 0,
          breakdown: [],
          events: [],
          aiAdvice: {
            summary: '暂无数据',
            suggestions: []
          }
        };
      }
    } else {
      // 如果没有日期参数，返回默认数据结构
      return {
        totalScore: 0,
        breakdown: [],
        events: [],
        aiAdvice: {
          summary: '暂无数据',
          suggestions: []
        }
      };
    }
  }

  /**
   * 通用：获取某一类型的总评分
   * @param {Object} params
   * @param {string} params.type - 评分类型（sleep / diet / exercise / ...）
   * @param {Date} params.startDate
   * @param {Object} params
   */
  async getScoreSummary(params = {}) {
    const type = params.type || 'sleep';
    const startDate = params.startDate ? formatDate(params.startDate) : null;
    const endDate = params.endDate ? formatDate(params.endDate) : null;

    if (!startDate) {
      return { totalScore: 0 };
    }

    try {
      if (type === 'sleep') {
        const res = await this.sleepController.getSleepScoreSummary({ startDate });
        return await handleResponse(res);
      }

      // 其他类型复用 getScoreDetail 的 totalScore
      const detail = await this.getScoreDetailData({ type, startDate, endDate });
      return { totalScore: detail?.totalScore ?? 0 };
    } catch (error) {
      console.error('Error getting score summary:', error);
      return { totalScore: 0 };
    }
  }

  /**
   * 通用：获取各维度概览
   * @param {Object} params
   * @param {string} params.type - 评分类型
   * @param {Date} params.startDate
   */
  async getBreakdown(params = {}) {
    const type = params.type || 'sleep';
    const startDate = params.startDate ? formatDate(params.startDate) : null;
    const endDate = params.endDate ? formatDate(params.endDate) : null;

    if (!startDate) {
      return { items: [] };
    }

    try {
      if (type === 'sleep') {
        const res = await this.sleepController.getSleepBreakdown({ startDate });
        return await handleResponse(res); // { items: [...] }
      }

      const detail = await this.getScoreDetailData({ type, startDate, endDate });
      return {
        items: detail?.breakdown ?? []
      };
    } catch (error) {
      console.error('Error getting breakdown:', error);
      return { items: [] };
    }
  }

  /**
   * 通用：获取单个维度的 Markdown 详情
   * @param {Object} params
   * @param {string} params.type - 评分类型
   * @param {Date} params.startDate
   * @param {string} params.key - 维度 key（sleep 下如 durationScore 等，其它类型可用 label 或自定义 key）
   */
  async getBreakdownDetail(params = {}) {
    const type = params.type || 'sleep';
    const startDate = params.startDate ? formatDate(params.startDate) : null;
    const { key } = params;

    if (!startDate || !key) {
      return { key: key || '', label: '', detailText: '' };
    }

    try {
      if (type === 'sleep') {
        const res = await this.sleepController.getSleepBreakdownDetail({ startDate, key });
        return await handleResponse(res);
      }

      // 其它类型：从综合明细中按 key/label 查找
      const detail = await this.getScoreDetailData({ type, startDate });
      const item = detail?.breakdown?.find(
        (d) => d.key === key || d.label === key
      );
      return {
        key,
        label: item?.label || '',
        detailText: item?.detailText || ''
      };
    } catch (error) {
      console.error('Error getting breakdown detail:', error);
      return { key, label: '', detailText: '' };
    }
  }

  /**
   * 通用：获取事件列表
   * @param {Object} params
   * @param {string} params.type - 评分类型
   * @param {Date} params.startDate
   * @param {Date} params.endDate
   */
  async getEvents(params = {}) {
    const type = params.type || 'sleep';
    const startDate = params.startDate ? formatDate(params.startDate) : null;
    const endDate = params.endDate ? formatDate(params.endDate) : null;

    if (!startDate) {
      return { events: [] };
    }

    try {
      if (type === 'sleep') {
        const res = await this.sleepController.getSleepEvents({ startDate });
        return await handleResponse(res); // { events: [...] }
      }

      // 其它类型：直接走分类事件接口
      const res = await this.controller.getCategoryEvents({
        startDate,
        endDate,
        category: type
      });
      const data = await handleResponse(res);
      // 保持统一结构：events 为数组（内部每项包含 category/totalDuration/events 等）
      return {
        events: data ?? []
      };
    } catch (error) {
      console.error('Error getting events:', error);
      return { events: [] };
    }
  }

  /**
   * 通用：获取 AI 建议
   * @param {Object} params
   * @param {string} params.type - 评分类型
   * @param {Date} params.startDate
   * @param {Date} params.endDate
   */
  async getAdvice(params = {}) {
    const type = params.type || 'sleep';
    const startDate = params.startDate ? formatDate(params.startDate) : null;
    const endDate = params.endDate ? formatDate(params.endDate) : null;

    if (!startDate) {
      return {
        summary: '暂无数据',
        suggestions: []
      };
    }

    try {
      if (type === 'sleep') {
        // 睡眠类型统一走 SleepService，封装在 core/service 层
        try {
          return await this.sleepService.getSleepAdvice({ startDate });
        } catch (e) {
          console.error('Error getting sleep advice from SleepService:', e);
          return {
            summary: '暂无数据',
            suggestions: []
          };
        }
      }

      // 其它类型：从综合明细中取 aiAdvice
      const detail = await this.getScoreDetailData({ type, startDate, endDate });
      return detail?.aiAdvice || {
        summary: '暂无数据',
        suggestions: []
      };
    } catch (error) {
      console.error('Error getting advice:', error);
      return {
        summary: '暂无数据',
        suggestions: []
      };
    }
  }

  /**
   * 兼容旧睡眠专用方法：内部转调通用方法并固定 type = 'sleep'
   */
  async getSleepScoreSummary(params = {}) {
    return this.getScoreSummary({ ...params, type: 'sleep' });
  }

  /**
   * 兼容旧睡眠专用方法：内部转调通用方法并固定 type = 'sleep'
   */
  async getSleepBreakdown(params = {}) {
    return this.getBreakdown({ ...params, type: 'sleep' });
  }

  /**
   * 兼容旧睡眠专用方法：内部转调通用方法并固定 type = 'sleep'
   */
  async getSleepBreakdownDetail(params = {}) {
    return this.getBreakdownDetail({ ...params, type: 'sleep' });
  }

  /**
   * 兼容旧睡眠专用方法：内部转调通用方法并固定 type = 'sleep'
   */
  async getSleepEvents(params = {}) {
    return this.getEvents({ ...params, type: 'sleep' });
  }

  /**
   * 兼容旧睡眠专用方法：内部转调通用方法并固定 type = 'sleep'
   */
  async getSleepAdvice(params = {}) {
    return this.getAdvice({ ...params, type: 'sleep' });
  }

  /**
   * 统一：生成 AI 建议（流式或一次性）
   * 睡眠走 SleepService 流式大模型；其它类型从 getAdvice 取数据后一次性 onOutput
   * @param {Object} params - { type, startDate, endDate }
   * @param {Object} callbacks - { onThought, onOutput }
   */
  async generateAiAdvice(params = {}, callbacks = {}) {
    const type = params.type || 'sleep';
    const startDate = params.startDate ? (typeof params.startDate === 'string' ? params.startDate : formatDate(params.startDate)) : null;
    const endDate = params.endDate ? formatDate(params.endDate) : null;
    const { onOutput = () => {} } = callbacks;

    if (type === 'sleep' && startDate) {
      return this.sleepService.generateAiAdvice({ startDate }, callbacks);
    }

    // 非睡眠：用 getAdvice 结果拼成 Markdown 一次性输出
    const advice = await this.getAdvice({ type, startDate, endDate });
    const lines = ['## AI总结', advice?.summary || '暂无数据', '', '## 建议', ...(advice?.suggestions || []).map((s, i) => `${i + 1}. ${s}`)];
    onOutput(lines.join('\n'));
    return { thought: '', output: lines.join('\n') };
  }

  /**
   * 统一：生成总分一句话总结
   * 睡眠走 SleepService 大模型一句话；其它类型从 getAdvice.summary 返回
   * @param {Object} params - { type, startDate, endDate }
   * @returns {Promise<{ summary: string }>}
   */
  async generateOverviewSummary(params = {}) {
    const type = params.type || 'sleep';
    const startDate = params.startDate ? (typeof params.startDate === 'string' ? params.startDate : formatDate(params.startDate)) : null;
    const endDate = params.endDate ? formatDate(params.endDate) : null;

    if (type === 'sleep' && startDate) {
      const summaryText = await this.sleepService.generateOverviewSummary({ startDate });
      return { summary: summaryText || '' };
    }

    const advice = await this.getAdvice({ type, startDate, endDate });
    return { summary: advice?.summary || '暂无总结' };
  }

  /**
   * 获取评分趋势
   * @param {number} days - 天数
   * @returns {Promise<any>} 评分趋势数据
   */
  async getScoreTrend(days = 7) {
    const safeDays = Number(days) || 7;

    // 简单构造一个近期趋势假数据（从近到远分数略有波动）
    const today = new Date();
    const trend = Array.from({ length: safeDays }).map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (safeDays - 1 - index));
      return {
        date: formatDate(date),
        score: 75 + Math.round(Math.sin(index / 2) * 8) // 75±8 之间波动
      };
    });

    return Promise.resolve(trend);
  }
}

export const analyseApi = new AnalyseApi();