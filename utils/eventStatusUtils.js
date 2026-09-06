const isSameDate = (date1, date2) => (
  date1.getFullYear() === date2.getFullYear()
  && date1.getMonth() === date2.getMonth()
  && date1.getDate() === date2.getDate()
);

function getFinalStatus(item, now = new Date()) {
  const ONE_HOUR = 60 * 60 * 1000;
  const startTime = new Date(item.startDatetime);
  const endTime = new Date(item.endDatetime);
  const timeToStart = startTime - now;
  const kind = item.timeKind ?? item.time_kind;

  if (item.status === 'notCompleted') {
    return item.status;
  }

  if (kind === 'instant') {
    if (now > startTime) return 'completed';
    const isStartToday = isSameDate(startTime, now);
    const isStartFuture = startTime > now && !isStartToday;
    if (timeToStart > 0) {
      if (isStartToday && timeToStart <= ONE_HOUR) return 'upcoming';
      if (isStartFuture || (isStartToday && timeToStart > ONE_HOUR)) return 'early';
    }
    return 'completed';
  }

  const isStartToday = isSameDate(startTime, now);
  const isEndToday = isSameDate(endTime, now);
  const isStartFuture = startTime > now && !isStartToday;
  const isEndPast = endTime < now && !isEndToday;

  let finalStatus = item.status;

  if (isEndPast || (isEndToday && now > endTime)) {
    finalStatus = 'completed';
  } else if (
    (startTime < now && endTime > now)
    || (isStartToday && isEndToday && now >= startTime && now <= endTime)
  ) {
    finalStatus = 'inProgress';
  } else if (timeToStart > 0) {
    if (isStartToday && timeToStart <= ONE_HOUR) {
      finalStatus = 'upcoming';
    } else if (isStartFuture || (isStartToday && timeToStart > ONE_HOUR)) {
      finalStatus = 'early';
    }
  }

  return finalStatus;
}

module.exports = { getFinalStatus, isSameDate };
module.exports.default = module.exports;
