import { describe, expect, it } from "vitest";
import { gearDefs, implantDefs } from "../data/seed";
import { createInitialState } from "./state";
import { getEffectiveStatForNode, sumMercLoadoutStatBonus } from "./gearStatBonus";

describe("장비·임플란트 스탯 보정 (B-1)", () => {
  const state = createInitialState();
  const loadout = {
    gearOwner: state.gearOwner,
    implantOwner: state.implantOwner,
    gearDefs,
    implantDefs,
  };

  it("백건우 — 절연 부츠+손목 관절이 wire 보정을 가산한다", () => {
    const bonus = sumMercLoadoutStatBonus("merc_breaker_01", "wire", loadout);
    expect(bonus).toBeGreaterThan(0);
  });

  it("장비 없는 맥락이면 원시 스탯만 사용한다", () => {
    expect(getEffectiveStatForNode("merc_test", 40, "frame")).toBe(40);
  });

  it("T-S1-U1: loadout 존재 시 effective stat ≠ base stat", () => {
    const base = 48;
    const bare = getEffectiveStatForNode("merc_breaker_01", base, "wire");
    const equipped = getEffectiveStatForNode("merc_breaker_01", base, "wire", loadout);
    expect(bare).toBe(base);
    expect(equipped).toBeGreaterThan(base);
    expect(equipped).not.toBe(bare);
  });
});
