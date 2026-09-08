const EMOTION_TRIGGER_TYPES = {
  SEE: 'see',
  RECALL: 'recall',
  BECAUSE: 'because',
};

const EMOTION_TRIGGER_OPTIONS = [
  { id: EMOTION_TRIGGER_TYPES.SEE, label: '看到', template: '看到{subject}，{feeling}' },
  { id: EMOTION_TRIGGER_TYPES.RECALL, label: '想起', template: '想起{subject}，{feeling}' },
  { id: EMOTION_TRIGGER_TYPES.BECAUSE, label: '因为某人', template: '看到{subject}，因为{person}{cause}，{feeling}' },
];

const EMOTION_FEELING_OPTIONS = [
  '烦躁', '开心', '焦虑', '平静', '难过', '愤怒', '疲惫', '兴奋',
];

module.exports = {
  EMOTION_TRIGGER_TYPES,
  EMOTION_TRIGGER_OPTIONS,
  EMOTION_FEELING_OPTIONS,
};
module.exports.default = module.exports;
