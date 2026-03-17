import { AnalyseMapper } from "@/core/mapper";
import { EventService, StatisticsService } from '@/core/service';
import { AiService } from '@/core/service/AiService';
import dayjs from 'dayjs';
import { AsyncStorage } from 'expo-sqlite/kv-store';
import { AnalysisService } from './AnalysisService';
import { DataService } from './DataService';

export class AnalyseService {
  constructor() {
    this.statisticsService = new StatisticsService();
    this.eventService = new EventService();
    this.dataService = new DataService();
    this.analyseMapper = new AnalyseMapper();
    this.analysisService = new AnalysisService();
  }

  /**
   * 获取每日分析输入数据
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<Object>} 分析输入数据
   */
  async _getDailyInput(startDate, endDate) {
    const target = dayjs(startDate, 'YYYY-MM-DD', true);
    if (!target.isValid()) {
      throw new Error('无效的日期格式');
    }

    const currentDateStr = target.format('YYYY-MM-DD');

    // 获取当天所有事件
    const eventsToday = await this.eventService.getByEndDateRange(
      currentDateStr,
      endDate || currentDateStr,
      'all'
    );

    const statsToday = await this.statisticsService.getDayStatistics(currentDateStr);

    return this.dataService.buildDailyAnalysisInput({
      date: currentDateStr,
      events: eventsToday,
      stats: statsToday
    });
  }

  /**
   * 公共 AI 调用函数
   * @param {Object} params - { startDate, endDate, callbacks, forceRefresh }
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @param {Object} params.callbacks - 回调函数 { onThought, onOutput }
   * @param {boolean} params.forceRefresh - 是否强制刷新（忽略缓存）
   * @returns {Promise<{ thought: string, output: string }>}
   */
  async _callAiService(params = {}) {
    const { startDate, endDate, callbacks = {}, forceRefresh = false } = params;
    const {
      onThought = () => { },
      onOutput = () => { }
    } = callbacks;

    // 获取每日输入数据
    const dailyInput = await this._getDailyInput(startDate, endDate);
    const { dateRange: date, keyEvents, eventHash } = dailyInput;

    // 检查缓存（除非强制刷新）
    if (!forceRefresh) {
      const cached = await this.analyseMapper.checkCache(date, eventHash);
      if (cached && cached.reportText) {
        // 直接返回缓存的结果
        onOutput(cached.reportText);
        return { thought: '', output: cached.reportText };
      }
    }

    // 读取 AI 配置
    const [apiKey, model, apiBaseUrl] = await Promise.all([
      AsyncStorage.getItem('AI_DIARY_API_KEY'),
      AsyncStorage.getItem('AI_DIARY_MODEL'),
      AsyncStorage.getItem('AI_DIARY_API_BASE_URL')
    ]);

    if (!apiKey || apiKey.trim() === '') {
      throw new Error('未配置 AI 密钥，无法生成分析报告');
    }

    const aiService = new AiService(
      apiKey.trim(),
      model || 'Qwen/Qwen3-8B',
      apiBaseUrl || 'https://api.siliconflow.cn/v1'
    );

    const systemPrompt = `你是一名"个人行为数据分析助手"，需要根据用户一天的行为记录，输出固定结构的 Markdown 分析报告。

事件分类：sleep=睡眠 diet=饮食 sports=运动 study=学习 work=工作 entertainment=娱乐 daily=日常 shopping=购物 travel=出行

【输出要求】
1. 只输出 Markdown 文本，不要输出 JSON、不要多余解释
2. 必须包含以下章节，顺序如下：
   # 综合评估
   ## 评分
   ## 概述
   ## 得分原因
   ## 建议
   ## 总结
   # 睡眠分析
   ## 评分
   ## 概述
   ## 得分原因
   ## 建议
   ## 总结
   # 饮食分析
   ## 评分
   ## 概述
   ## 得分原因
   ## 建议
   ## 总结
   # 运动分析
   ## 评分
   ## 概述
   ## 得分原因
   ## 建议
   ## 总结
   # 效率分析
   ## 评分
   ## 概述
   ## 得分原因
   ## 建议
   ## 总结
   # 生活平衡
   ## 评分
   ## 概述
   ## 得分原因
   ## 建议
   ## 总结
   # 情绪状态
   ## 评分
   ## 概述
   ## 得分原因
   ## 建议
   ## 总结
   # 总结
3. 每个分析章节必须包含：评分：xx、概述：、得分原因：、建议：、总结：
4. 评分为 0-100 的整数，必须能从报告中找到清晰的行为依据
5. 今日改进重点用有序列表，如 1. xxx  2. xxx
6. 输出格式示例：
   # 综合评估
   ## 评分
   82
   
   ## 概述
   今天整体效率较高，学习时间占比较大，娱乐时间适中。
   
   ## 得分原因
   - 学习时间约8小时44分钟
   - 娱乐时间约1小时49分钟
   - 睡眠时间较充足
   
   ## 建议
   - 继续保持当前学习节奏
   - 注意适当增加运动
   
   ## 总结
   整体属于效率较高的一天。
   
   ---
   
   # 睡眠分析
   ## 评分
   78
   
   ## 概述
   ...
   ## 得分原因
   ...
   ## 建议
   ...
   ## 总结
   ...
   
   ---
   
   # 饮食分析
   ## 评分
   88
   ...
   
   ---
   
   # 运动分析
   ## 评分
   65
   ...
   
   ---
   
   # 效率分析
   ## 评分
   92
   ...
   
   ---
   
   # 生活平衡
   ## 评分
   85
   ...
   
   ---
   
   # 情绪状态
   ## 评分
   80
   ...
   
   ---
   
   # 总结
   整体的总结

评分维度：睡眠、饮食、运动、效率、生活平衡、情绪状态`;

    const statsText = JSON.stringify(dailyInput.stats, null, 2);

    const keyEventsText = keyEvents.length > 0
      ? keyEvents.map((e) => e.line || `${e.timeRange} ${e.title} ${e.duration} ${e.description || ''}`.trim()).join('\n')
      : '';

    // 按分类分组的事件数据
    const eventsByCategoryText = Object.entries(dailyInput.eventsByCategory)
      .map(([category, events]) => {
        const categoryName = category || '未分类';
        const categoryEvents = events.map((e) => e.line || '').join('\n');
        return `【${categoryName}】\n${categoryEvents}`;
      })
      .join('\n\n');

    const userPrompt = `请根据以下用户一天的行为数据进行分析，输出固定结构的 Markdown 报告。

事件分类：sleep=睡眠 diet=饮食 sports=运动 study=学习 work=工作 entertainment=娱乐 daily=日常 shopping=购物 travel=出行

输出格式示例：

# 综合评估
## 评分
82

## 概述
今天整体效率较高，学习时间占比较大，娱乐时间适中。

## 得分原因
- 学习时间约8小时44分钟
- 娱乐时间约1小时49分钟
- 睡眠时间较充足

## 建议
- 继续保持当前学习节奏
- 注意适当增加运动

## 总结
整体属于效率较高的一天。

# 睡眠分析
## 评分
78

## 概述
...
## 得分原因
...
## 建议
...
## 总结
...

# 饮食分析
## 评分
88
...

# 运动分析
## 评分
65
...

# 效率分析
## 评分
92
...

# 生活平衡
## 评分
85
...

# 情绪状态
## 评分
80
...

# 总结
整体的总结

下面是用户一天的行为统计数据：
${statsText}

下面是用户行为关键事件（按时长排序）：
${keyEventsText}

下面是用户行为按分类分组：
${eventsByCategoryText}
`;

    // 调用 AI 生成内容
    const result = await aiService.generateContent(
      { userPrompt, systemPrompt },
      { onThought, onOutput }
    );

    // 保存 AI 生成的结果到数据库
    if (result.output) {
      await this.analysisService.parseAITextToStructured(result.output, date, eventHash);
    }

    return result;
  }

  /**
   * 获取看板数据
   * @param {Object} params
   * @param {string} params.startDate - 开始日期，格式：YYYY-MM-DD
   * @param {string} params.endDate - 结束日期，格式：YYYY-MM-DD
   * @returns {Promise<Object>} 看板数据
   */
  async getDashboard(params = {}) {
    const { startDate } = params;

    // 从数据库读取结构化分析数据
    const structuredData = await this.analyseMapper.readStructuredData(startDate);

    // 获取昨日数据
    const yesterdayData = await this.analyseMapper.getYesterdayData(startDate);

    // 构建看板数据
    return {
      totalScore: structuredData?.total.score || 0,
      scores: {
        sleepScore: structuredData?.sleep.score || 0,
        dietScore: structuredData?.diet.score || 0,
        sportScore: structuredData?.exercise.score || 0,
        productivityScore: structuredData?.efficiency.score || 0,
        emotionScore: structuredData?.emotion.score || 0,
        balanceScore: structuredData?.balance.score || 0
      },
      scoreChanges: {
        sleepChange: structuredData && yesterdayData ? (structuredData.sleep.score || 0) - (yesterdayData.sleep.score || 0) : 0,
        dietChange: structuredData && yesterdayData ? (structuredData.diet.score || 0) - (yesterdayData.diet.score || 0) : 0,
        sportChange: structuredData && yesterdayData ? (structuredData.exercise.score || 0) - (yesterdayData.exercise.score || 0) : 0,
        productivityChange: structuredData && yesterdayData ? (structuredData.efficiency.score || 0) - (yesterdayData.efficiency.score || 0) : 0,
        emotionChange: structuredData && yesterdayData ? (structuredData.emotion.score || 0) - (yesterdayData.emotion.score || 0) : 0,
        balanceChange: structuredData && yesterdayData ? (structuredData.balance.score || 0) - (yesterdayData.balance.score || 0) : 0
      },
      dimensions: structuredData || {},
      overallSummary: structuredData?.overallSummary
    };
  }

  /**
   * 生成 AI 分析报告（流式，直接返回原始 AI 输出，不解析）
   * @param {Object} params - { startDate, endDate, forceRefresh }
   * @param {string} params.startDate - 开始日期
   * @param {string} params.endDate - 结束日期
   * @param {boolean} params.forceRefresh - 是否强制刷新（忽略缓存）
   * @param {Object} callbacks - { onThought, onOutput }
   * @returns {Promise<{ thought: string, output: string }>}
   */
  async generateAiReportStream(params = {}, callbacks = {}) {
    const { startDate, endDate, forceRefresh = false } = params;

    // 调用公共 AI 函数获取流式结果
    return this._callAiService({
      startDate,
      endDate,
      callbacks,
      forceRefresh
    });
  }
}

