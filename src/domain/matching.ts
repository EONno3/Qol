import { getMatch } from "../data/lookups";
import type { MatchCase, MatchSignal, Outlook } from "../data/types";

export { getMatch };

export function canDeploy(match: MatchCase): boolean {
  return match.deploymentVerdict !== "locked";
}

export function effectiveAnalysisLevel(mercLevel: number, missionLevel: number): number {
  return Math.min(mercLevel, missionLevel);
}

export interface VisibleMatchInfo {
  canDeploy: boolean;
  signals: MatchSignal[];
  successOutlook: Outlook | null;
  lossOutlook: Outlook | null;
}

export function visibleMatchInfo(match: MatchCase, level: number): VisibleMatchInfo {
  const deployable = canDeploy(match);
  
  // Phase 0 (Level 0): 출격 가능 여부만 제공 (signals 없음)
  if (level <= 0) {
    // 단, 출격 불가 사유(locked)는 가장 중요한 정보이므로 signals에 한줄 요약으로 제공할 수 있음.
    // 하지만 현재 시스템상 locked 상태 자체가 canDeploy = false로 UI에 표시되므로 빈 배열 반환.
    return { canDeploy: deployable, signals: [], successOutlook: null, lossOutlook: null };
  }
  
  // Phase 1 (Level 1): 출격 가능 여부 + 긍정/부정 요소의 대략적 개수 및 존재 여부만 제공.
  if (level === 1) {
    const advantageCount = match.signals.filter(s => s.signalType === "advantage").length;
    const disadvantageCount = match.signals.filter(s => s.signalType === "disadvantage" || s.signalType === "conditional").length;
    
    const blurredSignals: MatchSignal[] = [];
    if (advantageCount > 0) {
      blurredSignals.push({ signalType: "advantage", textKo: `긍정 요소 ${advantageCount}개 감지` });
    }
    if (disadvantageCount > 0) {
      blurredSignals.push({ signalType: "disadvantage", textKo: `위험 요소 ${disadvantageCount}개 감지` });
    }
    
    return { canDeploy: deployable, signals: blurredSignals, successOutlook: null, lossOutlook: null };
  }
  
  // Phase 2 (Level >= 2): 상세 signals 전체 노출 + 시나리오(Outlook) 예측 제공.
  return {
    canDeploy: deployable,
    signals: match.signals,
    successOutlook: match.successOutlook,
    lossOutlook: match.lossOutlook,
  };
}
