import dayjs from 'dayjs';

export const toDayjs = (value) => {
  if (!value) return dayjs();
  return dayjs(value);
};

export const formatDate = (value) => toDayjs(value).format('YYYY-MM-DD');

export const normalizeDateRange = (startDate, endDate) => {
  const start = toDayjs(startDate).startOf('day');
  const end = endDate ? toDayjs(endDate).endOf('day') : toDayjs(startDate).endOf('day');
  return { start, end };
};

export const getDayRange = (date = new Date()) => {
  const target = toDayjs(date);
  return {
    start: target.startOf('day'),
    end: target.endOf('day')
  };
};

export const getPreviousDayRange = (date = new Date()) => {
  const target = toDayjs(date).subtract(1, 'day');
  return {
    start: target.startOf('day'),
    end: target.endOf('day')
  };
};

export const getWeekRange = (date = new Date()) => {
  const target = toDayjs(date);
  return {
    start: target.startOf('week'),
    end: target.endOf('week')
  };
};

export const getMonthRange = (date = new Date()) => {
  const target = toDayjs(date);
  return {
    start: target.startOf('month'),
    end: target.endOf('month')
  };
};

export const getMinutesBetween = (startDateTime, endDateTime) => {
  const start = toDayjs(startDateTime);
  const end = toDayjs(endDateTime);
  const diff = end.diff(start, 'minute');
  return Number.isFinite(diff) ? Math.max(0, diff) : 0;
};

export const enumerateDates = (startDate, endDate) => {
  const { start, end } = normalizeDateRange(startDate, endDate);
  const dates = [];
  let cursor = start.startOf('day');

  while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
    dates.push(cursor.format('YYYY-MM-DD'));
    cursor = cursor.add(1, 'day');
  }

  return dates;
};

export const clamp = (value, min, max) => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};
