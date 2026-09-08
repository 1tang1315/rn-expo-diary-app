const {
  SPORTS_RECORD_TYPES,
  SPORTS_RECORD_TYPE_OPTIONS,
  ROUTINE_TEMPLATES,
} = require('../constants/sportsConstants.js');
const { EVENT_TIME_KIND } = require('../constants/eventTimeKindPolicy.js');

function createDefaultSportsExtras(overrides = {}) {
  return {
    recordType: SPORTS_RECORD_TYPES.SINGLE,
    actionName: '',
    reps: 10,
    sets: 1,
    routineId: ROUTINE_TEMPLATES[0]?.id || 'baduanjin',
    routineName: ROUTINE_TEMPLATES[0]?.name || '八段锦',
    ...overrides,
  };
}

function normalizeSportsExtras(extras = {}) {
  const recordType = SPORTS_RECORD_TYPE_OPTIONS.some((o) => o.id === extras.recordType)
    ? extras.recordType
    : SPORTS_RECORD_TYPES.SINGLE;
  const template = ROUTINE_TEMPLATES.find((t) => t.id === extras.routineId) || ROUTINE_TEMPLATES[0];
  const reps = Number.isFinite(Number(extras.reps)) && Number(extras.reps) > 0
    ? Math.floor(Number(extras.reps))
    : 10;
  const sets = Number.isFinite(Number(extras.sets)) && Number(extras.sets) > 0
    ? Math.floor(Number(extras.sets))
    : 1;
  return {
    recordType,
    actionName: typeof extras.actionName === 'string' ? extras.actionName : '',
    reps,
    sets,
    routineId: template.id,
    routineName: extras.routineName || template.name,
  };
}

function suggestTimeKindForSportsExtras(extras) {
  const n = normalizeSportsExtras(extras);
  return n.recordType === SPORTS_RECORD_TYPES.SINGLE
    ? EVENT_TIME_KIND.INSTANT
    : EVENT_TIME_KIND.INTERVAL;
}

function suggestIconForSportsExtras(extras) {
  const n = normalizeSportsExtras(extras);
  if (n.recordType === SPORTS_RECORD_TYPES.ROUTINE) {
    const t = ROUTINE_TEMPLATES.find((r) => r.id === n.routineId);
    return t?.icon || 'self-improvement';
  }
  return 'directions-run';
}

function formatSportsExtrasSummary(extras) {
  const n = normalizeSportsExtras(extras);
  if (n.recordType === SPORTS_RECORD_TYPES.ROUTINE) {
    return n.routineName || '整套动作';
  }
  const name = n.actionName?.trim() || '运动';
  return `${name} · ${n.reps}次${n.sets > 1 ? ` × ${n.sets}组` : ''}`;
}

module.exports = {
  createDefaultSportsExtras,
  normalizeSportsExtras,
  suggestTimeKindForSportsExtras,
  suggestIconForSportsExtras,
  formatSportsExtrasSummary,
};
module.exports.default = module.exports;
