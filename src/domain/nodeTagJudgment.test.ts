import { describe, expect, it } from "vitest";
import { createMockMercenary } from "../test/factories";
import {
  TEST_CHALLENGE_ELECTRIC,
  TEST_CHALLENGE_GEAR_DETECTION,
  TEST_GEAR_INSULATED_ID,
  TEST_GEAR_VISIBLE_ID,
  TEST_NODE_INTERPRETATIONS,
  createTestAdverseNode,
  createTestNeutralNode,
} from "../test/nodeJudgmentFixtures";
import { resolveNodeJudgment } from "./nodeTagJudgment";
import type { TaggedAttribution } from "./mercTagPool";

const baseMerc = createMockMercenary({ stats: { frame: 40, cool: 40, wire: 40, cypher: 40, pulse: 40 } });

describe("nodeTagJudgment (T-S0-2,3,7)", () => {
  it("adverse + 전기 challenge + 절연 장비 → positive triggered, passChance 상승", () => {
    const loadoutTags: TaggedAttribution[] = [
      { tagId: "tag_gear_insulated_work_habit", sourceType: "gear", sourceId: TEST_GEAR_INSULATED_ID },
    ];
    const withTag = resolveNodeJudgment({
      stars: 3,
      merc: baseMerc,
      node: createTestAdverseNode([TEST_CHALLENGE_ELECTRIC]),
      mission: { tier: "lower", missionType: "지원" },
      mercenaryTags: [],
      loadoutTags,
      rng: () => 0.5,
      interpretations: TEST_NODE_INTERPRETATIONS,
    });
    const withoutTag = resolveNodeJudgment({
      stars: 3,
      merc: baseMerc,
      node: createTestAdverseNode([TEST_CHALLENGE_ELECTRIC]),
      mission: { tier: "lower", missionType: "지원" },
      mercenaryTags: [],
      loadoutTags: [],
      rng: () => 0.5,
      interpretations: TEST_NODE_INTERPRETATIONS,
    });

    expect(withTag.triggeredTags.some((t) => t.sourceId === TEST_GEAR_INSULATED_ID)).toBe(true);
    expect(withTag.tagPassChanceDelta).toBeGreaterThan(withoutTag.tagPassChanceDelta);
    expect(withTag.triggeredTags[0]?.sourceType).toBe("gear");
  });

  it("adverse + 탐지 challenge + 외장 무기 태그 → negative triggered", () => {
    const loadoutTags: TaggedAttribution[] = [
      { tagId: "tag_gear_weapon_visible", sourceType: "gear", sourceId: TEST_GEAR_VISIBLE_ID },
    ];
    const result = resolveNodeJudgment({
      stars: 2,
      merc: baseMerc,
      node: createTestAdverseNode([TEST_CHALLENGE_GEAR_DETECTION]),
      mission: { tier: "mid", missionType: "잠입" },
      mercenaryTags: [],
      loadoutTags,
      rng: () => 0.99,
      interpretations: TEST_NODE_INTERPRETATIONS,
    });

    expect(result.triggeredTags.some((t) => t.reading === "negative")).toBe(true);
    expect(result.triggeredTags[0]?.sourceId).toBe(TEST_GEAR_VISIBLE_ID);
    expect(result.tagPassChanceDelta).toBeLessThan(0);
  });

  it("neutral + challengeTags 없음 → tagDelta 0, triggered 빈 배열", () => {
    const result = resolveNodeJudgment({
      stars: 2,
      merc: baseMerc,
      node: createTestNeutralNode(),
      mission: { tier: "lower", missionType: "지원" },
      mercenaryTags: [],
      loadoutTags: [
        { tagId: "tag_gear_weapon_visible", sourceType: "gear", sourceId: TEST_GEAR_VISIBLE_ID },
      ],
      rng: () => 0.5,
      interpretations: TEST_NODE_INTERPRETATIONS,
    });
    expect(result.tagPassChanceDelta).toBe(0);
    expect(result.triggeredTags).toHaveLength(0);
  });

  it("T-GB-3: neutral + wastewater context + 방독면 → pool 기반 positive triggered", () => {
    const mercenaryTags: TaggedAttribution[] = [
      { tagId: "tag_gear_gas_mask", sourceType: "mercenary", sourceId: "merc_pool_test" },
    ];
    const result = resolveNodeJudgment({
      stars: 2,
      merc: baseMerc,
      node: createTestNeutralNode({
        challengeTags: ["tag_context_lower_wastewater"],
        defaultPolarity: "neutral",
      }),
      mission: { tier: "lower", missionType: "지원" },
      mercenaryTags,
      loadoutTags: [],
      rng: () => 0.5,
      interpretations: TEST_NODE_INTERPRETATIONS,
    });

    expect(result.triggeredTags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tagId: "tag_gear_gas_mask",
          reading: "positive",
          ruleId: "pool_wastewater_gas_mask",
          sourceType: "mercenary",
          sourceId: "merc_pool_test",
        }),
      ])
    );
    expect(result.tagPassChanceDelta).toBeGreaterThan(0);
  });
});
