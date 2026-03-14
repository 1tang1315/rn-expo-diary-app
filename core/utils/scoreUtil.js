import dayjs from 'dayjs';
import { clamp, getMinutesBetween } from '@/core/utils/timeUtil';

const DEFAULT_BODY_WEIGHT_KG = 60;
const ACTIVE_MET_THRESHOLD = 3;
const SEDENTARY_THRESHOLD_MINUTES = 8 * 60;

const POSITIVE_MOOD_WORDS = ['开心', '愉快', '满足', '平静', '放松', '高兴', '期待', 'good', 'happy'];
const NEGATIVE_MOOD_WORDS = ['焦虑', '烦躁', '压力', '难过', '生气', '低落', '失眠', 'bad', 'sad'];

const MET_KEYWORD_RULES = [
  { label: '跑步', met: 8, keywords: ['跑步', '慢跑', '夜跑', 'run', 'running'] },
  { label: '骑车', met: 6, keywords: ['骑车', '骑行', '单车', '自行车', 'bike', 'bicycle'] },
  { label: '快走', met: 4, keywords: ['快走', '健走', '快步', 'brisk walk'] },
  { label: '慢走', met: 3, keywords: ['慢走', '散步', '走路', '步行', 'walk', 'walking'] },
  { label: '力量训练', met: 6, keywords: ['健身', '力量', '撸铁', '深蹲', '俯卧撑', 'gym'] },
  { label: '打游戏', met: 1.5, keywords: ['打游戏', '游戏', '电竞', '开黑', 'game', 'gaming'], sedentary: true },
  { label: '刷视频', met: 1.2, keywords: ['刷抖音', '刷视频', '短视频', '抖音', '快手', 'reels', 'shorts'], sedentary: true },
  { label: '看剧', met: 1.3, keywords: ['看剧', '追剧', '电视剧', '看电影', '电影', 'movie', 'tv'], sedentary: true }
];

const CATEGORY_MET_FALLBACK = {
  sleep: { met: 0.9, label: '睡眠' },
  sports: { met: 4, label: '运动健康' },
  exercise: { met: 4, label: '运动' },
  entertainment: { met: 1.5, label: '娱乐', sedentary: true }
};

const safeString = (value) => (typeof value === 'string' ? value : '');
const eventTime = (event, camelKey, snakeKey) => event?.[camelKey] ?? event?.[snakeKey];
const toRound = (value) => Math.round(Number(value) || 0);

const parseBedtimeMinute = (dateTime) => {
  const time = dayjs(dateTime);
  if (!time.isValid()) return null;
  const base = time.hour() * 60 + time.minute();
  return time.hour() < 12 ? base + 24 * 60 : base;
};

/** 晚寝判定：入睡时间在 当日18:00~次日06:00 内（parseBedtimeMinute 下 18:00=1080, 次日06:00=1800） */
const isNightSleepByMinute = (minute) => {
  if (!Number.isFinite(minute)) return false;
  return minute >= 18 * 60 && minute < 24 * 60 + 6 * 60;
};

const formatMinuteToClock = (value) => {
  if (!Number.isFinite(value)) return null;
  const normalized = value % (24 * 60);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const getDurationScore = (minutes) => {
  const hours = minutes / 60;
  if (hours >= 7 && hours <= 9) return 40;
  if (hours >= 6) return 30;
  if (hours >= 5) return 20;
  if (hours < 5) return 10;
  if (hours > 9.5) return 30;
  return 35;
};

const getBedtimeScore = (latestBedtimeMinute) => {
  if (!Number.isFinite(latestBedtimeMinute)) return 0;
  if (latestBedtimeMinute >= 1320 && latestBedtimeMinute <= 1410) return 25;
  if (latestBedtimeMinute <= 1470) return 20;
  if (latestBedtimeMinute <= 1530) return 15;
  return 5;
};

const getContinuityScore = (eventCount, daySleepDuration) => {
  let score = 20;
  if (eventCount === 2) score = 18;
  if (eventCount > 2) score = 10;
  if (daySleepDuration > 120) score = Math.max(0, score - 5);
  return score;
};

const getStabilityScore = (todayBedtimeMinute, previousBedtimeMinute) => {
  if (!Number.isFinite(todayBedtimeMinute) || !Number.isFinite(previousBedtimeMinute)) return 15;

  let diff = Math.abs(todayBedtimeMinute - previousBedtimeMinute);
  if (diff > 12 * 60) diff = 24 * 60 - diff;

  if (diff < 30) return 15;
  if (diff < 60) return 10;
  if (diff < 120) return 5;
  return 0;
};

const classifyEventMET = (event) => {
  const title = safeString(event?.title);
  const description = safeString(event?.description);
  const category = safeString(event?.category).toLowerCase();
  const text = `${title} ${description}`.toLowerCase();

  const keywordMatch = MET_KEYWORD_RULES.find((rule) =>
    rule.keywords.some((keyword) => text.includes(keyword.toLowerCase()))
  );
  if (keywordMatch) {
    return { met: keywordMatch.met, label: keywordMatch.label, sedentary: Boolean(keywordMatch.sedentary) };
  }

  if (CATEGORY_MET_FALLBACK[category]) {
    return {
      met: CATEGORY_MET_FALLBACK[category].met,
      label: CATEGORY_MET_FALLBACK[category].label,
      sedentary: Boolean(CATEGORY_MET_FALLBACK[category].sedentary)
    };
  }

  return { met: 1.3, label: '坐着', sedentary: false };
};

const calculateEnergyScore = (activeKcal) => {
  if (activeKcal >= 500) return 60;
  if (activeKcal >= 400) return 50;
  if (activeKcal >= 300) return 40;
  if (activeKcal >= 200) return 25;
  if (activeKcal >= 100) return 10;
  return 0;
};

const calculateExerciseDurationScore = (minutes) => {
  if (minutes >= 60) return 25;
  if (minutes >= 45) return 20;
  if (minutes >= 30) return 15;
  if (minutes >= 15) return 8;
  return 0;
};

const calculateExerciseContinuityScore = (minutes) => {
  if (minutes >= 40) return 15;
  if (minutes >= 30) return 12;
  if (minutes >= 20) return 8;
  if (minutes >= 10) return 5;
  return 0;
};

const getExerciseLevel = (score) => {
  if (score >= 85) return '非常活跃';
  if (score >= 65) return '健康水平';
  if (score >= 40) return '偏少';
  if (score >= 20) return '不足';
  return '严重缺乏';
};

const getSuggestionFromTags = (tags) => {
  const suggestionMap = {
    缺乏运动: '每天至少30分钟运动',
    能量消耗不足: '增加快走或骑车',
    没有有效运动: '尝试一次30分钟连续运动',
    久坐过多: '每1小时起身活动'
  };
  return tags.map((tag) => suggestionMap[tag]).filter(Boolean);
};

export const calculateSleepScoreFromEvents = (events = [], previousDayEvents = []) => {
  const currentSleepEvents = events.filter((event) => event.category === 'sleep' && event.status === 'completed');
  const previousSleepEvents = previousDayEvents.filter((event) => event.category === 'sleep' && event.status === 'completed');

  if (currentSleepEvents.length === 0) {
    return {
      totalScore: 0,
      durationScore: 0,
      bedtimeScore: 0,
      continuityScore: 0,
      stabilityScore: 0,
      totalDuration: 0,
      daySleepDuration: 0,
      eventCount: 0,
      validEvents: 0,
      latestBedtime: null,
      previousLatestBedtime: null,
      timeDiff: 0
    };
  }

  const totalDuration = currentSleepEvents.reduce((sum, event) => {
    return sum + getMinutesBetween(eventTime(event, 'startDatetime', 'start_datetime'), eventTime(event, 'endDatetime', 'end_datetime'));
  }, 0);

  const daySleepDuration = currentSleepEvents.reduce((sum, event) => {
    const start = dayjs(eventTime(event, 'startDatetime', 'start_datetime'));
    const duration = getMinutesBetween(eventTime(event, 'startDatetime', 'start_datetime'), eventTime(event, 'endDatetime', 'end_datetime'));
    if (start.isValid() && start.hour() >= 6 && start.hour() < 18) {
      return sum + duration;
    }
    return sum;
  }, 0);

  const bedtimeMinutes = currentSleepEvents
    .map((event) => parseBedtimeMinute(eventTime(event, 'startDatetime', 'start_datetime')))
    .filter((value) => Number.isFinite(value) && isNightSleepByMinute(value));
  const latestBedtimeMinute = bedtimeMinutes.length ? Math.max(...bedtimeMinutes) : null;

  const previousBedtimeMinutes = previousSleepEvents
    .map((event) => parseBedtimeMinute(eventTime(event, 'startDatetime', 'start_datetime')))
    .filter((value) => Number.isFinite(value) && isNightSleepByMinute(value));
  const previousLatestBedtimeMinute = previousBedtimeMinutes.length ? Math.max(...previousBedtimeMinutes) : null;

  let timeDiff = 0;
  if (Number.isFinite(latestBedtimeMinute) && Number.isFinite(previousLatestBedtimeMinute)) {
    timeDiff = Math.abs(latestBedtimeMinute - previousLatestBedtimeMinute);
    if (timeDiff > 12 * 60) timeDiff = 24 * 60 - timeDiff;
  }

  const durationScore = getDurationScore(totalDuration);
  const bedtimeScore = getBedtimeScore(latestBedtimeMinute);
  const continuityScore = getContinuityScore(currentSleepEvents.length, daySleepDuration);
  const stabilityScore = getStabilityScore(latestBedtimeMinute, previousLatestBedtimeMinute);
  const totalScore = toRound(durationScore + bedtimeScore + continuityScore + stabilityScore);

  return {
    totalScore,
    durationScore,
    bedtimeScore,
    continuityScore,
    stabilityScore,
    totalDuration,
    daySleepDuration,
    eventCount: currentSleepEvents.length,
    validEvents: currentSleepEvents.length,
    latestBedtime: formatMinuteToClock(latestBedtimeMinute),
    previousLatestBedtime: formatMinuteToClock(previousLatestBedtimeMinute),
    timeDiff
  };
};

export const calculateExerciseScoreFromEvents = (events = [], options = {}) => {
  const bodyWeightKg = Number(options.bodyWeightKg) > 0 ? Number(options.bodyWeightKg) : DEFAULT_BODY_WEIGHT_KG;
  const completedEvents = events.filter((event) => event.status === 'completed');

  let activeKcal = 0;
  let exerciseTime = 0;
  let longestSession = 0;
  let sedentaryTime = 0;
  const exerciseEvents = [];

  completedEvents.forEach((event) => {
    const startTime = eventTime(event, 'startDatetime', 'start_datetime');
    const endTime = eventTime(event, 'endDatetime', 'end_datetime');
    if (!startTime || !endTime) return;

    const minutes = getMinutesBetween(startTime, endTime);
    if (!minutes) return;

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

    if (sedentary) sedentaryTime += minutes;
  });

  const energyScore = calculateEnergyScore(activeKcal);
  const durationScore = calculateExerciseDurationScore(exerciseTime);
  const continuityScore = calculateExerciseContinuityScore(longestSession);
  const totalScore = toRound(energyScore + durationScore + continuityScore);

  const tags = [];
  if (exerciseTime < 15) tags.push('缺乏运动');
  if (activeKcal < 200) tags.push('能量消耗不足');
  if (longestSession < 10) tags.push('没有有效运动');
  if (sedentaryTime >= SEDENTARY_THRESHOLD_MINUTES) tags.push('久坐过多');

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
    suggestions: getSuggestionFromTags(tags),
    bodyWeightKg,
    activeEventCount: exerciseEvents.length,
    exerciseEvents
  };
};

export const calculateDietScore = (statistics) => {
  const mealCount = Number(statistics?.mealCount || 0);
  if (mealCount >= 3 && mealCount <= 4) return 90;
  if (mealCount === 2) return 75;
  if (mealCount === 1) return 55;
  if (mealCount > 4) return 70;
  return 35;
};

export const calculateSportScore = (statistics) => {
  const minutes = Number(statistics?.sportDuration || 0);
  if (minutes >= 60) return 92;
  if (minutes >= 45) return 85;
  if (minutes >= 30) return 75;
  if (minutes >= 15) return 60;
  return 40;
};

export const calculateProductivityScore = (statistics) => {
  const minutes = Number(statistics?.studyDuration || 0);
  if (minutes >= 240) return 95;
  if (minutes >= 180) return 88;
  if (minutes >= 120) return 78;
  if (minutes >= 60) return 65;
  return 45;
};

export const calculateEmotionScore = (events = []) => {
  const moodEvents = events.filter((event) => event.category === 'mood' && event.status === 'completed');
  if (moodEvents.length === 0) {
    return { totalScore: 70, positiveCount: 0, negativeCount: 0, neutralCount: 0 };
  }

  let positiveCount = 0;
  let negativeCount = 0;

  moodEvents.forEach((event) => {
    const text = `${safeString(event.title)} ${safeString(event.description)}`.toLowerCase();
    const positiveHit = POSITIVE_MOOD_WORDS.some((word) => text.includes(word.toLowerCase()));
    const negativeHit = NEGATIVE_MOOD_WORDS.some((word) => text.includes(word.toLowerCase()));
    if (positiveHit && !negativeHit) positiveCount += 1;
    if (negativeHit && !positiveHit) negativeCount += 1;
  });

  const neutralCount = moodEvents.length - positiveCount - negativeCount;
  const rawScore = 75 + positiveCount * 8 - negativeCount * 10;
  const totalScore = clamp(toRound(rawScore), 20, 100);

  return { totalScore, positiveCount, negativeCount, neutralCount };
};

export const calculateBalanceScore = (componentScores) => {
  const values = Object.values(componentScores).map((value) => Number(value) || 0);
  if (!values.length) return 0;

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  return clamp(toRound(100 - std * 1.6), 30, 100);
};

export const calculateTotalScore = (componentScores) => {
  const values = Object.values(componentScores).map((value) => Number(value) || 0);
  if (!values.length) return 0;
  return toRound(values.reduce((sum, value) => sum + value, 0) / values.length);
};

export const buildScoreBundle = ({ statistics, events, previousDayEvents }) => {
  const sleepEvents = events.filter((event) => event.category === 'sleep' && event.status === 'completed');
  const sleepDetails = calculateSleepScoreFromEvents(sleepEvents, previousDayEvents);
  const exerciseDetails = calculateExerciseScoreFromEvents(events);
  const moodDetails = calculateEmotionScore(events);

  const sleepScore = sleepDetails.totalScore;
  const dietScore = calculateDietScore(statistics);
  const sportScore = exerciseDetails.totalScore;
  const productivityScore = calculateProductivityScore(statistics);
  const emotionScore = moodDetails.totalScore;
  const balanceScore = calculateBalanceScore({
    sleepScore,
    dietScore,
    sportScore,
    productivityScore,
    emotionScore
  });

  const totalScore = calculateTotalScore({
    sleepScore,
    dietScore,
    sportScore,
    productivityScore,
    emotionScore,
    balanceScore
  });

  return {
    statistics,
    scores: {
      sleepScore,
      dietScore,
      sportScore,
      productivityScore,
      emotionScore,
      balanceScore,
      totalScore
    },
    components: {
      sleep: { totalScore: sleepScore, details: sleepDetails, events: sleepEvents },
      diet: { totalScore: dietScore, details: { mealCount: statistics.mealCount } },
      exercise: { totalScore: sportScore, details: exerciseDetails },
      productivity: { totalScore: productivityScore, details: { studyDuration: statistics.studyDuration } },
      mood: { totalScore: emotionScore, details: moodDetails },
      balance: { totalScore: balanceScore }
    }
  };
};

export const buildSleepCalculationProcess = (dateLabel, sleepDetails) => {
  if (!sleepDetails || !sleepDetails.eventCount) return `# ${dateLabel} 睡眠评分\n\n暂无睡眠数据`;

  return `# ${dateLabel} 睡眠评分计算

## 1) 睡眠时长
- 总时长：${Math.floor(sleepDetails.totalDuration / 60)}小时${sleepDetails.totalDuration % 60}分钟
- 得分：${sleepDetails.durationScore}/40

## 2) 入睡时间
- 最晚入睡：${sleepDetails.latestBedtime || '无'}
- 得分：${sleepDetails.bedtimeScore}/25

## 3) 连续性
- 事件数量：${sleepDetails.eventCount}
- 白天睡眠：${Math.floor(sleepDetails.daySleepDuration / 60)}小时${sleepDetails.daySleepDuration % 60}分钟
- 得分：${sleepDetails.continuityScore}/20

## 4) 稳定性
- 与前一日偏差：${sleepDetails.timeDiff || 0}分钟
- 得分：${sleepDetails.stabilityScore}/15

## 5) 总分
- ${sleepDetails.durationScore} + ${sleepDetails.bedtimeScore} + ${sleepDetails.continuityScore} + ${sleepDetails.stabilityScore} = **${sleepDetails.totalScore}**`;
};

export const buildExerciseCalculationProcess = (dateLabel, details) => {
  if (!details) return `# ${dateLabel} 运动评分\n\n暂无运动数据`;

  return `# ${dateLabel} 运动评分计算

## 1) 能量消耗
- active_kcal：${details.activeKcal} kcal
- 得分：${details.energyScore}/60

## 2) 运动时长
- exercise_time：${details.exerciseTime} 分钟
- 得分：${details.durationScore}/25

## 3) 连续性
- longest_session：${details.longestSession} 分钟
- 得分：${details.continuityScore}/15

## 4) 总分
- ${details.energyScore} + ${details.durationScore} + ${details.continuityScore} = **${details.totalScore}**

## 5) 标签
${details.tags?.length ? details.tags.map((tag) => `- ${tag}`).join('\n') : '- 无'}`;
};
