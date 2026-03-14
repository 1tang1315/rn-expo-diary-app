import { EventService } from '@/core/service/EventService';
import { calculateSleepScoreFromEvents } from '@/core/utils';
import dayjs from 'dayjs';

export class SleepService {
  constructor() {
    this.eventService = new EventService();
  }

  /**
   * 内部核心分析逻辑，返回睡眠分析所需的完整上下文
   * 对外接口可以基于该结果拆分返回更“纯粹”的数据
   */
  async buildSleepAnalysis(params = {}) {
    const { startDate } = params;

    const target = dayjs(startDate, 'YYYY-MM-DD', true);
    if (!target.isValid()) {
      throw new Error('无效的日期格式');
    }

    const currentDateStr = target.format('YYYY-MM-DD');
    const previousDateStr = target.subtract(1, 'day').format('YYYY-MM-DD');
    const twoDaysAgoDateStr = target.subtract(2, 'day').format('YYYY-MM-DD');

    const [eventsToday, eventsYesterday, eventsTwoDaysAgo] = await Promise.all([
      this.eventService.getByDateRangeAndCategory(currentDateStr, currentDateStr, 'sleep', 'desc'),
      this.eventService.getByDateRangeAndCategory(previousDateStr, previousDateStr, 'sleep', 'desc'),
      this.eventService.getByDateRangeAndCategory(twoDaysAgoDateStr, twoDaysAgoDateStr, 'sleep', 'desc')
    ]);

    // 过滤睡眠事件：按结束时间过滤出当天的睡眠数据
    const filterSleepEventsByStartTime = (events, targetDate) => {
      const targetDateObj = dayjs(targetDate);
      const targetDateStr = targetDateObj.format('YYYY-MM-DD');

      return events.filter(event => {
        // 按结束时间确定归属日期
        const end = dayjs(event.endDatetime || event.end_datetime || event.startDatetime || event.start_datetime);
        if (!end.isValid()) return false;
        const endDateStr = end.format('YYYY-MM-DD');
        return endDateStr === targetDateStr;
      });
    };

    // 过滤当日与昨日的睡眠事件
    const filteredSleepEventsToday = filterSleepEventsByStartTime(eventsToday, currentDateStr);
    const filteredSleepEventsYesterday = filterSleepEventsByStartTime(eventsYesterday, previousDateStr);

    // 当日与昨日的睡眠评分明细（昨日需要用前一日作为参考）
    const sleepDetails = calculateSleepScoreFromEvents(filteredSleepEventsToday, eventsYesterday);
    const sleepDetailsYesterday = calculateSleepScoreFromEvents(filteredSleepEventsYesterday, eventsTwoDaysAgo);

    // 四个维度的满分和占比（总占比 100）
    const dimensions = [
      { key: 'durationScore', label: '睡眠时长', maxScore: 40, ratio: 40 },
      { key: 'bedtimeScore', label: '入睡时间', maxScore: 25, ratio: 25 },
      { key: 'continuityScore', label: '连续性', maxScore: 20, ratio: 20 },
      { key: 'stabilityScore', label: '稳定性', maxScore: 15, ratio: 15 }
    ];

    // 处理事件数据
    const sleepEvents = filteredSleepEventsToday;
    const nightSleepEvents = sleepEvents.filter(e => this.isNightSleepEvent(e));
    const daySleepEvents = sleepEvents.filter(e => this.isDaySleepEvent(e));
    const wakeMentionCount = this.countWakeMentions(sleepEvents);
    const bedtimeDay0 = sleepDetails.latestBedtime || this.getLatestBedtimeFromEvents(filteredSleepEventsToday);
    const bedtimeDay1 = sleepDetails.previousLatestBedtime || this.getLatestBedtimeFromEvents(eventsYesterday);
    const bedtimeDay2 = this.getLatestBedtimeFromEvents(eventsTwoDaysAgo);

    const breakdown = dimensions.map((dim) => {
      const originScore = Number(sleepDetails[dim.key] || 0); // 当日原始分
      const percentScore = dim.maxScore > 0 ? Math.round((originScore / dim.maxScore) * 100) : 0; // 当日百分制
      const ratioScore = Math.round(percentScore * (dim.ratio / 100)); // 当日占比折算分

      // 昨日对应维度分数（用于对比）
      const originScoreYesterday = sleepDetailsYesterday
        ? Number(sleepDetailsYesterday[dim.key] || 0)
        : 0;
      const percentScoreYesterday =
        dim.maxScore > 0 && originScoreYesterday
          ? Math.round((originScoreYesterday / dim.maxScore) * 100)
          : 0;
      const ratioScoreYesterday = Math.round(
        percentScoreYesterday * (dim.ratio / 100)
      );

      // 与昨日对比（百分制差值；正数为提升，负数为下降）
      const changePercent = percentScore - percentScoreYesterday;

      // 生成详情文本
      let detailText = `# ${dim.label}详情\n\n`;
      if (dim.label.includes('时长')) {
        const totalDuration = sleepDetails.totalDuration || 0;
        const durationHours = totalDuration / 60;
        let durationRange = '';
        let scoreReason = '';

        if (durationHours < 6) {
          durationRange = '不足6小时';
          scoreReason = '睡眠时长不足，影响身体恢复和白天精力';
        } else if (durationHours >= 6 && durationHours < 7) {
          durationRange = '6-7小时';
          scoreReason = '睡眠时长偏少，建议适当增加';
        } else if (durationHours >= 7 && durationHours <= 9) {
          durationRange = '7-9小时（理想范围）';
          scoreReason = '睡眠时长在理想范围内，有助于身体充分恢复';
        } else {
          durationRange = '超过9小时';
          scoreReason = '睡眠时长偏长，可能影响白天活动效率';
        }

        detailText += `## 得分情况\n- 得分：${percentScore}分\n- 满分：100分\n- 占比：${dim.ratio}%\n\n`;
        detailText += `## 详细数据\n`;

        // 原始数据：各段睡眠事件及时长，并汇总得出总时长
        const segmentHours = [];
        if (sleepEvents.length > 0) {
          sleepEvents.forEach(event => {
            const start = dayjs(event.startDatetime || event.start_datetime);
            const end = dayjs(event.endDatetime || event.end_datetime || event.startDatetime || event.start_datetime);
            const durationMinutes = end.diff(start, 'minute');
            const durationHours = durationMinutes / 60;
            segmentHours.push(durationHours);
            const durationStr = durationHours >= 1 ? `${durationHours.toFixed(1)}小时` : `${durationMinutes}分钟`;
            const title = event.title || '睡眠';
            detailText += `>- ${start.format('HH:mm')}~${end.format('HH:mm')}（${durationStr}）：${title}\n`;
          });
          const sumExpr = segmentHours.map(h => h >= 1 ? `${h.toFixed(1)}小时` : `${Math.round(h * 60)}分钟`).join(' + ');
          detailText += `\n- 各段相加：${sumExpr} = **${durationHours.toFixed(1)}小时**\n`;
        }

        detailText += `- 实际睡眠时长：${durationHours.toFixed(1)}小时\n- 睡眠时长区间：${durationRange}\n\n`;
        detailText += `## 得分原因\n${scoreReason}\n\n`;
        detailText += `## 说明\n根据睡眠时长计算得分，理想睡眠时长为7-9小时，在此范围内得分最高。`;
      } else if (dim.label.includes('入睡')) {
        const bedtimeStr = bedtimeDay0 || '—';
        const bedtimeNum = bedtimeStr !== '—' ? (() => {
          const [h, m] = bedtimeStr.split(':').map(Number);
          // 调整凌晨时间（0-6点）为24-30，便于时间范围判断
          const adjustedHour = h < 6 ? h + 24 : h;
          return adjustedHour + m / 60;
        })() : null;
        let bedtimeRange = '';
        let scoreReason = '';

        if (bedtimeNum != null) {
          if (18 < bedtimeNum && bedtimeNum < 22) {
            bedtimeRange = '早于22:00';
            scoreReason = '入睡时间过早，可能影响白天活动安排';
          } else if (bedtimeNum >= 22 && bedtimeNum <= 23.5) {
            bedtimeRange = '22:00-23:30（理想范围）';
            scoreReason = '入睡时间在理想范围内，有助于保证充足睡眠';
          } else if (bedtimeNum > 23.5 && bedtimeNum <= 25) {
            bedtimeRange = '23:30-01:00';
            scoreReason = '入睡时间偏晚，建议适当提前';
          } else {
            bedtimeRange = '晚于01:00';
            scoreReason = '入睡时间过晚，可能影响睡眠质量和白天精力';
          }
        } else {
          bedtimeRange = '暂无数据';
          scoreReason = '当日无晚寝记录，无法计算入睡时间';
        }

        detailText += `## 得分情况\n- 得分：${percentScore}分\n- 满分：100分\n- 占比：${dim.ratio}%\n\n`;
        detailText += `## 详细数据\n`;
        if (nightSleepEvents.length > 0) {
          detailText += `当日晚寝事件：\n`;
          nightSleepEvents.forEach(event => {
            const start = dayjs(event.startDatetime || event.start_datetime);
            const end = dayjs(event.endDatetime || event.end_datetime || event.startDatetime || event.start_datetime);
            const durationMinutes = end.diff(start, 'minute');
            const durationStr = durationMinutes >= 60 ? `${(durationMinutes / 60).toFixed(1)}小时` : `${durationMinutes}分钟`;
            const title = event.title || '睡眠';
            detailText += `>- ${start.format('HH:mm')}~${end.format('HH:mm')}（${durationStr}）：${title}\n`;
          });
          detailText += `\n`;
        }
        detailText += `- 实际入睡时间（取最晚一段）：**${bedtimeStr}**\n- 入睡时间区间：${bedtimeRange}\n\n`;
        detailText += `## 得分原因\n${scoreReason}\n\n`;
        detailText += `## 说明\n根据入睡时间计算得分，理想入睡时间为22:00-23:30，在此范围内得分最高。取当日晚寝事件中最晚的开始时间作为入睡时间。`;
      } else if (dim.label.includes('连续')) {
        const continuityScoreVal = Number(sleepDetails.continuityScore ?? sleepDetails.continuity ?? 0);
        const continuityPercent = 20 > 0 ? Math.round((continuityScoreVal / 20) * 100) : 0;
        let continuityLevel = '';
        let scoreReason = '';

        if (continuityScoreVal >= 18) {
          continuityLevel = '优秀（中断少）';
          scoreReason = '睡眠连续性好，中断次数少，睡眠质量高';
        } else if (continuityScoreVal >= 14) {
          continuityLevel = '良好';
          scoreReason = '睡眠连续性较好，偶尔有中断';
        } else if (continuityScoreVal >= 10) {
          continuityLevel = '一般';
          scoreReason = '睡眠连续性一般，有一定中断';
        } else {
          continuityLevel = '较差（中断多）';
          scoreReason = '睡眠连续性差，中断次数多，影响睡眠质量';
        }

        detailText += `## 得分情况\n- 得分：${percentScore}分\n- 满分：100分\n- 占比：${dim.ratio}%\n\n`;
        detailText += `## 详细数据\n`;

        const daySleepMinutes = sleepDetails.daySleepDuration || 0;
        const daySleepHours = (daySleepMinutes / 60).toFixed(1);
        detailText += `**白天睡眠**（6:00–18:00 开始的睡眠）：${daySleepEvents.length} 段，合计 ${daySleepHours} 小时\n`;
        if (daySleepEvents.length > 0) {
          daySleepEvents.forEach(event => {
            const start = dayjs(event.startDatetime || event.start_datetime);
            const end = dayjs(event.endDatetime || event.end_datetime || event.startDatetime || event.start_datetime);
            const durationMinutes = end.diff(start, 'minute');
            const durationStr = durationMinutes >= 60 ? `${(durationMinutes / 60).toFixed(1)}小时` : `${durationMinutes}分钟`;
            detailText += `>- ${start.format('HH:mm')}~${end.format('HH:mm')}（${durationStr}）\n`;
          });
        }

        detailText += `\n**晚寝睡眠**（18:00 后或 6:00 前开始的睡眠）：${nightSleepEvents.length} 段\n`;
        if (nightSleepEvents.length > 0) {
          nightSleepEvents.forEach(event => {
            const start = dayjs(event.startDatetime || event.start_datetime);
            const end = dayjs(event.endDatetime || event.end_datetime || event.startDatetime || event.start_datetime);
            const durationMinutes = end.diff(start, 'minute');
            const durationStr = durationMinutes >= 60 ? `${(durationMinutes / 60).toFixed(1)}小时` : `${durationMinutes}分钟`;
            const title = event.title || '睡眠';
            detailText += `>- ${start.format('HH:mm')}~${end.format('HH:mm')}（${durationStr}）：${title}\n`;
          });
        }

        detailText += `\n- 描述中提及「醒来/半夜醒/起夜」等：**${wakeMentionCount}** 处（供参考）\n`;
        detailText += `- 当日睡眠段数：**${sleepDetails.eventCount || 0}** 段（段数越少、白天睡眠越短，连续性得分越高）\n`;
        detailText += `- 睡眠连续性得分：${continuityScoreVal}/20（约 ${continuityPercent}%）\n- 连续性等级：${continuityLevel}\n\n`;
        detailText += `## 得分原因\n${scoreReason}\n\n`;
        detailText += `## 说明\n连续性根据当日睡眠段数及白天睡眠时长计算；描述中的「醒来」次数供参考，可辅助判断夜间是否中断。`;
      } else if (dim.label.includes('稳定')) {
        const stabilityScoreVal = Number(sleepDetails.stabilityScore ?? sleepDetails.stability ?? 0);
        const stabilityPercent = 15 > 0 ? Math.round((stabilityScoreVal / 15) * 100) : 0;
        let stabilityLevel = '';
        let scoreReason = '';

        if (stabilityScoreVal >= 12) {
          stabilityLevel = '优秀（规律）';
          scoreReason = '作息时间稳定，入睡和起床时间规律';
        } else if (stabilityScoreVal >= 9) {
          stabilityLevel = '良好';
          scoreReason = '作息时间较为稳定，有一定规律';
        } else if (stabilityScoreVal >= 6) {
          stabilityLevel = '一般';
          scoreReason = '作息时间稳定性一般，有波动';
        } else {
          stabilityLevel = '较差（不规律）';
          scoreReason = '作息时间不稳定，入睡和起床时间波动较大';
        }

        const date0 = target.format('YYYY-MM-DD');
        const date1 = target.subtract(1, 'day').format('YYYY-MM-DD');
        const date2 = target.subtract(2, 'day').format('YYYY-MM-DD');

        detailText += `## 得分情况\n- 得分：${percentScore}分\n- 满分：100分\n- 占比：${dim.ratio}%\n\n`;
        detailText += `## 详细数据\n`;
        detailText += `近 3 天晚寝入睡时间（用于计算稳定性）：\n`;
        detailText += `>- **当日**（${date0}）：入睡 **${bedtimeDay0 || '—'}**\n`;
        detailText += `>- **前 1 天**（${date1}）：入睡 **${bedtimeDay1 || '—'}**\n`;
        detailText += `>- **前 2 天**（${date2}）：入睡 **${bedtimeDay2 || '—'}**\n\n`;
        detailText += `- 稳定性得分：${stabilityScoreVal}/15（约 ${stabilityPercent}%）\n`;
        detailText += `- 稳定性等级：${stabilityLevel}\n\n`;
        detailText += `## 得分原因\n${scoreReason}\n\n`;
        detailText += `## 说明\n根据当日与前一日入睡时间差值计算稳定性，差值越小得分越高；上表展示 3 天数据便于查看作息规律。`;
      } else {
        detailText += `## 得分情况\n- 得分：${percentScore}分\n- 满分：100分\n- 占比：${dim.ratio}%\n\n`;
        detailText += `## 说明\n根据相关指标计算得分。`;
      }

      return {
        key: dim.key,
        label: dim.label,
        value: ratioScore, // 当日占比折算分（用于构成总分的维度对比）
        originScore, // 当日原始分
        maxScore: dim.maxScore,
        ratio: dim.ratio, // 占比（例如 40 表示 40%）
        percentScore, // 当日百分制得分（0-100）
        ratioScore, // 当日占比折算分（对总分的贡献）
        // 与昨日对比相关字段
        originScoreYesterday,
        percentScoreYesterday,
        ratioScoreYesterday,
        changePercent,
        detailText // 详情文本（Markdown）
      };
    });

    // 总分 = 各维度当日占比折算分之和（百分制）
    const totalScore = breakdown.reduce((sum, item) => sum + item.ratioScore, 0);

    // 昨日总分 = 各维度昨日占比折算分之和（百分制）
    const totalScoreYesterday = breakdown.reduce(
      (sum, item) => sum + (item.ratioScoreYesterday || 0),
      0
    );

    const aiAdvice = this.buildSleepAdvice(sleepDetails);

    // 当天睡眠事件列表：不再区分白天/晚寝，但仍返回总时长和维度贡献分
    const formatOneEvent = (event) => {
      const start = dayjs(event.startDatetime || event.start_datetime);
      const end = dayjs(event.endDatetime || event.end_datetime || event.startDatetime || event.start_datetime);
      const durationMinutes = end.diff(start, 'minute');
      const durationHours = durationMinutes / 60;
      const durationStr = durationHours >= 1 ? `${durationHours.toFixed(1)}小时` : `${durationMinutes}分钟`;
      return {
        timeRange: `${start.format('HH:mm')}~${end.format('HH:mm')}`,
        duration: durationStr,
        title: event.title || '睡眠',
        description: event.content || event.description || ''
      };
    };

    // 使用总分钟数计算当日总时长字符串
    const totalMinutes = sleepDetails.totalDuration || 0;
    const totalDurationStr =
      totalMinutes >= 60 ? `${(totalMinutes / 60).toFixed(1)}小时` : `${totalMinutes}分钟`;

    // 统一为单一分组：category=睡眠，events 为当天全部睡眠事件
    const eventData =
      sleepEvents.length > 0
        ? [
            {
              category: '睡眠',
              totalDuration: totalDurationStr,
              contribution: `${totalScore}分`,
              events: sleepEvents.map(formatOneEvent)
            }
          ]
        : [];

    return {
      totalScore,
      totalScoreYesterday,
      breakdown,
      aiAdvice,
      events: eventData,
      sleepDetails,
      sleepDetailsYesterday
    };
  }

  /**
   * 兼容旧接口：仍然返回综合结构
   */
  async getSleepDetail(params = {}) {
    const analysis = await this.buildSleepAnalysis(params);
    return {
      totalScore: analysis.totalScore,
      breakdown: analysis.breakdown,
      aiAdvice: analysis.aiAdvice,
      events: analysis.events
    };
  }

  /**
   * 返回总分
   */
  async getSleepScoreSummary(params = {}) {
    const analysis = await this.buildSleepAnalysis(params);
    return {
      totalScore: analysis.totalScore
    };
  }

  /**
   * 返回各维度概览
   */
  async getSleepBreakdown(params = {}) {
    const analysis = await this.buildSleepAnalysis(params);
    const items = analysis.breakdown.map(({ detailText, ...rest }) => rest);
    return {
      items
    };
  }

  /**
   * 按维度 key 获取对应的 Markdown 详情
   */
  async getSleepBreakdownDetail(params = {}) {
    const { startDate, key } = params;
    if (!key) {
      throw new Error('缺少维度 key');
    }
    const analysis = await this.buildSleepAnalysis({ startDate });
    const item = analysis.breakdown.find(d => d.key === key);
    return {
      key,
      label: item?.label || '',
      detailText: item?.detailText || ''
    };
  }

  /**
   * 返回事件列表数据
   */
  async getSleepEvents(params = {}) {
    const analysis = await this.buildSleepAnalysis(params);
    return {
      events: analysis.events
    };
  }

  /**
   * 返回 AI 建议
   */
  async getSleepAdvice(params = {}) {
    const analysis = await this.buildSleepAnalysis(params);
    return analysis.aiAdvice;
  }

  buildSleepAdvice(details) {
    const suggestions = [];

    if (!details || !details.eventCount) {
      return {
        summary: '当前日期暂无有效睡眠记录，建议坚持记录睡眠以获得更准确的分析结果。',
        suggestions: [
          '睡前简单记录入睡和起床时间，帮助建立稳定作息。',
          '尽量保持固定的睡眠时间窗口，比如 23:00 前入睡，7:00 左右起床。'
        ]
      };
    }

    const { durationScore, bedtimeScore, continuityScore, stabilityScore } = details;

    if (durationScore < 40) {
      suggestions.push('适当延长夜间连续睡眠时长，尽量保证 7-9 小时的总睡眠时间。');
    } else {
      suggestions.push('继续保持当前的睡眠时长，7-9 小时的睡眠有助于恢复精力。');
    }

    if (bedtimeScore < 25) {
      suggestions.push('尝试将入睡时间逐步提前到 22:00-23:30 区间，减少过晚入睡。');
    }

    if (continuityScore < 20) {
      suggestions.push('减少碎片化睡眠，避免频繁小睡，尽量形成 1 次午休 + 1 次夜间睡眠的结构。');
    }

    if (stabilityScore < 15) {
      suggestions.push('保持相对固定的入睡时间，避免入睡时间每天波动过大。');
    }

    if (suggestions.length === 0) {
      suggestions.push('当前睡眠结构和作息较为理想，继续保持即可。');
    }

    return {
      summary: '基于当日睡眠时长、入睡时间、连续性与稳定性综合评估出的睡眠评分。',
      suggestions
    };
  }

  // 辅助方法：判断是否为夜间睡眠事件
  isNightSleepEvent(event) {
    const start = dayjs(event.startDatetime || event.start_datetime);
    if (!start.isValid()) return false;
    const hour = start.hour();
    return hour >= 21 || hour < 6;
  }

  // 辅助方法：判断是否为白天睡眠事件
  isDaySleepEvent(event) {
    const start = dayjs(event.startDatetime || event.start_datetime);
    if (!start.isValid()) return false;
    const hour = start.hour();
    return hour >= 6 && hour < 21;
  }

  // 辅助方法：统计睡眠事件中提到醒来的次数
  countWakeMentions(events) {
    let count = 0;
    const wakeKeywords = ['醒来', '半夜醒', '起夜', '惊醒', '醒了'];
    events.forEach(event => {
      const content = (event.content || event.description || '').toLowerCase();
      wakeKeywords.forEach(keyword => {
        if (content.includes(keyword.toLowerCase())) {
          count++;
        }
      });
    });
    return count;
  }

  // 辅助方法：从事件中获取最晚的入睡时间
  getLatestBedtimeFromEvents(events) {
    let latestBedtime = null;
    let latestHour = -1;
    let latestMinute = -1;

    events.forEach(event => {
      const start = dayjs(event.startDatetime || event.start_datetime);
      if (!start.isValid()) return;
      const hour = start.hour();
      const minute = start.minute();

      // 考虑到入睡时间可能在凌晨（0-6点），需要特殊处理
      const adjustedHour = hour < 6 ? hour + 24 : hour;
      if (adjustedHour > latestHour || (adjustedHour === latestHour && minute > latestMinute)) {
        latestHour = adjustedHour;
        latestMinute = minute;
        latestBedtime = start.format('HH:mm');
      }
    });

    return latestBedtime;
  }
}
