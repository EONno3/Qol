/**
 * 생성기 danger → missionTags 매핑.
 * 노드 challenge 배치 후보는 MISSION_TAG_NODE_CANDIDATES 참고.
 */
import type { NodePolarity, NodeRole, Tier } from "./types";

export const DANGER_KEYWORD_TO_MISSION_TAGS: Record<string, string[]> = {
  전선: ["tag_threat_electric"],
  누전: ["tag_threat_electric"],
  감전: ["tag_threat_electric"],
  고압: ["tag_threat_electric"],
  검문: ["tag_challenge_gear_detection"],
  스캔: ["tag_challenge_gear_detection"],
};

/** danger 텍스트(문자열·배열)에서 missionTags dedupe 추출 */
export function mapDangerTextToMissionTags(danger: string | string[] | undefined | null): string[] {
  if (!danger) return ["tag_context_generic"];
  const parts = Array.isArray(danger) ? danger : [danger];
  const tags = new Set<string>(["tag_context_generic"]);
  for (const text of parts) {
    for (const [keyword, mapped] of Object.entries(DANGER_KEYWORD_TO_MISSION_TAGS)) {
      if (text.includes(keyword)) mapped.forEach((t) => tags.add(t));
    }
  }
  return [...tags].sort();
}

/** missionTag → 노드에 부여할 challenge 축 (generic 제외) */
export const MISSION_TAG_NODE_CANDIDATES: Record<
  string,
  { challengeTags: string[]; defaultPolarity: NodePolarity }
> = {
  tag_threat_electric: {
    challengeTags: ["tag_threat_electric"],
    defaultPolarity: "adverse",
  },
  tag_challenge_gear_detection: {
    challengeTags: ["tag_challenge_gear_detection"],
    defaultPolarity: "adverse",
  },
};

/** 미션 타입별 역할 가중 배율 (기본 entry>obstacle>objective>exit에 곱함) */
export const ROLE_WEIGHT_BY_MISSION_TYPE: Record<
  string,
  Partial<Record<NodeRole, number>>
> = {
  잠입: { entry: 2.5 },
  기업: { entry: 1.5 },
};

/** Gap A — tier별 neutral context tag 폴백 풀 (빈 노드 challengeTags 채움) */
export const TIER_CONTEXT_TAGS: Record<Tier, string[]> = {
  lower: [
    "tag_context_lower_damp",
    "tag_context_lower_stench",
    "tag_context_lower_wastewater",
  ],
  mid: ["tag_context_mid_machine_noise", "tag_context_industrial"],
  upper: ["tag_context_upper_dry", "tag_context_upper_disinfectant"],
};
