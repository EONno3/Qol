import { describe, expect, it } from "vitest";
import { createMockMercenary, createMockResultReport } from "../test/factories";
import { applySettlement, netCredits } from "./settlement";
import { createInitialState } from "./state";
import { calcCompensationSplit } from "./mercCompensation";

describe("applySettlement — merc share (T-DF-SETTLE)", () => {
  const merc = createMockMercenary({ mercId: "merc_test", expectedShareRate: 0.4 });

  it("T-DF-SETTLE-1: mercShareRate 40% → ledger는 픽ser 몫만, mercDissatisfactionStacks 변화 없음", () => {
    const report = createMockResultReport({
      mercId: merc.mercId,
      rewardCredits: 10_000,
      extraRewardCredits: 0,
      lostCredits: 0,
    });
    const net = netCredits(report);
    const { fixerCredits } = calcCompensationSplit(net, 0.4);

    const next = applySettlement(createInitialState(), report, {
      mercShareRate: 0.4,
      mercExpectedShareRate: merc.expectedShareRate,
    });

    expect(next.ledger).toBe(fixerCredits);
    expect(next.mercDissatisfactionStacks[merc.mercId] ?? 0).toBe(0);
    expect(next.playerBehavioralStats.totalCreditsEarned).toBe(fixerCredits);
  });

  it("T-DF-SETTLE-2: mercShareRate 25% (< 기대 40%) → 불만도 +15", () => {
    const report = createMockResultReport({
      mercId: merc.mercId,
      rewardCredits: 10_000,
      lostCredits: 0,
    });

    const next = applySettlement(createInitialState(), report, {
      mercShareRate: 0.25,
      mercExpectedShareRate: 0.4,
    });

    expect(next.mercDissatisfactionStacks[merc.mercId]).toBe(15);
  });

  it("T-DF-SETTLE-3: mercShareRate 미전달(0) → 레거시: 픽ser가 net 전액 수령", () => {
    const report = createMockResultReport({ rewardCredits: 10_000, lostCredits: 0 });
    const next = applySettlement(createInitialState(), report);
    expect(next.ledger).toBe(10_000);
  });
});
