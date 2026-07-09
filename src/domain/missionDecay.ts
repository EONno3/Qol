import { GAME_CONFIG } from "../data/config";
import type { GameState } from "./state";

export type MissionDecayBoardContext = {
  missionDecayTimers: Record<string, number>;
  analysisMissionSlotId: string | null;
};

export type MissionDecayDisplay =
  | { kind: "remaining"; turns: number }
  | { kind: "paused" };

export function getMissionDecayDisplay(
  ctx: MissionDecayBoardContext,
  missionId: string,
): MissionDecayDisplay {
  if (ctx.analysisMissionSlotId === missionId) {
    return { kind: "paused" };
  }
  const turns =
    ctx.missionDecayTimers[missionId] ?? GAME_CONFIG.mission.decayTurnsDefault;
  return { kind: "remaining", turns };
}

export function getMissionDecayLabel(display: MissionDecayDisplay): string {
  if (display.kind === "paused") {
    return "분석 중 (만료 정지)";
  }
  return `방치 ${display.turns}턴`;
}

export function formatExpiredMissionNotice(expiredMissionIds: string[]): string | null {
  if (expiredMissionIds.length === 0) {
    return null;
  }
  if (expiredMissionIds.length === 1) {
    return "의뢰 만료됨";
  }
  return `의뢰 ${expiredMissionIds.length}건 만료됨`;
}

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
  expiredMissionIds: string[];
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
    expiredMissionIds: expired,
  };
}
