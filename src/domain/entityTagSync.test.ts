import { describe, expect, it } from "vitest";
import { mercenaries } from "../data/seed";
import {
  getExpectedSystemTagsForMerc,
  getGameplayTagIdsFromInterpretations,
  validateMercSystemTags,
} from "./entityTagSync";

describe("entityTagLinks ↔ seed.systemTags 동기화 (B-0)", () => {
  it("gameplay 태그 집합은 해석 규칙(gate_modifier·joker_card)에서 유도된다", () => {
    const ids = getGameplayTagIdsFromInterpretations();
    expect(ids.has("tag_origin_slum_native")).toBe(true);
    expect(ids.has("tag_gear_insulated_work_habit")).toBe(false);
  });

  it("merc_breaker_01 — gameplay 태그 2종만 systemTags에 포함", () => {
    expect(getExpectedSystemTagsForMerc("merc_breaker_01")).toEqual([
      "tag_operation_high_voltage_grid_tech",
      "tag_origin_slum_native",
    ]);
  });

  it("seed 용병 4명 전원 systemTags가 entityTagLinks gameplay 부분집합과 일치", () => {
    for (const merc of mercenaries) {
      const result = validateMercSystemTags(merc);
      expect(result, `${merc.mercId}: missing=${result.missing} extra=${result.extra}`).toEqual({
        valid: true,
        missing: [],
        extra: [],
      });
    }
  });
});
