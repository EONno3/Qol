import type { GameState } from "./state";
import { getMercenary } from "../data/lookups";
import { STATUS_GEAR_DESTROYED, STATUS_GEAR_DESTROYED_JOKER } from "../data/constants";
import { GAME_CONFIG } from "../data/config";
import { getStationModifiers } from "./stationModifiers";

// 레벨 업에 필요한 크레딧 계산 공식
export function getUpgradeCost(currentLevel: number): number {
  return currentLevel * GAME_CONFIG.station.upgradeCostMultiplier;
}

export function getFacilityUpgradeCost(currentTier: number): number {
  if (currentTier >= 2) return 0;
  return GAME_CONFIG.station.facilityUpgradeCost;
}

// 장비 재수급 비용 (시설 장비 카테고리 할인 반영)
export function getReplacementCost(state?: GameState): number {
  const base = GAME_CONFIG.mercenary.replacementCost;
  if (!state) return base;
  const { replacementCostMultiplier } = getStationModifiers(state);
  return Math.floor(base * replacementCostMultiplier);
}

// 업그레이드 시 능력치 변화 계산 (인프라: OP·운영비만 — 분석은 업무 시설 전용)
export function getUpgradedStation(state: GameState) {
  if (!state.stationState) return null;
  const currentLevel = state.stationState.level;
  const nextLevel = currentLevel + 1;

  return {
    ...state.stationState,
    level: nextLevel,
    operatingCostPerTurn: Math.pow(nextLevel, 2) * GAME_CONFIG.station.operatingCostBaseMultiplier,
  };
}

export function upgradeStation(state: GameState): GameState {
  if (!state.stationState) return state;

  const currentLevel = state.stationState.level;
  const cost = getUpgradeCost(currentLevel);

  if (state.ledger < cost) {
    return state;
  }

  const upgradedStation = getUpgradedStation(state);
  if (!upgradedStation) return state;

  return {
    ...state,
    ledger: state.ledger - cost,
    stationState: upgradedStation,
    maxCommandPoints: state.maxCommandPoints + 2,
    currentCommandPoints: state.currentCommandPoints + 2,
  };
}

export function upgradeFacilityTier(state: GameState): GameState {
  if (!state.stationState) return state;
  const currentTier = state.stationState.facilityTier ?? 1;
  if (currentTier >= 2) return state;

  const cost = getFacilityUpgradeCost(currentTier);
  if (state.ledger < cost) return state;

  return {
    ...state,
    ledger: state.ledger - cost,
    stationState: {
      ...state.stationState,
      facilityTier: 2,
    },
  };
}

// 용병 고용 비용 계산 (임시: 지휘력 코스트 * 2000)
export function getHiringCost(mercId: string): number {
  const merc = getMercenary(mercId);
  if (!merc) return 0;
  if (merc.hiringCost !== undefined) return merc.hiringCost;
  return merc.commandCost * GAME_CONFIG.mercenary.hiringCostMultiplier;
}

export function hireMercenary(state: GameState, mercId: string): GameState {
  if (state.hiredMercs.includes(mercId)) return state;

  const cost = getHiringCost(mercId);
  if (state.ledger < cost) return state;

  return {
    ...state,
    ledger: state.ledger - cost,
    hiredMercs: [...state.hiredMercs, mercId],
  };
}

export function fireMercenary(state: GameState, mercId: string): GameState {
  if (!state.hiredMercs.includes(mercId)) return state;

  return {
    ...state,
    hiredMercs: state.hiredMercs.filter((id) => id !== mercId),
  };
}

export function replaceDestroyedGear(state: GameState, mercId: string): GameState {
  const REPLACEMENT_COST = getReplacementCost(state);
  if (state.ledger < REPLACEMENT_COST) return state;

  const currentStatuses = state.mercStatuses[mercId] || [];
  const hasDestroyedGear =
    currentStatuses.includes(STATUS_GEAR_DESTROYED) ||
    currentStatuses.includes(STATUS_GEAR_DESTROYED_JOKER);

  const ownedGears = Object.entries(state.gearOwner)
    .filter(([, ownerId]) => ownerId === mercId)
    .map(([gearId]) => gearId);

  const ownedImplants = Object.entries(state.implantOwner)
    .filter(([, ownerId]) => ownerId === mercId)
    .map(([implantId]) => implantId);

  const brokenGearId = ownedGears.find(
    (gid) => state.gearStates[gid] === "destroyed" || state.gearStates[gid] === "damaged",
  );

  const brokenImplantId = ownedImplants.find(
    (iid) => state.implantStates[iid] === "destroyed" || state.implantStates[iid] === "damaged",
  );

  if (!hasDestroyedGear && !brokenGearId && !brokenImplantId) return state;

  const newGearStates = { ...state.gearStates };
  const newImplantStates = { ...state.implantStates };

  if (brokenGearId) {
    newGearStates[brokenGearId] = "normal";
  }
  if (brokenImplantId) {
    newImplantStates[brokenImplantId] = "normal";
  }

  const newStatuses = currentStatuses.filter(
    (s) => s !== STATUS_GEAR_DESTROYED && s !== STATUS_GEAR_DESTROYED_JOKER,
  );

  return {
    ...state,
    ledger: state.ledger - REPLACEMENT_COST,
    gearStates: newGearStates,
    implantStates: newImplantStates,
    mercStatuses: {
      ...state.mercStatuses,
      [mercId]: newStatuses,
    },
  };
}
