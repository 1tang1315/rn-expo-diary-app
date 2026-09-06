const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  EVENT_TIME_KIND,
  getTimeKindPolicy,
  resolveDefaultTimeKind,
} = require('../../constants/eventTimeKindPolicy.js');

describe('eventTimeKindPolicy', () => {
  it('diet / sports / daily 默认为 interval 且允许切换', () => {
    for (const id of ['diet', 'sports', 'daily', 'entertainment', 'shopping']) {
      const p = getTimeKindPolicy(id);
      assert.equal(p.defaultKind, EVENT_TIME_KIND.INTERVAL);
      assert.equal(p.allowSwitch, true);
    }
  });

  it('sleep / work / study / travel 默认为 interval 且不允许切换', () => {
    for (const id of ['sleep', 'work', 'study', 'travel']) {
      const p = getTimeKindPolicy(id);
      assert.equal(p.defaultKind, EVENT_TIME_KIND.INTERVAL);
      assert.equal(p.allowSwitch, false);
    }
  });

  it('未知分类与 all 回退 daily', () => {
    assert.equal(resolveDefaultTimeKind('all'), EVENT_TIME_KIND.INTERVAL);
    assert.equal(getTimeKindPolicy('all').allowSwitch, true);
    assert.deepEqual(getTimeKindPolicy('nope'), getTimeKindPolicy('daily'));
  });
});
