import type { GameState } from "./state";
import type { AnalysisSlotEntry, AnalysisSlotsState } from "../data/types";
import { getStationAnalysisFacilityBonus } from "./stationModifiers";

export const MAX_ANALYSIS_LEVEL = 2;

type LegacyAnalysisSlotEntry = {
  targetId: string | null;
  progress?: number;
  bonusLevel?: number;
};

export function migrateAnalysisSlotEntry(entry: LegacyAnalysisSlotEntry): AnalysisSlotEntry {
  return {
    targetId: entry.targetId,
    progress: entry.progress ?? entry.bonusLevel ?? 0,
  };
}

export function migrateAnalysisSlots(slots: AnalysisSlotsState): AnalysisSlotsState {
  return {
    merc: migrateAnalysisSlotEntry(slots.merc as LegacyAnalysisSlotEntry),
    mission: migrateAnalysisSlotEntry(slots.mission as LegacyAnalysisSlotEntry),
  };
}

export function createEmptyAnalysisSlots(): AnalysisSlotsState {
  return {
    merc: { targetId: null, progress: 0 },
    mission: { targetId: null, progress: 0 },
  };
}

export function getStationMercAnalysisBase(state: GameState): number {
  const raw = state.stationState?.analysisMercLv ?? 0;
  return Math.min(MAX_ANALYSIS_LEVEL, raw + getStationAnalysisFacilityBonus(state));
}

export function getStationMissionAnalysisBase(state: GameState): number {
  const raw = state.stationState?.analysisMissionLv ?? 0;
  return Math.min(MAX_ANALYSIS_LEVEL, raw + getStationAnalysisFacilityBonus(state));
}

export type AnalysisBaseLevels = {
  merc: number;
  mission: number;
};

/** UI·도메인 공통: 시설 버프가 반영된 용병/미션 분석 베이스 레벨 */
export function getAnalysisBaseLevels(state: GameState): AnalysisBaseLevels {
  return {
    merc: getStationMercAnalysisBase(state),
    mission: getStationMissionAnalysisBase(state),
  };
}

export function maxSlotBonusForBase(stationBase: number): number {
  return Math.max(0, MAX_ANALYSIS_LEVEL - stationBase);
}

/** 턴 진행 시 슬롯에 배치된 대상의 progress +1 (기관 베이스 한도 내) */
export function tickAnalysisSlotsOnTurnAdvance(state: GameState): AnalysisSlotsState {
  const { merc, mission } = state.analysisSlots;
  const mercBase = getStationMercAnalysisBase(state);
  const missionBase = getStationMissionAnalysisBase(state);

  return {
    merc: merc.targetId
      ? {
          ...merc,
          progress: Math.min(maxSlotBonusForBase(mercBase), merc.progress + 1),
        }
      : merc,
    mission: mission.targetId
      ? {
          ...mission,
          progress: Math.min(maxSlotBonusForBase(missionBase), mission.progress + 1),
        }
      : mission,
  };
}

export function assignMercAnalysisSlot(
  state: GameState,
  mercId: string | null,
): GameState {
  return {
    ...state,
    analysisSlots: {
      ...state.analysisSlots,
      merc: { targetId: mercId, progress: 0 },
    },
  };
}

export function assignMissionAnalysisSlot(
  state: GameState,
  missionId: string | null,
): GameState {
  return {
    ...state,
    analysisSlots: {
      ...state.analysisSlots,
      mission: { targetId: missionId, progress: 0 },
    },
  };
}

/** 슬롯 배치 중인 대상에만 progress 적용 (임시 상승) */
function computeEffectiveMercLevel(state: GameState, mercId: string): number {
  const base = getStationMercAnalysisBase(state);
  const slot = state.analysisSlots.merc;
  const bonus = slot.targetId === mercId ? slot.progress : 0;
  return Math.min(MAX_ANALYSIS_LEVEL, base + bonus);
}

function computeEffectiveMissionLevel(state: GameState, missionId: string): number {
  const base = getStationMissionAnalysisBase(state);
  const slot = state.analysisSlots.mission;
  const bonus = slot.targetId === missionId ? slot.progress : 0;
  return Math.min(MAX_ANALYSIS_LEVEL, base + bonus);
}

export type EffectiveAnalysisLevels = {
  merc: number;
  mission: number;
  match: number;
};

/** UI·도메인 공통: 베이스 + 슬롯 progress가 반영된 실효 분석 레벨 SSOT */
export function getEffectiveAnalysisLevels(
  state: GameState,
  mercId?: string | null,
  missionId?: string | null,
): EffectiveAnalysisLevels {
  const merc =
    mercId != null && mercId !== ""
      ? computeEffectiveMercLevel(state, mercId)
      : getStationMercAnalysisBase(state);
  const mission =
    missionId != null && missionId !== ""
      ? computeEffectiveMissionLevel(state, missionId)
      : getStationMissionAnalysisBase(state);
  return {
    merc,
    mission,
    match: Math.min(merc, mission),
  };
}

export function effectiveMercAnalysisLevel(state: GameState, mercId: string): number {
  return computeEffectiveMercLevel(state, mercId);
}

export function effectiveMissionAnalysisLevel(state: GameState, missionId: string): number {
  return computeEffectiveMissionLevel(state, missionId);
}

export function effectiveMatchAnalysisLevel(
  state: GameState,
  mercId: string,
  missionId: string,
): number {
  return getEffectiveAnalysisLevels(state, mercId, missionId).match;
}
