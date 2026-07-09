import type { FacilityId, StationCategory, StationFacilityTier } from "./types";

export interface FacilityTierEffects {
  analysisBaseBonus: number;
  fatigueMultiplier: number;
  dispatchCommandDiscount: number;
  replacementCostMultiplier: number;
  dissatisfactionGainMultiplier: number;
}

export interface FacilityDefinition {
  facilityId: FacilityId;
  category: StationCategory;
  nameKo: string;
  effectSummaryKo: string;
  tier1: FacilityTierEffects;
  tier2: FacilityTierEffects;
}

export const NEUTRAL_FACILITY_EFFECTS: FacilityTierEffects = {
  analysisBaseBonus: 0,
  fatigueMultiplier: 1,
  dispatchCommandDiscount: 0,
  replacementCostMultiplier: 1,
  dissatisfactionGainMultiplier: 1,
};

export const FACILITY_DEFINITIONS: Record<FacilityId, FacilityDefinition> = {
  lodging_patch_den: {
    facilityId: "lodging_patch_den",
    category: "숙박",
    nameKo: "땜질 소굴",
    effectSummaryKo: "파견 후 피로도 누적 감소",
    tier1: { ...NEUTRAL_FACILITY_EFFECTS, fatigueMultiplier: 0.8 },
    tier2: { ...NEUTRAL_FACILITY_EFFECTS, fatigueMultiplier: 0.7 },
  },
  entertainment_alley_bar: {
    facilityId: "entertainment_alley_bar",
    category: "유흥",
    nameKo: "뒷골목 바",
    effectSummaryKo: "정산 시 용병 불만도 증가 완화",
    tier1: { ...NEUTRAL_FACILITY_EFFECTS, dissatisfactionGainMultiplier: 0.5 },
    tier2: { ...NEUTRAL_FACILITY_EFFECTS, dissatisfactionGainMultiplier: 0.25 },
  },
  meal_field_kitchen: {
    facilityId: "meal_field_kitchen",
    category: "식사",
    nameKo: "간이 배급소",
    effectSummaryKo: "출격 지휘력(OP) 비용 감소",
    tier1: { ...NEUTRAL_FACILITY_EFFECTS, dispatchCommandDiscount: 1 },
    tier2: { ...NEUTRAL_FACILITY_EFFECTS, dispatchCommandDiscount: 2 },
  },
  gear_shadow_pawn: {
    facilityId: "gear_shadow_pawn",
    category: "장비",
    nameKo: "뒷골목 전당포",
    effectSummaryKo: "암시장 장비 재수급 비용 할인",
    tier1: { ...NEUTRAL_FACILITY_EFFECTS, replacementCostMultiplier: 0.8 },
    tier2: { ...NEUTRAL_FACILITY_EFFECTS, replacementCostMultiplier: 0.65 },
  },
  work_signal_relay: {
    facilityId: "work_signal_relay",
    category: "업무",
    nameKo: "불법 통신 중계소",
    effectSummaryKo: "영구 분석 베이스 +1 (Tier 2: +2)",
    tier1: { ...NEUTRAL_FACILITY_EFFECTS, analysisBaseBonus: 1 },
    tier2: { ...NEUTRAL_FACILITY_EFFECTS, analysisBaseBonus: 2 },
  },
};

export const DEFAULT_FACILITY_BY_CATEGORY: Record<StationCategory, FacilityId> = {
  숙박: "lodging_patch_den",
  유흥: "entertainment_alley_bar",
  식사: "meal_field_kitchen",
  장비: "gear_shadow_pawn",
  업무: "work_signal_relay",
};

export function getFacilityDefinition(facilityId: FacilityId): FacilityDefinition {
  return FACILITY_DEFINITIONS[facilityId];
}

export function getFacilityEffectsForTier(
  facilityId: FacilityId,
  tier: StationFacilityTier,
): FacilityTierEffects {
  const def = FACILITY_DEFINITIONS[facilityId];
  return tier >= 2 ? def.tier2 : def.tier1;
}
