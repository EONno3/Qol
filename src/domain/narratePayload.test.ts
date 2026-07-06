import { describe, expect, it } from "vitest";
import { buildNarratePayload } from "./narratePayload";
import { createMockMercenary, createMockMission, createMockResultReport } from "../test/factories";
import { gearDefs, implantDefs } from "../data/seed";
import type { TriggeredTag } from "../data/types";

const insulatedBootsPositive: TriggeredTag = {
  tagId: "tag_gear_insulated_work_habit",
  sourceType: "gear",
  sourceId: "gear_feet_insulated_boots_01",
  ruleId: "node_insulated_vs_electric",
  reading: "positive",
};

describe("buildNarratePayload — triggeredTags → /narrate 페이로드", () => {
  it("T-S4-1: ResultReport.triggeredTags가 sourceType/sourceId/ruleId/reading을 유지해 전달된다", () => {
    const report = createMockResultReport({
      mercId: "merc_breaker_01",
      triggeredTags: [insulatedBootsPositive],
      nodeLogKo: ["[1노드] 전기 관문 - 통과"],
    });
    const mission = createMockMission({ displayNameKo: "퓨즈 캐패시터 점검" });
    const merc = createMockMercenary({ mercId: "merc_breaker_01", aliasKo: "차단기" });

    const payload = buildNarratePayload(report, mission, merc, { gearDefs, implantDefs });

    expect(payload.triggeredTags).toHaveLength(1);
    expect(payload.triggeredTags[0]).toMatchObject({
      tagId: "tag_gear_insulated_work_habit",
      sourceType: "gear",
      sourceId: "gear_feet_insulated_boots_01",
      ruleId: "node_insulated_vs_electric",
      reading: "positive",
    });
    expect(payload.missionName).toBe("퓨즈 캐패시터 점검");
    expect(payload.mercName).toBe("차단기");
  });

  it("T-S4-2: gear 출처 sourceId는 gearDefs에서 sourceDisplayNameKo로 해석된다", () => {
    const report = createMockResultReport({
      triggeredTags: [insulatedBootsPositive],
    });

    const payload = buildNarratePayload(
      report,
      createMockMission(),
      createMockMercenary(),
      { gearDefs, implantDefs }
    );

    expect(payload.triggeredTags[0]?.sourceDisplayNameKo).toBe("러버세인트 절연 부츠");
  });

  it("T-S4-3: positive gear 태그는 출처 장비명이 담긴 contributionKo 서사 힌트를 포함한다", () => {
    const report = createMockResultReport({
      triggeredTags: [insulatedBootsPositive],
    });

    const payload = buildNarratePayload(
      report,
      createMockMission(),
      createMockMercenary(),
      { gearDefs, implantDefs }
    );

    const hint = payload.triggeredTags[0]?.contributionKo ?? "";
    expect(hint).toContain("러버세인트 절연 부츠");
    expect(hint).toMatch(/기여|도움|통과/);
  });
});

/** Phase 5 — nodeResolutions 풀 팩트 → /narrate (Gap C). Green 전 Red. */
describe("buildNarratePayload — nodeResolutions → /narrate 페이로드 (Phase 5)", () => {
  const electricObstacleResolution = {
    nodeInstanceId: "node_obstacle_1",
    nameKo: "변전실 통제선",
    role: "obstacle" as const,
    outcome: "pass" as const,
    logKo: "[관문 통과] 변전실 통제선",
    challengeTags: ["tag_threat_electric"],
    triggeredTags: [insulatedBootsPositive],
    passChance: 64,
    tagPassChanceDelta: 6,
  };

  const entryResolution = {
    nodeInstanceId: "node_entry_0",
    nameKo: "하층 진입로",
    role: "entry" as const,
    outcome: "pass" as const,
    logKo: "[진입 통과] 하층 진입로",
    challengeTags: [] as string[],
    triggeredTags: [] as TriggeredTag[],
    passChance: 78,
    tagPassChanceDelta: 0,
  };

  it("T-S5-1: report.nodeResolutions가 enrich된 nodeResolutions 배열로 전달된다", () => {
    const report = createMockResultReport({
      nodeResolutions: [entryResolution, electricObstacleResolution],
    });
    const payload = buildNarratePayload(
      report,
      createMockMission(),
      createMockMercenary(),
      { gearDefs, implantDefs }
    );

    expect(payload.nodeResolutions).toBeDefined();
    expect(payload.nodeResolutions).toHaveLength(2);
    expect(payload.nodeResolutions![0]?.nameKo).toBe("하층 진입로");
    expect(payload.nodeResolutions![1]?.nameKo).toBe("변전실 통제선");
  });

  it("T-S5-2: 노드별 role·roleLabelKo·outcome·passChance·tagPassChanceDelta가 포함된다", () => {
    const report = createMockResultReport({
      nodeResolutions: [electricObstacleResolution],
    });
    const payload = buildNarratePayload(
      report,
      createMockMission(),
      createMockMercenary(),
      { gearDefs, implantDefs }
    );

    const node = payload.nodeResolutions![0];
    expect(node).toMatchObject({
      role: "obstacle",
      roleLabelKo: "관문",
      outcome: "pass",
      passChance: 64,
      tagPassChanceDelta: 6,
    });
  });

  it("T-S5-3: 노드별 triggeredTags는 해당 노드에만 enrich되어 전달된다", () => {
    const report = createMockResultReport({
      nodeResolutions: [entryResolution, electricObstacleResolution],
      triggeredTags: [insulatedBootsPositive],
    });
    const payload = buildNarratePayload(
      report,
      createMockMission(),
      createMockMercenary(),
      { gearDefs, implantDefs }
    );

    expect(payload.nodeResolutions![0]?.triggeredTags).toEqual([]);
    expect(payload.nodeResolutions![1]?.triggeredTags).toHaveLength(1);
    expect(payload.nodeResolutions![1]?.triggeredTags[0]).toMatchObject({
      reading: "positive",
      sourceDisplayNameKo: "러버세인트 절연 부츠",
      ruleId: "node_insulated_vs_electric",
    });
  });

  it("T-S5-4: nodeResolutions가 없으면 빈 배열을 반환한다", () => {
    const report = createMockResultReport({ nodeResolutions: undefined });
    const payload = buildNarratePayload(report, createMockMission(), createMockMercenary());

    expect(payload.nodeResolutions).toEqual([]);
  });
});
