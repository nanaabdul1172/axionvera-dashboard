/**
 * @module components/optimized
 *
 * Performance-optimized component exports.
 */

export { MemoizedBalanceCard } from "./MemoizedBalanceCard";
export {
  LazyAnalyticsDashboard,
  LazyTransactionHistory,
  LazyGovernanceStats,
  LazyProposalList,
  LazyPerformanceChart,
  LazyFlowChart,
  LazyAPYChart,
  LazyCreateProposalModal,
  makeLazy,
} from "./LazyComponents";
export { VirtualList, useVirtualScroll } from "./VirtualList";
