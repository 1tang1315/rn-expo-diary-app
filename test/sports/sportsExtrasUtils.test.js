const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  suggestTimeKindForSportsExtras,
  formatSportsExtrasSummary,
} = require('../../utils/sportsExtrasUtils.js');
const { SPORTS_RECORD_TYPES } = require('../../constants/sportsConstants.js');
const { EVENT_TIME_KIND } = require('../../constants/eventTimeKindPolicy.js');

describe('sportsExtrasUtils', () => {
  it('单动作建议 instant，套路建议 interval', () => {
    assert.equal(
      suggestTimeKindForSportsExtras({ recordType: SPORTS_RECORD_TYPES.SINGLE }),
      EVENT_TIME_KIND.INSTANT
    );
    assert.equal(
      suggestTimeKindForSportsExtras({ recordType: SPORTS_RECORD_TYPES.ROUTINE }),
      EVENT_TIME_KIND.INTERVAL
    );
  });

  it('格式化运动摘要', () => {
    const text = formatSportsExtrasSummary({
      recordType: SPORTS_RECORD_TYPES.SINGLE,
      actionName: '俯卧撑',
      reps: 20,
      sets: 3,
    });
    assert.match(text, /俯卧撑/);
    assert.match(text, /20次/);
  });
});
