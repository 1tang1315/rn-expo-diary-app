const DAILY_RECORD_TYPES = {
  NORMAL: 'normal',
  JOURNAL: 'journal',
};

const DAILY_RECORD_TYPE_OPTIONS = [
  { id: DAILY_RECORD_TYPES.NORMAL, label: '普通日程', emoji: '📋' },
  { id: DAILY_RECORD_TYPES.JOURNAL, label: '随手记', emoji: '📝' },
];

const JOURNAL_PERIODS = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  OTHER: 'other',
};

const JOURNAL_PERIOD_OPTIONS = [
  { id: JOURNAL_PERIODS.MORNING, label: '早上' },
  { id: JOURNAL_PERIODS.AFTERNOON, label: '下午' },
  { id: JOURNAL_PERIODS.EVENING, label: '晚上' },
  { id: JOURNAL_PERIODS.OTHER, label: '其他' },
];

module.exports = {
  DAILY_RECORD_TYPES,
  DAILY_RECORD_TYPE_OPTIONS,
  JOURNAL_PERIODS,
  JOURNAL_PERIOD_OPTIONS,
};
module.exports.default = module.exports;
