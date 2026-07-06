import { describe, expect, it } from "vitest";
import {
  getSurvivalProbability,
  calculateSurvivalRoll,
  getSurvivalBreakdown,
} from "./survival";
import type { Mercenary, Tier } from "../data/types";

describe("Survival Tag Synergies and Probability Calculations", () => {
  const baseMerc: Mercenary = {
    mercId: "test_merc",
    displayNameKo: "테스트용병",
    aliasKo: "테스터",
    originKo: "하층",
    contractTermsKo: "없음",
    stats: { frame: 50, cool: 50, wire: 50, cypher: 50, pulse: 50 },
    maxHp: 100,
    visibilityLevel: "low",
    commandCost: 3,
    phase0ProfileKo: "프로필",
    phase1SummaryKo: "요약",
    phase2SummaryKo: "상세",
    systemTags: []
  };

  it("하층 작전 구역에서 기본 생존율과 스탯 보정치(frame/pulse 중 max의 10%)가 정상 작동한다", () => {
    // baseMerc의 frame=50, pulse=50 이므로 스탯 보정치는 +5
    // 하층 기본 생존율 60% + 스탯 보정 5 = 65% (태그 보정 없을 시)
    const prob = getSurvivalProbability("lower", baseMerc);
    expect(prob).toBe(65);
  });

  it("하층 작전 구역에서 적합 자질 태그(슬럼_출신 등) 보유 시 생존율 보너스(+15%)가 적용된다", () => {
    const mercWithBonus: Mercenary = {
      ...baseMerc,
      systemTags: ["슬럼_출신"]
    };
    // 65% + 15% = 80%
    const prob = getSurvivalProbability("lower", mercWithBonus);
    expect(prob).toBe(80);
  });

  it("하층 작전 구역에서 부적합 자질 태그(노출형_크롬 등) 보유 시 생존율 패널티(-20%)가 적용된다", () => {
    const mercWithPenalty: Mercenary = {
      ...baseMerc,
      systemTags: ["노출형_크롬"]
    };
    // 65% - 20% = 45%
    const prob = getSurvivalProbability("lower", mercWithPenalty);
    expect(prob).toBe(45);
  });

  it("생존율 판정 결과 롤(calculateSurvivalRoll) 실행 시 로그에 자질 보정이 표시되어야 한다", () => {
    const mercWithBonus: Mercenary = {
      ...baseMerc,
      systemTags: ["슬럼_출신"]
    };
    const result = calculateSurvivalRoll("lower", mercWithBonus);
    expect(result.survivalLogKo).toContain("[자질 보정] 용병 자질 태그 시너지 작동 (보정치: +15%)");
  });
});

describe("survival tier tag penalties (T-B-4)", () => {
  const statMerc: Mercenary = {
    mercId: "merc_stat",
    displayNameKo: "스탯용",
    aliasKo: "s",
    originKo: "하층",
    contractTermsKo: "없음",
    stats: { frame: 50, cool: 50, wire: 50, cypher: 50, pulse: 50 },
    maxHp: 100,
    visibilityLevel: "low",
    commandCost: 3,
    phase0ProfileKo: "p",
    phase1SummaryKo: "p",
    phase2SummaryKo: "p",
    systemTags: [],
  };

  it("T-B-4-1: 중층 부정 태그 페널티는 명세 -25% (현재 전역 -20%면 실패)", () => {
    const merc: Mercenary = {
      ...statMerc,
      systemTags: ["노출형_크롬"],
    };
    // 중층 기본 40% + 스탯 5 = 45, -25% → 20%
    const prob = getSurvivalProbability("mid", merc);
    expect(prob).toBe(20);
  });

  it("T-B-4-2: 상층 부정 태그 페널티는 명세 -30% (현재 전역 -20%면 실패)", () => {
    const merc: Mercenary = {
      ...statMerc,
      systemTags: ["tag_origin_illegal_arena"],
    };
    // 상층 기본 20% + 스탯 5 = 25, -30% → 0% (하한)
    const prob = getSurvivalProbability("upper", merc);
    expect(prob).toBe(0);
  });

  it("T-B-4-3: 상층 긍정 태그 보너스는 명세 +20% (현재 +15%면 실패)", () => {
    const merc: Mercenary = {
      ...statMerc,
      systemTags: ["tag_origin_upper_etiquette"],
    };
    // 상층 기본 20% + 스탯 5 = 25, +20% → 45%
    const prob = getSurvivalProbability("upper", merc);
    expect(prob).toBe(45);
  });

  it("T-B-4-4: 상층에서 슬럼 출신 약점 태그 -30% 미등록 시 페널티 미적용(실패)", () => {
    const merc: Mercenary = {
      ...statMerc,
      systemTags: ["tag_origin_slum_native"],
    };
    // 명세: 상층 -30% 약점. 기본 25% - 30% = 0%
    const prob = getSurvivalProbability("upper", merc);
    expect(prob).toBe(0);
  });

  it("T-B-4-5: 중층 긍정 태그(유흥가 출신) +15% 명세 유지", () => {
    const merc: Mercenary = {
      ...statMerc,
      systemTags: ["tag_origin_nightlife_worker"],
    };
    // 중층 45% + 15% = 60%
    const prob = getSurvivalProbability("mid", merc);
    expect(prob).toBe(60);
  });
});

// getSurvivalBreakdown은 순수 분해 selector이며, 합산 결과는
// 기존 getSurvivalProbability와 반드시 동일해야 한다(Tidy First: 동작 불변).
describe("getSurvivalBreakdown (T-B4-UI 구조 회귀 가드)", () => {
  const statMerc: Mercenary = {
    mercId: "merc_bd",
    displayNameKo: "분해용",
    aliasKo: "bd",
    originKo: "하층",
    contractTermsKo: "없음",
    stats: { frame: 50, cool: 50, wire: 50, cypher: 50, pulse: 50 },
    maxHp: 100,
    visibilityLevel: "low",
    commandCost: 3,
    phase0ProfileKo: "p",
    phase1SummaryKo: "p",
    phase2SummaryKo: "p",
    systemTags: [],
  };

  const tiers: Tier[] = ["lower", "mid", "upper"];

  it("모든 구역에서 분해 합산치가 getSurvivalProbability와 일치한다", () => {
    for (const tier of tiers) {
      for (const tags of [[], ["tag_origin_slum_native"], ["tag_origin_upper_etiquette"]]) {
        const merc: Mercenary = { ...statMerc, systemTags: tags };
        const bd = getSurvivalBreakdown(tier, merc);
        expect(bd.finalProbability).toBe(getSurvivalProbability(tier, merc));
        const rawSum = bd.baseProbability + bd.statBonus + bd.tagBonusTotal;
        expect(bd.finalProbability).toBe(Math.min(100, Math.max(0, rawSum)));
      }
    }
  });

  it("상층 슬럼 출신 용병은 태그 보정 내역에 -30% 약점이 라벨과 함께 노출된다", () => {
    const merc: Mercenary = {
      ...statMerc,
      systemTags: ["tag_origin_slum_native"],
    };
    const bd = getSurvivalBreakdown("upper", merc);
    expect(bd.baseProbability).toBe(20);
    const slum = bd.tagContributions.find((c) => c.value === -30);
    expect(slum).toBeDefined();
    expect(slum!.reading).toBe("negative");
    expect(slum!.labelKo.length).toBeGreaterThan(0);
    // 20 기본 + 5 스탯 - 30 태그 = -5 → 하한 0
    expect(bd.finalProbability).toBe(0);
  });

  it("태그 보정이 없는 용병은 tagContributions가 비어 있다(허위 페널티 없음)", () => {
    const bd = getSurvivalBreakdown("upper", statMerc);
    expect(bd.tagContributions).toEqual([]);
    expect(bd.tagBonusTotal).toBe(0);
  });
});
