import { Cache } from "../cache";

describe("Cache", () => {
  let c: Cache;

  beforeEach(() => {
    c = new Cache();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ─── set / get ────────────────────────────────────────────────────────────

  it("returns a stored value before TTL expires", () => {
    c.set("k", "v", { ttl: 1000 });
    expect(c.get("k")).toBe("v");
  });

  it("returns undefined after TTL expires", () => {
    c.set("k", "v", { ttl: 1000 });
    jest.advanceTimersByTime(1001);
    expect(c.get("k")).toBeUndefined();
  });

  it("isFresh returns false after TTL", () => {
    c.set("k", "v", { ttl: 500 });
    jest.advanceTimersByTime(501);
    expect(c.isFresh("k")).toBe(false);
  });

  it("delete removes the entry", () => {
    c.set("k", "v");
    c.delete("k");
    expect(c.get("k")).toBeUndefined();
  });

  it("clear empties the store", () => {
    c.set("a", 1);
    c.set("b", 2);
    c.clear();
    expect(c.get("a")).toBeUndefined();
    expect(c.get("b")).toBeUndefined();
  });

  // ─── invalidateByTag ─────────────────────────────────────────────────────

  it("invalidateByTag removes all tagged entries", () => {
    c.set("a", 1, { tags: ["wallet:G1"] });
    c.set("b", 2, { tags: ["wallet:G1"] });
    c.set("c", 3, { tags: ["wallet:G2"] });
    c.invalidateByTag("wallet:G1");
    expect(c.get("a")).toBeUndefined();
    expect(c.get("b")).toBeUndefined();
    expect(c.get("c")).toBe(3);
  });

  // ─── getOrFetch ───────────────────────────────────────────────────────────

  it("calls factory on cache miss and caches the result", async () => {
    const factory = jest.fn().mockResolvedValue("data");
    const result = await c.getOrFetch("k", factory, { ttl: 5000 });
    expect(result).toBe("data");
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("returns cached value on subsequent calls without calling factory", async () => {
    const factory = jest.fn().mockResolvedValue("data");
    await c.getOrFetch("k", factory, { ttl: 5000 });
    await c.getOrFetch("k", factory, { ttl: 5000 });
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("re-fetches after TTL expires (swr:false)", async () => {
    const factory = jest.fn().mockResolvedValue("data");
    await c.getOrFetch("k", factory, { ttl: 500, swr: false });
    jest.advanceTimersByTime(501);
    await c.getOrFetch("k", factory, { ttl: 500, swr: false });
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("stale-while-revalidate returns stale value immediately", async () => {
    jest.useRealTimers();
    const factory = jest.fn()
      .mockResolvedValueOnce("v1")
      .mockResolvedValue("v2");

    // Populate cache
    await c.getOrFetch("k", factory, { ttl: 50, swr: true });

    // Let TTL expire
    await new Promise((r) => setTimeout(r, 60));

    // SWR: stale value returned, background refresh starts
    const stale = await c.getOrFetch("k", factory, { ttl: 50, swr: true });
    expect(stale).toBe("v1");

    // Wait for background refresh to settle
    await new Promise((r) => setTimeout(r, 20));
    expect(c.isFresh("k")).toBe(true);
  });

  it("propagates factory errors on cache miss", async () => {
    const factory = jest.fn().mockRejectedValue(new Error("fetch failed"));
    await expect(c.getOrFetch("k", factory)).rejects.toThrow("fetch failed");
  });

  it("uses default TTL of 30 000 ms when none is provided", () => {
    c.set("k", "v");
    expect(c.isFresh("k")).toBe(true);
    jest.advanceTimersByTime(29_999);
    expect(c.isFresh("k")).toBe(true);
    jest.advanceTimersByTime(1);
    expect(c.isFresh("k")).toBe(false);
  });
});
