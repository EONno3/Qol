import type {
  Mercenary,
  Mission,
  MissionNode,
  NodeResolutionLog,
  NodeRole,
  QueuedNode,
  ResultReport,
  ResultType,
  RoutingDecision,
  StatKey,
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
import type { NodeOutcome } from "../data/types";
import { assignNodeChallenges } from "./assignNodeChallenges";
import { resolveMissionNodes } from "./missionNodes";
import { createForcedEntryRiskNode, evaluateEntryGate } from "./entryGate";
import {
  createVisibilityRiskNode,
  evaluateVisibilityExposure,
} from "./visibilityPenalty";

export { resolveMissionNodes } from "./missionNodes";

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

export interface MissionRunResult {
  report: ResultReport;
  mercSurvived: boolean;
  fatalStatuses: string[];
  context: import("../data/types").MissionRunContext;
}

export interface MissionRunParams {
  mission: Mission;
  merc: Mercenary;
  rng?: () => number;
  loadout?: DispatchLoadoutContext;
  initialQueue?: NodeQueue;
  postNodeRouting?: (
    node: QueuedNode,
    judgment: ReturnType<typeof resolveNodeJudgment>,
    context: import("../data/types").MissionRunContext,
    queue: NodeQueue
  ) => RoutingDecision | void;
}

function mergeTriggered(
  all: import("../data/types").TriggeredTag[],
  nodeTags: import("../data/types").TriggeredTag[]
): import("../data/types").TriggeredTag[] {
  const out = [...all];
  for (const t of nodeTags) {
    if (
      !out.some(
        (x) => x.tagId === t.tagId && x.sourceId === t.sourceId && x.ruleId === t.ruleId
      )
    ) {
      out.push(t);
    }
  }
  return out;
}

export function executeMissionRun(params: MissionRunParams): MissionRunResult {
  const { mission, merc, loadout, postNodeRouting } = params;
  const rng = params.rng ?? Math.random;
  const stars = Math.max(1, Math.min(5, mission.difficultyStars || 1));
  const fatiguePerNode = GAME_CONFIG.difficulty.fatiguePerNodeByDifficulty[stars] ?? 3;
  const tier = mission.tier;
  const tierNameKo = TIER_LABEL_KO[tier] || tier;

  const context = createMissionRunContext(mission.missionId, merc.mercId);
  const queue = params.initialQueue ?? buildInitialQueue(mission);
  const mercenaryTags = resolveMercenaryTagAttributions(merc);
  const loadoutTags = resolveLoadoutTagAttributions(merc.mercId, loadout);

  const logs: string[] = [];
  const nodeResolutions: NodeResolutionLog[] = [];
  const statusChanges: StatusChange[] = [];

  logs.push(`[작전 개시] ${tierNameKo} 구역 진입 준비 완료.`);

  const entryGateResult = evaluateEntryGate(mission.entryGate, merc, loadout);
  let entryBlocked = false;

  if (entryGateResult.outcome === "blocked") {
    entryBlocked = true;
    if (entryGateResult.logKo) logs.push(entryGateResult.logKo);
  } else if (entryGateResult.outcome === "forced_risk") {
    if (entryGateResult.logKo) logs.push(entryGateResult.logKo);
    const riskName =
      mission.entryGate?.forcedRiskNodeNameKo ?? "돌발 위험 구간";
    queue.injectNext([createForcedEntryRiskNode(mission, riskName)]);
  }

  if (!entryBlocked) {
    const visibilityExposure = evaluateVisibilityExposure(mission, merc, loadout);
    if (visibilityExposure.exposed && visibilityExposure.riskNodeNameKo) {
      if (visibilityExposure.logKo) logs.push(visibilityExposure.logKo);
      queue.injectNext([
        createVisibilityRiskNode(mission, visibilityExposure.riskNodeNameKo),
      ]);
      context.emergencyCount += 1;
    }
  }

  let totalFatigue = 0;
  let minorFails = 0;
  let objectiveSucceeded = false;
  let exitOutcome: NodeOutcome | null = null;
  let catastropheRole: NodeRole | null = null;
  let nodeIndex = 0;
  let phase: "main" | "survival" | "done" = "main";

  if (!entryBlocked) {
  while (phase === "main" && !queue.isEmpty()) {
    const node = queue.pop()!;
    const judgment = resolveNodeJudgment({
      stars,
      merc,
      node,
      mission,
      loadout,
      mercenaryTags,
      loadoutTags,
      rng,
    });

    totalFatigue += fatiguePerNode;
    logs.push(judgment.logKo);
    recordTriggeredTags(context, judgment.triggeredTags);
    applySeizureFromTriggered(context, judgment.triggeredTags, judgment.outcome);

    nodeResolutions.push({
      nodeInstanceId: node.nodeInstanceId,
      nameKo: node.nameKo,
      role: node.role,
      outcome: judgment.outcome,
      logKo: judgment.logKo,
      challengeTags: node.challengeTags,
      triggeredTags: judgment.triggeredTags,
      passChance: judgment.passChance,
      tagPassChanceDelta: judgment.tagPassChanceDelta,
    });

    if (judgment.outcome === "minor") minorFails++;
    if (node.role === "objective") objectiveSucceeded = judgment.outcome === "pass";
    if (node.role === "exit") exitOutcome = judgment.outcome;

    if (judgment.outcome === "critical") {
      catastropheRole = node.role;
      if (node.role !== "exit") {
        logs.push(`[작전 중단] 치명적 차질로 더 이상 작전을 이어갈 수 없다.`);
        phase = "survival";
        queue.clear();
        break;
      }
    }

    let routing: RoutingDecision = judgment.routing;
    const custom = postNodeRouting?.(node, judgment, context, queue);
    if (custom) routing = custom;

    if (routing.action === "inject") {
      if (routing.position === "next") queue.injectNext(routing.nodes);
      else queue.injectBeforeExit(routing.nodes);
    } else if (routing.action === "goto_phase") {
      if (routing.phase === "survival") {
        phase = "survival";
        queue.clear();
      } else {
        phase = "done";
        queue.clear();
      }
    }

    nodeIndex++;
  }
  }

  const exitedCleanly = exitOutcome === "pass";
  const exitedAlive = exitOutcome === "pass" || exitOutcome === "minor";
  const catastropheBeforeExit = catastropheRole !== null && catastropheRole !== "exit";

  let resultType: ResultType;
  let mercSurvived = true;
  const fatalStatuses: string[] = [];

  if (entryBlocked) {
    resultType = "failure";
    mercSurvived = true;
  } else if (exitedAlive && !catastropheBeforeExit) {
    if (objectiveSucceeded) {
      resultType = exitedCleanly && minorFails === 0 ? "success" : "partial_success";
    } else {
      resultType = "failure";
    }
    mercSurvived = true;
  } else {
    resultType = "failure";
    if (stars === 1) {
      logs.push(`[난이도 1 보정] 위협 수준이 낮아 구사일생으로 빠져나왔다.`);
      mercSurvived = true;
    } else {
      const sr = calculateSurvivalRoll(tier, merc);
      logs.push(sr.survivalLogKo);
      mercSurvived = sr.survived;
      if (sr.survived) fatalStatuses.push(...sr.fatalStatuses);
      else fatalStatuses.push(STATUS_KIA);
    }
  }

  const jokerMerc = loadout
    ? mercTriggersJokerForMissionType(merc, mission.missionType || "", loadout)
    : mercTriggersJokerForMissionType(merc, mission.missionType || "");

  if (!entryBlocked && resultType === "failure" && mercSurvived && jokerMerc) {
    logs.push(
      `[조커 카드 개입] 용병의 숨겨둔 플랜 B 장비가 과부하되며 위기를 무마합니다. 작전은 부분 성공으로 강제 전환됩니다.`
    );
    resultType = "partial_success";
    statusChanges.push({
      statusId: STATUS_GEAR_DESTROYED_JOKER,
      changeType: "add",
      noteKo: "조커 카드 발동으로 인한 치명적 장비 파손",
    });
  }

  let reward = 0;
  let summaryLogKo = "";
  if (entryBlocked) {
    reward = 0;
    summaryLogKo =
      "진입 조건 미달로 작전 구역에 들어가지도 못하고 철수했다.";
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

  statusChanges.push({
    statusId: STATUS_FATIGUE_PLUS,
    changeType: "add",
    noteKo: `작전 수행으로 인한 피로도 누적 (+${totalFatigue})`,
  });
  fatalStatuses.forEach((fs) => {
    statusChanges.push({ statusId: fs, changeType: "add", noteKo: "작전 여파에 따른 치명적 상태" });
  });

  const triggeredTags = mergeTriggered([], context.allTriggeredTags);

  const report: ResultReport = {
    reportId: `sim_report_${mission.missionId}_${merc.mercId}_${Date.now()}`,
    missionId: mission.missionId,
    mercId: merc.mercId,
    resultType,
    rewardCredits: reward,
    extraRewardCredits: 0,
    lostCredits: resultType === "success" ? 0 : Math.floor(mission.rewardCredits * 0.3),
    summaryLogKo,
    fulfilledConditionsKo: entryBlocked
      ? "진입 게이트 미통과"
      : objectiveSucceeded
        ? "핵심 목표 달성"
        : "핵심 목표 미달",
    missingConditionsKo: entryBlocked
      ? "필수 진입 조건 미충족"
      : resultType === "success"
        ? "없음"
        : objectiveSucceeded
          ? "이탈·부수 목표에서 손실 발생"
          : "핵심 목표 미달",
    nodeLogKo: logs,
    nodeResolutions,
    triggeredTags,
    runContextSnapshot: {
      seizedGearIds: [...context.seizedGearIds],
      flags: { ...context.flags },
      emergencyCount: context.emergencyCount,
    },
    statusChanges,
    gearUpdates: [],
    implantUpdates: [],
    reputationChanges: [],
    followupHooks: [],
  };

  return { report, mercSurvived, fatalStatuses, context };
}
