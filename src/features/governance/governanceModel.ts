import type { GovernanceProposal, ProposalTally, VoteChoice } from "./types";

const voteFieldByChoice: Record<VoteChoice, keyof Pick<GovernanceProposal, "votesFor" | "votesAgainst" | "votesAbstain">> = {
  for: "votesFor",
  against: "votesAgainst",
  abstain: "votesAbstain"
};

export function getProposalTally(proposal: GovernanceProposal): ProposalTally {
  const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
  const participationPercent = proposal.quorum > 0 ? Math.min((totalVotes / proposal.quorum) * 100, 100) : 0;
  const supportPercent = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
  const quorumReached = totalVotes >= proposal.quorum;

  let stateLabel = "Voting open";
  if (proposal.state === "queued") {
    stateLabel = "Queued";
  } else if (proposal.state === "passed" || (proposal.state === "active" && quorumReached && proposal.votesFor > proposal.votesAgainst)) {
    stateLabel = "Passing";
  } else if (proposal.state === "rejected" || (proposal.state === "active" && quorumReached && proposal.votesAgainst >= proposal.votesFor)) {
    stateLabel = "Not passing";
  } else if (!quorumReached) {
    stateLabel = "Quorum needed";
  }

  return {
    totalVotes,
    participationPercent,
    supportPercent,
    quorumReached,
    stateLabel
  };
}

export function castGovernanceVote(
  proposal: GovernanceProposal,
  nextVote: VoteChoice,
  previousVote?: VoteChoice,
  votingPower = 10000
): GovernanceProposal {
  const updated = { ...proposal };

  if (previousVote) {
    const previousField = voteFieldByChoice[previousVote];
    updated[previousField] = Math.max(0, updated[previousField] - votingPower);
  }

  const nextField = voteFieldByChoice[nextVote];
  updated[nextField] += votingPower;

  return updated;
}

export function formatGovernancePercent(value: number): string {
  return `${Math.round(value)}%`;
}
