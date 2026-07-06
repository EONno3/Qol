import { describe, expect, it } from "vitest";
import {
  evaluateVisibilityExposure,
  getMercVisibilityScore,
  isStealthSensitiveMission,
  STEALTH_SENSITIVE_MISSION_TYPES,
} from "./visibilityPenalty";
import type { Mercenary, Mission } from "../data/types";
import { gearDefs, implantDefs } from "../data/seed";

const baseMerc: Mercenary = {
  mercId: "merc_test",
  displayNameKo: "테스트",
  aliasKo: "테스터",
  originKo: "하층",
  contractTermsKo: "계약",
  stats: { frame: 40, cool: 40, wire: 40, cypher: 40, pulse: 40 },
  maxHp: 100,
  visibilityLevel: "low",
  commandCost: 3,
  phase0ProfileKo: "p",
  phase1SummaryKo: "p",
  phase2SummaryKo: "p",
  systemTags: [],
};

const stealthMission = (over: Partial<Mission> = {}): Mission => ({
  missionId: "m_stealth",
  displayNameKo: "잠입 테스트",
  tier: "mid",
  missionType: "잠입",
  difficultyStars: 2,
  nodeCount: 3,
  rewardCredits: 10000,
  earlyWithdrawalPenalty: 2000,
  phase0BriefingKo: "b",
  phase1SummaryKo: "b",
  phase2SummaryKo: "b",
  successSummaryKo: "s",
  failureSummaryKo: "f",
  mechanics: { visibility_limit: 40, primary_stat: "cypher", secondary_stat: "wire" },
  ...over,
});

describe("visibilityPenalty (T-B-3)", () => {
  it("T-B-3-0: STEALTH_SENSITIVE_MISSION_TYPES에 잠입·비밀·기업 포함", () => {
    expect(STEALTH_SENSITIVE_MISSION_TYPES).toContain("잠입");
    expect(STEALTH_SENSITIVE_MISSION_TYPES).toContain("비밀");
    expect(STEALTH_SENSITIVE_MISSION_TYPES).toContain("기업");
    expect(isStealthSensitiveMission(stealthMission())).toBe(true);
    expect(isStealthSensitiveMission(stealthMission({ missionType: "지원" }))).toBe(false);
  });

  it("T-B-3-1: 잠입 미션 + very_high 가시성 → exposed + 경비대 적발 노드명", () => {
    const merc = { ...baseMerc, visibilityLevel: "very_high" };
    const result = evaluateVisibilityExposure(stealthMission(), merc);

    expect(result.exposed).toBe(true);
    expect(result.overshoot).toBeGreaterThan(0);
    expect(result.riskNodeNameKo).toMatch(/경비대|적발|검문/);
    expect(result.logKo).toMatch(/가시성|적발|노출/);
  });

  it("T-B-3-2: 지원 미션 + very_high 가시성 → exposed false", () => {
    const merc = { ...baseMerc, visibilityLevel: "very_high" };
    const mission = stealthMission({ missionType: "지원" });

    const result = evaluateVisibilityExposure(mission, merc);

    expect(result.exposed).toBe(false);
  });

  it("T-B-3-3: 잠입 + very_low 가시성 → exposed false", () => {
    const merc = { ...baseMerc, visibilityLevel: "very_low" };
    const result = evaluateVisibilityExposure(stealthMission(), merc);

    expect(result.exposed).toBe(false);
    expect(result.overshoot).toBe(0);
  });

  it("T-B-3-4: 산탄 암 임플란트 loadout 시 가시성 점수 상승", () => {
    const merc = { ...baseMerc, mercId: "merc_chromeshow_01", visibilityLevel: "medium" };
    const loadout = {
      gearOwner: {},
      implantOwner: { implant_arm_shotgun_01: "merc_chromeshow_01" },
      gearDefs,
      implantDefs,
    };

    const bare = getMercVisibilityScore(merc);
    const equipped = getMercVisibilityScore(merc, loadout);

    expect(equipped).toBeGreaterThan(bare);
  });
});
