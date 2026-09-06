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
