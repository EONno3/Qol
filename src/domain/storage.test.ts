import { describe, expect, it, beforeEach } from "vitest";
import { createInitialState } from "./state";
import { loadGame, saveGame, clearGame } from "./storage";

describe("storage utilities", () => {
  beforeEach(() => {
    // Vitest에서 jsdom 환경을 사용하더라도 깨끗하게 유지
    localStorage.clear();
  });

  it("저장 후 불러오면 상태가 복구된다", () => {
    const state = createInitialState();
    state.ledger = 9999;
    state.turnCount = 5;

    const saved = saveGame(state);
    expect(saved).toBe(true);

    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded?.ledger).toBe(9999);
    expect(loaded?.turnCount).toBe(5);
  });

  it("저장된 데이터가 없으면 null을 반환한다", () => {
    const loaded = loadGame();
    expect(loaded).toBeNull();
  });

  it("데이터를 지우면 다시 불러왔을 때 null이 된다", () => {
    saveGame(createInitialState());
    clearGame();
    const loaded = loadGame();
    expect(loaded).toBeNull();
  });
});
