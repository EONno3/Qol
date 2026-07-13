import { describe, expect, it, beforeEach } from "vitest";
import { createMockMercenary, createMockMission } from "../test/factories";
import { resetNodeInstanceCounter } from "./nodeQueue";
import {
  advanceCatchUpNode,
  createCatchUpRun,
  finalizeCatchUpRun,
  peekCatchUpNode,
} from "./catchUpRun";
import { startDispatch } from "./mission";
import { createInitialState } from "./state";
import { startCatchUpDispatch } from "./catchUpDispatch";

describe("catchUpRun SM (T-DC2-SM)", () => {
  const mission = createMockMission({
    missionId: "sm_mission",
    nodeCount: 4,
    nodes: [
      { nameKo: "진입", role: "entry", statCheck: "frame" },
      { nameKo: "목표", role: "objective", statCheck: "cool" },
      { nameKo: "장애", role: "obstacle", statCheck: "wire" },
      { nameKo: "이탈", role: "exit", statCheck: "cypher" },
    ],
  });
  const merc = createMockMercenary({ mercId: "sm_merc" });

  beforeEach(() => {
    resetNodeInstanceCounter();
  });

  it("T-DC2-SM-1: 생성 시 보고서 없음·active 상태", () => {
    const run = createCatchUpRun({
      dispatchId: "d1",
      mission,
      merc,
      predictAnalysisLevel: 2,
    });
    expect(run.status).toBe("active");
    expect(peekCatchUpNode(run)).not.toBeNull();
    expect(() => finalizeCatchUpRun(run, mission, merc)).not.toThrow();
  });

  it("T-DC2-SM-2: intervene는 cap까지 소모", () => {
    let run = createCatchUpRun({
      dispatchId: "d2",
      mission,
      merc,
      predictAnalysisLevel: 2,
    });
    const cap = run.interventionsLeft;
    expect(cap).toBeGreaterThan(0);

    while (run.status === "active" && run.interventionsLeft > 0) {
      run = advanceCatchUpNode(run, mission, merc, "intervene");
    }
    expect(run.intervenedCount).toBeLessThanOrEqual(cap);
  });

  it("T-DC2-SM-3: pass는 개입 예산 미소모", () => {
    let run = createCatchUpRun({
      dispatchId: "d3",
      mission,
      merc,
      predictAnalysisLevel: 1,
    });
    const before = run.interventionsLeft;
    run = advanceCatchUpNode(run, mission, merc, "pass");
    expect(run.interventionsLeft).toBe(before);
    expect(run.intervenedCount).toBe(0);
  });

  it("T-DC2-SM-4: finalize 시 catchUpActive=true", () => {
    let run = createCatchUpRun({
      dispatchId: "d4",
      mission,
      merc,
      predictAnalysisLevel: 2,
    });
    while (run.status === "active") {
      run = advanceCatchUpNode(run, mission, merc, "pass");
    }
    const { report } = finalizeCatchUpRun(run, mission, merc);
    expect(report.catchUpActive).toBe(true);
  });

  it("T-DC2-SM-5: 어사인 startDispatch는 catchUp 없이 불변", () => {
    let state = createInitialState();
    state = {
      ...state,
      acceptedMissions: ["mission_lower_fuse_capacitor_01"],
      currentCommandPoints: 20,
    };
    const before = state.generatedReports;
    state = startDispatch(state, "mission_lower_fuse_capacitor_01", "merc_breaker_01");
    expect(state.activeCatchUpRun).toBeNull();
    expect(Object.keys(state.generatedReports).length).toBeGreaterThan(
      Object.keys(before).length,
    );
  });
});

describe("startCatchUpDispatch (T-DC2-DISP)", () => {
  it("선계산 없이 activeCatchUpRun만 설정", () => {
    let state = createInitialState();
    state = {
      ...state,
      acceptedMissions: ["mission_lower_fuse_capacitor_01"],
      currentCommandPoints: 20,
      hiredMercs: ["merc_breaker_01", ...(state.hiredMercs ?? [])],
    };
    const reportsBefore = Object.keys(state.generatedReports).length;
    state = startCatchUpDispatch(
      state,
      "mission_lower_fuse_capacitor_01",
      "merc_breaker_01",
      2,
    );
    expect(state.activeCatchUpRun).not.toBeNull();
    expect(state.activeCatchUpRun?.status).toBe("active");
    expect(Object.keys(state.generatedReports).length).toBe(reportsBefore);
    expect(state.activeDispatches.length).toBe(0);
  });
});
