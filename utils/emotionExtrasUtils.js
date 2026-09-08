const {
  EMOTION_TRIGGER_TYPES,
  EMOTION_TRIGGER_OPTIONS,
  EMOTION_FEELING_OPTIONS,
} = require('../constants/emotionConstants.js');
const { EVENT_TIME_KIND } = require('../constants/eventTimeKindPolicy.js');

function createDefaultEmotionExtras(overrides = {}) {
  return {
    triggerType: EMOTION_TRIGGER_TYPES.SEE,
    triggerSubject: '',
    personName: '',
    causeDetail: '',
    feeling: EMOTION_FEELING_OPTIONS[0],
    ...overrides,
  };
}

function normalizeEmotionExtras(extras = {}) {
  const triggerType = EMOTION_TRIGGER_OPTIONS.some((o) => o.id === extras.triggerType)
    ? extras.triggerType
    : EMOTION_TRIGGER_TYPES.SEE;
  const feeling = EMOTION_FEELING_OPTIONS.includes(extras.feeling)
    ? extras.feeling
    : EMOTION_FEELING_OPTIONS[0];
  return {
    triggerType,
    triggerSubject: typeof extras.triggerSubject === 'string' ? extras.triggerSubject : '',
    personName: typeof extras.personName === 'string' ? extras.personName : '',
    causeDetail: typeof extras.causeDetail === 'string' ? extras.causeDetail : '',
    feeling,
  };
}

function suggestTimeKindForEmotionExtras() {
  return EVENT_TIME_KIND.INSTANT;
}

function suggestIconForEmotionExtras() {
  return 'mood';
}

function formatEmotionExtrasSummary(extras) {
  const n = normalizeEmotionExtras(extras);
  const subject = n.triggerSubject.trim() || '…';
  const feeling = n.feeling;
  if (n.triggerType === EMOTION_TRIGGER_TYPES.SEE) {
    return `看到${subject}，${feeling}`;
  }
  if (n.triggerType === EMOTION_TRIGGER_TYPES.RECALL) {
    return `想起${subject}，${feeling}`;
  }
  const person = n.personName.trim() || '某人';
  const cause = n.causeDetail.trim();
  const causePart = cause ? `，${cause}` : '';
  return `看到${subject}，因为${person}${causePart}，${feeling}`;
}

module.exports = {
  createDefaultEmotionExtras,
  normalizeEmotionExtras,
  suggestTimeKindForEmotionExtras,
  suggestIconForEmotionExtras,
  formatEmotionExtrasSummary,
};
module.exports.default = module.exports;
