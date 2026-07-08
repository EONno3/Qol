import type { Mercenary, Mission, ResultReport } from "../data/types";
import { getSurvivalProbability } from "./survival";
import { mercTriggersJokerForMissionType } from "./tags";
import { getEffectiveStatForNode, type DispatchLoadoutContext } from "./gearStatBonus";
import { executeMissionRun } from "./missionRunExecutor";
import { computeNodePassChance } from "./nodePassChance";
import type { StatKey } from "../data/types";

export type { DispatchLoadoutContext };
export { computeNodePassChance };

export function shouldTriggerJoker(mission: Mission, merc: Mercenary, loadout?: DispatchLoadoutContext): boolean {
  return mercTriggersJokerForMissionType(merc, mission.missionType || "", loadout);
}

export interface SimulationResult {
  report: ResultReport;
  mercSurvived: boolean;
  fatalStatuses: string[];
}

export function simulateMission(
  mission: Mission,
  merc: Mercenary,
  rng: () => number = Math.random,
  loadout?: DispatchLoadoutContext,
  catchUp?: import("../data/types").CatchUpConfig
): SimulationResult {
  const { report, mercSurvived, fatalStatuses } = executeMissionRun({
    mission,
    merc,
    rng,
    loadout,
    catchUp,
  });
  return { report, mercSurvived, fatalStatuses };
}

export function calculateGearDestructionProb(
  mission: Mission,
  merc: Mercenary,
  loadout?: DispatchLoadoutContext
): number {
  const stars = Math.max(1, Math.min(5, mission.difficultyStars || 1));

  const primaryStat = (mission.mechanics?.primary_stat ?? "frame") as StatKey;
  const baseStat = merc.stats[primaryStat] ?? 0;
  const effectiveStat = getEffectiveStatForNode(merc.mercId, baseStat, primaryStat, loadout);
  const passChance = computeNodePassChance(stars, effectiveStat);
  const failChance = 1 - passChance / 100;

  let survivalProbIfFailed = 1;
  if (stars > 1) {
    survivalProbIfFailed = getSurvivalProbability(mission.tier, merc) / 100;
  }

  const hasJoker = shouldTriggerJoker(mission, merc, loadout);
  const gearDestructionGivenFail = hasJoker ? 1.0 : 1.0 * survivalProbIfFailed;

  return failChance * gearDestructionGivenFail * 100;
}
