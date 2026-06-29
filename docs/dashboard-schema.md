# Dashboard Schema Specification

Axionvera dashboard schemas are declarative JSON documents that describe pages without requiring bespoke React pages for each protocol module.

## Page shape

```json
{
  "version": 1,
  "id": "protocol-overview",
  "title": "Protocol Overview",
  "description": "Optional subtitle",
  "root": { "id": "root", "component": "layout", "children": [] }
}
```

The parser rejects unsupported versions, missing required strings, duplicate component IDs, unsupported component names, and malformed child collections with path-aware errors such as `$schema.root.children[0]`.

## Components

### `layout`

Layouts compose nested components. Use `variant: "grid"` with `columns` from `1` to `4`, or omit the variant for stacked sections.

### `widget`

Widgets render metric or text cards from `widgets` entries containing `id`, `type`, `title`, optional `value`, and optional `description`.

### `form`

Forms render design-system inputs from `fields`. Fields support `text`, `number`, `email`, and `password` input types. Validation supports `required`, numeric `min`/`max`, regular-expression `pattern`, and custom `message`.

### `table`

Tables render `columns` and JSON `rows`. Each column has a `key` and `header`; row values are read by key and missing values render as an em dash.

## Renderer lifecycle

1. `parseDashboardSchema` validates the unknown JSON payload.
2. `DashboardSchemaRenderer` memoizes parsing and displays path-aware schema errors in an alert.
3. The renderer recursively maps schema nodes to design-system cards, tables, widgets, nested layouts, and forms.
4. Form submissions run client-side field validation before invoking `onSubmit(formId, values)`.

See `src/schema/examples.ts` for a runnable protocol overview schema.
