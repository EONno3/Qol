import { describe, expect, it } from "vitest";
import { calcCompensationSplit, calcDissatisfactionGain } from "./mercCompensation";

describe("mercCompensation (T-DF-COMP)", () => {
  it("T-DF-COMP-1: 순이익 10,000 · 용병 40% → 픽ser 6,000 / 용병 4,000", () => {
    const split = calcCompensationSplit(10_000, 0.4);
    expect(split.mercCredits).toBe(4_000);
    expect(split.fixerCredits).toBe(6_000);
  });

  it("T-DF-COMP-2: 순이익 ≤0 이면 전액 픽ser 몫(손실), 용병 0", () => {
    expect(calcCompensationSplit(-500, 0.4)).toEqual({ fixerCredits: -500, mercCredits: 0 });
    expect(calcCompensationSplit(0, 0.4)).toEqual({ fixerCredits: 0, mercCredits: 0 });
  });

  it("T-DF-COMP-3: 기대 40% · 적용 25% · net>0 → 불만도 15 (1%/pt)", () => {
    expect(calcDissatisfactionGain(0.4, 0.25, 10_000)).toBe(15);
  });

  it("T-DF-COMP-4: 적용 ≥ 기대 또는 net≤0 이면 불만도 0", () => {
    expect(calcDissatisfactionGain(0.4, 0.4, 10_000)).toBe(0);
    expect(calcDissatisfactionGain(0.4, 0.5, 10_000)).toBe(0);
    expect(calcDissatisfactionGain(0.4, 0.1, -100)).toBe(0);
  });
});
