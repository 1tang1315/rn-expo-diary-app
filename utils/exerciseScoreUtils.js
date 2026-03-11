import { getTotalMinutes } from './formatTimeUtils';

const DEFAULT_BODY_WEIGHT_KG = 60;
const ACTIVE_MET_THRESHOLD = 3;
const SEDENTARY_THRESHOLD_MINUTES = 8 * 60;

const MET_KEYWORD_RULES = [
  { label: '跑步', met: 8, keywords: ['跑步', '慢跑', '夜跑', 'run', 'running'] },
  { label: '骑车', met: 6, keywords: ['骑车', '骑行', '单车', '自行车', 'bike', 'bicycle'] },
  { label: '快走', met: 4, keywords: ['快走', '健走', '快步', 'brisk walk'] },
  { label: '慢走', met: 3, keywords: ['慢走', '散步', '走路', '步行', 'walk', 'walking'] },
  { label: '打游戏', met: 1.5, keywords: ['打游戏', '游戏', '电竞', '开黑', 'game', 'gaming'], sedentary: true },
  { label: '刷视频', met: 1.2, keywords: ['刷抖音', '刷视频', '短视频', '抖音', '快手', 'reels', 'shorts'], sedentary: true },
  { label: '看剧', met: 1.3, keywords: ['看剧', '追剧', '电视剧', '看电影', '电影', 'movie', 'tv'], sedentary: true },
  { label: '睡觉', met: 0.9, keywords: ['睡觉', '睡眠', '午睡', 'nap', 'sleep'] }
];

const CATEGORY_MET_FALLBACK = {
  sleep: { met: 0.9, label: '睡眠' },
  sports: { met: 4, label: '运动健康' },
  exercise: { met: 4, label: '运动' },
  entertainment: { met: 1.5, label: '娱乐', sedentary: true }
};

const safeString = (value) => (typeof value === 'string' ? value : '');

const getEventTimeField = (event, camelKey, snakeKey) => event?.[camelKey] ?? event?.[snakeKey];

const classifyEventMET = (event) => {
  const title = safeString(event?.title);
  const description = safeString(event?.description);
  const category = safeString(event?.category).toLowerCase();
  const text = `${title} ${description}`.toLowerCase();

  const keywordMatch = MET_KEYWORD_RULES.find((rule) =>
    rule.keywords.some((keyword) => text.includes(keyword.toLowerCase()))
  );
  if (keywordMatch) {
    return {
      met: keywordMatch.met,
      label: keywordMatch.label,
      sedentary: Boolean(keywordMatch.sedentary)
    };
  }

  if (CATEGORY_MET_FALLBACK[category]) {
    return {
      met: CATEGORY_MET_FALLBACK[category].met,
      label: CATEGORY_MET_FALLBACK[category].label,
      sedentary: Boolean(CATEGORY_MET_FALLBACK[category].sedentary)
    };
  }

  return {
    met: 1.3,
    label: '坐着',
    sedentary: false
  };
};

const calculateEnergyScore = (activeKcal) => {
  if (activeKcal >= 500) return 60;
  if (activeKcal >= 400) return 50;
  if (activeKcal >= 300) return 40;
  if (activeKcal >= 200) return 25;
  if (activeKcal >= 100) return 10;
  return 0;
};

const calculateDurationScore = (exerciseMinutes) => {
  if (exerciseMinutes >= 60) return 25;
  if (exerciseMinutes >= 45) return 20;
  if (exerciseMinutes >= 30) return 15;
  if (exerciseMinutes >= 15) return 8;
  return 0;
};

const calculateContinuityScore = (longestSessionMinutes) => {
  if (longestSessionMinutes >= 40) return 15;
  if (longestSessionMinutes >= 30) return 12;
  if (longestSessionMinutes >= 20) return 8;
  if (longestSessionMinutes >= 10) return 5;
  return 0;
};

const getExerciseLevel = (score) => {
  if (score >= 85) return '非常活跃';
  if (score >= 65) return '健康水平';
  if (score >= 40) return '偏少';
  if (score >= 20) return '不足';
  return '严重缺乏';
};

const buildSuggestionsFromTags = (tags) => {
  const suggestionMap = {
    缺乏运动: '每天至少30分钟运动',
    能量消耗不足: '增加快走或骑车',
    没有有效运动: '尝试一次30分钟连续运动',
    久坐过多: '每1小时起身活动'
  };
  return tags.map((tag) => suggestionMap[tag]).filter(Boolean);
};

/**
 * 计算运动评分 V1
 * @param {Array} events - 事件数组（默认使用已完成事件）
 * @param {Object} options - 计算参数
 * @param {number} options.bodyWeightKg - 体重（kg）
 * @returns {Object} 运动评分结果
 */
export const calculateExerciseScore = (events = [], options = {}) => {
  const bodyWeightKg = Number(options.bodyWeightKg) > 0 ? Number(options.bodyWeightKg) : DEFAULT_BODY_WEIGHT_KG;

  let activeKcal = 0;
  let exerciseTime = 0;
  let longestSession = 0;
  let sedentaryTime = 0;
  const exerciseEvents = [];

  events.forEach((event) => {
    const startTime = getEventTimeField(event, 'startDatetime', 'start_datetime');
    const endTime = getEventTimeField(event, 'endDatetime', 'end_datetime');
    if (!startTime || !endTime) return;

    const minutes = getTotalMinutes(startTime, endTime);
    if (!Number.isFinite(minutes) || minutes <= 0) return;

    const { met, label, sedentary } = classifyEventMET(event);
    const kcal = met * bodyWeightKg * (minutes / 60);

    if (met >= ACTIVE_MET_THRESHOLD) {
      activeKcal += kcal;
      exerciseTime += minutes;
      longestSession = Math.max(longestSession, minutes);
      exerciseEvents.push({
        title: event.title || label,
        category: event.category,
        minutes,
        met,
        kcal: Number(kcal.toFixed(1))
      });
    }

    if (sedentary) {
      sedentaryTime += minutes;
    }
  });

  const energyScore = calculateEnergyScore(activeKcal);
  const durationScore = calculateDurationScore(exerciseTime);
  const continuityScore = calculateContinuityScore(longestSession);
  const totalScore = Math.round(energyScore + durationScore + continuityScore);

  const tags = [];
  if (exerciseTime < 15) tags.push('缺乏运动');
  if (activeKcal < 200) tags.push('能量消耗不足');
  if (longestSession < 10) tags.push('没有有效运动');
  if (sedentaryTime >= SEDENTARY_THRESHOLD_MINUTES) tags.push('久坐过多');

  const suggestions = buildSuggestionsFromTags(tags);

  return {
    totalScore,
    energyScore,
    durationScore,
    continuityScore,
    activeKcal: Number(activeKcal.toFixed(1)),
    exerciseTime,
    longestSession,
    sedentaryTime,
    level: getExerciseLevel(totalScore),
    tags,
    suggestions,
    bodyWeightKg,
    activeEventCount: exerciseEvents.length,
    exerciseEvents
  };
};
