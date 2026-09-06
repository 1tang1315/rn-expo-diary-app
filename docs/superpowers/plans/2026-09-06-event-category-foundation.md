# 事件分类地基 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 给首页 `event` 加上 `time_kind` / `extras` / 多图，表单按分类政策显示时刻或时间段，分类业务字段只留空插槽。

**架构：** 纯函数（政策、时长、JSON、图片 key）可单测；SQLite 三列兼容旧库；`EventService` 负责序列化与删图；`EventModal` 拆时间区、图片区、`EventCategoryFields`。时长是否计入只看 `time_kind === 'instant'`，不看起止是否相等。

**技术栈：** Expo 53、expo-sqlite、expo-file-system、expo-image-picker、dayjs、Node `node --test`（不引入 Jest）。

**规格：** `docs/superpowers/specs/2026-09-06-event-category-foundation-design.md`

---

## 文件结构

- 创建：`constants/eventTimeKindPolicy.js` — 各分类默认 timeKind 与是否允许切换
- 创建：`utils/eventDurationUtils.js` — `isInstantEvent` / `getEventDurationMinutes`
- 创建：`utils/eventPayloadUtils.js` — extras/images 的 parse/serialize，instant 写入同一时间字符串
- 创建：`utils/eventImageUtils.js` — 本地 URI ↔ 相对 key
- 创建：`utils/eventStatusUtils.js` — 从 TimelineList 抽出 `getFinalStatus`
- 创建：`core/db/eventDurationSql.js` — 统计 SQL 片段（instant 时长为 0）
- 创建：`components/event/EventTimeFields.jsx` — 时刻/时间段控件
- 创建：`components/event/EventImagePicker.jsx` — 多图选择
- 创建：`components/event/EventCategoryFields.jsx` — 分类插槽，本期返回 null
- 创建：`test/event/eventTimeKindPolicy.test.js`
- 创建：`test/event/eventDurationUtils.test.js`
- 创建：`test/event/eventPayloadUtils.test.js`
- 创建：`test/event/eventImageUtils.test.js`
- 创建：`test/event/eventStatusUtils.test.js`
- 修改：`core/db/initDB.js` — CREATE 三列 + ALTER 兼容旧库
- 修改：`core/db/imageDB.js` — `ImageDirType.EVENT`
- 修改：`core/service/EventService.js` — 读写解析、删图
- 修改：`core/mapper/EventMapper.js` — getTotalStats 排除 instant 时长
- 修改：`core/mapper/StatisticsMapper.js` — 时长 SQL 用公共片段
- 修改：`core/schemas/eventSchema.js` — timeKind / extras / images
- 修改：`utils/formatTimeUtils.js` — 不改 `getTotalMinutes` 语义；时长走 `eventDurationUtils`
- 修改：`utils/formatEventUtils.js`、`utils/previewFormatter.js`、`utils/statisticsUtils.js`、`core/service/analyse/DataService.js`、`utils/exerciseScoreUtils.js` — 事件时长改用 `getEventDurationMinutes`（有 event 对象处）
- 修改：`components/event/EventModal.jsx` — 政策、时间区、图片、插槽、保存校验
- 修改：`components/event/TimelineList.jsx` — 瞬间展示、缩略图、用抽出的 status
- 修改：`package.json` — `"test:event": "node --test test/event/*.test.js"`

不要改底部 Tab、不要加情绪/喝水分类、不要接 MinIO。

---

### 任务 1：分类时间政策（纯函数）

**文件：**
- 创建：`constants/eventTimeKindPolicy.js`
- 测试：`test/event/eventTimeKindPolicy.test.js`

- [ ] **步骤 1：写失败测试**

```js
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
```

- [ ] **步骤 2：运行确认失败**

```bash
node --test test/event/eventTimeKindPolicy.test.js
```

预期：`Cannot find module` 或导出不存在。

- [ ] **步骤 3：实现**

`constants/eventTimeKindPolicy.js` 必须同时能被 Node `require` 和 Metro `import` 使用：只写 CommonJS `module.exports`，或写 ESM 并在测试里用动态 import。本项目现有页面是 ESM `import`，**用 ESM 导出，测试文件改成：**

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  EVENT_TIME_KIND,
  getTimeKindPolicy,
  resolveDefaultTimeKind,
} from '../../constants/eventTimeKindPolicy.js';
```

`package.json` 没有 `"type": "module"`。Expo 用 babel 转 import。Node 直接跑 `import` 会失败。

**做法：** 政策文件用纯对象 + `export`，测试用 `node --experimental-vm-modules` 不可靠。改为 **无 import 的 `.js` 可被两边用：**

```js
const EVENT_TIME_KIND = { INSTANT: 'instant', INTERVAL: 'interval' };

const POLICIES = {
  diet: { defaultKind: EVENT_TIME_KIND.INTERVAL, allowSwitch: true },
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

if (typeof exports !== 'undefined') {
  exports.EVENT_TIME_KIND = EVENT_TIME_KIND;
}
```

Expo 的 `import { getTimeKindPolicy } from '@/constants/eventTimeKindPolicy'` 对 CJS 的 named export 通常可用（Metro interop）。若 Metro 只拿到 `default`，再加：

```js
module.exports.default = module.exports;
```

测试保持 `require`，不要用 ESM import。

- [ ] **步骤 4：跑测试通过**

```bash
node --test test/event/eventTimeKindPolicy.test.js
```

预期：pass。

- [ ] **步骤 5：Commit**

```bash
git add constants/eventTimeKindPolicy.js test/event/eventTimeKindPolicy.test.js
git commit -m "$(cat <<'EOF'
feat: 增加事件分类 timeKind 政策配置

EOF
)"
```

Windows PowerShell 没有 HEREDOC。实现时用：

```bash
git add constants/eventTimeKindPolicy.js test/event/eventTimeKindPolicy.test.js
git commit -m "feat: 增加事件分类 timeKind 政策配置"
```

---

### 任务 2：时长只认 time_kind

**文件：**
- 创建：`utils/eventDurationUtils.js`
- 测试：`test/event/eventDurationUtils.test.js`

- [ ] **步骤 1：失败测试**

```js
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
```

- [ ] **步骤 2：跑测失败**

```bash
node --test test/event/eventDurationUtils.test.js
```

- [ ] **步骤 3：实现（CJS，内部 require 现有 getTotalMinutes）**

`utils/eventDurationUtils.js`：

```js
const { getTotalMinutes } = require('./formatTimeUtils.js');

function isInstantEvent(event) {
  if (!event) return false;
  const kind = event.timeKind ?? event.time_kind;
  return kind === 'instant';
}

function getEventDurationMinutes(event) {
  if (isInstantEvent(event)) return 0;
  const start = event.startDatetime ?? event.start_datetime;
  const end = event.endDatetime ?? event.end_datetime;
  return getTotalMinutes(start, end);
}

module.exports = { isInstantEvent, getEventDurationMinutes };
```

`utils/formatTimeUtils.js` 当前是 ESM `export const`。**不能**从 CJS require ESM。

**修正：** 把 `isInstantEvent` / `getEventDurationMinutes` 写进现有 `utils/formatTimeUtils.js`（已是 ESM），测试文件用：

在 `package.json` 增加 `"type"` 会破坏整个 Expo 工程，禁止。

**可用方案：** `test/event/runDuration.mjs` 对 `formatTimeUtils.js` 用动态 import——但 formatTimeUtils 无后缀依赖可能仍失败。

最稳：`eventDurationUtils.js` **不要依赖 formatTimeUtils**，自己用同一套 minute diff：

```js
function parseToDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(typeof value === 'string' ? value.replace(' ', 'T') : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getTotalMinutesLocal(start, end) {
  const s = parseToDate(start);
  const e = parseToDate(end);
  if (!s || !e) return 0;
  return Math.floor((e.getTime() - s.getTime()) / 60000);
}
```

注意：现有 `getTotalMinutes` 是 `dayjs.diff(..., 'minute')`，对 `YYYY-MM-DD HH:mm` 与 dayjs 解析一致。为与线上一致，**eventDurationUtils 允许依赖 dayjs**（项目已有，CJS `require('dayjs')` 可用）：

```js
const dayjs = require('dayjs');

function isInstantEvent(event) {
  if (!event) return false;
  return (event.timeKind ?? event.time_kind) === 'instant';
}

function getEventDurationMinutes(event) {
  if (!event || isInstantEvent(event)) return 0;
  const start = event.startDatetime ?? event.start_datetime;
  const end = event.endDatetime ?? event.end_datetime;
  return dayjs(end).diff(dayjs(start), 'minute');
}

module.exports = { isInstantEvent, getEventDurationMinutes };
module.exports.default = module.exports;
```

业务代码：`import { isInstantEvent, getEventDurationMinutes } from '@/utils/eventDurationUtils'`。

- [ ] **步骤 4：测试通过**

```bash
node --test test/event/eventDurationUtils.test.js
```

- [ ] **步骤 5：Commit**

```bash
git add utils/eventDurationUtils.js test/event/eventDurationUtils.test.js
git commit -m "feat: 事件时长按 timeKind 排除瞬间记录"
```

---

### 任务 3：extras / images JSON 与 instant 写入约定

**文件：**
- 创建：`utils/eventPayloadUtils.js`
- 测试：`test/event/eventPayloadUtils.test.js`

- [ ] **步骤 1：失败测试**

```js
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
```

- [ ] **步骤 2：跑测失败**

```bash
node --test test/event/eventPayloadUtils.test.js
```

- [ ] **步骤 3：实现 CJS**

```js
function parseEventExtras(raw) {
  if (raw == null || raw === '') return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function parseEventImages(raw) {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === 'string');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function serializeEventExtras(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '{}';
  return JSON.stringify(value);
}

function serializeEventImages(value) {
  if (!Array.isArray(value)) return '[]';
  return JSON.stringify(value.filter((x) => typeof x === 'string'));
}

function applyInstantDatetimes(event) {
  if (!event) return event;
  const kind = event.timeKind ?? event.time_kind;
  if (kind !== 'instant') return event;
  const next = { ...event };
  if (Object.prototype.hasOwnProperty.call(next, 'startDatetime')) {
    next.endDatetime = next.startDatetime;
  }
  if (Object.prototype.hasOwnProperty.call(next, 'start_datetime')) {
    next.end_datetime = next.start_datetime;
  }
  return next;
}

function hydrateEventRow(camelEvent) {
  if (!camelEvent) return camelEvent;
  return {
    ...camelEvent,
    timeKind: camelEvent.timeKind || 'interval',
    extras: parseEventExtras(camelEvent.extras),
    images: parseEventImages(camelEvent.images),
  };
}

module.exports = {
  parseEventExtras,
  parseEventImages,
  serializeEventExtras,
  serializeEventImages,
  applyInstantDatetimes,
  hydrateEventRow,
};
```

`hydrateEventRow`：旧行 `timeKind` 空 → `'interval'`。

- [ ] **步骤 4：测试通过**

```bash
node --test test/event/eventPayloadUtils.test.js
```

- [ ] **步骤 5：Commit**

```bash
git add utils/eventPayloadUtils.js test/event/eventPayloadUtils.test.js
git commit -m "feat: 事件 extras/images JSON 与 instant 时间写入"
```

---

### 任务 4：图片相对 key

**文件：**
- 创建：`utils/eventImageUtils.js`
- 测试：`test/event/eventImageUtils.test.js`

相对 key 形态：`event/img_1.jpg`。完整 URI 含 `/images/event/`。

- [ ] **步骤 1：失败测试**

```js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  toEventImageKey,
  toEventImageUri,
  isEventImageKey,
} = require('../../utils/eventImageUtils.js');

describe('eventImageUtils', () => {
  it('从完整路径抽出 event/... key', () => {
    assert.equal(
      toEventImageKey('file:///data/images/event/img_1.jpg'),
      'event/img_1.jpg'
    );
    assert.equal(toEventImageKey('event/img_1.jpg'), 'event/img_1.jpg');
  });

  it('key 拼回 URI 使用传入的 images 根目录', () => {
    assert.equal(
      toEventImageUri('file:///data/images/', 'event/img_1.jpg'),
      'file:///data/images/event/img_1.jpg'
    );
  });

  it('识别相对 key', () => {
    assert.equal(isEventImageKey('event/a.jpg'), true);
    assert.equal(isEventImageKey('file:///tmp/x.jpg'), false);
  });
});
```

- [ ] **步骤 2：跑测失败**

```bash
node --test test/event/eventImageUtils.test.js
```

- [ ] **步骤 3：实现（不要在此文件 import expo-file-system，便于 Node 测试）**

```js
function isEventImageKey(value) {
  return typeof value === 'string' && value.startsWith('event/') && !value.includes('://');
}

function toEventImageKey(uriOrKey) {
  if (!uriOrKey || typeof uriOrKey !== 'string') return '';
  if (isEventImageKey(uriOrKey)) return uriOrKey;
  const marker = '/images/';
  const idx = uriOrKey.lastIndexOf(marker);
  if (idx >= 0) {
    return uriOrKey.slice(idx + marker.length);
  }
  const name = uriOrKey.split('/').pop();
  return name ? `event/${name}` : '';
}

function toEventImageUri(baseImageDir, key) {
  if (isEventImageKey(key)) {
    const root = baseImageDir.endsWith('/') ? baseImageDir : `${baseImageDir}/`;
    return `${root}${key}`;
  }
  return key;
}

module.exports = { isEventImageKey, toEventImageKey, toEventImageUri };
```

- [ ] **步骤 4：测试通过并 commit**

```bash
node --test test/event/eventImageUtils.test.js
git add utils/eventImageUtils.js test/event/eventImageUtils.test.js
git commit -m "feat: 事件图片相对路径与 URI 转换"
```

---

### 任务 5：DB 列、EVENT 目录、时长 SQL 片段

**文件：**
- 修改：`core/db/initDB.js`（event 的 CREATE，约 23–38 行）
- 修改：`core/db/imageDB.js`（`ImageDirType`）
- 创建：`core/db/eventDurationSql.js`

- [ ] **步骤 1：CREATE 增加三列**

在 `CREATE TABLE IF NOT EXISTS event` 中 `icon` 后增加：

```sql
time_kind      TEXT, /* instant | interval；NULL 视为 interval */
extras         TEXT, /* JSON object */
images         TEXT, /* JSON string array of relative keys */
```

- [ ] **步骤 2：旧库 ALTER（CREATE IF NOT EXISTS 不会加列）**

`getDB` 里 `CREATE TABLE` 之后立刻执行（忽略“duplicate column”）：

```js
const eventAlters = [
  'ALTER TABLE event ADD COLUMN time_kind TEXT',
  'ALTER TABLE event ADD COLUMN extras TEXT',
  'ALTER TABLE event ADD COLUMN images TEXT',
];
for (const sql of eventAlters) {
  try {
    await db.execAsync(sql);
  } catch (e) {
    const msg = String(e?.message || e);
    if (!msg.includes('duplicate column')) {
      throw e;
    }
  }
}
```

- [ ] **步骤 3：ImageDirType**

```js
export const ImageDirType = {
  STORAGE: 'storage',
  DIARY: 'diary',
  SYSTEM: 'system',
  EVENT: 'event',
};
```

- [ ] **步骤 4：时长 SQL（给 mapper 用，ESM）**

`core/db/eventDurationSql.js`：

```js
export function sqlEventDurationMinutes(alias = '') {
  const p = alias ? `${alias}.` : '';
  return `CASE WHEN ${p}time_kind = 'instant' THEN 0 ELSE (JULIANDAY(${p}end_datetime) - JULIANDAY(${p}start_datetime)) * 24 * 60 END`;
}

export function sqlEventDurationHours(alias = '') {
  const p = alias ? `${alias}.` : '';
  return `CASE WHEN ${p}time_kind = 'instant' THEN 0 ELSE (JULIANDAY(${p}end_datetime) - JULIANDAY(${p}start_datetime)) * 24 END`;
}
```

`NULL time_kind` 的 `CASE WHEN time_kind = 'instant'` 为 false，走 ELSE，旧行仍计入时长。

- [ ] **步骤 5：Commit**

```bash
git add core/db/initDB.js core/db/imageDB.js core/db/eventDurationSql.js
git commit -m "feat: event 表增加 time_kind extras images 列"
```

---

### 任务 6：EventService 读写与删图

**文件：**
- 修改：`core/service/EventService.js`
- 修改：`core/schemas/eventSchema.js`（create/update/response 增加字段）

现有 `EventModal` 保存用的是 **snake_case** 字段（`start_datetime`）。`BaseService.create` 会 `camelToSnakeObject`，两种命名都能进库。Service 必须两种都处理。

- [ ] **步骤 1：schema 增加**

在 `eventCreateSchema` / `eventUpdateSchema` / `eventResponseSchema` 的 properties 中加入：

```js
timeKind: { type: 'string', enum: ['instant', 'interval'], description: '时刻或时间段' },
extras: { type: 'object', description: '分类扩展 JSON' },
images: { type: 'array', items: { type: 'string' }, description: '图片相对 key' },
```

- [ ] **步骤 2：EventService 映射**

在 class 内增加：

```js
mapEvent(po) {
  if (!po) return po;
  const { snakeToCamelObject } = require('@/core/utils');
  const { hydrateEventRow } = require('@/utils/eventPayloadUtils');
  return hydrateEventRow(snakeToCamelObject(po));
}

prepareWrite(data) {
  const { serializeEventExtras, serializeEventImages, applyInstantDatetimes } = require('@/utils/eventPayloadUtils');
  let next = { ...data };
  if (!next.timeKind && !next.time_kind) {
    next.timeKind = 'interval';
  }
  next = applyInstantDatetimes(next);
  const extrasObj = next.extras && typeof next.extras === 'object' && !Array.isArray(next.extras)
    ? next.extras
    : {};
  const imagesArr = Array.isArray(next.images) ? next.images : [];
  next.extras = serializeEventExtras(extrasObj);
  next.images = serializeEventImages(imagesArr);
  return next;
}
```

覆盖：

- `getByDateRange` / `getByDateRangeAndCategory` / `getByEndDateRange` / `searchByKeyword` / `getByFilters`：`.map(r => this.mapEvent(r))` 替代只 `snakeToCamelObject`
- `getAll` / `getById`：同样（覆盖 BaseService）
- `create(data)`：`return super.create(this.prepareWrite(data))`
- `update(id, data)`：更新前读旧行，对比 images，删掉不再引用的本地文件（用 `toEventImageUri(BASE_IMAGE_DIR, key)` + `deleteLocalImage`），再 `super.update(id, this.prepareWrite(data))`
- `delete(id)`：对齐 StorageService：先 `getById`，`super.delete`，再对 `images` 每张 `deleteLocalImage`

`updateStatus` 里 `this.update(id, event)` 会带上已 hydrate 的 extras 对象，`prepareWrite` 会再序列化，避免把 object 写进 SQLite。

图片文件删除必须用完整 URI。`BASE_IMAGE_DIR` 来自 `@/constants/commonConstans`。

- [ ] **步骤 3：Commit**

```bash
git add core/service/EventService.js core/schemas/eventSchema.js
git commit -m "feat: 事件读写序列化 extras/images 并删除本地图"
```

---

### 任务 7：统计 SQL 与 JS 时长调用点

**文件：**
- 修改：`core/mapper/EventMapper.js` `getTotalStats`（约 146–151 行）
- 修改：`core/mapper/StatisticsMapper.js` 所有 `JULIANDAY(end) - JULIANDAY(start)` 时长表达式
- 修改：`utils/formatEventUtils.js`、`utils/previewFormatter.js`、`utils/statisticsUtils.js`、`core/service/analyse/DataService.js`

`COUNT(*)` **不要**排除 instant（次数仍算）。只把时长表达式换成 `sqlEventDurationMinutes`。

- [ ] **步骤 1：EventMapper.getTotalStats**

```js
import { sqlEventDurationHours } from '@/core/db/eventDurationSql';

const [totalDurationResult] = await db.getAllAsync(`
  SELECT SUM(${sqlEventDurationHours()}) AS totalHours
  FROM event WHERE deleted_at IS NULL
`);
```

- [ ] **步骤 2：StatisticsMapper.getStatisticsByDateRange**

每个 `(JULIANDAY(...) * 24 * 60)` 换成 `sqlEventDurationMinutes('e')`。睡眠那支同样包进 CASE：瞬间睡眠时长 0。

总时长那大 CASE：

```sql
ROUND(IFNULL(SUM(
  CASE
    WHEN e.time_kind = 'instant' THEN 0
    WHEN e.category = 'sleep' AND DATE(e.end_datetime) = d.stat_date THEN
      (JULIANDAY(e.end_datetime) - JULIANDAY(e.start_datetime)) * 24 * 60
    ELSE
      (JULIANDAY(MIN(e.end_datetime, DATE(d.stat_date, '+1 day'))) - JULIANDAY(MAX(e.start_datetime, d.stat_date))) * 24 * 60
  END
), 0)) AS total_duration
```

分类分项 SUM 最外层同样：`WHEN e.time_kind = 'instant' THEN 0` 再走原分类 CASE。

- [ ] **步骤 3：getCategoryStatistics / getHabitTrackingData**

`SUM((JULIANDAY...) * 24 * 60)` → `SUM(${sqlEventDurationMinutes()})`  
`ROUND((JULIANDAY...) * 24 * 60, 0) AS duration_minutes` → `ROUND(${sqlEventDurationMinutes()}, 0) AS duration_minutes`

- [ ] **步骤 4：JS**

`formatEventUtils.js` 里 reduce 的 `getTotalMinutes(e.start_datetime, e.end_datetime)` 改为 `getEventDurationMinutes(e)`。

`previewFormatter.js` / `statisticsUtils.js` / `DataService.buildDailyAnalysisInput` 的 processedEvents duration 改为 `getEventDurationMinutes(e)`。

`exerciseScoreUtils` / `sleepScoreUtils` 若只拿到 start/end 没有 kind，保持 `getTotalMinutes`（调用方应传入完整 event 时再改）。若函数参数已是 event 对象，改用 `getEventDurationMinutes`。

- [ ] **步骤 5：Commit**

```bash
git add core/mapper/EventMapper.js core/mapper/StatisticsMapper.js utils/formatEventUtils.js utils/previewFormatter.js utils/statisticsUtils.js core/service/analyse/DataService.js utils/exerciseScoreUtils.js utils/sleepScoreUtils.js
git commit -m "feat: 统计与分析排除 instant 事件时长"
```

---

### 任务 8：列表状态与展示

**文件：**
- 创建：`utils/eventStatusUtils.js`
- 测试：`test/event/eventStatusUtils.test.js`
- 修改：`components/event/TimelineList.jsx`

- [ ] **步骤 1：把现有 `getFinalStatus` 原样搬到 `utils/eventStatusUtils.js`（CJS + dayjs/Date 逻辑），增加 instant 分支：当前时间晚于该时刻（用 startDatetime）→ `completed`；尚未到 → 走原来的 early/upcoming（`end` 视为等于 start，不要把瞬间标成 inProgress，除非 now 落在同一分钟内）。**

明确规则：

```js
function getFinalStatus(item, now = new Date()) {
  if (item.status === 'notCompleted') return item.status;
  const startTime = new Date(item.startDatetime);
  const kind = item.timeKind ?? item.time_kind;
  if (kind === 'instant') {
    if (now > startTime) return 'completed';
    const ONE_HOUR = 60 * 60 * 1000;
    const timeToStart = startTime - now;
    if (timeToStart > 0 && timeToStart <= ONE_HOUR) return 'upcoming';
    if (timeToStart > ONE_HOUR) return 'early';
    return 'completed';
  }
  // 其余复制 TimelineList 里现有 interval 逻辑，把 `new Date()` 换成 now
}
```

测试用固定 `now`：

```js
const now = new Date('2026-09-06T12:00:00');
assert.equal(getFinalStatus({
  timeKind: 'instant',
  status: 'upcoming',
  startDatetime: '2026-09-06 11:00',
  endDatetime: '2026-09-06 11:00',
}, now), 'completed');
assert.equal(getFinalStatus({
  timeKind: 'instant',
  status: 'upcoming',
  startDatetime: '2026-09-06 12:30',
  endDatetime: '2026-09-06 12:30',
}, now), 'upcoming');
```

- [ ] **步骤 2：TimelineList 删除本地 getFinalStatus，改为 import。**

`formatDuration`：

```js
import { isInstantEvent, getEventDurationMinutes } from '@/utils/eventDurationUtils';
import { formatDurationByMinutes } from '@/utils/formatTimeUtils';
import { toEventImageUri } from '@/utils/eventImageUtils';
import { BASE_IMAGE_DIR } from '@/constants/commonConstans';
import { Image } from 'react-native'; // 或 expo-image

const formatDuration = (item) => formatDurationByMinutes(getEventDurationMinutes(item));
```

时间文案：

- instant：只显示 `item.startTime`（或 `startDatetime` 的 HH:mm），**不要** `12:30 - 12:30(0分钟)`
- interval：保持现有 `start - end(时长)`

左侧轴：instant 只显示一个时间点，不显示结束时间。

缩略图：`item.images?.[0]` 存在则 `<Image source={{ uri: toEventImageUri(BASE_IMAGE_DIR, item.images[0]) }} />`，宽高约 48。

- [ ] **步骤 3：测试 + commit**

```bash
node --test test/event/eventStatusUtils.test.js
git add utils/eventStatusUtils.js test/event/eventStatusUtils.test.js components/event/TimelineList.jsx
git commit -m "feat: 时间线按时刻/时间段展示并排除瞬间时长"
```

---

### 任务 9：EventModal 时间区、图片、空插槽

**文件：**
- 创建：`components/event/EventTimeFields.jsx`
- 创建：`components/event/EventImagePicker.jsx`
- 创建：`components/event/EventCategoryFields.jsx`
- 修改：`components/event/EventModal.jsx`
- 修改：`package.json` scripts

- [ ] **步骤 1：空插槽**

```jsx
import React from 'react';

export default function EventCategoryFields({ category, extras, onExtrasChange }) {
  return null;
}
```

- [ ] **步骤 2：EventTimeFields**

Props：`timeKind`, `allowSwitch`, `startDatetime`, `endDatetime`, `onChangeTimeKind`, `onChangeStart`, `onChangeEnd`，以及现有的「当前时间 / 选择日期 / 选择时间」按钮回调（或把 DateTimePicker 仍留在 Modal，本组件只负责布局）。

- `allowSwitch` 为 true 时两个按钮：「时刻」「时间段」，选中项用 `ThemeButton active`。
- `timeKind === 'instant'` 只渲染开始时间那一组，label 改为「时间」。
- `interval` 渲染开始+结束两组（从 EventModal 现有 JSX 剪过来）。

切换到 instant：不要改用户选的开始时间。切换到 interval：若结束不晚于开始，设为开始 + 10 分钟。

- [ ] **步骤 3：EventImagePicker**

对齐 `StorageModal.pickImage`，但 `allowsMultipleSelection: true`（Android/iOS 支持则用；web 不支持就循环单选）。`ImageDirType.EVENT`。

**保存策略（规格：成功才入库）：** 选择后先把 **picker 临时 uri** 放进 `formData.pendingImageUris`。保存时再 `saveImageToLocal(uri, EVENT)` → `toEventImageKey`。取消弹窗不 copy。已有事件的旧图是相对 key，保留在 `formData.images`。

展示：pending 用临时 uri；已保存用 `toEventImageUri(BASE_IMAGE_DIR, key)`。可删除某一张（从 pending 或 images 去掉）。

- [ ] **步骤 4：改 EventModal 状态**

`formData` 增加：`timeKind`, `extras: {}`, `images: []`, `pendingImageUris: []`。

另：`timeKindTouched`（useRef 或 state）。

初始化：

- 编辑：`timeKind: currentEvent.timeKind || 'interval'`，`images: currentEvent.images || []`，`extras: currentEvent.extras || {}`，`pendingImageUris: []`，`timeKindTouched = true`（编辑不因改分类覆盖 kind）。
- 新增：`timeKind: resolveDefaultTimeKind(defaultCategory)`，`timeKindTouched = false`。interval 时结束 = 开始 + 10 分钟；不要给 instant +10 分钟。

`confirmCategorySelect`：新增且 `!timeKindTouched` 时 `timeKind = resolveDefaultTimeKind(categoryId)`。

`onChangeTimeKind`：设 `timeKindTouched = true`。

`handleSave`：

1. pending 全部 `saveImageToLocal`；任一张失败则 Alert，**不**调用 create/update。
2. `images = [...formData.images, ...newKeys]`。
3. `interval` 且 `startDatetime >= endDatetime` → Alert「结束时间必须晚于开始时间」。
4. `instant` 不比较早晚。
5. params：

```js
{
  start_datetime: formatDatetime(startDatetime),
  end_datetime: timeKind === 'instant'
    ? formatDatetime(startDatetime)
    : formatDatetime(endDatetime),
  title, category, description, status, icon,
  time_kind: timeKind,
  extras: formData.extras || {},
  images,
}
```

`EventService.prepareWrite` 会再 applyInstant 与 serialize。Modal 也可只传 camelCase，不要混用导致丢字段。推荐 **统一 camelCase** 与 BaseService 一致：

```js
{
  startDatetime: formatDatetime(startDatetime),
  endDatetime: ...,
  timeKind,
  extras: formData.extras || {},
  images,
  title, category, description, status, icon,
}
```

现有 Modal 用 snake_case 也能进 `camelToSnakeObject`（已是 snake 则不变）。选一种并在本次改掉 Modal，避免 `timeKind` 与 `time_kind` 同时出现。

「全部」tab：`currentTab === 'all'` 时 defaultCategory 已是 `daily`（现有 `categories.find(!isFixed)` 实际是 daily）。保持：未选手动分类前用 daily 政策。

sleep 等 `allowSwitch === false`：不渲染切换按钮。

在描述和状态之间插入 `<EventTimeFields />` 替换两段起止 JSX；描述后插入图片；icon 后插入 `<EventCategoryFields category={formData.category} extras={formData.extras} onExtrasChange={(extras) => handleInputChange('extras', extras)} />`。

- [ ] **步骤 5：package.json**

```json
"test:event": "node --test test/event/*.test.js"
```

跑：

```bash
npm run test:event
```

预期：任务 1–4、8 的测试全绿。

- [ ] **步骤 6：手动验收（实现者在 Expo 里点）**

1. 饮食新增：默认两套时间；切到时刻后保存；列表只显示一个点；统计当天饮食时长不含这条。
2. 睡眠新增：无「时刻|时间段」。
3. 编辑旧事件：无 timeKind，表现为时间段。
4. 加两张图保存，再删事件，私有目录对应文件消失。
5. interval 起止相同：保存被拒绝。

- [ ] **步骤 7：Commit**

```bash
git add components/event/EventTimeFields.jsx components/event/EventImagePicker.jsx components/event/EventCategoryFields.jsx components/event/EventModal.jsx package.json
git commit -m "feat: 事件表单支持时刻/时间段与多图"
```

---

## 自检

| 规格项 | 任务 |
|--------|------|
| time_kind / extras / images 列 + ALTER | 5 |
| 判别只看 time_kind | 2、3、7、8 |
| instant 同一字符串 | 3、6、9 |
| interval 结束必须晚于开始 | 9 |
| 新增 interval +10 分钟、instant 不加 | 9 |
| 统计 SQL + JS 排除 instant 时长 | 7 |
| 列表瞬间文案 / 状态 | 8 |
| EVENT 目录、相对 key、多图、删文件 | 4、5、6、9 |
| 不接 MinIO | 全程不写 |
| 分类政策表（饮食默认 interval 可切换） | 1、9 |
| 全部 tab / 改分类 / 编辑保留 kind | 9 |
| EventCategoryFields 空 | 9 |
| schema | 6 |
| JSON 解析失败 | 3 |
| 旧行 NULL → interval | 3 hydrate |

无「待定」实现步骤。CJS 工具函数是为了 `node --test` 能跑；页面继续 `import`。
