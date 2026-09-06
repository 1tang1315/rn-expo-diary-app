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
module.exports.default = module.exports;
