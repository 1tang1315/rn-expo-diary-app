import dayjs from "dayjs";

/**
 * 获取本地时区时间字符串（格式：YYYY-MM-DD HH:mm:ss）
 * @returns {string} 本地时间字符串（如：2025-09-17 15:44:22）
 */
export function getLocalDateTimeByDayjs() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}
