import { StatisticsService } from '@/core/service/StatisticsService';
import dayjs from 'dayjs';
import { SleepService } from './SleepService';

export class AnalyseService {
  constructor() {
    this.statisticsService = new StatisticsService();
    this.sleepService = new SleepService();
  }
  
  /**
   * 获取指定分类的事件数据
   * @param {Object} params
   * @param {string} params.startDate - 开始日期，格式：YYYY-MM-DD
   * @param {string} params.endDate - 结束日期，格式：YYYY-MM-DD
   * @param {string} params.category - 事件分类
   * @returns {Promise<Array>} 事件数据
   */
  async getCategoryEvents(params = {}) {
    const { startDate, endDate, category } = params;

    const target = dayjs(startDate, 'YYYY-MM-DD', true);
    if (!target.isValid()) {
      throw new Error('无效的日期格式');
    }

    const currentDate = target.toDate();
    const events = await this.statisticsService.getEventsByDateRange(currentDate, endDate ? dayjs(endDate).toDate() : currentDate);

    // 过滤指定分类的事件
    const categoryEvents = events.filter(event => {
      // 处理分类名称的映射
      const eventCategory = event.category;
      if (category === 'mood' && (eventCategory === 'mood' || eventCategory === '情绪')) return true;
      if (category === 'exercise' && (eventCategory === 'exercise' || eventCategory === '运动' || eventCategory === 'sport')) return true;
      if (category === 'diet' && (eventCategory === 'diet' || eventCategory === '饮食')) return true;
      if (category === 'productivity' && (eventCategory === 'productivity' || eventCategory === '效率')) return true;
      if (category === 'balance' && (eventCategory === 'balance' || eventCategory === '平衡')) return true;
      if (category === 'sleep' && (eventCategory === 'sleep' || eventCategory === '睡眠')) return true;
      return false;
    });

    // 处理事件数据格式
    if (categoryEvents.length > 0) {
      let totalDurationMinutes = 0;
      const eventItems = categoryEvents.map(event => {
        const start = dayjs(event.startDatetime);
        const end = dayjs(event.endDatetime || event.startDatetime);
        const durationMinutes = end.diff(start, 'minute');
        totalDurationMinutes += durationMinutes;
        const durationHours = durationMinutes / 60;
        const durationStr = durationHours >= 1 ? `${durationHours.toFixed(1)}小时` : `${durationMinutes}分钟`;

        return {
          timeRange: `${start.format('HH:mm')}~${end.format('HH:mm')}`,
          duration: durationStr,
          title: event.title || category,
          description: event.content || ''
        };
      });

      const totalHours = totalDurationMinutes / 60;
      const totalDurationStr = totalHours >= 1 ? `${totalHours.toFixed(1)}小时` : `${totalDurationMinutes}分钟`;

      // 简单计算贡献分数：基于事件数量和总时长
      const eventCount = categoryEvents.length;
      const baseScore = eventCount * 20; // 每个事件基础分20分
      const durationScore = Math.min(Math.floor(totalDurationMinutes / 60) * 10, 60); // 每小时10分，最高60分
      const contributionScore = Math.min(baseScore + durationScore, 100);

      return [{
        category: this.getCategoryName(category),
        totalDuration: totalDurationStr,
        contribution: `${contributionScore}分`,
        events: eventItems
      }];
    }

    return [];
  }

  /**
   * 获取分类的中文名称
   * @param {string} category - 分类英文名称
   * @returns {string} 分类中文名称
   */
  getCategoryName(category) {
    const categoryMap = {
      sleep: '睡眠',
      mood: '情绪',
      exercise: '运动',
      diet: '饮食',
      productivity: '效率',
      balance: '平衡'
    };
    return categoryMap[category] || category;
  }

  /**
   * 获取指定类型的评分详情
   * @param {Object} params
   * @param {string} params.type - 评分类型
   * @param {string} params.startDate - 开始日期，格式：YYYY-MM-DD
   * @param {string} params.endDate - 结束日期，格式：YYYY-MM-DD
   * @returns {Promise<Object>} 评分详情
   */
  async getScoreDetail(params = {}) {
    const { type, startDate, endDate } = params;

    if (type === 'sleep') {
      // 保持兼容的综合结构（总分 + breakdown + 事件 + ai 建议）
      return await this.sleepService.getSleepDetail({ startDate, endDate });
    } else {
      // 其他类型的详情数据获取逻辑
      // 这里暂时返回一个默认结构，后续可以根据需要扩展
      const events = await this.getCategoryEvents({ startDate, endDate, category: type });

      let breakdown = [];
      let totalScore = 0;

      if (type === 'exercise') {
        breakdown = [
          { label: '能量消耗得分', value: 46, maxScore: 60, ratio: 60, percentScore: 77 },
          { label: '运动时长得分', value: 20, maxScore: 25, ratio: 25, percentScore: 80 },
          { label: '运动连续性得分', value: 12, maxScore: 15, ratio: 15, percentScore: 80 }
        ];
        totalScore = 78;
      } else if (type === 'diet') {
        breakdown = [
          { label: '饮食质量得分', value: 35, maxScore: 50, ratio: 50, percentScore: 70 },
          { label: '饮食规律性得分', value: 28, maxScore: 30, ratio: 30, percentScore: 93 },
          { label: '营养多样性得分', value: 19, maxScore: 20, ratio: 20, percentScore: 95 }
        ];
        totalScore = 82;
      } else if (type === 'productivity') {
        breakdown = [
          { label: '专注度得分', value: 32, maxScore: 40, ratio: 40, percentScore: 80 },
          { label: '任务完成度得分', value: 30, maxScore: 40, ratio: 40, percentScore: 75 },
          { label: '时间管理得分', value: 26, maxScore: 20, ratio: 20, percentScore: 130 }
        ];
        totalScore = 88;
      } else if (type === 'mood' || type === 'emotion') {
        breakdown = [
          { label: '积极情绪得分', value: 34, maxScore: 40, ratio: 40, percentScore: 85 },
          { label: '压力管理得分', value: 24, maxScore: 30, ratio: 30, percentScore: 80 },
          { label: '情绪稳定性得分', value: 22, maxScore: 30, ratio: 30, percentScore: 73 }
        ];
        totalScore = 80;
      } else if (type === 'balance' || type === 'overall') {
        breakdown = [
          { label: '工作与生活平衡得分', value: 30, maxScore: 40, ratio: 40, percentScore: 75 },
          { label: '健康习惯坚持度得分', value: 28, maxScore: 30, ratio: 30, percentScore: 93 },
          { label: '情绪与压力平衡得分', value: 26, maxScore: 30, ratio: 30, percentScore: 87 }
        ];
        totalScore = 84;
      } else {
        breakdown = [
          { label: '综合表现得分', value: 70, maxScore: 100, ratio: 100, percentScore: 70 }
        ];
        totalScore = 70;
      }

      // 为每个评分项生成详情文本
      const breakdownWithDetails = breakdown.map(item => {
        let detailText = `# ${item.label}详情\n\n`;

        if (type === 'sleep') {
          if (item.label.includes('时长')) {
            detailText += `## 得分情况\n- 得分：${item.percentScore ?? item.value ?? 0}分\n- 满分：100分\n- 占比：${item.ratio ?? 0}%\n\n`;
            detailText += `## 详细数据\n- 实际睡眠时长：${(item.value / item.ratio * 100 / 100 * item.maxScore / 40 * 8).toFixed(1)}小时\n- 睡眠时长区间：7-9小时（理想范围）\n\n`;
            detailText += `## 得分原因\n睡眠时长在理想范围内，有助于身体充分恢复\n\n`;
            detailText += `## 说明\n根据睡眠时长计算得分，理想睡眠时长为7-9小时，在此范围内得分最高。`;
          } else if (item.label.includes('入睡')) {
            detailText += `## 得分情况\n- 得分：${item.percentScore ?? item.value ?? 0}分\n- 满分：100分\n- 占比：${item.ratio ?? 0}%\n\n`;
            detailText += `## 详细数据\n- 实际入睡时间：22:30\n- 入睡时间区间：22:00-23:30（理想范围）\n\n`;
            detailText += `## 得分原因\n入睡时间在理想范围内，有助于保证充足睡眠\n\n`;
            detailText += `## 说明\n根据入睡时间计算得分，理想入睡时间为22:00-23:30，在此范围内得分最高。`;
          } else if (item.label.includes('连续')) {
            detailText += `## 得分情况\n- 得分：${item.percentScore ?? item.value ?? 0}分\n- 满分：100分\n- 占比：${item.ratio ?? 0}%\n\n`;
            detailText += `## 详细数据\n- 睡眠连续性指数：85%\n- 连续性等级：良好\n\n`;
            detailText += `## 得分原因\n睡眠连续性较好，偶尔有中断\n\n`;
            detailText += `## 说明\n根据睡眠连续性计算得分，睡眠中断次数越少、持续时间越长，得分越高。`;
          } else if (item.label.includes('稳定')) {
            detailText += `## 得分情况\n- 得分：${item.percentScore ?? item.value ?? 0}分\n- 满分：100分\n- 占比：${item.ratio ?? 0}%\n\n`;
            detailText += `## 详细数据\n- 作息稳定性指数：90%\n- 稳定性等级：优秀（规律）\n\n`;
            detailText += `## 得分原因\n作息时间稳定，入睡和起床时间规律\n\n`;
            detailText += `## 说明\n根据作息稳定性计算得分，入睡和起床时间越规律，得分越高。`;
          } else {
            detailText += `## 得分情况\n- 得分：${item.percentScore ?? item.value ?? 0}分\n- 满分：100分\n- 占比：${item.ratio ?? 0}%\n\n`;
            detailText += `## 说明\n根据相关指标计算得分。`;
          }
        } else if (type === 'exercise') {
          if (item.label.includes('能量')) {
            detailText += `## 得分情况\n- 得分：${item.value ?? 0}分\n- 满分：${item.maxScore ?? 60}分\n- 占比：${item.ratio ?? 0}%\n\n`;
            detailText += `## 详细数据\n- 实际能量消耗：350千卡\n- 消耗区间：300-500千卡（良好）\n\n`;
            detailText += `## 得分原因\n能量消耗适中，达到日常活动需求\n\n`;
            detailText += `## 说明\n根据能量消耗计算得分，消耗越多得分越高，最高60分。`;
          } else if (item.label.includes('时长')) {
            detailText += `## 得分情况\n- 得分：${item.value ?? 0}分\n- 满分：${item.maxScore ?? 25}分\n- 占比：${item.ratio ?? 0}%\n\n`;
            detailText += `## 详细数据\n- 实际运动时长：45分钟\n- 时长区间：30-60分钟（良好）\n\n`;
            detailText += `## 得分原因\n运动时长充足，达到有效运动时间\n\n`;
            detailText += `## 说明\n根据运动时长计算得分，运动时间越长得分越高，最高25分。`;
          } else if (item.label.includes('连续')) {
            detailText += `## 得分情况\n- 得分：${item.value ?? 0}分\n- 满分：${item.maxScore ?? 15}分\n- 占比：${item.ratio ?? 0}%\n\n`;
            detailText += `## 详细数据\n- 最长连续运动：30分钟\n- 连续性等级：良好\n\n`;
            detailText += `## 得分原因\n运动连续性较好，能够保持一定强度\n\n`;
            detailText += `## 说明\n根据运动连续性计算得分，运动持续时间越长得分越高，最高15分。`;
          } else {
            detailText += `## 得分情况\n- 得分：${item.value ?? 0}分\n- 满分：${item.maxScore ?? 100}分\n\n`;
            detailText += `## 说明\n根据相关指标计算得分。`;
          }
        } else if (type === 'diet') {
          if (item.label.includes('质量')) {
            detailText += `## 得分情况\n- 得分：${item.value ?? 0}分\n- 满分：${item.maxScore ?? 50}分\n- 占比：${item.ratio ?? 0}%\n\n`;
            detailText += `## 详细数据\n- 饮食质量指数：75%\n- 质量等级：良好\n\n`;
            detailText += `## 得分原因\n饮食结构合理，营养均衡\n\n`;
            detailText += `## 说明\n根据饮食质量计算得分，营养均衡、健康饮食得分越高。`;
          } else if (item.label.includes('规律')) {
            detailText += `## 得分情况\n- 得分：${item.value ?? 0}分\n- 满分：${item.maxScore ?? 30}分\n- 占比：${item.ratio ?? 0}%\n\n`;
            detailText += `## 详细数据\n- 饮食规律指数：90%\n- 规律等级：优秀\n\n`;
            detailText += `## 得分原因\n饮食时间规律，三餐定时定量\n\n`;
            detailText += `## 说明\n根据饮食规律性计算得分，定时定量饮食得分越高。`;
          } else if (item.label.includes('多样')) {
            detailText += `## 得分情况\n- 得分：${item.value ?? 0}分\n- 满分：${item.maxScore ?? 20}分\n- 占比：${item.ratio ?? 0}%\n\n`;
            detailText += `## 详细数据\n- 食物种类：12种\n- 多样性等级：良好\n\n`;
            detailText += `## 得分原因\n食物种类丰富，营养摄入多样化\n\n`;
            detailText += `## 说明\n根据营养多样性计算得分，食物种类越多得分越高。`;
          } else {
            detailText += `## 得分情况\n- 得分：${item.value ?? 0}分\n- 满分：${item.maxScore ?? 100}分\n\n`;
            detailText += `## 说明\n根据相关指标计算得分。`;
          }
        } else {
          detailText += `## 得分情况\n- 得分：${item.value ?? 0}分\n- 满分：${item.maxScore ?? 100}分\n\n`;
          detailText += `## 说明\n根据相关指标计算得分。`;
        }

        return {
          ...item,
          detailText
        };
      });

      return {
        totalScore,
        breakdown: breakdownWithDetails,
        events,
        aiAdvice: {
          summary: `这是针对「${this.getCategoryName(type)}」维度的分析结果。`,
          suggestions: [
            '保持稳定的生活节奏，有助于该维度评分的持续提升。',
            '结合实际情况适当调整目标，避免过度焦虑或过于放松。',
            '建议坚持记录一段时间后再观察趋势变化。'
          ]
        }
      };
    }
  }

  /**
   * 睡眠专用：总评分
   */
  async getSleepScoreSummary(params = {}) {
    const { startDate } = params;
    return this.sleepService.getSleepScoreSummary({ startDate });
  }

  /**
   * 睡眠专用：各维度概览（不含 detailText）
   */
  async getSleepBreakdown(params = {}) {
    const { startDate } = params;
    return this.sleepService.getSleepBreakdown({ startDate });
  }

  /**
   * 睡眠专用：单个维度的 Markdown 详情
   */
  async getSleepBreakdownDetail(params = {}) {
    const { startDate, key } = params;
    return this.sleepService.getSleepBreakdownDetail({ startDate, key });
  }

  /**
   * 睡眠专用：事件列表
   */
  async getSleepEvents(params = {}) {
    const { startDate } = params;
    return this.sleepService.getSleepEvents({ startDate });
  }

  /**
   * 睡眠专用：AI 建议
   */
  async getSleepAdvice(params = {}) {
    const { startDate } = params;
    return this.sleepService.getSleepAdvice({ startDate });
  }
}

