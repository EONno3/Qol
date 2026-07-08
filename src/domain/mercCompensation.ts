import { GAME_CONFIG } from "../data/config";

export interface CompensationSplit {
  fixerCredits: number;
  mercCredits: number;
}

/** 순이익을 픽서·용병 몫으로 분할 (정수 크레딧, 용병 floor·픽ser 잔여) */
export function calcCompensationSplit(
  net: number,
  mercShareRate: number,
): CompensationSplit {
  if (net <= 0) {
    return { fixerCredits: net, mercCredits: 0 };
  }
  const rate = Math.max(0, Math.min(1, mercShareRate));
  const mercCredits = Math.floor(net * rate);
  return { fixerCredits: net - mercCredits, mercCredits };
}

/** 기대 지분 미달 시 불만도 스택 증가량 (순이익 ≤0 이면 0) */
export function calcDissatisfactionGain(
  expectedShareRate: number,
  appliedShareRate: number,
  net: number,
): number {
  if (net <= 0 || appliedShareRate >= expectedShareRate) {
    return 0;
  }
  const expectedPct = Math.round(expectedShareRate * 100);
  const appliedPct = Math.round(appliedShareRate * 100);
  const shortfallPercent = Math.max(0, expectedPct - appliedPct);
  return shortfallPercent * GAME_CONFIG.mercenary.dissatisfactionPerPercentShortfall;
}
