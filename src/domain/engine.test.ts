import { describe, expect, it } from "vitest";
import { simulateMission, calculateGearDestructionProb, computeNodePassChance } from "./engine";
import type { Mercenary, Mission, MissionNode } from "../data/types";
import { STATUS_GEAR_DESTROYED_JOKER } from "../data/constants";
import { gearDefs, implantDefs } from "../data/seed";
import { createInitialState } from "./state";
import { sumMercLoadoutStatBonus } from "./gearStatBonus";

/**
 * 노드 역할 기반 판정 엔진 테스트.
 *
 * 설계 핵심(기획 확정):
 *  - 난이도가 '기본 성공 후함'을 결정한다(쉬울수록 후함).
 *  - 노드는 역할(진입/장애/목표/이탈)이 있고, 성공/실패의 '의미'가 역할마다 다르다.
 *  - 목표+이탈을 성공하면 중간 장애를 말아먹어도 실패가 아니다.
 *  - 막바지 이탈을 치명적으로 실패하면 부분성공이 아니라 '미귀환(실패)'이다.
 *
 * 결정성: simulateMission(mission, merc, rng) 에 rng를 주입해 굴림을 통제한다.
 */

// 0..1 값을 순서대로 반환하는 결정적 rng (마지막 값으로 고정)
function seq(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

const baseMission: Mission = {
  missionId: "test_mission",
  displayNameKo: "테스트 미션",
  tier: "lower",
  missionType: "지원",
  difficultyStars: 3,
  nodeCount: 3,
  rewardCredits: 10000,
  earlyWithdrawalPenalty: 3000,
  phase0BriefingKo: "브리핑",
  phase1SummaryKo: "요약",
  phase2SummaryKo: "상세",
  successSummaryKo: "성공",
  failureSummaryKo: "실패",
  mechanics: { visibility_limit: 100, primary_stat: "frame", secondary_stat: "wire" },
};

function withNodes(nodes: MissionNode[], over: Partial<Mission> = {}): Mission {
  return { ...baseMission, nodes, nodeCount: nodes.length, ...over };
}

const baseMerc: Mercenary = {
  mercId: "merc_test",
  displayNameKo: "테스트용병",
  aliasKo: "테스터",
  originKo: "하층",
  contractTermsKo: "계약",
  stats: { frame: 40, cool: 40, wire: 40, cypher: 40, pulse: 40 },
  maxHp: 100,
  visibilityLevel: "low",
  commandCost: 3,
  phase0ProfileKo: "프로필",
  phase1SummaryKo: "요약",
  phase2SummaryKo: "태그 없음",
  systemTags: [],
};

const N = (role: MissionNode["role"], nameKo: string): MissionNode => ({
  role,
  nameKo,
  statCheck: "frame",
});

describe("노드 역할 기반 판정 엔진", () => {
  it("난이도 1은 후해서 평범한 용병도 대체로 성공한다", () => {
    const mission = withNodes(
      [N("entry", "진입"), N("objective", "목표 수행"), N("exit", "이탈")],
      { difficultyStars: 1 }
    );
    // 중간값 굴림(roll 41)로도 1성 기본치(90)면 전부 통과
    const result = simulateMission(mission, baseMerc, () => 0.4);
    expect(result.report.resultType).toBe("success");
  });

  it("목표와 이탈을 성공하면 중간 장애를 다수 실패해도 실패가 아니다", () => {
    const mission = withNodes([
      N("entry", "진입"),
      N("obstacle", "장애1"),
      N("obstacle", "장애2"),
      N("obstacle", "장애3"),
      N("obstacle", "장애4"),
      N("objective", "핵심 목표"),
      N("exit", "이탈"),
    ]);
    // 3성 frame40: passChance = 66 + (40-45) = 61
    // entry 통과 / 장애4개 경미실패(roll 70) / 목표 통과 / 이탈 통과
    const rng = seq([0.1, 0.69, 0.69, 0.69, 0.69, 0.1, 0.1]);
    const result = simulateMission(mission, baseMerc, rng);
    expect(result.report.resultType).not.toBe("failure");
    expect(result.report.resultType).toBe("partial_success");
  });

  it("막바지 이탈을 치명적으로 실패하면 부분성공이 아니라 실패(미귀환)다", () => {
    const mission = withNodes(
      [N("entry", "진입"), N("objective", "핵심 목표"), N("exit", "이탈")],
      { difficultyStars: 3 }
    );
    // frame45 -> passChance = 66. 이탈에서 roll 96 -> overshoot 30 >= 25 -> 치명
    const merc = { ...baseMerc, stats: { ...baseMerc.stats, frame: 45 } };
    const rng = seq([0.1, 0.1, 0.95]);
    const result = simulateMission(mission, merc, rng);
    expect(result.report.resultType).toBe("failure");
  });

  it("목표를 놓치고 빈손 생환하면 실패다", () => {
    const mission = withNodes(
      [N("entry", "진입"), N("objective", "핵심 목표"), N("exit", "이탈")],
      { difficultyStars: 2 }
    );
    // 2성 frame40: passChance = 78 + (40-40) = 78
    // entry 통과 / 목표 경미실패(roll 90, overshoot 12) / 이탈 통과
    const rng = seq([0.1, 0.89, 0.1]);
    const result = simulateMission(mission, baseMerc, rng);
    expect(result.report.resultType).toBe("failure");
    expect(result.report.fulfilledConditionsKo).toContain("미달");
  });

  it("적합한 조커 태그 보유 용병은 빈손 실패를 부분 성공으로 구제받는다", () => {
    const mission = withNodes(
      [N("entry", "진입"), N("objective", "핵심 목표"), N("exit", "이탈")],
      { difficultyStars: 2, missionType: "지원" }
    );
    const jokerMerc: Mercenary = {
      ...baseMerc,
      mercId: "merc_joker",
      systemTags: ["고압망_작업"], // 지원/교섭/추적 조커 트리거
    };
    const rng = seq([0.1, 0.89, 0.1]); // 목표 경미실패 → 빈손 생환 실패 경로
    const result = simulateMission(mission, jokerMerc, rng);
    expect(result.report.resultType).toBe("partial_success");
    expect(
      result.report.statusChanges.some((sc) => sc.statusId === STATUS_GEAR_DESTROYED_JOKER)
    ).toBe(true);
  });

  it("조커 태그가 없으면 구제받지 못하고 실패한다", () => {
    const mission = withNodes(
      [N("entry", "진입"), N("objective", "핵심 목표"), N("exit", "이탈")],
      { difficultyStars: 2, missionType: "지원" }
    );
    const rng = seq([0.1, 0.89, 0.1]);
    const result = simulateMission(mission, baseMerc, rng);
    expect(result.report.resultType).toBe("failure");
    expect(
      result.report.statusChanges.some((sc) => sc.statusId === STATUS_GEAR_DESTROYED_JOKER)
    ).toBe(false);
  });

  it("노드 정의가 없는 미션도 nodeCount로 역할을 파생해 동작한다", () => {
    const result = simulateMission({ ...baseMission, difficultyStars: 1 }, baseMerc, () => 0.4);
    expect(["success", "partial_success"]).toContain(result.report.resultType);
    expect(result.report.nodeLogKo && result.report.nodeLogKo.length).toBeGreaterThan(0);
  });

  it("T-S1-U2: loadout 반영 시 파손 확률이 맨몸과 달라진다", () => {
    const mission = {
      ...baseMission,
      difficultyStars: 2,
      mechanics: { visibility_limit: 80, primary_stat: "wire" as const, secondary_stat: "frame" as const },
    };
    const merc = {
      ...baseMerc,
      mercId: "merc_breaker_01",
      stats: { frame: 30, cool: 30, wire: 30, cypher: 30, pulse: 30 },
    };
    const state = createInitialState();
    const loadout = {
      gearOwner: { gear_feet_insulated_boots_01: "merc_breaker_01" },
      implantOwner: state.implantOwner,
      gearDefs,
      implantDefs,
    };
    const bare = calculateGearDestructionProb(mission, merc);
    const equipped = calculateGearDestructionProb(mission, merc, loadout);
    expect(equipped).not.toBe(bare);
    expect(equipped).toBeLessThan(bare);
  });

  it("calculateGearDestructionProb는 조커 보유 시 더 높은 기대 파괴율을 반환한다", () => {
    const mission = { ...baseMission, difficultyStars: 2, missionType: "지원" };
    const weak = { ...baseMerc, stats: { frame: 10, cool: 10, wire: 10, cypher: 10, pulse: 10 } };
    const probWithJoker = calculateGearDestructionProb(mission, {
      ...weak,
      systemTags: ["고압망_작업"],
    });
    const probWithoutJoker = calculateGearDestructionProb(mission, { ...weak, systemTags: [] });
    expect(probWithJoker).toBeGreaterThan(probWithoutJoker);
  });

  it("장비 보정이 노드 통과 확률을 상승시킨다 (B-1)", () => {
    const stars = 3;
    const baseWire = 40;
    const state = createInitialState();
    const loadout = {
      gearOwner: state.gearOwner,
      implantOwner: state.implantOwner,
      gearDefs,
      implantDefs,
    };
    const gearBonus = sumMercLoadoutStatBonus("merc_breaker_01", "wire", loadout);
    expect(gearBonus).toBeGreaterThan(0);
    expect(computeNodePassChance(stars, baseWire + gearBonus)).toBeGreaterThan(
      computeNodePassChance(stars, baseWire)
    );
  });

  it("장비 보정으로 경계선 굴림이 실패에서 성공으로 바뀐다 (B-1)", () => {
    const mission = withNodes(
      [
        { role: "objective", nameKo: "전력 관문", statCheck: "wire" },
        N("exit", "이탈"),
      ],
      { difficultyStars: 3 }
    );
    const merc: Mercenary = {
      ...baseMerc,
      mercId: "merc_test",
      stats: { ...baseMerc.stats, wire: 40 },
      systemTags: [],
    };
    const loadout = {
      gearOwner: { gear_feet_insulated_boots_01: "merc_test" },
      implantOwner: {},
      gearDefs,
      implantDefs,
    };
    // 3성 wire40: passChance=61. roll=floor(0.61*100)+1=62 → 경미 실패
    const rng = seq([0.61, 0.1]);
    const withoutGear = simulateMission(mission, merc, rng);
    expect(withoutGear.report.resultType).toBe("failure");

    const withGear = simulateMission(mission, merc, seq([0.61, 0.1]), loadout);
    expect(withGear.report.resultType).toBe("success");
  });
});

describe("진입 게이트 (T-B-2)", () => {
  it("T-B-2-E1: block 모드 + 필수 스탯 미달 시 시뮬레이션이 진입 게이트에서 실패한다", () => {
    const mission = withNodes(
      [N("entry", "진입"), N("objective", "목표"), N("exit", "이탈")],
      {
        difficultyStars: 2,
        entryGate: {
          requirements: [{ kind: "stat", statKey: "cypher", minValue: 70 }],
          failureMode: "block",
        },
      }
    );
    const merc = { ...baseMerc, stats: { ...baseMerc.stats, cypher: 20 } };

    const result = simulateMission(mission, merc, () => 0.1);

    expect(result.report.resultType).toBe("failure");
    expect(result.report.nodeLogKo!.some((l) => l.includes("진입 게이트"))).toBe(true);
    expect(result.report.nodeResolutions?.length ?? 0).toBe(0);
  });

  it("T-B-2-E2: force_risk 모드 + 필수 태그 미보유 시 첫 노드가 위험 노드로 해석된다", () => {
    const mission = withNodes(
      [N("entry", "작전 구역 진입"), N("objective", "목표"), N("exit", "이탈")],
      {
        difficultyStars: 2,
        entryGate: {
          requirements: [{ kind: "tag", tagId: "tag_origin_upper_etiquette" }],
          failureMode: "force_risk",
          forcedRiskNodeNameKo: "적발 요격 전투",
        },
      }
    );
    const merc = { ...baseMerc, systemTags: [] };

    const result = simulateMission(mission, merc, () => 0.1);

    const first = result.report.nodeResolutions?.[0];
    expect(first?.nameKo).toBe("적발 요격 전투");
    expect(result.report.nodeLogKo!.some((l) => l.includes("적발") || l.includes("위험"))).toBe(
      true
    );
  });
});

describe("가시성 패널티 (T-B-3)", () => {
  const stealthMissionBase = (
    over: Partial<Mission> = {}
  ): Mission =>
    withNodes(
      [N("entry", "작전 구역 진입"), N("objective", "목표"), N("exit", "이탈")],
      {
        missionType: "잠입",
        difficultyStars: 2,
        mechanics: { visibility_limit: 40, primary_stat: "cypher", secondary_stat: "wire" },
        ...over,
      }
    );

  it("T-B-3-E1: 잠입 + very_high 가시성 → 경비대 적발 위험 노드가 큐에 주입된다", () => {
    const mission = stealthMissionBase();
    const merc = { ...baseMerc, visibilityLevel: "very_high" as const };

    const result = simulateMission(mission, merc, () => 0.1);

    const riskNode = result.report.nodeResolutions?.find(
      (n) => n.nameKo.includes("경비대") || n.nameKo.includes("적발") || n.nameKo.includes("검문")
    );
    expect(riskNode).toBeDefined();
    expect(result.report.nodeLogKo!.some((l) => /가시성|적발|노출|검문/.test(l))).toBe(true);
  });

  it("T-B-3-E2: 잠입 + very_low 가시성 → 가시성 위험 노드 없음", () => {
    const mission = stealthMissionBase();
    const merc = { ...baseMerc, visibilityLevel: "very_low" as const };

    const result = simulateMission(mission, merc, () => 0.1);

    expect(
      result.report.nodeResolutions?.some((n) =>
        /경비대|적발|검문/.test(n.nameKo)
      )
    ).toBe(false);
    expect(result.report.nodeLogKo!.some((l) => /가시성.*초과|노출 감지/.test(l))).toBe(false);
  });

  it("T-B-3-E3: 지원 미션 + very_high 가시성 → 가시성 패널티 미발동", () => {
    const mission = stealthMissionBase({ missionType: "지원" });
    const merc = { ...baseMerc, visibilityLevel: "very_high" as const };

    const result = simulateMission(mission, merc, () => 0.1);

    expect(
      result.report.nodeResolutions?.some((n) =>
        /경비대|적발|검문/.test(n.nameKo)
      )
    ).toBe(false);
  });

  it("T-B-3-E4: 잠입 + 산탄 암 임플란트 loadout → 가시성 초과로 위험 노드 발생", () => {
    const mission = stealthMissionBase({
      mechanics: { visibility_limit: 60, primary_stat: "cypher", secondary_stat: "wire" },
    });
    const merc: Mercenary = {
      ...baseMerc,
      mercId: "merc_chromeshow_01",
      visibilityLevel: "medium",
      stats: { frame: 50, cool: 40, wire: 30, cypher: 35, pulse: 45 },
    };
    const loadout = {
      gearOwner: {},
      implantOwner: { implant_arm_shotgun_01: "merc_chromeshow_01" },
      gearDefs,
      implantDefs,
    };

    const result = simulateMission(mission, merc, () => 0.1, loadout);

    expect(
      result.report.nodeResolutions?.some((n) =>
        /경비대|적발|검문|불심/.test(n.nameKo)
      )
    ).toBe(true);
  });
});
