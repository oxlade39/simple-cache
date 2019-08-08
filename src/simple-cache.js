"use strict";
const hasher = require('object-hash');
const InMemoryCacheStore = require('./in-memory-cache-store');

function SimpleCache(delegateFn, normalizer = x => x, cacheStore = InMemoryCacheStore()) {
  async function readThrough(request) {
    const normalizedRequest = normalizer(request);
    const hash = hasher(normalizedRequest);

    if (await cacheStore.contains(hash)) {
      return cacheStore.get(hash);
    }

    const result = await delegateFn(request);
    await cacheStore.put(hash, result);
    return await cacheStore.get(hash);
  }

  return {
    readThrough
  }
}

module.exports = SimpleCache
