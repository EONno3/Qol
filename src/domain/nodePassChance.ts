import { GAME_CONFIG } from "../data/config";

const BASE_PASS_BY_STARS: Record<number, number> = { 1: 90, 2: 78, 3: 66, 4: 54, 5: 42 };

function requirementFor(stars: number): number {
  return GAME_CONFIG.difficulty.statThresholdBase + stars * GAME_CONFIG.difficulty.statThresholdPerStar;
}

/** 노드 통과 확률(%) — effective stat 기준 */
export function computeNodePassChance(stars: number, effectiveStat: number): number {
  const base = BASE_PASS_BY_STARS[stars] ?? 60;
  const req = requirementFor(stars);
  return Math.max(5, Math.min(98, base + (effectiveStat - req)));
}
