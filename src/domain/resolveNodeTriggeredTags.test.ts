import { describe, expect, it } from "vitest";
import { CHALLENGE_TAG_POOL } from "../data/challengeTagPool";
import { createMockMercenary } from "../test/factories";
import { createTestNeutralNode } from "../test/nodeJudgmentFixtures";
import { resolveMercenaryTagAttributions } from "./mercTagPool";
import { resolveNodeTriggeredTags } from "./resolveNodeTriggeredTags";

describe("challengeTagPool (Gap B 데이터)", () => {
  it("T-GB-0: CHALLENGE_TAG_POOL에 Gap A context tag 4건 이상 등록", () => {
    expect(CHALLENGE_TAG_POOL.length).toBeGreaterThanOrEqual(4);
    const ids = CHALLENGE_TAG_POOL.map((e) => e.challengeTagId);
    expect(ids).toContain("tag_context_lower_wastewater");
    expect(ids).toContain("tag_context_lower_stench");
    expect(ids).toContain("tag_context_mid_machine_noise");
    expect(ids).toContain("tag_context_upper_disinfectant");
  });

  it("T-GB-0b: tag_context_lower_wastewater — 방독면·슬럼 출신 positive, 결벽증 negative", () => {
    const entry = CHALLENGE_TAG_POOL.find((e) => e.challengeTagId === "tag_context_lower_wastewater");
    expect(entry).toBeDefined();
    expect(entry!.reactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tagId: "tag_gear_gas_mask", reading: "positive" }),
        expect.objectContaining({ tagId: "tag_origin_slum_native", reading: "positive" }),
        expect.objectContaining({ tagId: "tag_trait_mysophobia", reading: "negative" }),
      ])
    );
  });
});

/** Gap B — challengeTag × 용병 태그 매칭 (RED → GREEN) */
describe("resolveNodeTriggeredTags (Gap B — T-GB)", () => {
  it("T-GB-1: tag_context_lower_wastewater — #방독면(positive)·#결벽증(negative)만 triggered, 무관 태그 제외", () => {
    const node = createTestNeutralNode({
      challengeTags: ["tag_context_lower_wastewater"],
      defaultPolarity: "neutral",
    });
    const merc = createMockMercenary({
      mercId: "merc_gap_b_01",
      systemTags: ["#방독면", "#결벽증", "#상관없는_태그"],
    });
    const attributions = resolveMercenaryTagAttributions(merc);

    const result = resolveNodeTriggeredTags({
      challengeTags: node.challengeTags,
      attributions,
    });

    expect(result).toHaveLength(2);

    const gasMask = result.find((t) => t.tagId === "tag_gear_gas_mask");
    expect(gasMask).toEqual(
      expect.objectContaining({
        tagId: "tag_gear_gas_mask",
        sourceType: "mercenary",
        sourceId: "merc_gap_b_01",
        reading: "positive",
        ruleId: "pool_wastewater_gas_mask",
      })
    );

    const mysophobia = result.find((t) => t.tagId === "tag_trait_mysophobia");
    expect(mysophobia).toEqual(
      expect.objectContaining({
        tagId: "tag_trait_mysophobia",
        sourceType: "mercenary",
        sourceId: "merc_gap_b_01",
        reading: "negative",
        ruleId: "pool_wastewater_mysophobia",
      })
    );

    expect(result.some((t) => t.tagId === "tag_test_irrelevant")).toBe(false);
  });

  it("T-GB-2: challengeTags 없으면 빈 배열", () => {
    const merc = createMockMercenary({ systemTags: ["#방독면"] });
    const result = resolveNodeTriggeredTags({
      challengeTags: [],
      attributions: resolveMercenaryTagAttributions(merc),
    });
    expect(result).toEqual([]);
  });
});
