import {
  factionDefs,
  gearDefs,
  implantDefs,
  matchCases,
  mercenaries,
  allMissions,
  resultReports,
  stats,
  statusDefs,
} from "./seed";
import type { MatchCase, Mercenary, Mission, ResultReport, StatKey } from "./types";
import { calculateDynamicMatch, calculateDynamicReport } from "../domain/dynamicSystem";
import type { DispatchLoadoutContext } from "../domain/gearStatBonus";


const visibilityLevelNames: Record<string, string> = {
  very_low: "매우 낮음",
  low: "낮음",
  medium: "보통",
  high: "높음",
  very_high: "매우 높음",
};

const statusNameById = new Map(statusDefs.map((s) => [s.statusId, s.displayNameKo]));
const gearNameById = new Map(gearDefs.map((g) => [g.gearId, g.displayNameKo]));
const implantNameById = new Map(implantDefs.map((i) => [i.implantId, i.displayNameKo]));
const factionNameById = new Map(factionDefs.map((f) => [f.factionId, f.displayNameKo]));

export function getMission(missionId: string): Mission | undefined {
  return allMissions.find((m) => m.missionId === missionId);
}

export function getMercenary(mercId: string): Mercenary | undefined {
  return mercenaries.find((m) => m.mercId === mercId);
}

export function getMatch(
  missionId: string,
  mercId: string,
  loadout?: DispatchLoadoutContext
): MatchCase | undefined {
  const staticMatch = matchCases.find((m) => m.missionId === missionId && m.mercId === mercId);
  if (staticMatch) return staticMatch;

  const mission = getMission(missionId);
  const merc = getMercenary(mercId);
  if (mission && merc) {
    return calculateDynamicMatch(mission, merc, loadout);
  }
  return undefined;
}

export function getReport(missionId: string, mercId: string): ResultReport | undefined {
  const staticReport = resultReports.find((r) => r.missionId === missionId && r.mercId === mercId);
  if (staticReport) return staticReport;

  const mission = getMission(missionId);
  const merc = getMercenary(mercId);
  const match = getMatch(missionId, mercId);
  if (mission && merc && match) {
    return calculateDynamicReport(mission, merc, match);
  }
  return undefined;
}

export function statusName(statusId: string): string {
  return statusNameById.get(statusId) ?? statusId;
}

export function gearName(gearId: string): string {
  return gearNameById.get(gearId) ?? gearId;
}

export function implantName(implantId: string): string {
  return implantNameById.get(implantId) ?? implantId;
}

export function factionName(factionId: string): string {
  return factionNameById.get(factionId) ?? factionId;
}

const statNameById = new Map(stats.map((s) => [s.statKey, s.displayNameKo]));
export function statName(statId: string): string {
  return statNameById.get(statId.toLowerCase() as StatKey) ?? statId;
}

/** missionType은 이미 한글이므로 그대로 반환한다. (영문 타입 방어용 pass-through) */
export function missionTypeName(typeId: string): string {
  return typeId;
}

export function visibilityName(level: string): string {
  return visibilityLevelNames[level] ?? level;
}
