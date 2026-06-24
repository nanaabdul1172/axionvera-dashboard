import { useMemo, useState } from "react";

import { castGovernanceVote, formatGovernancePercent, getProposalTally } from "./governanceModel";
import { initialGovernanceProposals } from "./proposals";
import type { GovernanceProposal, VoteChoice } from "./types";

const voteLabels: Record<VoteChoice, string> = {
  for: "Support",
  against: "Against",
  abstain: "Abstain"
};

const voteButtonClasses: Record<VoteChoice, string> = {
  for: "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200",
  against: "border-rose-500 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-200",
  abstain: "border-slate-400 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200"
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</div>
    </div>
  );
}

export default function GovernanceDashboard() {
  const [proposals, setProposals] = useState<GovernanceProposal[]>(initialGovernanceProposals);
  const [selectedProposalId, setSelectedProposalId] = useState(initialGovernanceProposals[0]?.id ?? "");
  const [votesByProposal, setVotesByProposal] = useState<Record<string, VoteChoice>>({});

  const selectedProposal = proposals.find((proposal) => proposal.id === selectedProposalId) ?? proposals[0];
  const selectedVote = selectedProposal ? votesByProposal[selectedProposal.id] : undefined;
  const selectedTally = selectedProposal ? getProposalTally(selectedProposal) : null;

  const governanceSummary = useMemo(() => {
    const active = proposals.filter((proposal) => proposal.state === "active").length;
    const totalVotes = proposals.reduce((sum, proposal) => sum + getProposalTally(proposal).totalVotes, 0);
    const quorumReached = proposals.filter((proposal) => getProposalTally(proposal).quorumReached).length;

    return { active, totalVotes, quorumReached };
  }, [proposals]);

  function handleVote(choice: VoteChoice) {
    if (!selectedProposal) return;

    setProposals((current) =>
      current.map((proposal) =>
        proposal.id === selectedProposal.id
          ? castGovernanceVote(proposal, choice, votesByProposal[proposal.id])
          : proposal
      )
    );
    setVotesByProposal((current) => ({ ...current, [selectedProposal.id]: choice }));
  }

  if (!selectedProposal || !selectedTally) {
    return null;
  }

  return (
    <section className="space-y-6" aria-labelledby="governance-heading">
      <div>
        <p className="text-sm font-medium uppercase text-axion-600 dark:text-axion-300">
          Governance
        </p>
        <h1 id="governance-heading" className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
          Proposals and voting
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">
          Review active protocol proposals, inspect voting details, and cast a local dashboard vote.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Active proposals" value={String(governanceSummary.active)} detail={`${proposals.length} total proposals`} />
        <StatCard label="Recorded voting power" value={formatNumber(governanceSummary.totalVotes)} detail="Across visible proposals" />
          <StatCard label="Quorum reached" value={String(governanceSummary.quorumReached)} detail="Across proposal tallies" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <h2 className="px-2 text-lg font-semibold text-slate-900 dark:text-white">Proposal list</h2>
          <div className="mt-4 space-y-3">
            {proposals.map((proposal) => {
              const tally = getProposalTally(proposal);
              const isSelected = proposal.id === selectedProposal.id;

              return (
                <button
                  key={proposal.id}
                  type="button"
                  onClick={() => setSelectedProposalId(proposal.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    isSelected
                      ? "border-axion-500 bg-axion-50 shadow-sm dark:bg-axion-950/30"
                      : "border-slate-200 bg-slate-50 hover:border-axion-300 dark:border-slate-800 dark:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                        {proposal.id} · {proposal.category}
                      </div>
                      <div className="mt-1 font-semibold text-slate-900 dark:text-white">{proposal.title}</div>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {tally.stateLabel}
                    </span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-axion-500"
                      style={{ width: formatGovernancePercent(tally.participationPercent) }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {formatGovernancePercent(tally.participationPercent)} quorum participation
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-medium text-axion-600 dark:text-axion-300">{selectedProposal.id}</div>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{selectedProposal.title}</h2>
              <p className="mt-2 text-slate-600 dark:text-slate-300">{selectedProposal.summary}</p>
            </div>
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {selectedTally.stateLabel}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Support" value={formatGovernancePercent(selectedTally.supportPercent)} detail={`${formatNumber(selectedProposal.votesFor)} votes`} />
            <StatCard label="Participation" value={formatGovernancePercent(selectedTally.participationPercent)} detail={`${formatNumber(selectedTally.totalVotes)} of ${formatNumber(selectedProposal.quorum)}`} />
            <StatCard label="Voting ends" value={new Date(selectedProposal.votingEndsAt).toLocaleDateString()} detail={`Proposed by ${selectedProposal.proposer}`} />
          </div>

          <div className="mt-6 grid gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">For</span>
              <span className="text-slate-500 dark:text-slate-400">{formatNumber(selectedProposal.votesFor)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-2 rounded-full bg-emerald-500" style={{ width: formatGovernancePercent(selectedTally.supportPercent) }} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-500 dark:text-slate-400">
              <div>Against: {formatNumber(selectedProposal.votesAgainst)}</div>
              <div>Abstain: {formatNumber(selectedProposal.votesAbstain)}</div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <h3 className="font-semibold text-slate-900 dark:text-white">Cast vote</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(Object.keys(voteLabels) as VoteChoice[]).map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => handleVote(choice)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${voteButtonClasses[choice]} ${
                    selectedVote === choice ? "ring-2 ring-axion-400 ring-offset-2 dark:ring-offset-slate-950" : ""
                  }`}
                >
                  {voteLabels[choice]}
                </button>
              ))}
            </div>
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-300" aria-live="polite">
              Your vote: {selectedVote ? voteLabels[selectedVote] : "Not voted"}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-slate-900 dark:text-white">Governance flow</h3>
            <ol className="mt-3 grid gap-3 text-sm text-slate-600 dark:text-slate-300">
              {selectedProposal.executionPlan.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/70">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-axion-100 text-xs font-semibold text-axion-700 dark:bg-axion-950 dark:text-axion-200">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </article>
      </div>
    </section>
  );
}
