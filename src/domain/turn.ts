import type { GameState } from "./state";
import { missions } from "../data/seed";

/**
 * 다음 날로 넘어가기 (Advance Turn)
 * - 턴 수를 1 올린다.
 * - 지휘력을 최대치로 회복한다.
 * - 보드에 남아 있는 완료된(수주/파견되지 않은) 미션 정리는 MVP에서는 생략하거나
 *   간단히 남은 가용 미션을 유지한다. (추후 새 랜덤 미션 추가 로직 확장 가능)
 * - 진행 중인 미션(activeDispatches)이나 완료되었으나 정산 대기 중인 상태는
 *   원래 턴을 넘기기 전 강제로 정산하도록 UI에서 막을 수도 있고, 방치형이라면 이월할 수도 있다.
 *   여기서는 안전하게 이월(유지)한다.
 */
export function advanceTurn(state: GameState): GameState {
  const maintenanceCost = state.stationState?.operatingCostPerTurn ?? 0;
  
  // 후속 단서(Story Hooks)로 인해 해금되는 미션 찾기
  const unlockedMissions = missions.filter(m => {
    if (!m.requiredHookId) return false;
    
    // 이미 보드에 있거나, 수주했거나, 진행중/완료한 미션이면 제외
    const alreadyExists = 
      state.availableMissions.includes(m.missionId) ||
      state.acceptedMissions.includes(m.missionId) ||
      state.activeDispatches.some(d => d.missionId === m.missionId) ||
      state.completedDispatches.some(d => d.missionId === m.missionId);
      
    if (alreadyExists) return false;

    // 현재 보유한 후속 단서 중에 조건이 있는지 확인
    return state.followupHooks.includes(m.requiredHookId);
  });

  const newAvailableMissions = [
    ...state.availableMissions,
    ...unlockedMissions.map(m => m.missionId)
  ];

  return {
    ...state,
    turnCount: state.turnCount + 1,
    currentCommandPoints: state.maxCommandPoints,
    ledger: state.ledger - maintenanceCost, // 빚(마이너스) 허용
    availableMissions: newAvailableMissions,
  };
}
