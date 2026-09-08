const EVENT_TIME_KIND = { INSTANT: 'instant', INTERVAL: 'interval' };

const POLICIES = {
  diet: { defaultKind: EVENT_TIME_KIND.INTERVAL, allowSwitch: true },
  emotion: { defaultKind: EVENT_TIME_KIND.INSTANT, allowSwitch: false },
  sports: { defaultKind: EVENT_TIME_KIND.INTERVAL, allowSwitch: true },
  sleep: { defaultKind: EVENT_TIME_KIND.INTERVAL, allowSwitch: false },
  work: { defaultKind: EVENT_TIME_KIND.INTERVAL, allowSwitch: false },
  study: { defaultKind: EVENT_TIME_KIND.INTERVAL, allowSwitch: false },
  travel: { defaultKind: EVENT_TIME_KIND.INTERVAL, allowSwitch: false },
  daily: { defaultKind: EVENT_TIME_KIND.INTERVAL, allowSwitch: true },
  entertainment: { defaultKind: EVENT_TIME_KIND.INTERVAL, allowSwitch: true },
  shopping: { defaultKind: EVENT_TIME_KIND.INTERVAL, allowSwitch: true },
};

function getTimeKindPolicy(categoryId) {
  if (!categoryId || categoryId === 'all' || !POLICIES[categoryId]) {
    return POLICIES.daily;
  }
  return POLICIES[categoryId];
}

function resolveDefaultTimeKind(categoryId) {
  return getTimeKindPolicy(categoryId).defaultKind;
}

module.exports = {
  EVENT_TIME_KIND,
  POLICIES,
  getTimeKindPolicy,
  resolveDefaultTimeKind,
};

module.exports.default = module.exports;
