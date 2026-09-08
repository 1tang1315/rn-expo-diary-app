const SPORTS_RECORD_TYPES = {
  SINGLE: 'single',
  ROUTINE: 'routine',
};

const SPORTS_RECORD_TYPE_OPTIONS = [
  { id: SPORTS_RECORD_TYPES.SINGLE, label: '单动作', emoji: '🏃' },
  { id: SPORTS_RECORD_TYPES.ROUTINE, label: '整套动作', emoji: '🧘' },
];

const ROUTINE_TEMPLATES = [
  { id: 'baduanjin', name: '八段锦', icon: 'self-improvement' },
  { id: 'jingangong', name: '金刚功', icon: 'spa' },
  { id: 'basic-abs', name: '基础腹肌锻炼', icon: 'fitness-center' },
];

module.exports = {
  SPORTS_RECORD_TYPES,
  SPORTS_RECORD_TYPE_OPTIONS,
  ROUTINE_TEMPLATES,
};
module.exports.default = module.exports;
