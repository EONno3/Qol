import type { GameState } from "./state";
import type { AnalysisSlotEntry, AnalysisSlotsState } from "../data/types";
import { getStationAnalysisFacilityBonus } from "./stationModifiers";

export const MAX_ANALYSIS_LEVEL = 2;

type LegacyAnalysisSlotEntry = {
  targetId: string | null;
  progress?: number;
  bonusLevel?: number;
};

type LegacyAnalysisSlots = {
  merc?: LegacyAnalysisSlotEntry;
  mission?: LegacyAnalysisSlotEntry;
};

export function migrateAnalysisSlotEntry(entry: LegacyAnalysisSlotEntry): AnalysisSlotEntry {
  return {
    targetId: entry.targetId,
    progress: entry.progress ?? entry.bonusLevel ?? 0,
  };
}

/** Option B: merc 슬롯 폐기. 구세이브 merc 필드는 무시 */
export function migrateAnalysisSlots(
  slots: LegacyAnalysisSlots | AnalysisSlotsState,
): AnalysisSlotsState {
  const mission = (slots as LegacyAnalysisSlots).mission ?? {
    targetId: null,
    progress: 0,
  };
  return {
    mission: migrateAnalysisSlotEntry(mission),
  };
}

export function createEmptyAnalysisSlots(): AnalysisSlotsState {
  return {
    mission: { targetId: null, progress: 0 },
  };
}

/** 매칭 예측 베이스 (시설 버프 포함). 구 용병 분석 축 대체 */
export function getStationPredictAnalysisBase(state: GameState): number {
  const raw = state.stationState?.predictAnalysisLv ?? 0;
  return Math.min(MAX_ANALYSIS_LEVEL, raw + getStationAnalysisFacilityBonus(state));
}

export function getStationMissionAnalysisBase(state: GameState): number {
  const raw = state.stationState?.analysisMissionLv ?? 0;
  return Math.min(MAX_ANALYSIS_LEVEL, raw + getStationAnalysisFacilityBonus(state));
}

export type AnalysisBaseLevels = {
  mission: number;
  predict: number;
};

export function getAnalysisBaseLevels(state: GameState): AnalysisBaseLevels {
  return {
    mission: getStationMissionAnalysisBase(state),
    predict: getStationPredictAnalysisBase(state),
  };
}

export function maxSlotBonusForBase(stationBase: number): number {
  return Math.max(0, MAX_ANALYSIS_LEVEL - stationBase);
}

export function tickAnalysisSlotsOnTurnAdvance(state: GameState): AnalysisSlotsState {
  const { mission } = state.analysisSlots;
  const missionBase = getStationMissionAnalysisBase(state);
  return {
    mission: mission.targetId
      ? {
          ...mission,
          progress: Math.min(maxSlotBonusForBase(missionBase), mission.progress + 1),
        }
      : mission,
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

function computeEffectiveMissionLevel(state: GameState, missionId: string): number {
  const base = getStationMissionAnalysisBase(state);
  const slot = state.analysisSlots.mission;
  const bonus = slot.targetId === missionId ? slot.progress : 0;
  return Math.min(MAX_ANALYSIS_LEVEL, base + bonus);
}

export type EffectiveAnalysisLevels = {
  mission: number;
  predict: number;
  /** Option B: match === predict */
  match: number;
};

export function getEffectiveAnalysisLevels(
  state: GameState,
  _mercId?: string | null,
  missionId?: string | null,
): EffectiveAnalysisLevels {
  const mission =
    missionId != null && missionId !== ""
      ? computeEffectiveMissionLevel(state, missionId)
      : getStationMissionAnalysisBase(state);
  const predict = getStationPredictAnalysisBase(state);
  return { mission, predict, match: predict };
}

export function effectiveMissionAnalysisLevel(state: GameState, missionId: string): number {
  return computeEffectiveMissionLevel(state, missionId);
}

export function effectivePredictAnalysisLevel(state: GameState): number {
  return getStationPredictAnalysisBase(state);
}

export function effectiveMatchAnalysisLevel(
  state: GameState,
  _mercId: string,
  _missionId: string,
): number {
  return getStationPredictAnalysisBase(state);
}
