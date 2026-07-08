// ⚠️ C경로 전용 (단위 테스트): 정적 픽스처(퓨즈·엘네온·차단기 등)를 의도적으로 사용.
// 본편(A경로) 보드에는 이 ID들이 노출되지 않는다.
import { describe, expect, it } from "vitest";
import { createInitialState } from "./state";
import { acceptMission } from "./mission";

describe("acceptMission", () => {
  it("게시판에서 수주하면 available에서 빠지고 accepted에 들어간다", () => {
    const state = createInitialState();
    state.availableMissions = ["mission_lower_fuse_capacitor_01"];
    const next = acceptMission(state, "mission_lower_fuse_capacitor_01");

    expect(next.availableMissions).not.toContain("mission_lower_fuse_capacitor_01");
    expect(next.acceptedMissions).toContain("mission_lower_fuse_capacitor_01");
  });

  it("원본 상태를 변경하지 않는다", () => {
    const state = createInitialState();
    state.availableMissions = ["mission_lower_fuse_capacitor_01"];
    acceptMission(state, "mission_lower_fuse_capacitor_01");

    expect(state.acceptedMissions).toHaveLength(0);
    expect(state.availableMissions).toContain("mission_lower_fuse_capacitor_01");
  });

  it("이미 수주했거나 없는 미션은 그대로 둔다", () => {
    const state = createInitialState();
    const next = acceptMission(state, "mission_does_not_exist");

    expect(next.acceptedMissions).toHaveLength(0);
    expect(next.availableMissions).toEqual(state.availableMissions);
  });
});

import { startDispatch } from "./mission";

describe("startDispatch", () => {
  it("정상 파견 시 통제력이 코스트만큼 차감된다", () => {
    let state = createInitialState();
    state.availableMissions = ["mission_lower_fuse_capacitor_01"];
    // merc_breaker_01의 코스트는 seed.ts에서 4로 설정됨
    state.currentCommandPoints = 10;
    state = acceptMission(state, "mission_lower_fuse_capacitor_01");
    
    const next = startDispatch(state, "mission_lower_fuse_capacitor_01", "merc_breaker_01");
    
    expect(next.activeDispatches).toHaveLength(1);
    expect(next.currentCommandPoints).toBe(6);
  });

  it("통제력이 부족하면 파견되지 않는다", () => {
    let state = createInitialState();
    state.availableMissions = ["mission_lower_fuse_capacitor_01"];
    state.currentCommandPoints = 3; // merc_breaker_01 코스트(4)보다 작음
    state = acceptMission(state, "mission_lower_fuse_capacitor_01");

    const next = startDispatch(state, "mission_lower_fuse_capacitor_01", "merc_breaker_01");
    
    // 상태가 변하지 않아야 함
    expect(next.activeDispatches).toHaveLength(0);
    expect(next.currentCommandPoints).toBe(3);
  });

  it("캐치업 활성 파견은 코스트 ×1.5(올림)를 차감한다 (T-DC-COST)", () => {
    let state = createInitialState();
    state.availableMissions = ["mission_lower_fuse_capacitor_01"];
    state.currentCommandPoints = 10; // 코스트 4 → 캐치업 ceil(4*1.5)=6
    state = acceptMission(state, "mission_lower_fuse_capacitor_01");

    const next = startDispatch(state, "mission_lower_fuse_capacitor_01", "merc_breaker_01", {
      catchUp: { interventionNodeNamesKo: ["작전 구역 진입"] },
    });

    expect(next.activeDispatches).toHaveLength(1);
    expect(next.currentCommandPoints).toBe(4); // 10 - 6
  });

  it("캐치업 코스트가 부족하면 파견되지 않는다 (일반이면 가능한 지휘력이라도 차단) (T-DC-COST)", () => {
    let state = createInitialState();
    state.availableMissions = ["mission_lower_fuse_capacitor_01"];
    state.currentCommandPoints = 5; // 일반(4)이면 가능하지만 캐치업(6)이면 부족
    state = acceptMission(state, "mission_lower_fuse_capacitor_01");

    const next = startDispatch(state, "mission_lower_fuse_capacitor_01", "merc_breaker_01", {
      catchUp: { interventionNodeNamesKo: ["작전 구역 진입"] },
    });

    expect(next.activeDispatches).toHaveLength(0);
    expect(next.currentCommandPoints).toBe(5);
  });
});
