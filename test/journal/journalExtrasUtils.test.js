const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  suggestTimeKindForJournalExtras,
  formatJournalExtrasSummary,
} = require('../../utils/journalExtrasUtils.js');
const { DAILY_RECORD_TYPES } = require('../../constants/journalConstants.js');
const { EVENT_TIME_KIND } = require('../../constants/eventTimeKindPolicy.js');

describe('journalExtrasUtils', () => {
  it('随手记建议 instant', () => {
    assert.equal(
      suggestTimeKindForJournalExtras({ recordType: DAILY_RECORD_TYPES.JOURNAL }),
      EVENT_TIME_KIND.INSTANT
    );
  });

  it('格式化随手记摘要', () => {
    const text = formatJournalExtrasSummary({
      recordType: DAILY_RECORD_TYPES.JOURNAL,
      journalPeriod: 'morning',
    });
    assert.match(text, /随手记/);
    assert.match(text, /早上/);
  });
});
