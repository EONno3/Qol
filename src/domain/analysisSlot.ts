import type { GameState } from "./state";
import type { AnalysisSlotsState } from "../data/types";

export const MAX_ANALYSIS_LEVEL = 2;

export function createEmptyAnalysisSlots(): AnalysisSlotsState {
  return {
    merc: { targetId: null, bonusLevel: 0 },
    mission: { targetId: null, bonusLevel: 0 },
  };
}

export function getStationMercAnalysisBase(state: GameState): number {
  return state.stationState?.analysisMercLv ?? 0;
}

export function getStationMissionAnalysisBase(state: GameState): number {
  return state.stationState?.analysisMissionLv ?? 0;
}

export function maxSlotBonusForBase(stationBase: number): number {
  return Math.max(0, MAX_ANALYSIS_LEVEL - stationBase);
}

/** 턴 진행 시 슬롯에 배치된 대상의 bonusLevel +1 (기관 베이스 한도 내) */
export function tickAnalysisSlotsOnTurnAdvance(state: GameState): AnalysisSlotsState {
  const { merc, mission } = state.analysisSlots;
  const mercBase = getStationMercAnalysisBase(state);
  const missionBase = getStationMissionAnalysisBase(state);

  return {
    merc: merc.targetId
      ? {
          ...merc,
          bonusLevel: Math.min(maxSlotBonusForBase(mercBase), merc.bonusLevel + 1),
        }
      : merc,
    mission: mission.targetId
      ? {
          ...mission,
          bonusLevel: Math.min(maxSlotBonusForBase(missionBase), mission.bonusLevel + 1),
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
      merc: { targetId: mercId, bonusLevel: 0 },
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
      mission: { targetId: missionId, bonusLevel: 0 },
    },
  };
}

/** 슬롯 배치 중인 대상에만 bonusLevel 적용 (임시 상승) */
export function effectiveMercAnalysisLevel(state: GameState, mercId: string): number {
  const base = getStationMercAnalysisBase(state);
  const slot = state.analysisSlots.merc;
  const bonus = slot.targetId === mercId ? slot.bonusLevel : 0;
  return Math.min(MAX_ANALYSIS_LEVEL, base + bonus);
}

export function effectiveMissionAnalysisLevel(state: GameState, missionId: string): number {
  const base = getStationMissionAnalysisBase(state);
  const slot = state.analysisSlots.mission;
  const bonus = slot.targetId === missionId ? slot.bonusLevel : 0;
  return Math.min(MAX_ANALYSIS_LEVEL, base + bonus);
}

export function effectiveMatchAnalysisLevel(
  state: GameState,
  mercId: string,
  missionId: string,
): number {
  return Math.min(
    effectiveMercAnalysisLevel(state, mercId),
    effectiveMissionAnalysisLevel(state, missionId),
  );
}
