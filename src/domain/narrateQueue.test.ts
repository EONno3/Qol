import { describe, expect, it } from "vitest";
import { findPendingNarrateDispatch, listDispatchesForNarrate, resetFallbackReportsForNarrateRetry } from "./narrateQueue";
import { createMockGameState, createMockResultReport } from "../test/factories";

describe("narrateQueue", () => {
  it("active와 completed 파견을 모두 narrate 후보로 본다", () => {
    const state = createMockGameState({
      activeDispatches: [
        { dispatchId: "d-active", missionId: "m1", mercId: "merc1", startTime: 0, endTime: 1 },
      ],
      completedDispatches: [
        { dispatchId: "d-done", missionId: "m2", mercId: "merc2" },
      ],
    });

    expect(listDispatchesForNarrate(state).map((d) => d.dispatchId)).toEqual([
      "d-active",
      "d-done",
    ]);
  });

  it("completed 파견도 pending narrate 대상이 된다", () => {
    const state = createMockGameState({
      completedDispatches: [{ dispatchId: "d-done", missionId: "m1", mercId: "merc1" }],
      generatedReports: {
        "d-done": createMockResultReport({ aiNarrativeKo: undefined }),
      },
    });

    expect(findPendingNarrateDispatch(state)?.dispatchId).toBe("d-done");
  });

  it("GENERATING·FALLBACK·완료된 AI 문장은 pending에서 제외한다", () => {
    const state = createMockGameState({
      activeDispatches: [
        { dispatchId: "d-gen", missionId: "m1", mercId: "merc1", startTime: 0, endTime: 1 },
        { dispatchId: "d-fb", missionId: "m2", mercId: "merc2", startTime: 0, endTime: 1 },
        { dispatchId: "d-ok", missionId: "m3", mercId: "merc3", startTime: 0, endTime: 1 },
      ],
      generatedReports: {
        "d-gen": createMockResultReport({ aiNarrativeKo: "GENERATING" }),
        "d-fb": createMockResultReport({ aiNarrativeKo: "FALLBACK" }),
        "d-ok": createMockResultReport({ aiNarrativeKo: "AI 일지 본문" }),
      },
    });

    expect(findPendingNarrateDispatch(state)).toBeNull();
  });

  it("resetFallbackReportsForNarrateRetry는 FALLBACK만 undefined로 되돌린다", () => {
    const state = createMockGameState({
      completedDispatches: [{ dispatchId: "d1", missionId: "m1", mercId: "merc1" }],
      generatedReports: {
        d1: createMockResultReport({ aiNarrativeKo: "FALLBACK" }),
        d2: createMockResultReport({ aiNarrativeKo: "AI 본문" }),
      },
    });
    const next = resetFallbackReportsForNarrateRetry(state);
    expect(next.d1.aiNarrativeKo).toBeUndefined();
    expect(next.d2.aiNarrativeKo).toBe("AI 본문");
  });
});
