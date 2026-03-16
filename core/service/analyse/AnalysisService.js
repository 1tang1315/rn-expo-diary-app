/**
 * AnalysisService：AI 结果处理 / 兜底层
 *
 * 负责：
 * 1. 清洗 AI 返回（去掉 markdown / 解析 JSON）
 * 2. Schema 校验 & 默认兜底
 * 3. 映射为 UI 看板结构（兼容旧版 dashboard）
 */
export class AnalysisService {
  /**
   * 解析并标准化 AI 返回
   * @param {string|Object} raw
   * @param {Object} context
   * @param {string} context.dateRange
   * @returns {{ analysis: Object }}
   */
  normalizeDailyAnalysis(raw, { dateRange } = {}) {
    let obj = raw;

    if (typeof raw === 'string') {
      const cleaned = this.stripMarkdown(raw);
      try {
        obj = JSON.parse(cleaned);
      } catch (e) {
        obj = {};
      }
    }

    if (!obj || typeof obj !== 'object') {
      obj = {};
    }

    // 支持新格式：{ scorePanel, reportText }
    if (obj.scorePanel && typeof obj.scorePanel === 'object') {
      const { analysis, reportText } = this.normalizeFromScorePanel(obj.scorePanel, obj.reportText, dateRange);
      return { analysis: { ...analysis, reportText } };
    }

    const safeScores = this.ensureScores(obj.scores || {});

    const analysis = {
      dateRange: obj.dateRange || dateRange || '',
      overview: {
        totalScore: this.toSafeNumber(obj?.overview?.totalScore, 0),
        state: obj?.overview?.state || '',
        keyFactors: Array.isArray(obj?.overview?.keyFactors)
          ? obj.overview.keyFactors
          : []
      },
      scores: safeScores,
      review: Array.isArray(obj.review) ? obj.review : [],
      suggestions: Array.isArray(obj.suggestions) ? obj.suggestions : [],
      positive: Array.isArray(obj.positive) ? obj.positive : [],
      reportText: obj.reportText || ''
    };

    return { analysis };
  }

  /**
   * 从新格式 scorePanel（score + basis[]）+ reportText 转为统一 analysis
   */
  normalizeFromScorePanel(scorePanel, reportText, dateRange) {
    const panel = scorePanel || {};
    const total = this.toSafeNumber(panel.total, 0);
    const dimMap = [
      { panelKey: 'sleep', scoresKey: 'sleep' },
      { panelKey: 'diet', scoresKey: 'diet' },
      { panelKey: 'sports', scoresKey: 'exercise' },
      { panelKey: 'efficiency', scoresKey: 'efficiency' },
      { panelKey: 'balance', scoresKey: 'balance' },
      { panelKey: 'emotion', scoresKey: 'emotion' }
    ];
    const scores = {};
    dimMap.forEach(({ panelKey, scoresKey }) => {
      const dim = panel[panelKey] || {};
      const basis = Array.isArray(dim.basis) ? dim.basis : [];
      const basisStr = basis.map((b) => (typeof b === 'string' ? b : b?.text || String(b)));
      scores[scoresKey] = {
        score: this.toSafeNumber(dim.score, 50),
        metrics: {},
        evidence: basisStr,
        analysis: basisStr.length ? basisStr.join('；') : '暂无数据'
      };
    });
    const sum = Object.values(scores).reduce((acc, d) => acc + d.score, 0);
    const avg = Object.keys(scores).length ? Math.round(sum / Object.keys(scores).length) : 0;
    const overviewTotal = total > 0 ? total : avg;
    return {
      analysis: {
        dateRange: dateRange || '',
        overview: {
          totalScore: overviewTotal,
          state: '',
          keyFactors: []
        },
        scores,
        review: [],
        suggestions: [],
        positive: [],
        reportText: typeof reportText === 'string' ? reportText : ''
      },
      reportText: typeof reportText === 'string' ? reportText : ''
    };
  }

  /**
   * 将标准分析结构映射为旧版 dashboard 结构
   * （保持 UI 兼容，同时利用新 JSON）
   */
  toDashboard(analysis) {
    const { overview = {}, scores = {} } = analysis || {};

    const dimSleep = scores.sleep || {};
    const dimDiet = scores.diet || {};
    const dimExercise = scores.exercise || {};
    const dimEfficiency = scores.efficiency || {};
    const dimBalance = scores.balance || {};
    const dimEmotion = scores.emotion || {};

    const buildDimension = (dim) => {
      const metrics = dim.metrics || {};
      const metricEntries = Object.entries(metrics);
      const subDimensions = metricEntries.map(([key, value]) => ({
        key,
        label: String(key),
        score: this.toSafeNumber(dim.score, 0),
        ratio: metricEntries.length ? Math.round(100 / metricEntries.length) : 0,
        value
      }));

      return {
        score: this.toSafeNumber(dim.score, 0),
        ratio: 0,
        change: 0,
        reason: dim.analysis || '',
        metrics,
        evidence: Array.isArray(dim.evidence) ? dim.evidence : [],
        subDimensions
      };
    };

    const dimensions = {
      sleep: buildDimension(dimSleep),
      diet: buildDimension(dimDiet),
      sport: buildDimension(dimExercise),
      productivity: buildDimension(dimEfficiency),
      emotion: buildDimension(dimEmotion),
      balance: buildDimension(dimBalance)
    };

    return {
      totalScore: this.toSafeNumber(overview.totalScore, 0),
      scores: {
        sleepScore: dimensions.sleep.score,
        dietScore: dimensions.diet.score,
        sportScore: dimensions.sport.score,
        productivityScore: dimensions.productivity.score,
        emotionScore: dimensions.emotion.score,
        balanceScore: dimensions.balance.score
      },
      scoreChanges: {
        sleepChange: 0,
        dietChange: 0,
        sportChange: 0,
        productivityChange: 0,
        emotionChange: 0,
        balanceChange: 0
      },
      dimensions,
      aiAdvice: {
        summary: overview.state || '暂无分析数据',
        suggestions: (analysis.suggestions || []).map((s) => {
          if (typeof s === 'string') return s;
          if (s && typeof s === 'object') {
            const title = s.title || s.reason || '';
            const actions = Array.isArray(s.actions) ? s.actions.join('；') : '';
            return [title, actions].filter(Boolean).join('：');
          }
          return '';
        }).filter(Boolean)
      },
      // 原始 Markdown 报告文本，供 AI 分析报告展示
      reportText: analysis.reportText || '',
      // 把原始 analysis 也透出给上层，之后可以逐步迁移 UI
      rawAnalysis: { ...analysis, reportText: analysis.reportText || '' }
    };
  }

  /**
   * 去掉 ``` / ```json 包裹
   */
  stripMarkdown(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
  }

  /**
   * 确保六个维度字段都存在并兜底
   */
  ensureScores(scores = {}) {
    const dimKeys = ['sleep', 'diet', 'exercise', 'efficiency', 'balance', 'emotion'];
    const result = {};

    dimKeys.forEach((key) => {
      const raw = scores[key] || {};
      result[key] = {
        score: this.toSafeNumber(raw.score, 50),
        metrics: raw.metrics && typeof raw.metrics === 'object' ? raw.metrics : {},
        evidence: Array.isArray(raw.evidence) ? raw.evidence : [],
        analysis: raw.analysis || '暂无数据'
      };
    });

    return result;
  }

  toSafeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  /**
   * 从结构化 Markdown 报告解析为 analysis 对象（供评分看板使用）
   * 支持格式：# 综合评估 评分：82 ... # 睡眠分析 评分：78 ...
   * @param {string} markdown - AI 返回的 Markdown 全文
   * @param {Object} context
   * @param {string} context.dateRange
   * @returns {{ analysis: Object }}
   */
  parseMarkdownToAnalysis(markdown, { dateRange } = {}) {
    const text = markdown || '';

    const getScore = (section) => {
      if (!section) return 0;
      const m = section.match(/评分[:：]\s*([0-9]{1,3})/);
      const n = m ? Number(m[1]) : 0;
      return Number.isFinite(n) ? Math.min(Math.max(n, 0), 100) : 0;
    };

    const sectionTitles = ['综合评估', '睡眠分析', '饮食分析', '运动分析', '效率分析', '生活平衡', '情绪状态', '今日改进重点'];
    const sections = {};
    let lastEnd = 0;
    for (let i = 0; i < sectionTitles.length; i++) {
      const title = sectionTitles[i];
      const regex = new RegExp(`#\\s*${title}[\\s\\S]*?(?=#\\s*(?:${sectionTitles.join('|')})|$)`, 'i');
      const m = text.slice(lastEnd).match(regex);
      if (m) {
        sections[title] = m[0];
        lastEnd = text.indexOf(m[0], lastEnd) + m[0].length;
      }
    }

    const mSleep = getScore(sections['睡眠分析']);
    const mDiet = getScore(sections['饮食分析']);
    const mSport = getScore(sections['运动分析']);
    const mEff = getScore(sections['效率分析']);
    const mBal = getScore(sections['生活平衡']);
    const mEmo = getScore(sections['情绪状态']);
    const mTotal = getScore(sections['综合评估']);

    const scores = {
      sleep: { score: mSleep, metrics: {}, evidence: [], analysis: sections['睡眠分析'] || '' },
      diet: { score: mDiet, metrics: {}, evidence: [], analysis: sections['饮食分析'] || '' },
      exercise: { score: mSport, metrics: {}, evidence: [], analysis: sections['运动分析'] || '' },
      efficiency: { score: mEff, metrics: {}, evidence: [], analysis: sections['效率分析'] || '' },
      balance: { score: mBal, metrics: {}, evidence: [], analysis: sections['生活平衡'] || '' },
      emotion: { score: mEmo, metrics: {}, evidence: [], analysis: sections['情绪状态'] || '' }
    };

    const validScores = [mSleep, mDiet, mSport, mEff, mBal, mEmo].filter((x) => Number.isFinite(x));
    const avg = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
    const total = mTotal > 0 ? mTotal : avg;

    const improvementsSection = sections['今日改进重点'] || '';
    const suggestions = [];
    const lines = improvementsSection.split(/\n/);
    for (const line of lines) {
      const m = line.match(/^(\d+)[.．、]\s*(.+)$/);
      if (m) suggestions.push(m[2].trim());
    }

    const overviewState = sections['综合评估'] || '';

    const analysis = {
      dateRange: dateRange || '',
      overview: {
        totalScore: total,
        state: overviewState,
        keyFactors: []
      },
      scores,
      review: [],
      suggestions,
      positive: [],
      reportText: text
    };

    return { analysis };
  }
}

