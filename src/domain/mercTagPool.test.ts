import { describe, expect, it } from "vitest";
import { mercenaries } from "../data/seed";
import {
  resolveLoadoutTagAttributions,
  resolveMercenaryTagAttributions,
  tagPoolsDisjoint,
} from "./mercTagPool";
import { createInitialState } from "./state";
import { gearDefs, implantDefs } from "../data/seed";

describe("mercTagPool (T-S0-1)", () => {
  it("용병 풀과 loadout 풀은 gear/implant 태그가 겹치지 않는다", () => {
    const state = createInitialState();
    const loadout = {
      gearOwner: state.gearOwner,
      implantOwner: state.implantOwner,
      gearDefs,
      implantDefs,
    };
    const merc = mercenaries.find((m) => m.mercId === "merc_breaker_01")!;
    const mercTags = resolveMercenaryTagAttributions(merc);
    const loadoutTags = resolveLoadoutTagAttributions(merc.mercId, loadout);

    expect(mercTags.every((t) => t.sourceType === "mercenary")).toBe(true);
    expect(loadoutTags.every((t) => t.sourceType === "gear" || t.sourceType === "implant")).toBe(true);
    expect(
      mercTags.some((t) => t.tagId === "tag_gear_insulated_work_habit")
    ).toBe(false);
    expect(
      loadoutTags.some((t) => t.tagId === "tag_gear_insulated_work_habit")
    ).toBe(true);
    expect(tagPoolsDisjoint(mercTags, loadoutTags)).toBe(true);
  });
});
