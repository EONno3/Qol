import { getMission, getReport, getMercenary } from "../data/lookups";
import type { ResultReport, ResultType, MissionTypeKey } from "../data/types";
import type { GameState } from "./state";
import { STATUS_KIA } from "../data/constants";
import { calcCompensationSplit, calcDissatisfactionGain } from "./mercCompensation";
import { getStationModifiers } from "./stationModifiers";

export { getReport };

export interface SettlementOptions {
  /** 적용 용병 지분 (0~1). 미전달 시 0 = 픽ser 전액 (레거시) */
  mercShareRate?: number;
  /** 불만도 산정용 기대 지분. 미전달 시 seed Mercenary.expectedShareRate */
  mercExpectedShareRate?: number;
}

export function resolveReport(state: GameState, dispatchId: string): ResultReport | undefined {
  return state.generatedReports[dispatchId];
}

export function netCredits(report: ResultReport): number {
  return report.rewardCredits + report.extraRewardCredits - report.lostCredits;
}

// ─── Fame / Infamy 델타 ───────────────────────────────────────────────────────

function getFameDelta(resultType: ResultType): number {
  switch (resultType) {
    case "success": return 2;
    case "partial_success": return 1;
    default: return 0;
  }
}

function getInfamyDelta(resultType: ResultType): number {
  switch (resultType) {
    case "failure": return 2;
    case "incident": return 3;
    case "early_withdrawal": return 1;
    default: return 0;
  }
}

// ─── 정산 적용 ───────────────────────────────────────────────────────────────

export function applySettlement(
  state: GameState,
  report: ResultReport,
  options?: SettlementOptions,
): GameState {
  if (state.settledReports.includes(report.reportId)) {
    return state;
  }

  // 용병 상태 변경
  const mercStatuses = structuredClone(state.mercStatuses);
  const current = mercStatuses[report.mercId] ?? [];
  let isKia = false;

  for (const change of report.statusChanges) {
    if (change.statusId === STATUS_KIA && change.changeType === "add") {
      isKia = true;
    }
    if (change.changeType === "remove") {
      mercStatuses[report.mercId] = current.filter((id) => id !== change.statusId);
    } else if (!current.includes(change.statusId)) {
      current.push(change.statusId);
      mercStatuses[report.mercId] = current;
    }
  }

  let hiredMercs = state.hiredMercs;
  let totalMercsLost = state.playerBehavioralStats.totalMercsLost;

  if (isKia) {
    hiredMercs = hiredMercs.filter((id) => id !== report.mercId);
    totalMercsLost += 1;
  }

  // 장비 상태 변경 및 소유 관계 동기화
  const gearStates = { ...state.gearStates };
  const gearOwner = { ...state.gearOwner };
  for (const update of report.gearUpdates) {
    gearStates[update.gearId] = update.updateType;
    if (!gearOwner[update.gearId]) {
      gearOwner[update.gearId] = report.mercId;
    }
  }

  // 임플란트 상태 변경 및 소유 관계 동기화
  const implantStates = { ...state.implantStates };
  const implantOwner = { ...state.implantOwner };
  for (const update of report.implantUpdates) {
    implantStates[update.implantId] = update.updateType;
    if (!implantOwner[update.implantId]) {
      implantOwner[update.implantId] = report.mercId;
    }
  }

  // 팩션 호감도 변경
  const factionReputation = { ...state.factionReputation };
  for (const change of report.reputationChanges) {
    factionReputation[change.factionId] =
      (factionReputation[change.factionId] ?? 0) + change.reputationDelta;
  }

  // 후속 단서 추가
  const followupHooks = [...state.followupHooks];
  for (const hook of report.followupHooks) {
    if (!followupHooks.includes(hook.hookId)) {
      followupHooks.push(hook.hookId);
    }
  }

  // ─── playerBehavioralStats 업데이트 ────────────────────────────────────────
  const missionDef = getMission(report.missionId);
  const missionType = missionDef?.missionType ?? "기업";
  const net = netCredits(report);
  const mercShareRate = options?.mercShareRate ?? 0;
  const mercDef = getMercenary(report.mercId);
  const expectedShareRate =
    options?.mercExpectedShareRate ?? mercDef?.expectedShareRate ?? 0;
  const { fixerCredits } = calcCompensationSplit(net, mercShareRate);
  const { dissatisfactionGainMultiplier } = getStationModifiers(state);
  const dissGain = calcDissatisfactionGain(
    expectedShareRate,
    mercShareRate,
    net,
    dissatisfactionGainMultiplier,
  );

  const mercDissatisfactionStacks = { ...state.mercDissatisfactionStacks };
  if (dissGain > 0) {
    mercDissatisfactionStacks[report.mercId] =
      (mercDissatisfactionStacks[report.mercId] ?? 0) + dissGain;
  }

  const prev = state.playerBehavioralStats;

  const playerBehavioralStats = {
    ...prev,
    missionCountByType: {
      ...prev.missionCountByType,
      [missionType as MissionTypeKey]: (prev.missionCountByType[missionType as MissionTypeKey] ?? 0) + 1,
    },
    totalCreditsEarned: prev.totalCreditsEarned + Math.max(0, fixerCredits),
    totalMercsLost,
    fame: Math.min(100, prev.fame + getFameDelta(report.resultType)),
    infamy: Math.min(100, prev.infamy + getInfamyDelta(report.resultType)),
  };

  return {
    ...state,
    ledger: state.ledger + fixerCredits,
    hiredMercs,
    mercStatuses,
    mercDissatisfactionStacks,
    gearStates,
    implantStates,
    gearOwner,
    implantOwner,
    factionReputation,
    followupHooks,
    acceptedMissions: state.acceptedMissions.filter((id) => id !== report.missionId),
    settledReports: [...state.settledReports, report.reportId],
    playerBehavioralStats,
  };
}
