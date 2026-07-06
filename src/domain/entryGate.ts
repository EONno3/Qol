import type {
  EntryGateEvaluation,
  EntryGateSpec,
  Mercenary,
  Mission,
  MissionConditionTarget,
  QueuedNode,
  StatKey,
} from "../data/types";
import { getEffectiveStatForNode, type DispatchLoadoutContext } from "./gearStatBonus";
import { resolveLoadoutTagAttributions, resolveMercenaryTagAttributions } from "./mercTagPool";
import { mercHasTag } from "./tags";
import { resolveTagId } from "../data/tagRegistry";
import { nextNodeInstanceId } from "./nodeQueue";

const VISIBILITY_RANK: Record<string, number> = {
  very_low: 20,
  low: 40,
  medium: 60,
  high: 80,
  very_high: 100,
};

function mercMeetsTagRequirement(
  merc: Mercenary,
  tagId: string,
  loadout?: DispatchLoadoutContext
): boolean {
  if (mercHasTag(merc, tagId)) return true;
  const target = resolveTagId(tagId) ?? tagId;
  const attributed = [
    ...resolveMercenaryTagAttributions(merc),
    ...(loadout ? resolveLoadoutTagAttributions(merc.mercId, loadout) : []),
  ];
  return attributed.some((a) => a.tagId === target);
}

function isRequirementMet(
  requirement: MissionConditionTarget,
  merc: Mercenary,
  loadout?: DispatchLoadoutContext
): boolean {
  switch (requirement.kind) {
    case "stat": {
      const base = merc.stats[requirement.statKey] ?? 0;
      const effective = loadout
        ? getEffectiveStatForNode(merc.mercId, base, requirement.statKey, loadout)
        : base;
      return effective >= requirement.minValue;
    }
    case "tag":
      return mercMeetsTagRequirement(merc, requirement.tagId, loadout);
    case "gear":
      return loadout?.gearOwner[requirement.gearId] === merc.mercId;
    case "implant":
      return loadout?.implantOwner[requirement.implantId] === merc.mercId;
    case "visibility": {
      const mercVis = VISIBILITY_RANK[merc.visibilityLevel] ?? 60;
      const maxVis = VISIBILITY_RANK[requirement.maxLevel] ?? 60;
      return mercVis <= maxVis;
    }
    default:
      return true;
  }
}

function buildEntryGateLog(
  outcome: "blocked" | "forced_risk",
  entryGate: EntryGateSpec
): string {
  if (outcome === "blocked") {
    return "[진입 게이트 차단] 필수 조건 미달로 작전 구역에 들어가지 못했다.";
  }
  const riskLabel = entryGate.forcedRiskNodeNameKo ?? "돌발 위험";
  return `[진입 게이트] 자격 미달 — ${riskLabel} 구간으로 강제 진입한다.`;
}

/** B-2: 출격 전 필수 스탯·태그·장비·가시성 조건 대조 */
export function evaluateEntryGate(
  entryGate: EntryGateSpec | undefined,
  merc: Mercenary,
  loadout?: DispatchLoadoutContext
): EntryGateEvaluation {
  if (!entryGate || entryGate.requirements.length === 0) {
    return { outcome: "clear", unmetRequirements: [] };
  }

  const unmetRequirements = entryGate.requirements.filter(
    (req) => !isRequirementMet(req, merc, loadout)
  );

  if (unmetRequirements.length === 0) {
    return { outcome: "clear", unmetRequirements: [] };
  }

  const outcome = entryGate.failureMode === "block" ? "blocked" : "forced_risk";
  return {
    outcome,
    unmetRequirements,
    logKo: buildEntryGateLog(outcome, entryGate),
  };
}

/** force_risk 시 큐 맨 앞에 주입할 adverse emergency 노드 */
export function createForcedEntryRiskNode(
  mission: Mission,
  nameKo: string
): QueuedNode {
  const statCheck = (mission.mechanics?.primary_stat ?? "cypher") as StatKey;
  return {
    nodeInstanceId: nextNodeInstanceId("entry_risk"),
    nameKo,
    role: "entry",
    statCheck,
    nodeKind: "emergency",
    challengeTags: [],
    defaultPolarity: "adverse",
  };
}
