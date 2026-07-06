import { describe, expect, it } from "vitest";
import type { Mission } from "../data/types";
import { createInitialState, createFixerProfileFromOrigin } from "./state";
import { getMissionWeight, weightMissions } from "./world";

// ─── 테스트 픽스처 ────────────────────────────────────────────────────────────

const lowerMission: Mission = {
  missionId: "test_lower",
  displayNameKo: "하층 테스트 미션",
  tier: "lower",
  missionType: "지원",
  difficultyStars: 2,
  nodeCount: 3,
  rewardCredits: 5000,
  earlyWithdrawalPenalty: 1000,
  phase0BriefingKo: "",
  phase1SummaryKo: "",
  phase2SummaryKo: "",
  successSummaryKo: "",
  failureSummaryKo: "",
};

const midMission: Mission = { ...lowerMission, missionId: "test_mid", displayNameKo: "중층 테스트 미션", tier: "mid" };
const upperMission: Mission = { ...lowerMission, missionId: "test_upper", displayNameKo: "상층 테스트 미션", tier: "upper" };

function stateWithOrigin(origin: Parameters<typeof createFixerProfileFromOrigin>[0]) {
  const base = createInitialState();
  const { profile, initialCredits, factionReputation } = createFixerProfileFromOrigin(origin, "이름", "코드");
  return { ...base, fixerProfile: profile, ledger: initialCredits, factionReputation };
}

// ─── getMissionWeight 테스트 ─────────────────────────────────────────────────

describe("getMissionWeight - 출신지 기반 가중치", () => {
  it("하층_언존_태생은 하층 미션 가중치가 높다", () => {
    const state = stateWithOrigin("하층_언존_태생");
    const wLower = getMissionWeight(lowerMission, state);
    const wMid = getMissionWeight(midMission, state);
    const wUpper = getMissionWeight(upperMission, state);
    expect(wLower).toBeGreaterThan(wMid);
    expect(wMid).toBeGreaterThan(wUpper);
  });

  it("살아남은_폐기체도 하층 미션 가중치가 높다", () => {
    const state = stateWithOrigin("살아남은_폐기체");
    expect(getMissionWeight(lowerMission, state)).toBeGreaterThan(getMissionWeight(midMission, state));
  });

  it("몰락자는 중층 미션 가중치가 높다", () => {
    const state = stateWithOrigin("몰락자");
    const wLower = getMissionWeight(lowerMission, state);
    const wMid = getMissionWeight(midMission, state);
    const wUpper = getMissionWeight(upperMission, state);
    expect(wMid).toBeGreaterThan(wLower);
    expect(wMid).toBeGreaterThan(wUpper);
  });

  it("fixerProfile이 null이면 모든 미션 가중치가 동일하다 (1.0)", () => {
    const state = createInitialState(); // fixerProfile = null
    expect(getMissionWeight(lowerMission, state)).toBe(1.0);
    expect(getMissionWeight(midMission, state)).toBe(1.0);
    expect(getMissionWeight(upperMission, state)).toBe(1.0);
  });
});

describe("getMissionWeight - 스테이션 위치 기반 가중치", () => {
  it("하층 스테이션은 하층 미션 ×1.5, 상층 미션 ×0.2를 반환한다", () => {
    const state = stateWithOrigin("상실자");
    const statedState = {
      ...state,
      stationState: {
        stationId: "s1",
        fixerId: "f1",
        category: "숙박" as const,
        facilityName: "테스트",
        locationTier: "하층" as const,
        locationArea: "UNzone",
        level: 1,
        operatingCostPerTurn: 0,
        analysisMissionLv: 0,
        analysisMercLv: 0,
      },
    };
    expect(getMissionWeight(lowerMission, statedState)).toBeCloseTo(1.5);
    expect(getMissionWeight(midMission, statedState)).toBeCloseTo(0.7);
    expect(getMissionWeight(upperMission, statedState)).toBeCloseTo(0.2);
  });

  it("스테이션 위치가 출신지보다 우선한다", () => {
    // 하층_언존_태생이지만 중층 스테이션 → 중층 가중치 기준
    const state = stateWithOrigin("하층_언존_태생");
    const statedState = {
      ...state,
      stationState: {
        stationId: "s1",
        fixerId: "f1",
        category: "숙박" as const,
        facilityName: "테스트",
        locationTier: "중층" as const,
        locationArea: "Mid",
        level: 1,
        operatingCostPerTurn: 0,
        analysisMissionLv: 0,
        analysisMercLv: 0,
      },
    };
    // 중층 스테이션 기준: mid ×1.4, lower ×0.8
    expect(getMissionWeight(midMission, statedState)).toBeCloseTo(1.4);
    expect(getMissionWeight(lowerMission, statedState)).toBeCloseTo(0.8);
  });
});

describe("weightMissions", () => {
  it("하층_언존_태생은 하층 미션이 목록 앞에 정렬된다", () => {
    const state = stateWithOrigin("하층_언존_태생");
    const result = weightMissions([upperMission, midMission, lowerMission], state);
    expect(result[0].tier).toBe("lower");
    expect(result[2].tier).toBe("upper");
  });

  it("픽서 프로필 없으면 원래 순서를 유지한다 (가중치 동일)", () => {
    const state = createInitialState(); // fixerProfile = null
    const input = [upperMission, midMission, lowerMission];
    const result = weightMissions(input, state);
    // 동일 가중치이므로 순서 유지
    expect(result.map((m) => m.missionId)).toEqual(input.map((m) => m.missionId));
  });
});
