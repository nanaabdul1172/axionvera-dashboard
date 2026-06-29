import { useMemo, useState, type ReactNode } from "react";

import { Button } from "@/design-system/Button";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/design-system/Card";
import { Input } from "@/design-system/Input";
import { cn } from "@/lib/utils";
import { validateFieldValue } from "@/core/schemaValidation";
import { DashboardSchemaError, parseDashboardSchema } from "@/schema/parser";
import type { DashboardFormNode, DashboardPageSchema, DashboardSchemaNode } from "@/types/dashboardSchema";

interface DashboardSchemaRendererProps {
  schema: DashboardPageSchema | unknown;
  onSubmit?: (formId: string, values: Record<string, string>) => void;
}

const gridColumns = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
};

function NodeHeader({ node }: { node: DashboardSchemaNode }) {
  if (!node.title && !node.description) return null;
  return (
    <CardHeader>
      {node.title ? <CardTitle>{node.title}</CardTitle> : null}
      {node.description ? <CardDescription>{node.description}</CardDescription> : null}
    </CardHeader>
  );
}

function FormNode({ node, onSubmit }: { node: DashboardFormNode; onSubmit?: DashboardSchemaRendererProps["onSubmit"] }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  return (
    <Card className={node.className}>
      <NodeHeader node={node} />
      <CardBody>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const nextErrors = Object.fromEntries(
              node.fields.map((field) => [field.id, validateFieldValue(field, values[field.id] ?? "")])
            );
            setErrors(nextErrors);
            if (Object.values(nextErrors).some(Boolean)) return;
            onSubmit?.(node.id, values);
          }}
        >
          {node.fields.map((field) => (
            <Input
              key={field.id}
              label={field.label}
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              helperText={field.helperText}
              required={field.validation?.required}
              min={field.validation?.min}
              max={field.validation?.max}
              pattern={field.validation?.pattern}
              value={values[field.id] ?? ""}
              error={errors[field.id] ?? undefined}
              onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))}
            />
          ))}
          <Button type="submit">{node.submitLabel ?? "Submit"}</Button>
        </form>
      </CardBody>
    </Card>
  );
}

function renderNode(node: DashboardSchemaNode, onSubmit?: DashboardSchemaRendererProps["onSubmit"]): ReactNode {
  if (node.component === "layout") {
    const isGrid = node.variant === "grid";
    return (
      <section className={cn(isGrid ? `grid gap-6 ${gridColumns[node.columns ?? 2]}` : "space-y-6", node.className)}>
        {node.children.map((child) => (
          <div key={child.id}>{renderNode(child, onSubmit)}</div>
        ))}
      </section>
    );
  }

  if (node.component === "form") return <FormNode node={node} onSubmit={onSubmit} />;

  if (node.component === "table") {
    return (
      <Card className={node.className}>
        <NodeHeader node={node} />
        <CardBody className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-text-muted">
              <tr>{node.columns.map((column) => <th key={column.key} className="px-3 py-2">{column.header}</th>)}</tr>
            </thead>
            <tbody>
              {node.rows.length === 0 ? (
                <tr><td className="px-3 py-4 text-text-muted" colSpan={node.columns.length}>{node.emptyMessage ?? "No rows to display."}</td></tr>
              ) : node.rows.map((row, index) => (
                <tr key={index} className="border-t border-border-primary">
                  {node.columns.map((column) => <td key={column.key} className="px-3 py-3">{String(row[column.key] ?? "—")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={node.className}>
      <NodeHeader node={node} />
      <CardBody className="grid gap-4 sm:grid-cols-2">
        {node.widgets.map((widget) => (
          <article key={widget.id} className="rounded-xl border border-border-primary bg-background-secondary/30 p-4">
            <p className="text-xs font-medium uppercase text-text-muted">{widget.title}</p>
            {widget.value !== undefined ? <p className="mt-2 text-2xl font-semibold">{widget.value}</p> : null}
            {widget.description ? <p className="mt-1 text-xs text-text-muted">{widget.description}</p> : null}
          </article>
        ))}
      </CardBody>
    </Card>
  );
}

export function DashboardSchemaRenderer({ schema, onSubmit }: DashboardSchemaRendererProps) {
  const parsed = useMemo(() => {
    try {
      return { result: parseDashboardSchema(schema), error: null };
    } catch (error) {
      return { result: null, error: error instanceof Error ? error : new DashboardSchemaError("Unknown schema error.", "$schema") };
    }
  }, [schema]);

  if (parsed.error) {
    return <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-600">Invalid dashboard schema: {parsed.error.message}</div>;
  }

  const page = parsed.result.schema;
  return (
    <div className="space-y-6" data-schema-id={page.id}>
      <header>
        <h1 className="text-2xl font-semibold text-text-primary">{page.title}</h1>
        {page.description ? <p className="mt-2 text-sm text-text-muted">{page.description}</p> : null}
      </header>
      {renderNode(page.root, onSubmit)}
    </div>
  );
}
