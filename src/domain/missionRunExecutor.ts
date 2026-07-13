import type {
  Mercenary,
  Mission,
  QueuedNode,
  ResultReport,
  RoutingDecision,
} from "../data/types";
import { GAME_CONFIG } from "../data/config";
import type { DispatchLoadoutContext } from "./gearStatBonus";
import { NodeQueue } from "./nodeQueue";
import { resolveNodeJudgment } from "./nodeTagJudgment";
import {
  buildMissionRunReport,
  createMissionRunAccumulator,
  resolveMissionNodeStep,
} from "./missionRunSteps";

export { resolveMissionNodes } from "./missionNodes";
export { buildInitialQueue, missionNodeToQueued } from "./missionRunSteps";

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
  /** 캐치업(현장 개입) 설정 — 미전달 시 판정 완전 불변(옵트인, 레거시 배치 경로) */
  catchUp?: import("../data/types").CatchUpConfig;
  /** 숙박 시설 등 — 피로도 누적 배율 (기본 1) */
  fatigueMultiplier?: number;
  postNodeRouting?: (
    node: QueuedNode,
    judgment: ReturnType<typeof resolveNodeJudgment>,
    context: import("../data/types").MissionRunContext,
    queue: NodeQueue,
  ) => RoutingDecision | void;
}

export function executeMissionRun(params: MissionRunParams): MissionRunResult {
  const { mission, merc, loadout, postNodeRouting, catchUp, fatigueMultiplier = 1 } = params;
  const catchUpActive = !!catchUp && catchUp.interventionNodeNamesKo.length > 0;
  const rng = params.rng ?? Math.random;

  const acc = createMissionRunAccumulator({
    mission,
    merc,
    loadout,
    fatigueMultiplier,
    rng,
    initialQueue: params.initialQueue,
  });

  if (!acc.entryBlocked) {
    while (acc.phase === "main" && !acc.queue.isEmpty()) {
      const node = acc.queue.pop()!;
      const intervened =
        catchUpActive && catchUp!.interventionNodeNamesKo.includes(node.nameKo);
      resolveMissionNodeStep(acc, node, {
        intervened,
        catchUpPenaltyPercent: intervened ? GAME_CONFIG.catchUp.nodePenaltyPercent : 0,
        postNodeRouting,
      });
    }
  }

  const { report, mercSurvived, fatalStatuses } = buildMissionRunReport(acc, catchUpActive);

  return {
    report,
    mercSurvived,
    fatalStatuses,
    context: acc.context,
  };
}
