const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  isInstantEvent,
  getEventDurationMinutes,
} = require('../../utils/eventDurationUtils.js');

describe('eventDurationUtils', () => {
  it('只把 timeKind/time_kind === instant 当瞬间，不管起止是否相等', () => {
    assert.equal(isInstantEvent({ timeKind: 'instant', startDatetime: '2026-09-06 12:00', endDatetime: '2026-09-06 13:00' }), true);
    assert.equal(isInstantEvent({ time_kind: 'instant' }), true);
    assert.equal(isInstantEvent({ timeKind: 'interval', startDatetime: '2026-09-06 12:00', endDatetime: '2026-09-06 12:00' }), false);
    assert.equal(isInstantEvent({}), false);
    assert.equal(isInstantEvent({ timeKind: null }), false);
  });

  it('instant 时长为 0；interval 与旧行按起止差分钟', () => {
    assert.equal(getEventDurationMinutes({
      timeKind: 'instant',
      startDatetime: '2026-09-06 12:00',
      endDatetime: '2026-09-06 12:40',
    }), 0);
    assert.equal(getEventDurationMinutes({
      time_kind: 'interval',
      start_datetime: '2026-09-06 12:00',
      end_datetime: '2026-09-06 12:40',
    }), 40);
    assert.equal(getEventDurationMinutes({
      startDatetime: '2026-09-06 12:00',
      endDatetime: '2026-09-06 12:10',
    }), 10);
  });
});
