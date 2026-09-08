const {
  DIET_RECORD_TYPES,
  MEAL_SLOTS,
  WATER_MODES,
  MEAL_SLOT_OPTIONS,
  DIET_RECORD_TYPE_OPTIONS,
  WATER_MODE_OPTIONS,
  MEAL_SLOT_ICONS,
  RECORD_TYPE_ICONS,
} = require('../constants/dietConstants.js');
const { EVENT_TIME_KIND } = require('../constants/eventTimeKindPolicy.js');

function createDefaultDietExtras(overrides = {}) {
  return {
    recordType: DIET_RECORD_TYPES.MEAL,
    mealSlot: MEAL_SLOTS.BREAKFAST,
    waterMode: WATER_MODES.SIP,
    sipCount: 1,
    containerId: null,
    ...overrides,
  };
}

function normalizeDietExtras(extras = {}) {
  if (!extras || typeof extras !== 'object') {
    return createDefaultDietExtras();
  }
  const recordType = DIET_RECORD_TYPE_OPTIONS.some((o) => o.id === extras.recordType)
    ? extras.recordType
    : DIET_RECORD_TYPES.MEAL;
  const mealSlot = MEAL_SLOT_OPTIONS.some((o) => o.id === extras.mealSlot)
    ? extras.mealSlot
    : MEAL_SLOTS.BREAKFAST;
  const waterMode = WATER_MODE_OPTIONS.some((o) => o.id === extras.waterMode)
    ? extras.waterMode
    : WATER_MODES.SIP;
  const sipCount = Number.isFinite(Number(extras.sipCount)) && Number(extras.sipCount) > 0
    ? Math.floor(Number(extras.sipCount))
    : 1;
  return {
    recordType,
    mealSlot,
    waterMode,
    sipCount,
    containerId: extras.containerId || null,
  };
}

function suggestTimeKindForDietExtras(extras) {
  const normalized = normalizeDietExtras(extras);
  if (normalized.recordType === DIET_RECORD_TYPES.WATER) {
    return normalized.waterMode === WATER_MODES.SIP
      ? EVENT_TIME_KIND.INSTANT
      : EVENT_TIME_KIND.INTERVAL;
  }
  return EVENT_TIME_KIND.INTERVAL;
}

function suggestIconForDietExtras(extras) {
  const normalized = normalizeDietExtras(extras);
  if (normalized.recordType === DIET_RECORD_TYPES.MEAL) {
    return MEAL_SLOT_ICONS[normalized.mealSlot] || RECORD_TYPE_ICONS.meal;
  }
  return RECORD_TYPE_ICONS[normalized.recordType] || 'restaurant';
}

function getDietRecordTypeLabel(recordType) {
  return DIET_RECORD_TYPE_OPTIONS.find((o) => o.id === recordType)?.label || '饮食';
}

function getMealSlotLabel(mealSlot) {
  return MEAL_SLOT_OPTIONS.find((o) => o.id === mealSlot)?.label || '';
}

function getWaterModeLabel(waterMode) {
  return WATER_MODE_OPTIONS.find((o) => o.id === waterMode)?.label || '';
}

function formatDietExtrasSummary(extras, containerName, containerMl) {
  const normalized = normalizeDietExtras(extras);
  if (normalized.recordType === DIET_RECORD_TYPES.WATER) {
    const containerPart = containerName
      ? `${containerName}${containerMl ? ` ${containerMl}ml` : ''}`
      : '';
    if (normalized.waterMode === WATER_MODES.SIP) {
      const sipPart = `${normalized.sipCount}口`;
      return [containerPart, sipPart].filter(Boolean).join(' · ') || '喝水';
    }
    return containerPart ? `喝完 · ${containerPart}` : '喝完一瓶';
  }
  if (normalized.recordType === DIET_RECORD_TYPES.MEAL) {
    return getMealSlotLabel(normalized.mealSlot);
  }
  return getDietRecordTypeLabel(normalized.recordType);
}

module.exports = {
  createDefaultDietExtras,
  normalizeDietExtras,
  suggestTimeKindForDietExtras,
  suggestIconForDietExtras,
  getDietRecordTypeLabel,
  getMealSlotLabel,
  getWaterModeLabel,
  formatDietExtrasSummary,
};
module.exports.default = module.exports;
