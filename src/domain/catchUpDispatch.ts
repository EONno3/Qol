import type { GameState } from "./state";
import type { DispatchLoadoutContext } from "./gearStatBonus";
import { allMissions, mercenaries, gearDefs, implantDefs } from "../data/seed";
import { computeDispatchCommandCost } from "./mission";
import { getStationModifiers } from "./stationModifiers";
import { createCatchUpRun } from "./catchUpRun";

/** 캐치업 전용 파견 — simulateMission 선계산 없음, activeCatchUpRun에 SM 저장 */
export function startCatchUpDispatch(
  state: GameState,
  missionId: string,
  mercId: string,
  predictAnalysisLevel: number,
): GameState {
  if (state.activeCatchUpRun) return state;
  if (!state.acceptedMissions.includes(missionId)) return state;

  const missionDef = allMissions.find((m) => m.missionId === missionId);
  const mercDef = mercenaries.find((m) => m.mercId === mercId);
  if (!missionDef || !mercDef) return state;

  const baseCost = mercDef.commandCost ?? 0;
  const cost = computeDispatchCommandCost(state, baseCost, true);
  if (state.currentCommandPoints < cost) return state;

  const now = Date.now();
  const dispatchId = `catchup_${missionId}-${mercId}-${now}`;
  const { fatigueMultiplier } = getStationModifiers(state);

  const loadout: DispatchLoadoutContext = {
    gearOwner: state.gearOwner,
    implantOwner: state.implantOwner,
    gearDefs,
    implantDefs,
  };

  const run = createCatchUpRun({
    dispatchId,
    mission: missionDef,
    merc: mercDef,
    predictAnalysisLevel,
    loadout,
    fatigueMultiplier,
  });

  return {
    ...state,
    acceptedMissions: state.acceptedMissions.filter((id) => id !== missionId),
    currentCommandPoints: state.currentCommandPoints - cost,
    activeCatchUpRun: run,
  };
}

/** 캐치업 런 완료 → generatedReports·completedDispatches 반영 */
export function completeCatchUpDispatch(
  state: GameState,
  report: import("../data/types").ResultReport,
): GameState {
  const run = state.activeCatchUpRun;
  if (!run) return state;

  return {
    ...state,
    activeCatchUpRun: null,
    completedDispatches: [
      ...state.completedDispatches,
      { dispatchId: run.dispatchId, missionId: run.missionId, mercId: run.mercId },
    ],
    generatedReports: {
      ...state.generatedReports,
      [run.dispatchId]: report,
    },
  };
}
