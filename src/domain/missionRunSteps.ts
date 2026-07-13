import type {
  Mercenary,
  Mission,
  MissionRunContext,
  NodeOutcome,
  NodeResolutionLog,
  NodeRole,
  QueuedNode,
  ResultReport,
  ResultType,
  RoutingDecision,
  StatusChange,
} from "../data/types";
import { GAME_CONFIG } from "../data/config";
import { STATUS_FATIGUE_PLUS, STATUS_GEAR_DESTROYED_JOKER, STATUS_KIA, TIER_LABEL_KO } from "../data/constants";
import { calculateSurvivalRoll } from "./survival";
import { mercTriggersJokerForMissionType } from "./tags";
import type { DispatchLoadoutContext } from "./gearStatBonus";
import {
  applySeizureFromTriggered,
  createMissionRunContext,
  recordTriggeredTags,
} from "./missionRunContext";
import { resolveLoadoutTagAttributions, resolveMercenaryTagAttributions } from "./mercTagPool";
import { NodeQueue, nextNodeInstanceId } from "./nodeQueue";
import { resolveNodeJudgment } from "./nodeTagJudgment";
import type { MissionNode } from "../data/types";
import { assignNodeChallenges } from "./assignNodeChallenges";
import { resolveMissionNodes } from "./missionNodes";
import { createForcedEntryRiskNode, evaluateEntryGate } from "./entryGate";
import {
  createVisibilityRiskNode,
  evaluateVisibilityExposure,
} from "./visibilityPenalty";

export function missionNodeToQueued(node: MissionNode, index: number): QueuedNode {
  return {
    nodeInstanceId: nextNodeInstanceId(`node_${index}`),
    nameKo: node.nameKo,
    role: node.role,
    statCheck: node.statCheck,
    nodeKind: "basic_gate",
    challengeTags: node.challengeTags ?? [],
    defaultPolarity: node.defaultPolarity ?? "neutral",
  };
}

export function buildInitialQueue(mission: Mission): NodeQueue {
  const nodes = assignNodeChallenges({
    ...mission,
    nodes: resolveMissionNodes(mission),
  });
  return new NodeQueue(nodes.map((n, i) => missionNodeToQueued(n, i)));
}

export type MissionRunPhase = "main" | "survival" | "done";

export interface MissionRunAccumulator {
  mission: Mission;
  merc: Mercenary;
  loadout?: DispatchLoadoutContext;
  fatigueMultiplier: number;
  stars: number;
  fatiguePerNode: number;
  tierNameKo: string;
  context: MissionRunContext;
  queue: NodeQueue;
  mercenaryTags: ReturnType<typeof resolveMercenaryTagAttributions>;
  loadoutTags: ReturnType<typeof resolveLoadoutTagAttributions>;
  logs: string[];
  nodeResolutions: NodeResolutionLog[];
  phase: MissionRunPhase;
  entryBlocked: boolean;
  totalFatigue: number;
  minorFails: number;
  objectiveSucceeded: boolean;
  exitOutcome: NodeOutcome | null;
  catastropheRole: NodeRole | null;
  nodeIndex: number;
  catchUpBonusEarned: boolean;
  rng: () => number;
}

export interface ResolveMissionNodeOptions {
  intervened: boolean;
  catchUpPenaltyPercent: number;
  postNodeRouting?: (
    node: QueuedNode,
    judgment: ReturnType<typeof resolveNodeJudgment>,
    context: MissionRunContext,
    queue: NodeQueue,
  ) => RoutingDecision | void;
}

export function createMissionRunAccumulator(params: {
  mission: Mission;
  merc: Mercenary;
  loadout?: DispatchLoadoutContext;
  fatigueMultiplier?: number;
  rng?: () => number;
  initialQueue?: NodeQueue;
}): MissionRunAccumulator {
  const { mission, merc, loadout, fatigueMultiplier = 1, rng = Math.random } = params;
  const stars = Math.max(1, Math.min(5, mission.difficultyStars || 1));
  const fatiguePerNode = GAME_CONFIG.difficulty.fatiguePerNodeByDifficulty[stars] ?? 3;
  const tier = mission.tier;
  const tierNameKo = TIER_LABEL_KO[tier] || tier;

  const context = createMissionRunContext(mission.missionId, merc.mercId);
  const queue = params.initialQueue ?? buildInitialQueue(mission);
  const mercenaryTags = resolveMercenaryTagAttributions(merc);
  const loadoutTags = resolveLoadoutTagAttributions(merc.mercId, loadout);

  const acc: MissionRunAccumulator = {
    mission,
    merc,
    loadout,
    fatigueMultiplier,
    stars,
    fatiguePerNode,
    tierNameKo,
    context,
    queue,
    mercenaryTags,
    loadoutTags,
    logs: [`[작전 개시] ${tierNameKo} 구역 진입 준비 완료.`],
    nodeResolutions: [],
    phase: "main",
    entryBlocked: false,
    totalFatigue: 0,
    minorFails: 0,
    objectiveSucceeded: false,
    exitOutcome: null,
    catastropheRole: null,
    nodeIndex: 0,
    catchUpBonusEarned: false,
    rng,
  };

  const entryGateResult = evaluateEntryGate(mission.entryGate, merc, loadout);
  if (entryGateResult.outcome === "blocked") {
    acc.entryBlocked = true;
    if (entryGateResult.logKo) acc.logs.push(entryGateResult.logKo);
  } else if (entryGateResult.outcome === "forced_risk") {
    if (entryGateResult.logKo) acc.logs.push(entryGateResult.logKo);
    const riskName = mission.entryGate?.forcedRiskNodeNameKo ?? "돌발 위험 구간";
    queue.injectNext([createForcedEntryRiskNode(mission, riskName)]);
  }

  if (!acc.entryBlocked) {
    const visibilityExposure = evaluateVisibilityExposure(mission, merc, loadout);
    if (visibilityExposure.exposed && visibilityExposure.riskNodeNameKo) {
      if (visibilityExposure.logKo) acc.logs.push(visibilityExposure.logKo);
      queue.injectNext([createVisibilityRiskNode(mission, visibilityExposure.riskNodeNameKo)]);
      context.emergencyCount += 1;
    }
  }

  return acc;
}

/** 단일 노드 판정 — 어사인 배치 루프·캐치업 SM 공용 */
export function resolveMissionNodeStep(
  acc: MissionRunAccumulator,
  node: QueuedNode,
  options: ResolveMissionNodeOptions,
): void {
  const { intervened, catchUpPenaltyPercent, postNodeRouting } = options;
  const judgment = resolveNodeJudgment({
    stars: acc.stars,
    merc: acc.merc,
    node,
    mission: acc.mission,
    loadout: acc.loadout,
    mercenaryTags: acc.mercenaryTags,
    loadoutTags: acc.loadoutTags,
    rng: acc.rng,
    catchUpPenaltyPercent: intervened ? catchUpPenaltyPercent : 0,
  });

  acc.totalFatigue += acc.fatiguePerNode;
  acc.logs.push(judgment.logKo);
  if (intervened) {
    acc.logs.push(
      `[현장 개입] ${node.nameKo} — 픽서 직접 개입 (부정 확률 +${catchUpPenaltyPercent}%p).`,
    );
    if (judgment.outcome === "pass") {
      acc.catchUpBonusEarned = true;
      acc.logs.push(`[현장 개입 성공] ${node.nameKo} — 추가 보상 자격 확보.`);
    }
  }

  recordTriggeredTags(acc.context, judgment.triggeredTags);
  applySeizureFromTriggered(acc.context, judgment.triggeredTags, judgment.outcome);

  acc.nodeResolutions.push({
    nodeInstanceId: node.nodeInstanceId,
    nameKo: node.nameKo,
    role: node.role,
    outcome: judgment.outcome,
    logKo: judgment.logKo,
    challengeTags: node.challengeTags,
    triggeredTags: judgment.triggeredTags,
    passChance: judgment.passChance,
    tagPassChanceDelta: judgment.tagPassChanceDelta,
    intervened,
  });

  if (judgment.outcome === "minor") acc.minorFails++;
  if (node.role === "objective") acc.objectiveSucceeded = judgment.outcome === "pass";
  if (node.role === "exit") acc.exitOutcome = judgment.outcome;

  if (judgment.outcome === "critical") {
    acc.catastropheRole = node.role;
    if (node.role !== "exit") {
      acc.logs.push(`[작전 중단] 치명적 차질로 더 이상 작전을 이어갈 수 없다.`);
      acc.phase = "survival";
      acc.queue.clear();
      return;
    }
  }

  let routing: RoutingDecision = judgment.routing;
  const custom = postNodeRouting?.(node, judgment, acc.context, acc.queue);
  if (custom) routing = custom;

  if (routing.action === "inject") {
    if (routing.position === "next") acc.queue.injectNext(routing.nodes);
    else acc.queue.injectBeforeExit(routing.nodes);
  } else if (routing.action === "goto_phase") {
    if (routing.phase === "survival") {
      acc.phase = "survival";
      acc.queue.clear();
    } else {
      acc.phase = "done";
      acc.queue.clear();
    }
  }

  acc.nodeIndex++;
}

function mergeTriggered(
  all: import("../data/types").TriggeredTag[],
  nodeTags: import("../data/types").TriggeredTag[],
): import("../data/types").TriggeredTag[] {
  const out = [...all];
  for (const t of nodeTags) {
    if (
      !out.some(
        (x) => x.tagId === t.tagId && x.sourceId === t.sourceId && x.ruleId === t.ruleId,
      )
    ) {
      out.push(t);
    }
  }
  return out;
}

export function buildMissionRunReport(
  acc: MissionRunAccumulator,
  catchUpActive: boolean,
): { report: ResultReport; mercSurvived: boolean; fatalStatuses: string[] } {
  const { mission, merc, loadout } = acc;
  const exitedCleanly = acc.exitOutcome === "pass";
  const exitedAlive = acc.exitOutcome === "pass" || acc.exitOutcome === "minor";
  const catastropheBeforeExit =
    acc.catastropheRole !== null && acc.catastropheRole !== "exit";

  let resultType: ResultType;
  let mercSurvived = true;
  const fatalStatuses: string[] = [];

  if (acc.entryBlocked) {
    resultType = "failure";
    mercSurvived = true;
  } else if (exitedAlive && !catastropheBeforeExit) {
    if (acc.objectiveSucceeded) {
      resultType = exitedCleanly && acc.minorFails === 0 ? "success" : "partial_success";
    } else {
      resultType = "failure";
    }
    mercSurvived = true;
  } else {
    resultType = "failure";
    if (acc.stars === 1) {
      acc.logs.push(`[난이도 1 보정] 위협 수준이 낮아 구사일생으로 빠져나왔다.`);
      mercSurvived = true;
    } else {
      const sr = calculateSurvivalRoll(mission.tier, merc);
      acc.logs.push(sr.survivalLogKo);
      mercSurvived = sr.survived;
      if (sr.survived) fatalStatuses.push(...sr.fatalStatuses);
      else fatalStatuses.push(STATUS_KIA);
    }
  }

  const jokerMerc = loadout
    ? mercTriggersJokerForMissionType(merc, mission.missionType || "", loadout)
    : mercTriggersJokerForMissionType(merc, mission.missionType || "");

  let jokerStatusChange: StatusChange | null = null;
  if (!acc.entryBlocked && resultType === "failure" && mercSurvived && jokerMerc) {
    acc.logs.push(
      `[조커 카드 개입] 용병의 숨겨둔 플랜 B 장비가 과부하되며 위기를 무마합니다. 작전은 부분 성공으로 강제 전환됩니다.`,
    );
    resultType = "partial_success";
    jokerStatusChange = {
      statusId: STATUS_GEAR_DESTROYED_JOKER,
      changeType: "add",
      noteKo: "조커 카드 발동으로 인한 치명적 장비 파손",
    };
  }

  const totalFatigue = Math.round(acc.totalFatigue * acc.fatigueMultiplier);

  let reward = 0;
  let summaryLogKo = "";
  if (acc.entryBlocked) {
    reward = 0;
    summaryLogKo = "진입 조건 미달로 작전 구역에 들어가지도 못하고 철수했다.";
  } else if (resultType === "success") {
    reward = mission.rewardCredits;
    summaryLogKo = `작전 목표를 달성하고 깔끔하게 현장을 빠져나왔다. (피로도 +${totalFatigue})`;
  } else if (resultType === "partial_success") {
    reward = Math.floor(mission.rewardCredits * 0.5);
    summaryLogKo = `대가를 치렀지만 핵심 목표만은 건져 돌아왔다. (피로도 +${totalFatigue})`;
  } else {
    reward = 0;
    summaryLogKo = mercSurvived
      ? `작전 실패. 목표를 건지지 못한 채 현장을 빠져나왔다. (피로도 +${totalFatigue})`
      : `작전 실패. 용병은 현장에서 돌아오지 못했다. (피로도 +${totalFatigue})`;
  }

  const statusChanges: StatusChange[] = [
    {
      statusId: STATUS_FATIGUE_PLUS,
      changeType: "add",
      noteKo: `작전 수행으로 인한 피로도 누적 (+${totalFatigue})`,
    },
  ];
  if (jokerStatusChange) statusChanges.push(jokerStatusChange);
  fatalStatuses.forEach((fs) => {
    statusChanges.push({ statusId: fs, changeType: "add", noteKo: "작전 여파에 따른 치명적 상태" });
  });

  const triggeredTags = mergeTriggered([], acc.context.allTriggeredTags);

  const extraRewardCredits =
    acc.catchUpBonusEarned && reward > 0
      ? Math.floor(reward * (GAME_CONFIG.catchUp.bonusRewardPercent / 100))
      : 0;

  return {
    report: {
      reportId: `sim_report_${mission.missionId}_${merc.mercId}_${Date.now()}`,
      missionId: mission.missionId,
      mercId: merc.mercId,
      resultType,
      rewardCredits: reward,
      extraRewardCredits,
      lostCredits: resultType === "success" ? 0 : Math.floor(mission.rewardCredits * 0.3),
      summaryLogKo,
      fulfilledConditionsKo: acc.entryBlocked
        ? "진입 게이트 미통과"
        : acc.objectiveSucceeded
          ? "핵심 목표 달성"
          : "핵심 목표 미달",
      missingConditionsKo: acc.entryBlocked
        ? "필수 진입 조건 미충족"
        : resultType === "success"
          ? "없음"
          : acc.objectiveSucceeded
            ? "이탈·부수 목표에서 손실 발생"
            : "핵심 목표 미달",
      nodeLogKo: acc.logs,
      nodeResolutions: acc.nodeResolutions,
      catchUpBonusEarned: catchUpActive ? acc.catchUpBonusEarned : undefined,
      catchUpActive: catchUpActive ? true : undefined,
      triggeredTags,
      runContextSnapshot: {
        seizedGearIds: [...acc.context.seizedGearIds],
        flags: { ...acc.context.flags },
        emergencyCount: acc.context.emergencyCount,
      },
      statusChanges,
      gearUpdates: [],
      implantUpdates: [],
      reputationChanges: [],
      followupHooks: [],
    },
    mercSurvived,
    fatalStatuses,
  };
}

/** 직렬화용: NodeQueue → 배열 */
export function serializeQueue(queue: NodeQueue): QueuedNode[] {
  return queue.remaining();
}

export function deserializeQueue(nodes: QueuedNode[]): NodeQueue {
  return new NodeQueue(nodes);
}
