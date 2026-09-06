function parseEventExtras(raw) {
  if (raw == null || raw === '') return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function parseEventImages(raw) {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === 'string');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function serializeEventExtras(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '{}';
  return JSON.stringify(value);
}

function serializeEventImages(value) {
  if (!Array.isArray(value)) return '[]';
  return JSON.stringify(value.filter((x) => typeof x === 'string'));
}

function applyInstantDatetimes(event) {
  if (!event) return event;
  const kind = event.timeKind ?? event.time_kind;
  if (kind !== 'instant') return event;
  const next = { ...event };
  if (Object.prototype.hasOwnProperty.call(next, 'startDatetime')) {
    next.endDatetime = next.startDatetime;
  }
  if (Object.prototype.hasOwnProperty.call(next, 'start_datetime')) {
    next.end_datetime = next.start_datetime;
  }
  return next;
}

function hydrateEventRow(camelEvent) {
  if (!camelEvent) return camelEvent;
  return {
    ...camelEvent,
    timeKind: camelEvent.timeKind || 'interval',
    extras: parseEventExtras(camelEvent.extras),
    images: parseEventImages(camelEvent.images),
  };
}

module.exports = {
  parseEventExtras,
  parseEventImages,
  serializeEventExtras,
  serializeEventImages,
  applyInstantDatetimes,
  hydrateEventRow,
};
module.exports.default = module.exports;
