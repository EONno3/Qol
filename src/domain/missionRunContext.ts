import type { MissionRunContext } from "../data/types";

export function createMissionRunContext(missionId: string, mercId: string): MissionRunContext {
  return {
    missionId,
    mercId,
    flags: {},
    seizedGearIds: [],
    detectedAtNodeIndex: null,
    visibilityAccumulated: 0,
    emergencyCount: 0,
    allTriggeredTags: [],
  };
}

export function recordTriggeredTags(
  context: MissionRunContext,
  triggered: import("../data/types").TriggeredTag[]
): void {
  for (const t of triggered) {
    const dup = context.allTriggeredTags.some(
      (x) => x.tagId === t.tagId && x.sourceId === t.sourceId && x.ruleId === t.ruleId
    );
    if (!dup) context.allTriggeredTags.push(t);
  }
}

/** adverse 실패 시 negative gear triggered → 압수 목록 (범용) */
export function applySeizureFromTriggered(
  context: MissionRunContext,
  triggered: import("../data/types").TriggeredTag[],
  outcome: import("../data/types").NodeOutcome
): void {
  if (outcome === "pass") return;
  for (const t of triggered) {
    if (t.reading === "negative" && t.sourceType === "gear") {
      if (!context.seizedGearIds.includes(t.sourceId)) {
        context.seizedGearIds.push(t.sourceId);
      }
    }
  }
}
