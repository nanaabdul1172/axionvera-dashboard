import { parseDashboardSchema, DashboardSchemaError, protocolDashboardSchema } from "@/schema";

describe("parseDashboardSchema", () => {
  it("accepts a nested dashboard schema", () => {
    const parsed = parseDashboardSchema(protocolDashboardSchema);
    expect(parsed.schema.id).toBe("protocol-overview");
    expect(parsed.warnings).toEqual([]);
  });

  it("rejects malformed schemas with useful paths", () => {
    expect(() => parseDashboardSchema({ version: 1, id: "bad", title: "Bad", root: { id: "x", component: "chart" } }))
      .toThrow(DashboardSchemaError);
    expect(() => parseDashboardSchema({ version: 1, id: "bad", title: "Bad", root: { id: "x", component: "chart" } }))
      .toThrow("$schema.root");
  });
});
