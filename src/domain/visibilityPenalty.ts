import type { Mercenary, Mission, MissionTypeKey, QueuedNode, StatKey } from "../data/types";
import type { DispatchLoadoutContext } from "./gearStatBonus";
import { resolveLoadoutTagAttributions } from "./mercTagPool";
import { nextNodeInstanceId } from "./nodeQueue";

/** B-3: 가시성 한계가 실질 리스크로 작동하는 미션 타입 */
export const STEALTH_SENSITIVE_MISSION_TYPES: readonly MissionTypeKey[] = [
  "잠입",
  "비밀",
  "기업",
];

const VISIBILITY_RANK: Record<string, number> = {
  very_low: 20,
  low: 40,
  medium: 60,
  high: 80,
  very_high: 100,
};

/** loadout 노출형 장비·임플란트 가산치 (canonical tag 기준) */
const LOADOUT_VISIBILITY_BONUS_TAG_IDS = new Set([
  "tag_implant_showy_chrome",
  "tag_implant_high_output_shotgun_arm",
  "tag_gear_weapon_visible",
]);

/** 노출 태그 1개당 가시성 점수 가산 */
const VISIBILITY_TAG_BONUS = 15;

export interface VisibilityExposureResult {
  exposed: boolean;
  mercVisibility: number;
  visibilityLimit: number;
  overshoot: number;
  riskNodeNameKo?: string;
  logKo?: string;
}

export function isStealthSensitiveMission(mission: Mission): boolean {
  return STEALTH_SENSITIVE_MISSION_TYPES.includes(
    mission.missionType as MissionTypeKey
  );
}

/** 용병 기본 가시성 + loadout 노출 태그 가산 */
export function getMercVisibilityScore(
  merc: Mercenary,
  loadout?: DispatchLoadoutContext
): number {
  let score = VISIBILITY_RANK[merc.visibilityLevel] ?? 60;

  if (loadout) {
    const seenTags = new Set<string>();
    for (const attr of resolveLoadoutTagAttributions(merc.mercId, loadout)) {
      if (!LOADOUT_VISIBILITY_BONUS_TAG_IDS.has(attr.tagId)) continue;
      if (seenTags.has(attr.tagId)) continue;
      seenTags.add(attr.tagId);
      score += VISIBILITY_TAG_BONUS;
    }
  }

  return Math.min(100, score);
}

function pickRiskNodeNameKo(overshoot: number): string {
  if (overshoot >= 40) return "경비대 적발";
  if (overshoot >= 15) return "불심 검문";
  return "노출 감지 검문";
}

/** B-3: 은밀 미션에서 가시성 한계 초과 시 돌발 위험 노드 팩트 반환 */
export function evaluateVisibilityExposure(
  mission: Mission,
  merc: Mercenary,
  loadout?: DispatchLoadoutContext
): VisibilityExposureResult {
  const visibilityLimit = mission.mechanics?.visibility_limit ?? 100;
  const mercVisibility = getMercVisibilityScore(merc, loadout);
  const overshoot = Math.max(0, mercVisibility - visibilityLimit);

  if (!isStealthSensitiveMission(mission) || overshoot <= 0) {
    return {
      exposed: false,
      mercVisibility,
      visibilityLimit,
      overshoot: 0,
    };
  }

  const riskNodeNameKo = pickRiskNodeNameKo(overshoot);
  return {
    exposed: true,
    mercVisibility,
    visibilityLimit,
    overshoot,
    riskNodeNameKo,
    logKo: `[가시성 경고] 허용 한계 초과(노출 감지) — ${riskNodeNameKo} 위험이 예상된다.`,
  };
}

export function createVisibilityRiskNode(
  mission: Mission,
  nameKo: string
): QueuedNode {
  const statCheck = (mission.mechanics?.primary_stat ?? "cypher") as StatKey;
  return {
    nodeInstanceId: nextNodeInstanceId("vis_risk"),
    nameKo,
    role: "obstacle",
    statCheck,
    nodeKind: "emergency",
    challengeTags: ["tag_challenge_gear_detection"],
    defaultPolarity: "adverse",
  };
}
