export type VoteChoice = "for" | "against" | "abstain";

export type ProposalState = "active" | "passed" | "rejected" | "queued";

export type GovernanceProposal = {
  id: string;
  title: string;
  summary: string;
  proposer: string;
  category: string;
  createdAt: string;
  votingEndsAt: string;
  quorum: number;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  state: ProposalState;
  executionPlan: string[];
};

export type ProposalTally = {
  totalVotes: number;
  participationPercent: number;
  supportPercent: number;
  quorumReached: boolean;
  stateLabel: string;
};
