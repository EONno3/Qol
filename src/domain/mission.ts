import type { GameState } from "./state";
import type { CatchUpConfig } from "../data/types";
import { allMissions, mercenaries, gearDefs, implantDefs } from "../data/seed";
import { GAME_CONFIG } from "../data/config";
import { simulateMission } from "./engine";
import { getStationModifiers } from "./stationModifiers";

export interface StartDispatchOptions {
  /** 캐치업(현장 개입) 설정. 지정 시 코스트 ×1.5(올림) + 개입 노드 판정 페널티 반영 */
  catchUp?: CatchUpConfig;
}

export function acceptMission(state: GameState, missionId: string): GameState {
  if (!state.availableMissions.includes(missionId)) {
    return state;
  }
  return {
    ...state,
    availableMissions: state.availableMissions.filter((id) => id !== missionId),
    acceptedMissions: [missionId, ...state.acceptedMissions],
  };
}

export function computeDispatchCommandCost(
  state: GameState,
  baseMercCommandCost: number,
  catchUpActive: boolean,
): number {
  let cost = catchUpActive
    ? Math.ceil(baseMercCommandCost * GAME_CONFIG.catchUp.costMultiplier)
    : baseMercCommandCost;
  const { dispatchCommandDiscount } = getStationModifiers(state);
  return Math.max(1, cost - dispatchCommandDiscount);
}

export function startDispatch(
  state: GameState,
  missionId: string,
  mercId: string,
  options?: StartDispatchOptions
): GameState {
  if (!state.acceptedMissions.includes(missionId)) {
    return state; // 수주한 미션이 아님
  }
  
  const missionDef = allMissions.find(m => m.missionId === missionId);
  const duration = missionDef?.durationMs ?? 30000; // 기본 30초
  
  const mercDef = mercenaries.find(m => m.mercId === mercId);
  if (!missionDef || !mercDef) {
    return state; // 데이터가 없으면 진행 불가
  }
  const catchUpActive =
    !!options?.catchUp && options.catchUp.interventionNodeNamesKo.length > 0;
  const baseCost = mercDef.commandCost ?? 0;
  const cost = computeDispatchCommandCost(state, baseCost, catchUpActive);

  if (state.currentCommandPoints < cost) {
    return state; // 통제력 부족
  }
  
  const now = Date.now();
  const dispatchId = `${missionId}-${mercId}-${now}`;
  const dispatch = {
    dispatchId,
    missionId,
    mercId,
    startTime: now,
    endTime: now + duration,
  };

  // 파견 시작 시 시뮬레이션 돌려서 생성된 결과를 상태에 저장해 둠
  const { fatigueMultiplier } = getStationModifiers(state);
  const simulationResult = simulateMission(
    missionDef,
    mercDef,
    Math.random,
    {
      gearOwner: state.gearOwner,
      implantOwner: state.implantOwner,
      gearDefs,
      implantDefs,
    },
    catchUpActive ? options!.catchUp : undefined,
    fatigueMultiplier,
  );
  const newGeneratedReports = { ...state.generatedReports };
  newGeneratedReports[dispatchId] = simulationResult.report;

  return {
    ...state,
    acceptedMissions: state.acceptedMissions.filter(id => id !== missionId),
    activeDispatches: [...state.activeDispatches, dispatch],
    currentCommandPoints: state.currentCommandPoints - cost,
    generatedReports: newGeneratedReports,
  };
}

export function checkCompletedDispatches(state: GameState, currentTime: number): GameState {
  const completed = state.activeDispatches.filter(d => currentTime >= d.endTime);
  if (completed.length === 0) {
    return state; // 변경점 없음
  }

  const activeDispatches = state.activeDispatches.filter(d => currentTime < d.endTime);
  const newlyCompleted = completed.map(d => ({ dispatchId: d.dispatchId, missionId: d.missionId, mercId: d.mercId }));

  return {
    ...state,
    activeDispatches,
    completedDispatches: [...state.completedDispatches, ...newlyCompleted],
  };
}
