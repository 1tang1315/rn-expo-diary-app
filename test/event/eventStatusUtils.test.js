const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getFinalStatus } = require('../../utils/eventStatusUtils.js');

describe('eventStatusUtils', () => {
  it('instant 已过时刻为 completed', () => {
    const now = new Date('2026-09-06T12:00:00');
    assert.equal(getFinalStatus({
      timeKind: 'instant',
      status: 'upcoming',
      startDatetime: '2026-09-06 11:00',
      endDatetime: '2026-09-06 11:00',
    }, now), 'completed');
  });

  it('instant 未到时刻为 upcoming', () => {
    const now = new Date('2026-09-06T12:00:00');
    assert.equal(getFinalStatus({
      timeKind: 'instant',
      status: 'upcoming',
      startDatetime: '2026-09-06 12:30',
      endDatetime: '2026-09-06 12:30',
    }, now), 'upcoming');
  });
});
