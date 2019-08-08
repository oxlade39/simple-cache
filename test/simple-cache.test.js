"use strict";
const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const {expect} = chai;
chai.use(sinonChai);

const SimpleCache = require('../src/simple-cache');
const InMemoryCacheStore = require('../src/in-memory-cache-store');

describe("SimpleCache", () => {
  it("prevents duplicate calls to delegate", async () => {
    const delegate = sinon.stub().resolves('hi');

    const cache = SimpleCache(delegate);
    const result = [
      await cache.readThrough("some request"),
      await cache.readThrough("some request")
    ];
    expect(result).to.eql(['hi', 'hi']);
    expect(delegate).to.have.been.calledOnce;
  });
  
  it("supports a non async delegate function", async () => {
    const delegate = sinon.stub().returns('hi');

    const cache = SimpleCache(delegate);
    const result = [
      await cache.readThrough("some request"),
      await cache.readThrough("some request")
    ];
    expect(result).to.eql(['hi', 'hi']);
    expect(delegate).to.have.been.calledOnce;
  });

  describe("uses a CacheStore as backing persistence", () => {
    it("puts to CacheStore", async () => {
      const delegate = sinon.stub().resolves('hi');
      const cacheStore = InMemoryCacheStore();
      const spy = sinon.spy(cacheStore, 'put');

      const cache = SimpleCache(delegate, x => x, cacheStore);
      const result = await cache.readThrough("some request");
      expect(result).to.eql('hi');
      expect(spy).to.have.been.calledOnce;
    });

    it("fetches from CacheStore", async () => {
      const delegate = sinon.stub().resolves('hi');
      const cacheStore = InMemoryCacheStore();
      const put = sinon.spy(cacheStore, 'put');
      const get = sinon.spy(cacheStore, 'get');

      const cache = SimpleCache(delegate, x => x, cacheStore);
      const result = [
        await cache.readThrough("some request"),
        await cache.readThrough("some request")
      ];
      expect(result).to.eql(['hi', 'hi']);
      expect(put).to.have.been.calledOnce;
      expect(get).to.have.been.calledTwice;
    });
  });

  describe("normalizing requests", () => {
    it("performs request normalisation", async () => {
      const delegate = sinon.stub().resolves('hi');
      const cacheStore = InMemoryCacheStore();
      const normalizer = (request) => request;

      const put = sinon.spy(cacheStore, 'put');
      const normalization = sinon.spy(normalizer);

      const cache = SimpleCache(delegate, normalization, cacheStore);
      const requestOne = {
        a: [1, 2],
        b: [3, 4]
      };
      const requestTwo = {
        a: [2, 1],
        b: [3, 4]
      };

      await cache.readThrough(requestOne);
      await cache.readThrough(requestTwo);

      expect(put).to.have.been.calledTwice;
      expect(normalization).to.have.been.calledTwice;
    });

    it("causes cache hit for normlized request", async () => {
      const delegate = sinon.stub().resolves('hi');
      const normalizer = ({a, b}) => {
        a.sort();
        b.sort();
        return { a, b }
      }
      const normalization = sinon.spy(normalizer);

      const cache = SimpleCache(delegate, normalization);
      const requestOne = {
        a: [1, 2],
        b: [3, 4]
      };
      const requestTwo = {
        a: [2, 1],
        b: [3, 4]
      };

      await cache.readThrough(requestOne);
      await cache.readThrough(requestTwo);

      expect(delegate).to.have.been.calledOnce;
      expect(normalization).to.have.been.calledTwice;
    });
  });
});
