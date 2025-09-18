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
 * 格式化时间（HH:mm）
 * @param date - Date对象或时间字符串
 * @returns {string|null} 格式化后的时间（如"15:30"），无效输入返回null
 */
export const formatTime = (date) => {
  if (!date) return null;
  const dayjsObj = dayjs(date);
  return dayjsObj.isValid() ? dayjsObj.format("HH:mm") : null;
};

/**
 * 格式化日期时间（YYYY-MM-DD HH:mm）
 * @param date - Date对象或时间字符串
 * @returns {string|null} 格式化后的日期时间（如"2025-09-17 15:30"），无效输入返回null
 */
export const formatDatetime = (date) => {
  if (!date) return null;
  const dayjsObj = dayjs(date);
  return dayjsObj.isValid() ? dayjsObj.format("YYYY-MM-DD HH:mm") : null;
};

/**
 * 获取本地时区时间字符串（格式：YYYY-MM-DD HH:mm:ss）
 * @returns {string} 本地时间字符串（如：2025-09-17 15:44:22）
 */
export function getLocalDateTimeByDayjs() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

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