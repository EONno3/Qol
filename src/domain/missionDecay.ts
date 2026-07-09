import { GAME_CONFIG } from "../data/config";
import type { GameState } from "./state";

export function getPausedMissionDecayId(state: GameState): string | null {
  return state.analysisSlots.mission.targetId;
}

/** 게시판 미션에 방치 타이머가 없으면 기본값 부여, 보드 이탈 미션 타이머 정리 */
export function ensureMissionDecayTimers(state: GameState): Record<string, number> {
  const defaultTurns = GAME_CONFIG.mission.decayTurnsDefault;
  const timers = { ...state.missionDecayTimers };

  for (const missionId of state.availableMissions) {
    if (timers[missionId] === undefined) {
      timers[missionId] = defaultTurns;
    }
  }

  for (const missionId of Object.keys(timers)) {
    if (!state.availableMissions.includes(missionId)) {
      delete timers[missionId];
    }
  }

  return timers;
}

/** 턴 진행 시 방치 타이머 -1. 분석 슬롯 등록 미션은 tick 제외(기획 §1.2C) */
export function tickMissionDecayOnTurnAdvance(state: GameState): {
  availableMissions: string[];
  missionDecayTimers: Record<string, number>;
} {
  const pausedMissionId = getPausedMissionDecayId(state);
  const timers = ensureMissionDecayTimers(state);
  const expired: string[] = [];

  for (const missionId of state.availableMissions) {
    if (missionId === pausedMissionId) {
      continue;
    }

    const remaining = timers[missionId] ?? GAME_CONFIG.mission.decayTurnsDefault;
    const next = remaining - 1;
    if (next <= 0) {
      expired.push(missionId);
      delete timers[missionId];
    } else {
      timers[missionId] = next;
    }
  }

  return {
    availableMissions: state.availableMissions.filter((id) => !expired.includes(id)),
    missionDecayTimers: timers,
  };
}
