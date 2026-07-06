import { describe, expect, it } from "vitest";
import { createInitialState } from "./state";
import { generatedMissions, qaMissions } from "../data/seed";

describe("createInitialState - 미션 게시판 구성", () => {
  it("AI가 생성한 미션이 있으면 게시판에는 QA 픽스처 + 생성 미션만 노출하고 일반 정적 픽스처 미션은 제외한다", () => {
    // 전제: 현재 generated_missions.json 에 생성 미션이 존재한다
    expect(generatedMissions.length).toBeGreaterThan(0);

    const state = createInitialState();

    // 일반 정적 데모 미션은 게시판에서 보이지 않아야 한다
    expect(state.availableMissions).not.toContain("mission_lower_fuse_capacitor_01");
    expect(state.availableMissions).not.toContain("mission_mid_elneon_backdoor_01");

    // 게시판은 비어 있으면 안 되고, QA 픽스처 또는 생성 미션이어야 한다
    expect(state.availableMissions.length).toBeGreaterThan(0);
    const allowedIds = new Set([
      ...generatedMissions.map((m) => m.missionId),
      ...qaMissions.map((m) => m.missionId),
    ]);
    for (const id of state.availableMissions) {
      expect(allowedIds.has(id)).toBe(true);
    }
  });

  it("QA 전용 미션(진입 차단·가시성 경고)은 육안 검증을 위해 초기 게시판에 항상 병합 노출된다", () => {
    const state = createInitialState();
    expect(state.availableMissions).toContain("mission_qa_entrygate_block_01");
    expect(state.availableMissions).toContain("mission_qa_visibility_stealth_01");
  });

  it("후속 단서로만 해금되는 미션(requiredHookId)은 초기 게시판에서 제외한다", () => {
    const state = createInitialState();
    const hookOnly = generatedMissions.filter((m) => m.requiredHookId).map((m) => m.missionId);
    for (const id of hookOnly) {
      expect(state.availableMissions).not.toContain(id);
    }
  });
});
