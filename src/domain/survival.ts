import type { Mercenary, Tier } from "../data/types";
import { STATUS_FATAL_INJURY, STATUS_GEAR_DESTROYED } from "../data/constants";
import { getSurvivalTagBonusPercent, getSurvivalTagContributions } from "./tags";
import type { SurvivalTagContribution } from "./tags";

export interface SurvivalResult {
  survived: boolean;
  finalProbability: number;
  roll: number;
  survivalLogKo: string;
  fatalStatuses: string[];
}

/** 구역(tier)별 생존 환경 서술 라벨 (UI·로그 공용 SSOT). */
export const TIER_SURVIVAL_ENV_LABEL_KO: Record<Tier, string> = {
  lower: "하층 산업 폐기 지대",
  mid: "중층 케이섹 및 갱단 추격망",
  upper: "상층 정밀 살상 지대 및 암살 부대",
};

/** 구역별 기본 생존율(%). */
function getTierBaseProbability(tier: Tier): number {
  if (tier === "lower") return 60;
  if (tier === "mid") return 40;
  return 20; // upper
}

/** 구역별 생존 굴림에 쓰는 스탯 보정(%). */
function getSurvivalStatBonus(tier: Tier, merc: Mercenary): number {
  const { frame, cool, cypher, pulse } = merc.stats;
  let keyStat = 0;
  if (tier === "lower") keyStat = Math.max(frame, pulse);
  else if (tier === "mid") keyStat = Math.max(cypher, cool);
  else keyStat = Math.max(cool, cypher); // upper
  return Math.floor(keyStat * 0.1);
}

/** 생존율 계산의 구성 요소를 분해한 결과(투명 노출용). */
export interface SurvivalBreakdown {
  tier: Tier;
  tierLabelKo: string;
  baseProbability: number;
  statBonus: number;
  tagContributions: SurvivalTagContribution[];
  tagBonusTotal: number;
  finalProbability: number;
}

/**
 * 순수 selector: 생존율(기본확률 + 스탯보정 + 태그보정)의 분해 내역을 반환한다.
 * finalProbability는 getSurvivalProbability와 반드시 동일하다(동작 불변).
 */
export function getSurvivalBreakdown(
  tier: Tier,
  merc: Mercenary
): SurvivalBreakdown {
  const baseProbability = getTierBaseProbability(tier);
  const statBonus = getSurvivalStatBonus(tier, merc);
  const tagContributions = getSurvivalTagContributions(tier, merc);
  const tagBonusTotal = tagContributions.reduce((sum, c) => sum + c.value, 0);
  const finalProbability = Math.min(
    100,
    Math.max(0, baseProbability + statBonus + tagBonusTotal)
  );
  return {
    tier,
    tierLabelKo: TIER_SURVIVAL_ENV_LABEL_KO[tier],
    baseProbability,
    statBonus,
    tagContributions,
    tagBonusTotal,
    finalProbability,
  };
}

export function getSurvivalProbability(
  tier: Tier,
  merc: Mercenary
): number {
  return getSurvivalBreakdown(tier, merc).finalProbability;
}

export function calculateSurvivalRoll(
  tier: Tier,
  merc: Mercenary
): SurvivalResult {
  let logs: string[] = [];

  const finalProbability = getSurvivalProbability(tier, merc);

  if (tier === "lower") {
    logs.push(`[환경] 하층 산업 폐기 지대 (기본 생존율 60%)`);
    logs.push(`[스탯 보정] 프레임/펄스 반사신경 발동`);
  } else if (tier === "mid") {
    logs.push(`[환경] 중층 케이섹 및 갱단 추격망 (기본 생존율 40%)`);
    logs.push(`[스탯 보정] 은닉/침착성 우회 기동`);
  } else if (tier === "upper") {
    logs.push(`[환경] 상층 정밀 살상 지대 및 암살 부대 (기본 생존율 20%)`);
    logs.push(`[스탯 보정] 예법 기만/센서 교란`);
  }

  const tagBonus = getSurvivalTagBonusPercent(tier, merc);
  if (tagBonus !== 0) {
    logs.push(`[자질 보정] 용병 자질 태그 시너지 작동 (보정치: ${tagBonus > 0 ? "+" : ""}${tagBonus}%)`);
  }

  const roll = Math.floor(Math.random() * 100) + 1; // 1~100
  const survived = roll <= finalProbability;

  const fatalStatuses: string[] = [];

  if (survived) {
    logs.push(`[판정 결과: ${roll} / ${finalProbability}%] 극적인 탈출 성공. 단, 신체 및 의체에 치명적인 영구 손상 발생.`);
    fatalStatuses.push(STATUS_FATAL_INJURY, STATUS_GEAR_DESTROYED);
  } else {
    logs.push(`[판정 결과: ${roll} / ${finalProbability}%] 탈출 실패. 해당 용병은 현장에서 완전히 소거되었습니다.`);
  }

  return {
    survived,
    finalProbability,
    roll,
    survivalLogKo: logs.join(" "),
    fatalStatuses,
  };
}
