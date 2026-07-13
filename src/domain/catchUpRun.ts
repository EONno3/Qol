import type { CatchUpRunState, Mercenary, Mission, QueuedNode } from "../data/types";
import { GAME_CONFIG } from "../data/config";
import type { DispatchLoadoutContext } from "./gearStatBonus";
import { createSeededRng } from "./assignNodeChallenges";
import { maxCatchUpInterventions } from "./catchUp";
import { resolveLoadoutTagAttributions, resolveMercenaryTagAttributions } from "./mercTagPool";
import { TIER_LABEL_KO } from "../data/constants";
import {
  buildMissionRunReport,
  createMissionRunAccumulator,
  deserializeQueue,
  resolveMissionNodeStep,
  serializeQueue,
  type MissionRunAccumulator,
} from "./missionRunSteps";

export type CatchUpNodeAction = "intervene" | "pass";

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function accumulatorToRunState(
  acc: MissionRunAccumulator,
  meta: {
    dispatchId: string;
    predictAnalysisLevel: number;
    interventionsLeft: number;
    intervenedCount: number;
    rngSeed: number;
    status: CatchUpRunState["status"];
  },
): CatchUpRunState {
  return {
    dispatchId: meta.dispatchId,
    missionId: acc.mission.missionId,
    mercId: acc.merc.mercId,
    status: meta.status,
    predictAnalysisLevel: meta.predictAnalysisLevel,
    interventionsLeft: meta.interventionsLeft,
    intervenedCount: meta.intervenedCount,
    rngSeed: meta.rngSeed,
    fatigueMultiplier: acc.fatigueMultiplier,
    queueNodes: serializeQueue(acc.queue),
    phase: acc.phase,
    entryBlocked: acc.entryBlocked,
    logs: [...acc.logs],
    nodeResolutions: [...acc.nodeResolutions],
    context: { ...acc.context, seizedGearIds: [...acc.context.seizedGearIds], allTriggeredTags: [...acc.context.allTriggeredTags] },
    totalFatigue: acc.totalFatigue,
    minorFails: acc.minorFails,
    objectiveSucceeded: acc.objectiveSucceeded,
    exitOutcome: acc.exitOutcome,
    catastropheRole: acc.catastropheRole,
    nodeIndex: acc.nodeIndex,
    catchUpBonusEarned: acc.catchUpBonusEarned,
    stars: acc.stars,
    fatiguePerNode: acc.fatiguePerNode,
  };
}

function runStateToAccumulator(
  state: CatchUpRunState,
  mission: Mission,
  merc: Mercenary,
  loadout?: DispatchLoadoutContext,
): MissionRunAccumulator {
  const rng = createSeededRng(state.rngSeed + state.nodeIndex * 9973);
  return {
    mission,
    merc,
    loadout,
    fatigueMultiplier: state.fatigueMultiplier,
    stars: state.stars,
    fatiguePerNode: state.fatiguePerNode,
    tierNameKo: TIER_LABEL_KO[mission.tier] || mission.tier,
    context: state.context,
    queue: deserializeQueue(state.queueNodes),
    mercenaryTags: resolveMercenaryTagAttributions(merc),
    loadoutTags: resolveLoadoutTagAttributions(merc.mercId, loadout),
    logs: [...state.logs],
    nodeResolutions: [...state.nodeResolutions],
    phase: state.phase,
    entryBlocked: state.entryBlocked,
    totalFatigue: state.totalFatigue,
    minorFails: state.minorFails,
    objectiveSucceeded: state.objectiveSucceeded,
    exitOutcome: state.exitOutcome,
    catastropheRole: state.catastropheRole,
    nodeIndex: state.nodeIndex,
    catchUpBonusEarned: state.catchUpBonusEarned,
    rng,
  };
}

/** 인런 캐치업 런 생성 — 보고서 없음 */
export function createCatchUpRun(params: {
  dispatchId: string;
  mission: Mission;
  merc: Mercenary;
  predictAnalysisLevel: number;
  loadout?: DispatchLoadoutContext;
  fatigueMultiplier?: number;
}): CatchUpRunState {
  const { dispatchId, mission, merc, predictAnalysisLevel, loadout, fatigueMultiplier = 1 } = params;
  const rngSeed = hashSeed(`catchup_run_${dispatchId}`);
  const acc = createMissionRunAccumulator({
    mission,
    merc,
    loadout,
    fatigueMultiplier,
    rng: createSeededRng(rngSeed),
  });

  const nodeCount = serializeQueue(acc.queue).length;
  const cap = maxCatchUpInterventions(nodeCount);
  const status: CatchUpRunState["status"] =
    acc.entryBlocked || acc.queue.isEmpty() ? "finished" : "active";

  return accumulatorToRunState(acc, {
    dispatchId,
    predictAnalysisLevel,
    interventionsLeft: cap,
    intervenedCount: 0,
    rngSeed,
    status,
  });
}

/** 현재 처리 대기 노드 (peek) */
export function peekCatchUpNode(state: CatchUpRunState): QueuedNode | null {
  if (state.status !== "active" || state.phase !== "main" || state.entryBlocked) {
    return null;
  }
  const queue = deserializeQueue(state.queueNodes);
  return queue.peek() ?? null;
}

function isRunComplete(acc: MissionRunAccumulator): boolean {
  return acc.entryBlocked || acc.phase !== "main" || acc.queue.isEmpty();
}

/** 노드 1개 처리 — intervene/pass */
export function advanceCatchUpNode(
  state: CatchUpRunState,
  mission: Mission,
  merc: Mercenary,
  action: CatchUpNodeAction,
  loadout?: DispatchLoadoutContext,
): CatchUpRunState {
  if (state.status !== "active") return state;

  const acc = runStateToAccumulator(state, mission, merc, loadout);
  if (isRunComplete(acc)) {
    return { ...state, status: "finished" };
  }

  const node = acc.queue.pop()!;
  const doIntervene = action === "intervene" && state.interventionsLeft > 0;
  resolveMissionNodeStep(acc, node, {
    intervened: doIntervene,
    catchUpPenaltyPercent: doIntervene ? GAME_CONFIG.catchUp.nodePenaltyPercent : 0,
  });

  const interventionsLeft = doIntervene ? state.interventionsLeft - 1 : state.interventionsLeft;
  const intervenedCount = doIntervene ? state.intervenedCount + 1 : state.intervenedCount;
  const status: CatchUpRunState["status"] = isRunComplete(acc) ? "finished" : "active";

  return accumulatorToRunState(acc, {
    dispatchId: state.dispatchId,
    predictAnalysisLevel: state.predictAnalysisLevel,
    interventionsLeft,
    intervenedCount,
    rngSeed: state.rngSeed,
    status,
  });
}

/** 완료된 캐치업 런 → ResultReport */
export function finalizeCatchUpRun(
  state: CatchUpRunState,
  mission: Mission,
  merc: Mercenary,
  loadout?: DispatchLoadoutContext,
) {
  const acc = runStateToAccumulator(state, mission, merc, loadout);
  return buildMissionRunReport(acc, true);
}
