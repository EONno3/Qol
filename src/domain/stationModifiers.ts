import type { GameState } from "./state";
import type { StationFacilityTier } from "../data/types";
import {
  DEFAULT_FACILITY_BY_CATEGORY,
  getFacilityEffectsForTier,
  NEUTRAL_FACILITY_EFFECTS,
  type FacilityTierEffects,
} from "../data/stationFacilities";

export type StationModifiers = FacilityTierEffects;

export function resolveStationFacilityTier(
  tier: number | undefined,
): StationFacilityTier {
  return tier === 2 ? 2 : 1;
}

/** 업무 카테고리 시설만 영구 분석 베이스 보너스 제공 */
export function getStationAnalysisFacilityBonus(state: GameState): number {
  return getStationModifiers(state).analysisBaseBonus;
}

export function getStationModifiers(state: GameState): StationModifiers {
  const station = state.stationState;
  if (!station?.facilityId) {
    return { ...NEUTRAL_FACILITY_EFFECTS };
  }

  const tier = resolveStationFacilityTier(station.facilityTier);
  const effects = getFacilityEffectsForTier(station.facilityId, tier);

  if (station.category !== "업무") {
    return { ...effects, analysisBaseBonus: 0 };
  }

  return { ...effects };
}

export function getDefaultFacilityIdForCategory(
  category: import("../data/types").StationCategory,
) {
  return DEFAULT_FACILITY_BY_CATEGORY[category];
}
