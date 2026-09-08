const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  formatEmotionExtrasSummary,
  suggestTimeKindForEmotionExtras,
} = require('../../utils/emotionExtrasUtils.js');
const { EMOTION_TRIGGER_TYPES } = require('../../constants/emotionConstants.js');
const { EVENT_TIME_KIND } = require('../../constants/eventTimeKindPolicy.js');

describe('emotionExtrasUtils', () => {
  it('情绪始终建议 instant', () => {
    assert.equal(suggestTimeKindForEmotionExtras(), EVENT_TIME_KIND.INSTANT);
  });

  it('格式化看到句式', () => {
    const text = formatEmotionExtrasSummary({
      triggerType: EMOTION_TRIGGER_TYPES.SEE,
      triggerSubject: '那条消息',
      feeling: '烦躁',
    });
    assert.equal(text, '看到那条消息，烦躁');
  });
});
