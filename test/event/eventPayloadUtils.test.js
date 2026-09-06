const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseEventExtras,
  parseEventImages,
  serializeEventExtras,
  serializeEventImages,
  applyInstantDatetimes,
} = require('../../utils/eventPayloadUtils.js');

describe('eventPayloadUtils', () => {
  it('extras 非法或空则 {}', () => {
    assert.deepEqual(parseEventExtras(null), {});
    assert.deepEqual(parseEventExtras(''), {});
    assert.deepEqual(parseEventExtras('{'), {});
    assert.deepEqual(parseEventExtras('[]'), {});
    assert.deepEqual(parseEventExtras('{"a":1}'), { a: 1 });
  });

  it('images 非法则 []', () => {
    assert.deepEqual(parseEventImages(null), []);
    assert.deepEqual(parseEventImages('not-json'), []);
    assert.deepEqual(parseEventImages('{}'), []);
    assert.deepEqual(parseEventImages('["event/a.jpg"]'), ['event/a.jpg']);
  });

  it('serialize 只接受对象/数组', () => {
    assert.equal(serializeEventExtras({ x: 1 }), '{"x":1}');
    assert.equal(serializeEventExtras(null), '{}');
    assert.equal(serializeEventImages(['event/a.jpg']), '["event/a.jpg"]');
    assert.equal(serializeEventImages(null), '[]');
  });

  it('instant 把 end 写成与 start 完全相同的字符串', () => {
    const row = applyInstantDatetimes({
      timeKind: 'instant',
      startDatetime: '2026-09-06 08:15',
      endDatetime: '2026-09-06 08:25',
    });
    assert.equal(row.startDatetime, '2026-09-06 08:15');
    assert.equal(row.endDatetime, '2026-09-06 08:15');
    const snake = applyInstantDatetimes({
      time_kind: 'instant',
      start_datetime: '2026-09-06 08:15',
      end_datetime: '2026-09-06 09:00',
    });
    assert.equal(snake.end_datetime, '2026-09-06 08:15');
  });

  it('interval 不改时间', () => {
    const row = applyInstantDatetimes({
      timeKind: 'interval',
      startDatetime: '2026-09-06 08:15',
      endDatetime: '2026-09-06 08:25',
    });
    assert.equal(row.endDatetime, '2026-09-06 08:25');
  });
});
