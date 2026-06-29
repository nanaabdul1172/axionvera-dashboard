import { DependencyManager, DataSource, Widget } from "@/core/dependency/DependencyManager";

describe("DependencyManager", () => {
  let manager: DependencyManager;

  beforeEach(() => {
    manager = new DependencyManager();
  });

  it("should resolve a simple loading order", () => {
    const ds1: DataSource = { id: "ds1", name: "DS 1", loader: async () => {} };
    const w1: Widget = { id: "w1", name: "W 1", dependencies: ["ds1"] };

    manager.registerDataSource(ds1);
    manager.registerWidget(w1);

    const order = manager.getLoadingOrder();
    expect(order).toEqual(["ds1", "w1"]);
  });

  it("should resolve complex dependencies", () => {
    const ds1: DataSource = { id: "ds1", name: "DS 1", loader: async () => {} };
    const ds2: DataSource = { id: "ds2", name: "DS 2", loader: async () => {} };
    const w1: Widget = { id: "w1", name: "W 1", dependencies: ["ds1", "ds2"] };
    const w2: Widget = { id: "w2", name: "W 2", dependencies: ["w1", "ds1"] };

    manager.registerDataSource(ds1);
    manager.registerDataSource(ds2);
    manager.registerWidget(w1);
    manager.registerWidget(w2);

    const order = manager.getLoadingOrder();

    // ds1 and ds2 should come before w1
    // w1 should come before w2
    const ds1Idx = order.indexOf("ds1");
    const ds2Idx = order.indexOf("ds2");
    const w1Idx = order.indexOf("w1");
    const w2Idx = order.indexOf("w2");

    expect(ds1Idx).toBeLessThan(w1Idx);
    expect(ds2Idx).toBeLessThan(w1Idx);
    expect(w1Idx).toBeLessThan(w2Idx);
    expect(ds1Idx).toBeLessThan(w2Idx);
  });

  it("should throw error for circular dependencies", () => {
    const w1: Widget = { id: "w1", name: "W 1", dependencies: ["w2"] };
    const w2: Widget = { id: "w2", name: "W 2", dependencies: ["w1"] };

    manager.registerWidget(w1);
    expect(() => {
      manager.registerWidget(w2);
    }).toThrow("Circular dependency detected");
  });

  it("should handle multiple widgets sharing a data source", () => {
    const ds1: DataSource = { id: "ds1", name: "DS 1", loader: async () => {} };
    const w1: Widget = { id: "w1", name: "W 1", dependencies: ["ds1"] };
    const w2: Widget = { id: "w2", name: "W 2", dependencies: ["ds1"] };

    manager.registerDataSource(ds1);
    manager.registerWidget(w1);
    manager.registerWidget(w2);

    const order = manager.getLoadingOrder();
    expect(order.indexOf("ds1")).toBeLessThan(order.indexOf("w1"));
    expect(order.indexOf("ds1")).toBeLessThan(order.indexOf("w2"));
    expect(order.filter(id => id === "ds1").length).toBe(1);
  });
});
