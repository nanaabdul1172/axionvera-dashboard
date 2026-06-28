import { exportToCSV, exportToJSON, exportTimeSeriesCSV } from "@/utils/chartExport";

function getLastBlobContent(): string {
  const mockBlob = (global.Blob as jest.Mock).mock.calls.at(-1)?.[0]?.[0] ?? "";
  return mockBlob;
}

function getLastDownloadFilename(): string {
  const anchor = document.querySelector("a[download]") as HTMLAnchorElement | null;
  return anchor?.download ?? "";
}

beforeEach(() => {
  // Mock Blob constructor
  global.Blob = jest.fn((parts: BlobPart[], options?: BlobPropertyBag) => ({
    size: (parts as string[]).reduce((s, p) => s + p.length, 0),
    type: options?.type ?? "",
    text: async () => (parts as string[]).join(""),
  })) as unknown as typeof Blob;

  // Mock anchor click
  const clickMock = jest.fn();
  jest.spyOn(document, "createElement").mockImplementation((tag) => {
    if (tag === "a") {
      const a = { href: "", download: "", click: clickMock } as unknown as HTMLAnchorElement;
      return a;
    }
    return document.createElement(tag);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("exportToCSV", () => {
  const data = [
    { date: "2025-01-01", value: 100, extra: "x" },
    { date: "2025-01-02", value: 200, extra: "y" },
  ];

  it("calls Blob with CSV content including headers", () => {
    exportToCSV(data, "test.csv");
    const content = getLastBlobContent();
    expect(content).toContain("date,value,extra");
    expect(content).toContain("2025-01-01");
    expect(content).toContain("100");
  });

  it("filters columns when fields option is provided", () => {
    exportToCSV(data, "test.csv", { fields: ["date", "value"] });
    const content = getLastBlobContent();
    expect(content).toContain("date,value");
    expect(content).not.toContain("extra");
  });

  it("adds metadata comment when includeMetadata=true", () => {
    exportToCSV(data, "test.csv", { includeMetadata: true });
    const content = getLastBlobContent();
    expect(content).toContain("# Exported:");
    expect(content).toContain("# Rows: 2");
  });

  it("escapes commas in cell values", () => {
    exportToCSV([{ label: "hello, world", value: 1 }], "test.csv");
    const content = getLastBlobContent();
    expect(content).toContain('"hello, world"');
  });
});

describe("exportToJSON", () => {
  it("calls Blob with JSON stringified content", () => {
    exportToJSON({ key: "value" }, "test.json");
    const content = getLastBlobContent();
    expect(JSON.parse(content)).toEqual({ key: "value" });
  });

  it("wraps data in metadata when includeMetadata=true", () => {
    exportToJSON([1, 2, 3], "test.json", { includeMetadata: true });
    const content = getLastBlobContent();
    const parsed = JSON.parse(content);
    expect(parsed).toHaveProperty("exportedAt");
    expect(parsed).toHaveProperty("data");
    expect(parsed.data).toEqual([1, 2, 3]);
  });
});

describe("exportTimeSeriesCSV", () => {
  const tsData = [
    { timestamp: 1700000000000, date: "2023-11-14", value: 42 },
    { timestamp: 1700086400000, date: "2023-11-15", value: 55 },
  ];

  it("always includes date and value columns", () => {
    exportTimeSeriesCSV(tsData, "ts.csv");
    const content = getLastBlobContent();
    expect(content).toContain("date");
    expect(content).toContain("value");
  });

  it("merges extra fields from config.fields", () => {
    exportTimeSeriesCSV(tsData, "ts.csv", { fields: ["timestamp"] });
    const content = getLastBlobContent();
    expect(content).toContain("timestamp");
  });
});
