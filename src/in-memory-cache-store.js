function InMemoryCacheStore() {
  const store = {};

  async function get(key) {
    return store[key];
  }

  async function contains(key) {
    const exists = key in store
    return exists;
  }

  async function put(key, value) {
    store[key] = value;
  }

  return {
    get: get,
    contains: contains,
    put: put
  }
}

module.exports = InMemoryCacheStore;
