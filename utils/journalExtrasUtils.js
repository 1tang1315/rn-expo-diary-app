const {
  DAILY_RECORD_TYPES,
  DAILY_RECORD_TYPE_OPTIONS,
  JOURNAL_PERIOD_OPTIONS,
  JOURNAL_PERIODS,
} = require('../constants/journalConstants.js');
const { EVENT_TIME_KIND } = require('../constants/eventTimeKindPolicy.js');

function createDefaultJournalExtras(overrides = {}) {
  return {
    recordType: DAILY_RECORD_TYPES.NORMAL,
    journalPeriod: JOURNAL_PERIODS.OTHER,
    ...overrides,
  };
}

function normalizeJournalExtras(extras = {}) {
  const recordType = DAILY_RECORD_TYPE_OPTIONS.some((o) => o.id === extras.recordType)
    ? extras.recordType
    : DAILY_RECORD_TYPES.NORMAL;
  const journalPeriod = JOURNAL_PERIOD_OPTIONS.some((o) => o.id === extras.journalPeriod)
    ? extras.journalPeriod
    : JOURNAL_PERIODS.OTHER;
  return { recordType, journalPeriod };
}

function isJournalSnippet(extras) {
  return normalizeJournalExtras(extras).recordType === DAILY_RECORD_TYPES.JOURNAL;
}

function suggestTimeKindForJournalExtras(extras) {
  return isJournalSnippet(extras) ? EVENT_TIME_KIND.INSTANT : EVENT_TIME_KIND.INTERVAL;
}

function suggestIconForJournalExtras(extras) {
  return isJournalSnippet(extras) ? 'edit' : 'access-time';
}

function getJournalPeriodLabel(period) {
  return JOURNAL_PERIOD_OPTIONS.find((o) => o.id === period)?.label || '';
}

function formatJournalExtrasSummary(extras) {
  const n = normalizeJournalExtras(extras);
  if (!isJournalSnippet(n)) return null;
  const period = getJournalPeriodLabel(n.journalPeriod);
  return period ? `随手记 · ${period}` : '随手记';
}

module.exports = {
  createDefaultJournalExtras,
  normalizeJournalExtras,
  isJournalSnippet,
  suggestTimeKindForJournalExtras,
  suggestIconForJournalExtras,
  formatJournalExtrasSummary,
};
module.exports.default = module.exports;
