import { AnalyseMapper } from "@/core/mapper";

/**
   映射为 UI 看板结构
 */
export class AnalysisService {
  constructor() {
    this.analyseMapper = new AnalyseMapper();
  }

  /**
   * 从 AI 文本报告解析为结构化数据
   * @param {string} text - AI 返回的纯文本
   * @param {string} date - 日期
   * @param {string} eventHash - 事件哈希
   * @returns {Object} 结构化解析结果
   */
  async parseAITextToStructured(text, date, eventHash) {
    const cleanText = text || '';

    const getScore = (section) => {
      if (!section) return 0;
      const m = section.match(/## 评分\s*([0-9]{1,3})/);
      const n = m ? Number(m[1]) : 0;
      return Number.isFinite(n) ? Math.min(Math.max(n, 0), 100) : 0;
    };

    const getSectionText = (section) => {
      if (!section) return '';
      // 保留原始 Markdown 格式
      return section.trim();
    };

    const sections = {};

    // 简化章节提取逻辑，只将一级标题（单个 #）识别为章节开始
    let currentSection = '';
    let currentTitle = null;

    // 按行分割文本
    const lines = cleanText.split('\n');

    for (const line of lines) {
      // 检查是否是一级章节标题（以单个 # 开头，后面不是另一个 #）
      const titleMatch = line.match(/^#(?!#)\s+(.+)$/);
      if (titleMatch) {
        const title = titleMatch[1].trim();

        // 如果已经有当前章节，保存它
        if (currentTitle && currentSection) {
          sections[currentTitle] = currentSection;
        }

        // 开始新章节
        currentTitle = title;
        currentSection = line + '\n';
      } else if (currentTitle) {
        // 向当前章节添加内容（包括二级标题等）
        currentSection += line + '\n';
      }
    }

    // 保存最后一个章节
    if (currentTitle && currentSection) {
      sections[currentTitle] = currentSection;
    }

    // 解析各个部分
    const totalSection = sections['综合评估'] || '';
    const sleepSection = sections['睡眠分析'] || '';
    const dietSection = sections['饮食分析'] || '';
    const exerciseSection = sections['运动分析'] || '';
    const efficiencySection = sections['效率分析'] || '';
    const balanceSection = sections['生活平衡'] || '';
    const emotionSection = sections['情绪状态'] || '';
    let overallSummary = sections['总结'] || '';
    // 保留原始 Markdown 格式
    overallSummary = overallSummary.trim();

    // 使用AI返回的总分，如果AI没有返回则计算平均分作为兜底
    const validScores = [
      getScore(sleepSection),
      getScore(dietSection),
      getScore(exerciseSection),
      getScore(efficiencySection),
      getScore(balanceSection),
      getScore(emotionSection)
    ].filter((x) => Number.isFinite(x));
    const avg = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
    const totalScore = getScore(totalSection) > 0 ? getScore(totalSection) : avg;

    // 构建结构化数据
    const structuredData = {
      total: {
        score: totalScore,
        text: getSectionText(totalSection)
      },
      sleep: {
        score: getScore(sleepSection),
        text: getSectionText(sleepSection)
      },
      diet: {
        score: getScore(dietSection),
        text: getSectionText(dietSection)
      },
      exercise: {
        score: getScore(exerciseSection),
        text: getSectionText(exerciseSection)
      },
      efficiency: {
        score: getScore(efficiencySection),
        text: getSectionText(efficiencySection)
      },
      balance: {
        score: getScore(balanceSection),
        text: getSectionText(balanceSection)
      },
      emotion: {
        score: getScore(emotionSection),
        text: getSectionText(emotionSection)
      },
      overallSummary: overallSummary
    };

    // 存入数据库
    if (date && eventHash) {
      await this.analyseMapper.writeStructuredData(date, eventHash, structuredData, text);
    }

    return structuredData;
  }

  /**
   * 计算与昨日的分数对比
   * @param {Object} todayStructured - 今日的结构化数据
   * @param {Object} yesterdayStructured - 昨日的结构化数据
   * @returns {Object} 各维度的分数变化
   */
  calculateScoreChanges(todayStructured, yesterdayStructured) {
    const dimensions = ['total', 'sleep', 'diet', 'exercise', 'efficiency', 'balance', 'emotion'];
    const changes = {};

    dimensions.forEach(dimension => {
      const todayScore = todayStructured[dimension]?.score || 0;
      const yesterdayScore = yesterdayStructured?.[dimension]?.score || 0;
      changes[`${dimension}Change`] = todayScore - yesterdayScore;
    });

    return changes;
  }

  /**
   * 解析 AI 文本并添加与昨日的对比
   * @param {string} text - AI 返回的纯文本
   * @param {string} date - 当前日期（YYYY-MM-DD）
   * @param {Object} yesterdayData - 昨日的分析数据
   * @param {string} eventHash - 事件哈希
   * @returns {Object} 包含对比数据的结构化结果
   */
  async parseAndCompare(text, date, yesterdayData, eventHash) {
    // 解析 AI 文本为结构化数据
    const structured = await this.parseAITextToStructured(text, date, eventHash);

    // 计算与昨日的对比
    const changes = this.calculateScoreChanges(structured, yesterdayData);

    // 返回包含对比数据的结果
    return {
      ...structured,
      changes
    };
  }
}