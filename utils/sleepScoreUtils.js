import dayjs from "dayjs";
import { getTotalMinutes } from "./formatTimeUtils.js";

/**
 * 计算睡眠评分
 * @param {Array} sleepEvents - 睡眠事件数组
 * @param {Array} previousSleepEvents - 前一天的睡眠事件数组（用于计算稳定性）
 * @returns {Object} 包含总评分和各维度得分的对象
 */
export const calculateSleepScore = (sleepEvents, previousSleepEvents = []) => {
  // 过滤出睡眠类型的事件，并且只包含结束时间在当天的事件
  const validSleepEvents = sleepEvents.filter(event => {
    if (event.category !== 'sleep' || event.status !== 'completed') {
      return false;
    }
    // 只包含结束时间在当天的事件
    const endDate = dayjs(event.end_datetime);
    const eventEndDate = endDate.format('YYYY-MM-DD');
    // 假设sleepEvents中的事件都是当天的，取第一个事件的日期作为当天日期
    if (sleepEvents.length > 0) {
      const firstEventDate = dayjs(sleepEvents[0].end_datetime).format('YYYY-MM-DD');
      return eventEndDate === firstEventDate;
    }
    return false;
  });

  console.log(validSleepEvents, "validSleepEvents");

  if (validSleepEvents.length === 0) {
    return {
      totalScore: 0,
      durationScore: 0,
      bedtimeScore: 0,
      continuityScore: 0,
      stabilityScore: 0
    };
  }

  // 计算总睡眠时长
  let totalDuration = 0;
  let bedtimes = [];
  let daySleepDuration = 0;

  validSleepEvents.forEach(event => {
    const duration = getTotalMinutes(event.start_datetime, event.end_datetime);
    totalDuration += duration;

    const startTime = dayjs(event.start_datetime);
    bedtimes.push(startTime);

    // 计算白天睡眠时长（6:00-18:00）
    const hour = startTime.hour();
    if (hour >= 6 && hour < 18) {
      daySleepDuration += duration;
    }
  });

  // 找出最晚的入睡时间
  let latestBedtime = null;
  if (bedtimes.length > 0) {
    latestBedtime = bedtimes.reduce((latest, current) =>
      current.hour() >= 18 ? current : latest
      , bedtimes[0]);
  }

  // 找出前一天最晚的入睡时间
  let previousLatestBedtime = null;
  let timeDiff = 0;
  if (previousSleepEvents.length > 0) {
    const yesterdaySleepEvents = previousSleepEvents.filter(event =>
      event.category === 'sleep' && event.status === 'completed'
    );

    if (yesterdaySleepEvents.length > 0) {
      const yesterdayBedtimes = yesterdaySleepEvents.map(event =>
        dayjs(event.start_datetime)
      );

      previousLatestBedtime = yesterdayBedtimes.reduce((latest, current) =>
        current.hour() >= 18 ? current : latest
        , yesterdayBedtimes[0]);

      // 计算入睡时间偏差（分钟）
      if (latestBedtime) {
        const todayHour = latestBedtime.hour();
        const todayMinute = latestBedtime.minute();
        const yesterdayHour = previousLatestBedtime.hour();
        const yesterdayMinute = previousLatestBedtime.minute();

        const todayTotalMinutes = todayHour * 60 + todayMinute;
        const yesterdayTotalMinutes = yesterdayHour * 60 + yesterdayMinute;

        // 计算时间差，考虑跨天的情况
        timeDiff = Math.abs(todayTotalMinutes - yesterdayTotalMinutes);
        if (timeDiff > 720) {
          timeDiff = 1440 - timeDiff;
        }
      }
    }
  }

  // 计算各维度得分
  const durationScore = calculateDurationScore(totalDuration);
  const bedtimeScore = calculateBedtimeScore(bedtimes);
  const continuityScore = calculateContinuityScore(validSleepEvents, daySleepDuration);
  const stabilityScore = calculateStabilityScore(bedtimes, previousSleepEvents);

  // 计算总评分
  const totalScore = Math.round(
    durationScore +
    bedtimeScore +
    continuityScore +
    stabilityScore
  );

  return {
    totalScore,
    durationScore,
    bedtimeScore,
    continuityScore,
    stabilityScore,
    validEvents: validSleepEvents.length,
    totalDuration,
    daySleepDuration,
    eventCount: validSleepEvents.length,
    latestBedtime: latestBedtime ? `${latestBedtime.hour().toString().padStart(2, '0')}:${latestBedtime.minute().toString().padStart(2, '0')}` : null,
    previousLatestBedtime: previousLatestBedtime ? `${previousLatestBedtime.hour().toString().padStart(2, '0')}:${previousLatestBedtime.minute().toString().padStart(2, '0')}` : null,
    timeDiff
  };
};

/**
 * 计算睡眠时长得分（40分）
 * @param {number} minutes - 总睡眠时长（分钟）
 * @returns {number} 时长得分
 */
const calculateDurationScore = (minutes) => {
  const hours = minutes / 60;

  if (hours >= 7 && hours <= 9) {
    return 40;
  } else if (hours >= 6 && hours < 7) {
    return 30;
  } else if (hours >= 5 && hours < 6) {
    return 20;
  } else if (hours < 5) {
    return 10;
  } else if (hours > 9.5) {
    return 30;
  } else {
    return 35; // 9-9.5小时
  }
};

/**
 * 计算入睡时间得分（25分）
 * @param {Array} bedtimes - 入睡时间数组
 * @returns {number} 入睡时间得分
 */
const calculateBedtimeScore = (bedtimes) => {
  if (bedtimes.length === 0) return 0;

  // 找出最晚的入睡时间（通常是晚上睡觉的时间）
  const latestBedtime = bedtimes.reduce((latest, current) =>
    current.hour() >= 18 ? current : latest
    , bedtimes[0]);

  const hour = latestBedtime.hour();
  const minute = latestBedtime.minute();
  const totalMinutes = hour * 60 + minute;

  if (totalMinutes >= 22 * 60 && totalMinutes <= 23 * 60 + 30) {
    return 25;
  } else if (totalMinutes > 23 * 60 + 30 && totalMinutes <= 24 * 60 + 30) {
    return 20;
  } else if (totalMinutes > 24 * 60 + 30 && totalMinutes <= 25 * 60 + 30) {
    return 15;
  } else if (totalMinutes > 25 * 60 + 30) {
    return 5;
  } else {
    return 20; // 22:00之前
  }
};

/**
 * 计算睡眠连续性得分（20分）
 * @param {Array} sleepEvents - 睡眠事件数组
 * @param {number} daySleepDuration - 白天睡眠时长（分钟）
 * @returns {number} 连续性得分
 */
const calculateContinuityScore = (sleepEvents, daySleepDuration) => {
  let score = 20;

  if (sleepEvents.length === 2) {
    // 1次午睡 + 1次晚寝
    score = 18;
  } else if (sleepEvents.length > 2) {
    // 多次碎片睡眠
    score = 10;
  }

  // 白天睡超过2小时的惩罚
  if (daySleepDuration > 120) {
    score = Math.max(0, score - 5);
  }

  return score;
};

/**
 * 计算作息稳定性得分（15分）
 * @param {Array} bedtimes - 今日入睡时间数组
 * @param {Array} previousSleepEvents - 前一天的睡眠事件数组
 * @returns {number} 稳定性得分
 */
const calculateStabilityScore = (bedtimes, previousSleepEvents) => {
  if (bedtimes.length === 0 || previousSleepEvents.length === 0) {
    return 15;
  }

  // 找出今日最晚的入睡时间
  const todayLatestBedtime = bedtimes.reduce((latest, current) =>
    current.hour() >= 18 ? current : latest
    , bedtimes[0]);

  // 找出昨日最晚的入睡时间
  const yesterdaySleepEvents = previousSleepEvents.filter(event =>
    event.category === 'sleep' && event.status === 'completed'
  );

  if (yesterdaySleepEvents.length === 0) {
    return 15;
  }

  const yesterdayBedtimes = yesterdaySleepEvents.map(event =>
    dayjs(event.start_datetime)
  );

  const yesterdayLatestBedtime = yesterdayBedtimes.reduce((latest, current) =>
    current.hour() >= 18 ? current : latest
    , yesterdayBedtimes[0]);

  // 计算入睡时间偏差（分钟），只考虑时间部分
  const todayHour = todayLatestBedtime.hour();
  const todayMinute = todayLatestBedtime.minute();
  const yesterdayHour = yesterdayLatestBedtime.hour();
  const yesterdayMinute = yesterdayLatestBedtime.minute();

  const todayTotalMinutes = todayHour * 60 + todayMinute;
  const yesterdayTotalMinutes = yesterdayHour * 60 + yesterdayMinute;

  // 计算时间差，考虑跨天的情况（例如23:00到22:30应该是30分钟）
  let timeDiff = Math.abs(todayTotalMinutes - yesterdayTotalMinutes);
  if (timeDiff > 720) { // 如果时间差超过12小时，说明是跨天的情况，取较小的差值
    timeDiff = 1440 - timeDiff;
  }

  if (timeDiff < 30) {
    return 15;
  } else if (timeDiff >= 30 && timeDiff < 60) {
    return 10;
  } else if (timeDiff >= 60 && timeDiff < 120) {
    return 5;
  } else {
    return 0;
  }
};