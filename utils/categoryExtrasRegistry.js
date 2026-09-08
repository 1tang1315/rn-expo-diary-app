const {
  createDefaultDietExtras,
  normalizeDietExtras,
  suggestTimeKindForDietExtras,
  suggestIconForDietExtras,
  formatDietExtrasSummary,
} = require('./dietExtrasUtils.js');
const { findWaterContainer, getWaterContainers } = require('./waterContainerStorage.js');
const { DIET_RECORD_TYPES } = require('../constants/dietConstants.js');
const {
  createDefaultSportsExtras,
  normalizeSportsExtras,
  suggestTimeKindForSportsExtras,
  suggestIconForSportsExtras,
  formatSportsExtrasSummary,
} = require('./sportsExtrasUtils.js');
const {
  createDefaultEmotionExtras,
  normalizeEmotionExtras,
  suggestTimeKindForEmotionExtras,
  suggestIconForEmotionExtras,
  formatEmotionExtrasSummary,
} = require('./emotionExtrasUtils.js');
const {
  createDefaultJournalExtras,
  normalizeJournalExtras,
  suggestTimeKindForJournalExtras,
  suggestIconForJournalExtras,
  formatJournalExtrasSummary,
} = require('./journalExtrasUtils.js');

const REGISTRY = {
  diet: {
    createDefault: createDefaultDietExtras,
    normalize: normalizeDietExtras,
    suggestTimeKind: suggestTimeKindForDietExtras,
    suggestIcon: suggestIconForDietExtras,
    formatSummary: (extras) => formatDietExtrasSummary(
      extras,
      extras.containerName,
      extras.containerMl
    ),
    prepareForSave: async (extras) => {
      const normalized = normalizeDietExtras(extras);
      if (normalized.recordType === DIET_RECORD_TYPES.WATER && normalized.containerId) {
        const containers = await getWaterContainers();
        const container = findWaterContainer(containers, normalized.containerId);
        return {
          ...normalized,
          containerName: container?.name || null,
          containerMl: container?.volumeMl || null,
        };
      }
      return normalized;
    },
  },
  sports: {
    createDefault: createDefaultSportsExtras,
    normalize: normalizeSportsExtras,
    suggestTimeKind: suggestTimeKindForSportsExtras,
    suggestIcon: suggestIconForSportsExtras,
    formatSummary: formatSportsExtrasSummary,
    prepareForSave: async (extras) => normalizeSportsExtras(extras),
  },
  emotion: {
    createDefault: createDefaultEmotionExtras,
    normalize: normalizeEmotionExtras,
    suggestTimeKind: suggestTimeKindForEmotionExtras,
    suggestIcon: suggestIconForEmotionExtras,
    formatSummary: formatEmotionExtrasSummary,
    prepareForSave: async (extras) => normalizeEmotionExtras(extras),
  },
  daily: {
    createDefault: createDefaultJournalExtras,
    normalize: normalizeJournalExtras,
    suggestTimeKind: suggestTimeKindForJournalExtras,
    suggestIcon: suggestIconForJournalExtras,
    formatSummary: formatJournalExtrasSummary,
    prepareForSave: async (extras) => normalizeJournalExtras(extras),
  },
};

function getCategoryExtrasHandler(category) {
  return REGISTRY[category] || null;
}

function createDefaultExtrasForCategory(category) {
  const handler = getCategoryExtrasHandler(category);
  return handler ? handler.createDefault() : {};
}

function normalizeExtrasForCategory(category, extras) {
  const handler = getCategoryExtrasHandler(category);
  return handler ? handler.normalize(extras) : (extras || {});
}

function suggestTimeKindForCategory(category, extras) {
  const handler = getCategoryExtrasHandler(category);
  if (!handler) return null;
  return handler.suggestTimeKind(extras);
}

function suggestIconForCategory(category, extras) {
  const handler = getCategoryExtrasHandler(category);
  if (!handler) return null;
  return handler.suggestIcon(extras);
}

function formatExtrasSummaryForCategory(category, extras) {
  const handler = getCategoryExtrasHandler(category);
  if (!handler || !extras) return null;
  const summary = handler.formatSummary(extras);
  return summary || null;
}

async function prepareExtrasForSave(category, extras) {
  const handler = getCategoryExtrasHandler(category);
  if (!handler) return extras || {};
  return handler.prepareForSave(extras);
}

module.exports = {
  getCategoryExtrasHandler,
  createDefaultExtrasForCategory,
  normalizeExtrasForCategory,
  suggestTimeKindForCategory,
  suggestIconForCategory,
  formatExtrasSummaryForCategory,
  prepareExtrasForSave,
};
module.exports.default = module.exports;
