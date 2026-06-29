import type { ExportConfig, TimeSeriesDataPoint } from "@/types/analytics";

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function filterFields<T extends Record<string, unknown>>(
  data: T[],
  fields?: string[]
): Record<string, unknown>[] {
  if (!fields || fields.length === 0) return data;
  return data.map((row) =>
    Object.fromEntries(fields.filter((f) => f in row).map((f) => [f, row[f]]))
  );
}

function filterByDateRange<T extends Record<string, unknown>>(
  data: T[],
  dateRange?: ExportConfig["dateRange"]
): T[] {
  if (!dateRange) return data;
  return data.filter((row) => {
    const ts = row.timestamp;
    if (typeof ts !== "number") return true;
    return ts >= dateRange.start && ts <= dateRange.end;
  });
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape  = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];
  return lines.join("\n");
}

/**
 * Download chart data as a CSV file.
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  filename = "export.csv",
  config?: Partial<ExportConfig>
): void {
  let rows = filterByDateRange(data, config?.dateRange);
  rows     = filterFields(rows, config?.fields);

  const meta = config?.includeMetadata
    ? `# Exported: ${new Date().toISOString()}\n# Rows: ${rows.length}\n`
    : "";

  downloadFile(meta + toCSV(rows), filename, "text/csv;charset=utf-8;");
}

/**
 * Download chart data as a JSON file.
 */
export function exportToJSON(
  data: unknown,
  filename = "export.json",
  config?: Partial<ExportConfig>
): void {
  const payload = config?.includeMetadata
    ? { exportedAt: new Date().toISOString(), data }
    : data;

  downloadFile(JSON.stringify(payload, null, 2), filename, "application/json");
}

/**
 * Convenience wrapper for time-series data (always includes date + value).
 */
export function exportTimeSeriesCSV(
  data: TimeSeriesDataPoint[],
  filename = "timeseries.csv",
  config?: Partial<ExportConfig>
): void {
  const baseFields = ["date", "value", "timestamp"];
  const extraFields = config?.fields ?? [];
  const fields = [...new Set([...baseFields, ...extraFields])];

  exportToCSV(data as Record<string, unknown>[], filename, { ...config, fields });
}
