import type { ActiveDispatch, CompletedDispatch, GameState } from "../data/types";

export type NarrateDispatchRef = Pick<ActiveDispatch, "dispatchId" | "missionId" | "mercId">;

/** narrate가 아직 필요한 파견 — 진행 중·완료 대기 모두 포함 */
export function listDispatchesForNarrate(state: GameState): NarrateDispatchRef[] {
  const completed: CompletedDispatch[] = state.completedDispatches;
  return [...state.activeDispatches, ...completed];
}

/** aiNarrativeKo가 비어 있는 첫 파견 (FIFO) */
export function findPendingNarrateDispatch(state: GameState): NarrateDispatchRef | null {
  for (const dispatch of listDispatchesForNarrate(state)) {
    const report = state.generatedReports[dispatch.dispatchId];
    if (report && report.aiNarrativeKo === undefined) {
      return dispatch;
    }
  }
  return null;
}

/** AI 브리핑 토글 ON 시 — FALLBACK으로 고착된 진행/완료 파견을 narrate 재시도 가능 상태로 되돌린다. */
export function resetFallbackReportsForNarrateRetry(
  state: GameState
): GameState["generatedReports"] {
  const reports = { ...state.generatedReports };
  for (const dispatch of listDispatchesForNarrate(state)) {
    const report = reports[dispatch.dispatchId];
    if (report?.aiNarrativeKo === "FALLBACK") {
      reports[dispatch.dispatchId] = { ...report, aiNarrativeKo: undefined };
    }
  }
  return reports;
}
