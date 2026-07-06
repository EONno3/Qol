import { describe, it, expect } from "vitest";
import { calculateDynamicMatch, calculateDynamicReport } from "./dynamicSystem";
import { createMockMercenary, createMockMission, createMockMatchCase } from "../test/factories";
import { gearDefs, implantDefs } from "../data/seed";

// ─── calculateDynamicMatch 테스트 ─────────────────────────────────────────────

describe("calculateDynamicMatch - 스탯 시그널 판정", () => {
  it("주요 스탯이 임계치+10 이상이면 '압도적' 어드밴티지 시그널을 반환한다", () => {
    // difficultyStars=2 → statThreshold = base + 2*perStar. base=40, perStar=5 → 50
    const mission = createMockMission({ difficultyStars: 2 });
    const merc = createMockMercenary({ stats: { frame: 65, cool: 50, wire: 50, cypher: 50, pulse: 50 } });

    const result = calculateDynamicMatch(mission, merc);

    expect(result.signals.some(s => s.textKo.includes("압도적인 주요 스탯"))).toBe(true);
    expect(result.deploymentVerdict).toBe("clear");
  });

  it("주요 스탯이 임계치보다 낮으면 불리 시그널을 반환하고 verdict가 warning 이상이 된다", () => {
    const mission = createMockMission({ difficultyStars: 2 });
    const merc = createMockMercenary({ stats: { frame: 20, cool: 20, wire: 20, cypher: 20, pulse: 20 } });

    const result = calculateDynamicMatch(mission, merc);

    expect(result.signals.some(s => s.signalType === "disadvantage")).toBe(true);
    expect(["warning", "locked"]).toContain(result.deploymentVerdict);
  });

  it("가시성이 한계를 초과하면 불리(-3) 시그널이 포함된다", () => {
    // visibility_limit: 40, merc visibilityLevel: "high"(=80) → 초과
    const mission = createMockMission({
      difficultyStars: 1,
      mechanics: { visibility_limit: 40, primary_stat: "frame", secondary_stat: "wire" },
    });
    const merc = createMockMercenary({
      stats: { frame: 80, cool: 80, wire: 80, cypher: 80, pulse: 80 },
      visibilityLevel: "high",
    });

    const result = calculateDynamicMatch(mission, merc);

    expect(result.signals.some(s => s.textKo === "가시성 한계 초과 위험")).toBe(true);
  });

  it("가시성 초과 + 스탯 부족의 복합 조건에서 locked 판정이 나온다", () => {
    // 주요 스탯 10 < threshold(35) → disadvantage +2
    // 보조 스탯 10 < threshold - 10 → disadvantage +1
    // 가시성 high(80) > limit(40) → disadvantage +3
    // 합계 score = 0 - (2+1+3) = -6 → locked
    const mission = createMockMission({
      difficultyStars: 1,
      mechanics: { visibility_limit: 40, primary_stat: "frame", secondary_stat: "wire" },
    });
    const merc = createMockMercenary({
      stats: { frame: 10, cool: 10, wire: 10, cypher: 10, pulse: 10 },
      visibilityLevel: "high",
    });

    const result = calculateDynamicMatch(mission, merc);

    expect(result.deploymentVerdict).toBe("locked");
    expect(result.signals.some(s => s.textKo === "가시성 한계 초과 위험")).toBe(true);
  });

  it("가시성이 한계보다 20 이하로 충분히 낮으면 '은밀한 기동 가능' 어드밴티지가 붙는다", () => {
    const mission = createMockMission({
      mechanics: { visibility_limit: 80, primary_stat: "frame", secondary_stat: "wire" },
    });
    const merc = createMockMercenary({ visibilityLevel: "very_low" }); // 20 → 80-20=60 이하

    const result = calculateDynamicMatch(mission, merc);

    expect(result.signals.some(s => s.textKo === "은밀한 기동 가능")).toBe(true);
  });

  it("mechanics 정보가 없는 미션은 '미확인' 시그널이 반환된다", () => {
    const mission = createMockMission({ mechanics: undefined });
    const merc = createMockMercenary();

    const result = calculateDynamicMatch(mission, merc);

    expect(result.signals.some(s => s.signalType === "unknown")).toBe(true);
  });

  it("T-S1-U3: missionTags 전기 + 절연 부츠 loadout → advantage 시그널", () => {
    const mission = createMockMission({
      missionTags: ["tag_threat_electric", "tag_context_generic"],
      mechanics: { visibility_limit: 80, primary_stat: "wire", secondary_stat: "frame" },
    });
    const merc = createMockMercenary({ mercId: "merc_breaker_01" });
    const loadout = {
      gearOwner: { gear_feet_insulated_boots_01: "merc_breaker_01" },
      implantOwner: {},
      gearDefs,
      implantDefs,
    };

    const result = calculateDynamicMatch(mission, merc, loadout);

    expect(
      result.signals.some((s) => s.signalType === "advantage" && s.textKo.includes("전기"))
    ).toBe(true);
  });
});

// ─── calculateDynamicReport 테스트 ───────────────────────────────────────────

describe("calculateDynamicReport - 결과 타입별 보상 계산", () => {
  it("성공(success) 시 전액 보상이 반환된다", () => {
    const mission = createMockMission({ rewardCredits: 15000 });
    const merc = createMockMercenary();
    const match = createMockMatchCase({ expectedResultType: "success" });

    const report = calculateDynamicReport(mission, merc, match);

    expect(report.resultType).toBe("success");
    expect(report.rewardCredits).toBe(15000);
    expect(report.lostCredits).toBe(0);
  });

  it("부분 성공(partial_success) 시 보상 70%가 반환된다", () => {
    const mission = createMockMission({ rewardCredits: 10000 });
    const merc = createMockMercenary();
    const match = createMockMatchCase({ expectedResultType: "partial_success" });

    const report = calculateDynamicReport(mission, merc, match);

    expect(report.resultType).toBe("partial_success");
    expect(report.rewardCredits).toBe(7000);
  });

  it("실패(failure) 시 보상이 없고 손실이 발생한다", () => {
    const mission = createMockMission({ rewardCredits: 10000 });
    const merc = createMockMercenary();
    const match = createMockMatchCase({ expectedResultType: "failure" });

    const report = calculateDynamicReport(mission, merc, match);

    expect(report.resultType).toBe("failure");
    expect(report.rewardCredits).toBe(0);
    expect(report.lostCredits).toBeGreaterThan(0);
  });

  it("노드 로그가 nodeCount만큼 생성된다", () => {
    const mission = createMockMission({ nodeCount: 4 });
    const merc = createMockMercenary();
    const match = createMockMatchCase({ expectedResultType: "success" });

    const report = calculateDynamicReport(mission, merc, match);

    expect(report.nodeLogKo).toHaveLength(4);
  });
});
