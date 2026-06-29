import { DashboardDataPipeline, MemoryPipelineCache, normalizeArrayById } from "@/data";

describe("DashboardDataPipeline", () => {
  it("normalizes fetched records before caching", async () => {
    const cache = new MemoryPipelineCache();
    const pipeline = new DashboardDataPipeline({
      key: "positions",
      ttlMs: 1000,
      cache,
      now: () => 100,
      fetcher: async () => [
        { id: "a", balance: 1 },
        { id: "b", balance: 2 },
      ],
      transform: (records) => normalizeArrayById(records, "id"),
    });

    const result = await pipeline.read();

    expect(result.source).toBe("network");
    expect(result.data).toEqual({
      a: { id: "a", balance: 1 },
      b: { id: "b", balance: 2 },
    });
    expect(cache.read("positions")?.data).toEqual(result.data);
  });

  it("returns fresh cached data and minimizes duplicate fetches", async () => {
    let calls = 0;
    let now = 100;
    const pipeline = new DashboardDataPipeline({
      key: "analytics:wallet",
      ttlMs: 1000,
      cache: new MemoryPipelineCache(),
      now: () => now,
      fetcher: async () => {
        calls += 1;
        return { value: calls };
      },
    });

    await expect(pipeline.read()).resolves.toMatchObject({ data: { value: 1 }, source: "network" });
    await expect(pipeline.read()).resolves.toMatchObject({ data: { value: 1 }, source: "cache" });

    now = 1200;
    await Promise.all([pipeline.read(), pipeline.read(), pipeline.read()]);

    expect(calls).toBe(2);
  });

  it("notifies subscribers when cached data is updated", async () => {
    const subscriber = jest.fn();
    const pipeline = new DashboardDataPipeline({
      key: "health",
      ttlMs: 1000,
      cache: new MemoryPipelineCache(),
      now: () => 500,
      fetcher: async () => ({ status: "operational" }),
    });

    const unsubscribe = pipeline.subscribe(subscriber);
    await pipeline.read();
    unsubscribe();
    await pipeline.read({ force: true });

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "operational" }, updatedAt: 500, expiresAt: 1500 }),
    );
  });
});
