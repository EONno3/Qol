/**
 * Gap B — challengeTag × 용병/장비 태그 반응 레지스트리.
 * 노드 판정 시 challengeTags에 대해 positive/negative 매칭의 단일 출처.
 */
export type ChallengeTagReading = "positive" | "negative";

export interface ChallengeTagReaction {
  tagId: string;
  reading: ChallengeTagReading;
  ruleId: string;
}

export interface ChallengeTagPoolEntry {
  challengeTagId: string;
  reactions: ChallengeTagReaction[];
}

/** challengeTagId → 반응 태그 목록 */
export const CHALLENGE_TAG_POOL: ChallengeTagPoolEntry[] = [
  {
    challengeTagId: "tag_context_lower_wastewater",
    reactions: [
      { tagId: "tag_gear_gas_mask", reading: "positive", ruleId: "pool_wastewater_gas_mask" },
      { tagId: "tag_origin_slum_native", reading: "positive", ruleId: "pool_wastewater_slum_native" },
      { tagId: "tag_trait_mysophobia", reading: "negative", ruleId: "pool_wastewater_mysophobia" },
    ],
  },
  {
    challengeTagId: "tag_context_lower_stench",
    reactions: [
      { tagId: "tag_origin_slum_native", reading: "positive", ruleId: "pool_stench_slum_native" },
      { tagId: "tag_trait_mysophobia", reading: "negative", ruleId: "pool_stench_mysophobia" },
    ],
  },
  {
    challengeTagId: "tag_context_mid_machine_noise",
    reactions: [
      { tagId: "tag_gear_scanner_deception", reading: "positive", ruleId: "pool_noise_scanner_deception" },
      { tagId: "tag_implant_showy_chrome", reading: "negative", ruleId: "pool_noise_showy_chrome" },
    ],
  },
  {
    challengeTagId: "tag_context_upper_disinfectant",
    reactions: [
      { tagId: "tag_origin_upper_etiquette", reading: "positive", ruleId: "pool_disinfectant_upper_etiquette" },
      { tagId: "tag_origin_illegal_arena", reading: "negative", ruleId: "pool_disinfectant_illegal_arena" },
    ],
  },
];

export function reactionsForChallengeTag(challengeTagId: string): ChallengeTagReaction[] {
  return CHALLENGE_TAG_POOL.find((e) => e.challengeTagId === challengeTagId)?.reactions ?? [];
}
