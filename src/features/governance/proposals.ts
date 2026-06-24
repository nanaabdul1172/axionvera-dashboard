import type { GovernanceProposal } from "./types";

export const initialGovernanceProposals: GovernanceProposal[] = [
  {
    id: "avp-024",
    title: "Launch community validator incentive round",
    summary:
      "Allocate a focused incentive budget for validators that improve uptime reporting, incident response, and testnet coverage.",
    proposer: "Axionvera Core",
    category: "Network Operations",
    createdAt: "2026-06-18",
    votingEndsAt: "2026-06-28",
    quorum: 120000,
    votesFor: 82300,
    votesAgainst: 18100,
    votesAbstain: 9600,
    state: "active",
    executionPlan: [
      "Publish validator eligibility criteria",
      "Open a two-week participation window",
      "Review uptime and reporting evidence",
      "Release final incentive allocation report"
    ]
  },
  {
    id: "avp-025",
    title: "Prioritize vault analytics refresh cadence",
    summary:
      "Move vault analytics refreshes to a predictable schedule so dashboards show fresher balance, reward, and participation data.",
    proposer: "Analytics Working Group",
    category: "Dashboard",
    createdAt: "2026-06-20",
    votingEndsAt: "2026-06-30",
    quorum: 95000,
    votesFor: 54100,
    votesAgainst: 12400,
    votesAbstain: 8100,
    state: "active",
    executionPlan: [
      "Document the refresh cadence",
      "Add monitoring for stale analytics payloads",
      "Surface last refresh time in the dashboard"
    ]
  },
  {
    id: "avp-023",
    title: "Adopt treasury reporting template",
    summary:
      "Standardize monthly treasury reporting around inflows, outflows, protocol reserves, and open obligations.",
    proposer: "Treasury Council",
    category: "Treasury",
    createdAt: "2026-06-10",
    votingEndsAt: "2026-06-21",
    quorum: 100000,
    votesFor: 104500,
    votesAgainst: 16800,
    votesAbstain: 5700,
    state: "passed",
    executionPlan: [
      "Publish template in governance docs",
      "Backfill the previous monthly report",
      "Use the template for the next reporting cycle"
    ]
  }
];
