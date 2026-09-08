const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeDietExtras,
  suggestTimeKindForDietExtras,
  formatDietExtrasSummary,
} = require('../../utils/dietExtrasUtils.js');
const { EVENT_TIME_KIND } = require('../../constants/eventTimeKindPolicy.js');
const { DIET_RECORD_TYPES, WATER_MODES, MEAL_SLOTS } = require('../../constants/dietConstants.js');

describe('dietExtrasUtils', () => {
  it('喝水几口建议 instant，喝完一瓶建议 interval', () => {
    assert.equal(
      suggestTimeKindForDietExtras({ recordType: DIET_RECORD_TYPES.WATER, waterMode: WATER_MODES.SIP }),
      EVENT_TIME_KIND.INSTANT
    );
    assert.equal(
      suggestTimeKindForDietExtras({ recordType: DIET_RECORD_TYPES.WATER, waterMode: WATER_MODES.BOTTLE }),
      EVENT_TIME_KIND.INTERVAL
    );
  });

  it('正餐默认早餐', () => {
    const extras = normalizeDietExtras({});
    assert.equal(extras.recordType, DIET_RECORD_TYPES.MEAL);
    assert.equal(extras.mealSlot, MEAL_SLOTS.BREAKFAST);
  });

  it('格式化喝水摘要', () => {
    const text = formatDietExtrasSummary(
      { recordType: DIET_RECORD_TYPES.WATER, waterMode: WATER_MODES.SIP, sipCount: 3 },
      '水杯',
      300
    );
    assert.match(text, /水杯/);
    assert.match(text, /3口/);
  });
});
