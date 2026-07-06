import { describe, expect, it } from "vitest";
import { evaluateEntryGate } from "./entryGate";
import type { EntryGateSpec, Mercenary } from "../data/types";
import { gearDefs, implantDefs } from "../data/seed";

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

describe("entryGate (T-B-2)", () => {
  it("T-B-2-1: entryGate 미지정 시 clear", () => {
    const result = evaluateEntryGate(undefined, baseMerc);
    expect(result.outcome).toBe("clear");
    expect(result.unmetRequirements).toHaveLength(0);
  });

  it("T-B-2-2: 필수 스탯 미달 + failureMode block → blocked", () => {
    const entryGate: EntryGateSpec = {
      requirements: [{ kind: "stat", statKey: "cypher", minValue: 60 }],
      failureMode: "block",
    };
    const merc = { ...baseMerc, stats: { ...baseMerc.stats, cypher: 30 } };

    const result = evaluateEntryGate(entryGate, merc);

    expect(result.outcome).toBe("blocked");
    expect(result.unmetRequirements).toHaveLength(1);
    expect(result.logKo).toMatch(/진입 게이트|필수|미달/);
  });

  it("T-B-2-3: 필수 스탯 충족 → clear", () => {
    const entryGate: EntryGateSpec = {
      requirements: [{ kind: "stat", statKey: "cypher", minValue: 35 }],
      failureMode: "block",
    };
    const merc = { ...baseMerc, stats: { ...baseMerc.stats, cypher: 50 } };

    const result = evaluateEntryGate(entryGate, merc);

    expect(result.outcome).toBe("clear");
    expect(result.unmetRequirements).toHaveLength(0);
  });

  it("T-B-2-4: 필수 태그 미보유 + failureMode force_risk → forced_risk", () => {
    const entryGate: EntryGateSpec = {
      requirements: [{ kind: "tag", tagId: "tag_origin_upper_etiquette" }],
      failureMode: "force_risk",
      forcedRiskNodeNameKo: "적발 요격 전투",
    };
    const merc = { ...baseMerc, systemTags: [] };

    const result = evaluateEntryGate(entryGate, merc);

    expect(result.outcome).toBe("forced_risk");
    expect(result.unmetRequirements.some((r) => r.kind === "tag")).toBe(true);
    expect(result.logKo).toMatch(/위험|적발|강제/);
  });

  it("T-B-2-5: 필수 장비 loadout 보유 → clear", () => {
    const entryGate: EntryGateSpec = {
      requirements: [{ kind: "gear", gearId: "gear_feet_insulated_boots_01" }],
      failureMode: "block",
    };
    const merc = { ...baseMerc, mercId: "merc_breaker_01" };
    const loadout = {
      gearOwner: { gear_feet_insulated_boots_01: "merc_breaker_01" },
      implantOwner: {},
      gearDefs,
      implantDefs,
    };

    const result = evaluateEntryGate(entryGate, merc, loadout);

    expect(result.outcome).toBe("clear");
  });

  it("T-B-2-6: 필수 장비 미장착 + failureMode block → blocked", () => {
    const entryGate: EntryGateSpec = {
      requirements: [{ kind: "gear", gearId: "gear_feet_insulated_boots_01" }],
      failureMode: "block",
    };

    const result = evaluateEntryGate(entryGate, baseMerc);

    expect(result.outcome).toBe("blocked");
    expect(result.unmetRequirements.some((r) => r.kind === "gear")).toBe(true);
  });
});
