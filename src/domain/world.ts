/**
 * world.ts
 *
 * GameState의 world state(출신지, 스테이션 위치, 팩션 호감도)를
 * 미션 풀 정렬/필터에 반영하는 도메인 로직.
 *
 * 참고: static_data_spec.md Section 2.1 위치(Tier) 기본 가중치
 */

import type { Mission, FixerOrigin, LocationTier, Tier } from "../data/types";
import type { GameState } from "./state";

// ─── 위치 × 미션 Tier 가중치 테이블 ────────────────────────────────────────
// static_data_spec.md Section 2.1

const LOCATION_TIER_WEIGHTS: Record<LocationTier, Record<Tier, number>> = {
  하층: { lower: 1.5, mid: 0.7, upper: 0.2 },
  중층: { lower: 0.8, mid: 1.4, upper: 0.6 },
  상층: { lower: 0.3, mid: 0.8, upper: 1.8 },
};

// ─── 출신지 → 선호 LocationTier (스테이션 없을 때 fallback) ─────────────────

const ORIGIN_PREFERRED_TIER: Partial<Record<FixerOrigin, LocationTier>> = {
  하층_언존_태생: "하층",
  살아남은_폐기체: "하층",
  몰락자: "중층",
  버려진_사생아: "중층",
  // 추방자, 상실자, 무지한_외부인: 선호 없음 (null → 가중치 1.0 균등)
};

// ─── 유효 위치 결정 ──────────────────────────────────────────────────────────

function getEffectiveLocationTier(state: GameState): LocationTier | null {
  // 스테이션 위치가 출신지보다 우선
  if (state.stationState !== null) {
    return state.stationState.locationTier;
  }
  if (state.fixerProfile !== null) {
    return ORIGIN_PREFERRED_TIER[state.fixerProfile.origin] ?? null;
  }
  return null;
}

// ─── 미션 가중치 계산 ────────────────────────────────────────────────────────

/**
 * 단일 미션에 대한 가중치를 반환한다.
 * 값이 높을수록 미션 목록 앞에 정렬된다.
 * 기본값: 1.0 (픽서 프로필 없거나 선호 위치 없을 때)
 */
export function getMissionWeight(mission: Mission, state: GameState): number {
  const locationTier = getEffectiveLocationTier(state);
  if (locationTier === null) return 1.0;

  return LOCATION_TIER_WEIGHTS[locationTier][mission.tier];
}

// ─── 미션 풀 정렬 ────────────────────────────────────────────────────────────

/**
 * world_state에 따라 미션 배열을 가중치 내림차순으로 정렬해 반환한다.
 * 원본 배열을 변경하지 않는다.
 * 동일 가중치면 원래 순서를 유지한다(stable sort).
 */
export function weightMissions(missions: Mission[], state: GameState): Mission[] {
  // 동일 가중치 시 원래 순서 유지를 위해 인덱스 보존
  return missions
    .map((m, idx) => ({ m, idx, w: getMissionWeight(m, state) }))
    .sort((a, b) => b.w - a.w || a.idx - b.idx)
    .map(({ m }) => m);
}
