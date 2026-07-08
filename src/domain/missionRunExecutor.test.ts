import { describe, expect, it } from "vitest";
import { createMockMercenary, createMockMission } from "../test/factories";
import { gearDefs, implantDefs } from "../data/seed";
import {
  TEST_CHALLENGE_GEAR_DETECTION,
  createTestAdverseNode,
  createTestNeutralNode,
} from "../test/nodeJudgmentFixtures";
import { executeMissionRun, missionNodeToQueued } from "./missionRunExecutor";
import { NodeQueue, resetNodeInstanceCounter } from "./nodeQueue";
import { staticMissions, qaMissions } from "../data/seed";

function seq(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe("missionRunExecutor (T-S0-5,6,8)", () => {
  it("goto_phase survival 시 남은 노드를 스킵하고 생존 판정으로 간다", () => {
    resetNodeInstanceCounter();
    const mission = createMockMission({
      difficultyStars: 3,
      nodes: [
        { nameKo: "진입", role: "entry", statCheck: "frame" },
        { nameKo: "목표", role: "objective", statCheck: "frame" },
        { nameKo: "이탈", role: "exit", statCheck: "frame" },
      ],
    });
    const merc = createMockMercenary();

    const queue = new NodeQueue([
      missionNodeToQueued(mission.nodes![0], 0),
      missionNodeToQueued(mission.nodes![1], 1),
      missionNodeToQueued(mission.nodes![2], 2),
    ]);

    const result = executeMissionRun({
      mission,
      merc,
      rng: () => 0.1,
      initialQueue: queue,
      postNodeRouting: (node) => {
        if (node.role === "entry") return { action: "goto_phase", phase: "survival" };
      },
    });

    expect(result.report.nodeResolutions?.length).toBe(1);
    expect(result.report.resultType).toBe("failure");
  });

  it("adverse 실패 시 negative gear triggered → seizedGearIds에 반영", () => {
    resetNodeInstanceCounter();
    const gearId = "gear_weapon_fold_pistol_01";
    const mission = createMockMission({ difficultyStars: 2, missionType: "잠입", tier: "mid" });
    const merc = createMockMercenary({
      mercId: "merc_malt_01",
      stats: { frame: 10, cool: 10, wire: 10, cypher: 10, pulse: 10 },
    });

    const queue = new NodeQueue([
      createTestAdverseNode([TEST_CHALLENGE_GEAR_DETECTION], {
        nodeInstanceId: "adverse_entry",
        role: "entry",
        statCheck: "cypher",
      }),
      createTestNeutralNode({ nodeInstanceId: "exit", role: "exit", statCheck: "cypher" }),
    ]);

    const result = executeMissionRun({
      mission,
      merc,
      rng: seq([0.99, 0.05]),
      initialQueue: queue,
      loadout: {
        gearOwner: { [gearId]: merc.mercId },
        implantOwner: {},
        gearDefs,
        implantDefs,
      },
    });

    const first = result.report.nodeResolutions?.[0];
    expect(first?.triggeredTags.some((t) => t.sourceType === "gear" && t.reading === "negative")).toBe(
      true
    );
    if (first?.outcome !== "pass") {
      expect(result.report.runContextSnapshot?.seizedGearIds).toContain(gearId);
    }
  });

  it("ResultReport.triggeredTags에 sourceType gear/mercenary가 구분된다", () => {
    resetNodeInstanceCounter();
    const mission = createMockMission({
      difficultyStars: 1,
      nodes: [
        {
          nameKo: "전기 관문",
          role: "objective",
          statCheck: "wire",
          challengeTags: ["tag_threat_electric"],
          defaultPolarity: "adverse",
        },
        { nameKo: "이탈", role: "exit", statCheck: "wire" },
      ],
    });
    const merc = createMockMercenary({
      mercId: "merc_breaker_01",
      systemTags: ["tag_origin_slum_native"],
      stats: { frame: 54, cool: 38, wire: 48, cypher: 31, pulse: 42 },
    });

    const result = executeMissionRun({
      mission,
      merc,
      rng: () => 0.05,
      loadout: {
        gearOwner: { gear_feet_insulated_boots_01: "merc_breaker_01" },
        implantOwner: {},
        gearDefs,
        implantDefs,
      },
    });

    const tags = result.report.triggeredTags ?? [];
    for (const t of tags) {
      expect(["gear", "mercenary", "implant", "status"]).toContain(t.sourceType);
    }
    expect(result.report.nodeResolutions?.length).toBe(2);
    expect(result.report.nodeLogKo!.length).toBeGreaterThanOrEqual(2);
  });
});

describe("missionRunExecutor Step 1 integration (T-S1-6, T-S1-7)", () => {
  it("T-S1-6: fuse 미션 + breaker + 절연 부츠 → electric 노드 gear positive triggered", () => {
    resetNodeInstanceCounter();
    const mission = staticMissions.find((m) => m.missionId === "mission_lower_fuse_capacitor_01")!;
    const merc = createMockMercenary({
      mercId: "merc_breaker_01",
      stats: { frame: 54, cool: 38, wire: 48, cypher: 31, pulse: 42 },
    });

    const result = executeMissionRun({
      mission,
      merc,
      rng: () => 0.05,
      loadout: {
        gearOwner: { gear_feet_insulated_boots_01: "merc_breaker_01" },
        implantOwner: {},
        gearDefs,
        implantDefs,
      },
    });

    const electricNode = result.report.nodeResolutions?.find((r) =>
      r.challengeTags.includes("tag_threat_electric")
    );
    expect(electricNode).toBeDefined();
    expect(
      electricNode!.triggeredTags.some(
        (t) => t.sourceType === "gear" && t.reading === "positive"
      )
    ).toBe(true);
  });

  it("T-S1-7: challenge 없는 미션 → 모든 노드 triggeredTags 빈 배열", () => {
    resetNodeInstanceCounter();
    const mission = createMockMission({
      missionTags: ["tag_context_generic"],
      nodeCount: 3,
    });
    const merc = createMockMercenary();

    const result = executeMissionRun({
      mission,
      merc,
      rng: () => 0.5,
    });

    expect((result.report.nodeResolutions?.length ?? 0)).toBeGreaterThan(0);
    for (const res of result.report.nodeResolutions ?? []) {
      expect(res.triggeredTags).toEqual([]);
    }
  });
});

// D-B 판정 파이프라인 E2E: 3개 QA 미션(block/force_risk/stealth overshoot)이
// 실제 실행 큐에 올라갔을 때 위험 노드 주입·구조 로그(logKo)가 명세대로 나오는지 결정론적 검증.
describe("missionRunExecutor D-B pipeline E2E (T-DB-E2E)", () => {
  const blockMission = qaMissions.find(
    (m) => m.missionId === "mission_qa_entrygate_block_01"
  )!;
  const forceRiskMission = qaMissions.find(
    (m) => m.missionId === "mission_qa_entrygate_forcerisk_01"
  )!;
  const visibilityMission = qaMissions.find(
    (m) => m.missionId === "mission_qa_visibility_stealth_01"
  )!;

  it("T-DB-E2E-1: block 게이트 미달 → 진입 차단 로그, 노드 미실행, 실패 처리", () => {
    resetNodeInstanceCounter();
    // 기본 mock 용병: wire 50 < 요구치 99 → 진입 조건 미달
    const merc = createMockMercenary();

    const result = executeMissionRun({
      mission: blockMission,
      merc,
      rng: () => 0.5,
    });

    const logs = result.report.nodeLogKo ?? [];
    expect(logs.some((l) => l.includes("[진입 게이트 차단]"))).toBe(true);
    // 진입 차단 시 어떤 노드도 실행되지 않는다.
    expect(result.report.nodeResolutions?.length ?? 0).toBe(0);
    expect(result.report.resultType).toBe("failure");
    expect(result.report.missingConditionsKo).toContain("필수 진입 조건");
    // 진입도 못 했으므로 용병은 생존한다.
    expect(result.mercSurvived).toBe(true);
  });

  it("T-DB-E2E-2: force_risk 게이트 미달 → 차단 없이 「돌발 순찰조 조우」 위험 노드 강제 주입", () => {
    resetNodeInstanceCounter();
    const merc = createMockMercenary();

    const result = executeMissionRun({
      mission: forceRiskMission,
      merc,
      rng: () => 0.5,
    });

    const logs = result.report.nodeLogKo ?? [];
    // 진입 게이트 강제 진입 로그 + 강제 위험 노드명 노출
    expect(logs.some((l) => l.includes("[진입 게이트]"))).toBe(true);
    expect(logs.some((l) => l.includes("돌발 순찰조 조우"))).toBe(true);
    // 차단이 아니므로 노드가 실제 실행되고, 주입된 강제 위험 노드가 실행 내역에 포함된다.
    const injected = result.report.nodeResolutions?.find(
      (r) => r.nameKo === "돌발 순찰조 조우"
    );
    expect(injected).toBeDefined();
  });

  it("T-DB-E2E-3: stealth 가시성 초과 → 「불심 검문」 가시성 위험 노드 주입 + emergencyCount 증가", () => {
    resetNodeInstanceCounter();
    // 기본 mock 용병: visibilityLevel "low"(=40), 미션 한계 20 → overshoot 20 → "불심 검문"
    const merc = createMockMercenary();

    const result = executeMissionRun({
      mission: visibilityMission,
      merc,
      rng: () => 0.5,
    });

    const logs = result.report.nodeLogKo ?? [];
    expect(logs.some((l) => l.includes("[가시성 경고]"))).toBe(true);
    const injected = result.report.nodeResolutions?.find(
      (r) => r.nameKo === "불심 검문"
    );
    expect(injected).toBeDefined();
    expect(result.report.runContextSnapshot?.emergencyCount ?? 0).toBeGreaterThanOrEqual(1);
  });
});

describe("executeMissionRun 캐치업 현장 개입 (T-DC-ENGINE)", () => {
  function makeMission() {
    return createMockMission({
      difficultyStars: 2,
      nodes: [
        { nameKo: "진입", role: "entry", statCheck: "frame" },
        { nameKo: "목표", role: "objective", statCheck: "frame" },
        { nameKo: "이탈", role: "exit", statCheck: "frame" },
      ],
    });
  }

  it("T-DC-ENGINE-1: catchUp 미전달/빈 목록이면 판정이 완전히 동일하다 (옵트인, 회귀 방지)", () => {
    resetNodeInstanceCounter();
    const base = executeMissionRun({ mission: makeMission(), merc: createMockMercenary(), rng: () => 0.5 });
    resetNodeInstanceCounter();
    const empty = executeMissionRun({
      mission: makeMission(),
      merc: createMockMercenary(),
      rng: () => 0.5,
      catchUp: { interventionNodeNamesKo: [] },
    });
    const basePass = (base.report.nodeResolutions ?? []).map((r) => r.passChance);
    const emptyPass = (empty.report.nodeResolutions ?? []).map((r) => r.passChance);
    expect(emptyPass).toEqual(basePass);
  });

  it("T-DC-ENGINE-2: 개입 노드는 통과 확률이 정확히 15%p 낮아진다", () => {
    resetNodeInstanceCounter();
    const plain = executeMissionRun({ mission: makeMission(), merc: createMockMercenary(), rng: () => 0.5 });
    resetNodeInstanceCounter();
    const intervened = executeMissionRun({
      mission: makeMission(),
      merc: createMockMercenary(),
      rng: () => 0.5,
      catchUp: { interventionNodeNamesKo: ["목표"] },
    });
    const plainObj = (plain.report.nodeResolutions ?? []).find((r) => r.nameKo === "목표")!;
    const intObj = (intervened.report.nodeResolutions ?? []).find((r) => r.nameKo === "목표")!;
    expect(intObj.passChance).toBe(Math.max(5, plainObj.passChance - 15));
    // 개입하지 않은 노드는 영향 없음
    const plainEntry = (plain.report.nodeResolutions ?? []).find((r) => r.nameKo === "진입")!;
    const intEntry = (intervened.report.nodeResolutions ?? []).find((r) => r.nameKo === "진입")!;
    expect(intEntry.passChance).toBe(plainEntry.passChance);
  });

  it("T-DC-ENGINE-3: 개입 노드 통과 시 보상 플래그 true + [현장 개입] 로그", () => {
    resetNodeInstanceCounter();
    const result = executeMissionRun({
      mission: makeMission(),
      merc: createMockMercenary(),
      rng: () => 0.01, // 매우 낮은 굴림 → 통과
      catchUp: { interventionNodeNamesKo: ["목표"] },
    });
    expect(result.report.catchUpBonusEarned).toBe(true);
    expect((result.report.nodeLogKo ?? []).some((l) => l.includes("[현장 개입]"))).toBe(true);
  });

  it("T-DC-ENGINE-4: 개입 노드가 모두 실패하면 보상 플래그 false", () => {
    resetNodeInstanceCounter();
    const result = executeMissionRun({
      mission: makeMission(),
      merc: createMockMercenary({ stats: { frame: 1, cool: 1, wire: 1, cypher: 1, pulse: 1 } }),
      rng: () => 0.99, // 매우 높은 굴림 → 실패
      catchUp: { interventionNodeNamesKo: ["목표"] },
    });
    expect(result.report.catchUpBonusEarned).toBe(false);
  });

  it("T-DC-ENGINE-5: 개입 노드의 nodeResolutions 항목은 intervened=true, 비개입 노드는 false", () => {
    resetNodeInstanceCounter();
    const result = executeMissionRun({
      mission: makeMission(),
      merc: createMockMercenary(),
      rng: () => 0.5,
      catchUp: { interventionNodeNamesKo: ["목표"] },
    });
    const res = result.report.nodeResolutions ?? [];
    const objective = res.find((r) => r.nameKo === "목표")!;
    const nonIntervened = res.find((r) => r.nameKo !== "목표")!;
    expect(objective.intervened).toBe(true);
    expect(nonIntervened.intervened).toBe(false);
  });

  it("T-DC-ENGINE-6: catchUp 활성 시 report.catchUpActive=true", () => {
    resetNodeInstanceCounter();
    const result = executeMissionRun({
      mission: makeMission(),
      merc: createMockMercenary(),
      rng: () => 0.5,
      catchUp: { interventionNodeNamesKo: ["목표"] },
    });
    expect(result.report.catchUpActive).toBe(true);
  });

  it("T-DC-ENGINE-7: catchUp 미사용 시 report.catchUpActive는 undefined", () => {
    resetNodeInstanceCounter();
    const result = executeMissionRun({
      mission: makeMission(),
      merc: createMockMercenary(),
      rng: () => 0.5,
    });
    expect(result.report.catchUpActive).toBeUndefined();
  });
});
