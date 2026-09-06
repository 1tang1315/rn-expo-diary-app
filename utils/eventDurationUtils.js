const dayjs = require('dayjs');

function isInstantEvent(event) {
  if (!event) return false;
  const kind = event.timeKind ?? event.time_kind;
  return kind === 'instant';
}

function getEventDurationMinutes(event) {
  if (!event || isInstantEvent(event)) return 0;
  const start = event.startDatetime ?? event.start_datetime;
  const end = event.endDatetime ?? event.end_datetime;
  return dayjs(end).diff(dayjs(start), 'minute');
}

module.exports = { isInstantEvent, getEventDurationMinutes };
module.exports.default = module.exports;
