// 时间/日期/时长 处理工具函数

import dayjs from "dayjs";

/**
 * 格式化日期（YYYY-MM-DD）
 * @param date
 * @returns {string|null}
 */
export const formatDate = (date) => {
  if (!date) return null;
  // 如果是字符串且格式正确，直接返回
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  // 否则尝试转换为日期对象处理
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
};

/**
 * 根据开始/结束时间获取总时长(分钟)
 * @param startDateTime - 2025-08-28 22:00
 * @param endDateTime  - 2025-08-28 23:00
 */
export const getTotalMinutes = (startDateTime, endDateTime) => {
  const start = dayjs(startDateTime);
  const end = dayjs(endDateTime);
  return end.diff(start, 'minute');
};

/**
 * 格式化分钟时长函数(大于1小时显示: xx小时xx分钟; 小于1小时 仅显示分钟)
 * @param minutes
 * @returns {string}
 */
export const formatDurationByMinutes = (minutes) => {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}小时` : `${h}小时${m}分钟`;
};