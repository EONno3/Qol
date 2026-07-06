import type { GameState } from "./state";
import { getMercenary } from "../data/lookups";
import { STATUS_GEAR_DESTROYED, STATUS_GEAR_DESTROYED_JOKER } from "../data/constants";
import { GAME_CONFIG } from "../data/config";

// 레벨 업에 필요한 크레딧 계산 공식
export function getUpgradeCost(currentLevel: number): number {
  return currentLevel * GAME_CONFIG.station.upgradeCostMultiplier;
}

// 장비 재수급 비용 (GAME_CONFIG 단일 소스 참조)
export function getReplacementCost(): number {
  return GAME_CONFIG.mercenary.replacementCost;
}


// 업그레이드 시 능력치 변화 계산
export function getUpgradedStation(state: GameState) {
  if (!state.stationState) return null;
  const currentLevel = state.stationState.level;
  const nextLevel = currentLevel + 1;

  // 레벨에 따른 분석 레벨 배정 (Lv1: 0, Lv2: 1, Lv3: 2...)
  // 더 단순화: Lv1=0, Lv2=1, Lv3=2
  const nextAnalysis = nextLevel - 1;

  return {
    ...state.stationState,
    level: nextLevel,
    operatingCostPerTurn: Math.pow(nextLevel, 2) * GAME_CONFIG.station.operatingCostBaseMultiplier,
    analysisMissionLv: Math.min(2, nextAnalysis),
    analysisMercLv: Math.min(2, nextAnalysis),
  };
}

export function upgradeStation(state: GameState): GameState {
  if (!state.stationState) return state;
  
  const currentLevel = state.stationState.level;
  const cost = getUpgradeCost(currentLevel);

  if (state.ledger < cost) {
    return state; // 크레딧 부족
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

// 용병 고용 비용 계산 (임시: 지휘력 코스트 * 2000)
export function getHiringCost(mercId: string): number {
  const merc = getMercenary(mercId);
  if (!merc) return 0;
  if (merc.hiringCost !== undefined) return merc.hiringCost;
  return merc.commandCost * GAME_CONFIG.mercenary.hiringCostMultiplier;
}

export function hireMercenary(state: GameState, mercId: string): GameState {
  if (state.hiredMercs.includes(mercId)) return state; // 이미 고용됨
  
  const cost = getHiringCost(mercId);
  if (state.ledger < cost) return state; // 크레딧 부족

  return {
    ...state,
    ledger: state.ledger - cost,
    hiredMercs: [...state.hiredMercs, mercId]
  };
}

export function fireMercenary(state: GameState, mercId: string): GameState {
  if (!state.hiredMercs.includes(mercId)) return state;

  return {
    ...state,
    hiredMercs: state.hiredMercs.filter(id => id !== mercId)
  };
}

export function replaceDestroyedGear(state: GameState, mercId: string): GameState {
  const REPLACEMENT_COST = GAME_CONFIG.mercenary.replacementCost;
  if (state.ledger < REPLACEMENT_COST) return state;

  const currentStatuses = state.mercStatuses[mercId] || [];
  const hasDestroyedGear = currentStatuses.includes(STATUS_GEAR_DESTROYED) || currentStatuses.includes(STATUS_GEAR_DESTROYED_JOKER);
  
  // 소유 장비 및 임플란트 중 파손된 항목 조회
  const ownedGears = Object.entries(state.gearOwner)
    .filter(([, ownerId]) => ownerId === mercId)
    .map(([gearId]) => gearId);
  
  const ownedImplants = Object.entries(state.implantOwner)
    .filter(([, ownerId]) => ownerId === mercId)
    .map(([implantId]) => implantId);

  const brokenGearId = ownedGears.find(
    (gid) => state.gearStates[gid] === "destroyed" || state.gearStates[gid] === "damaged"
  );
  
  const brokenImplantId = ownedImplants.find(
    (iid) => state.implantStates[iid] === "destroyed" || state.implantStates[iid] === "damaged"
  );

  // 상태 태그 혹은 실제 장비 파손이 없으면 취소
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
    s => s !== STATUS_GEAR_DESTROYED && s !== STATUS_GEAR_DESTROYED_JOKER
  );

  return {
    ...state,
    ledger: state.ledger - REPLACEMENT_COST,
    gearStates: newGearStates,
    implantStates: newImplantStates,
    mercStatuses: {
      ...state.mercStatuses,
      [mercId]: newStatuses
    }
  };
}
