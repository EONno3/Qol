import type { GameState } from "./state";

const STORAGE_KEY = "cyberpunk_mercenary_save_v1";

export function saveGame(state: GameState): boolean {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (err) {
    console.error("Failed to save game state:", err);
    return false;
  }
}

export function loadGame(): GameState | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;
    return JSON.parse(serialized) as GameState;
  } catch (err) {
    console.error("Failed to load game state:", err);
    return null;
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear game state:", err);
  }
}
