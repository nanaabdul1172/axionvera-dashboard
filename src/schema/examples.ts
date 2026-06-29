import type { DashboardPageSchema } from "@/types/dashboardSchema";

export const protocolDashboardSchema: DashboardPageSchema = {
  version: 1,
  id: "protocol-overview",
  title: "Protocol Overview",
  description: "Schema-rendered dashboard for protocol modules.",
  root: {
    id: "root-grid",
    component: "layout",
    variant: "grid",
    columns: 2,
    children: [
      {
        id: "health-widgets",
        component: "widget",
        title: "Health",
        widgets: [
          { id: "tvl", type: "metric", title: "TVL", value: "$2.4M", description: "Across active vaults" },
          { id: "apy", type: "metric", title: "APY", value: "8.2%", description: "Trailing 30 days" }
        ]
      },
      {
        id: "operator-form",
        component: "form",
        title: "Operator Action",
        submitLabel: "Simulate",
        fields: [
          { id: "amount", label: "Amount", type: "number", validation: { required: true, min: 1 } },
          { id: "memo", label: "Memo", type: "text", helperText: "Optional transaction note" }
        ]
      },
      {
        id: "vault-table",
        component: "table",
        title: "Vaults",
        columns: [
          { key: "name", header: "Name" },
          { key: "status", header: "Status" },
          { key: "balance", header: "Balance" }
        ],
        rows: [
          { name: "Core Vault", status: "Healthy", balance: "1,200 AXV" },
          { name: "Rewards", status: "Syncing", balance: "320 AXV" }
        ]
      }
    ]
  }
};
