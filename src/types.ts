export type ProposalState = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED' | 'EXECUTED' | 'DEFEATED' | 'AWAITING_DELIVERY' | 'DELIVERY_REJECTED' | 'APPEALED';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  creator: string;
  requestedFunds: number;
  state: ProposalState;
  aiReasoning: string | null;
  createdAt: string;
  category?: string;
  riskScore?: number;
  votesFor?: number;
  votesAgainst?: number;
  deliveryUrl?: string;
  deliverySummary?: string;
}
