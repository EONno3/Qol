import type { Mercenary, Tier, TagJudgmentAxis } from "../data/types";
import { GAME_CONFIG } from "../data/config";
import { TAG_MISSION_INTERPRETATIONS } from "../data/tagMissionInterpretations";
import { resolveTagId } from "../data/tagRegistry";
import { findInterpretations } from "./tagInterpretationMatch";
import type { DispatchLoadoutContext } from "./gearStatBonus";
import { resolveLoadoutTagAttributions } from "./mercTagPool";

/** 용병이 보유한 systemTags를 canonical tagId 집합으로 정규화한다. */
export function normalizeMercTagIds(merc: Mercenary): string[] {
  const ids = new Set<string>();
  for (const raw of merc.systemTags ?? []) {
    const id = resolveTagId(raw);
    if (id) ids.add(id);
  }
  return [...ids];
}

export function mercHasTag(merc: Mercenary, tagIdOrAlias: string): boolean {
  const target = resolveTagId(tagIdOrAlias) ?? tagIdOrAlias;
  return normalizeMercTagIds(merc).includes(target);
}

/**
 * 구역(tier) 기준 생존 굴림 태그 보정 합계(%).
 * TagMissionInterpretation(gate_modifier|survival_modifier + positive/negative)을
 * GAME_CONFIG.mercenary.tagSurvival*ByTier로 해석.
 */
const SURVIVAL_JUDGMENT_AXES = new Set<TagJudgmentAxis>([
  "gate_modifier",
  "survival_modifier",
]);

export function getTierSurvivalTagBonusUnit(tier: Tier): number {
  return GAME_CONFIG.mercenary.tagSurvivalBonusByTier[tier];
}

export function getTierSurvivalTagPenaltyUnit(tier: Tier): number {
  return GAME_CONFIG.mercenary.tagSurvivalPenaltyByTier[tier];
}

/** 생존 굴림에 관여한 개별 태그 보정 내역(라벨 + 부호 포함 %). */
export interface SurvivalTagContribution {
  tagId: string;
  labelKo: string;
  reading: "positive" | "negative";
  value: number;
}

/**
 * 구역(tier) 기준, 용병의 태그가 생존 굴림에 기여하는 내역을 태그별로 분해한다.
 * getSurvivalTagBonusPercent는 이 값들의 단순 합계이다(투명 노출용 SSOT).
 */
export function getSurvivalTagContributions(
  tier: Tier,
  merc: Mercenary
): SurvivalTagContribution[] {
  const bonusUnit = getTierSurvivalTagBonusUnit(tier);
  const penaltyUnit = getTierSurvivalTagPenaltyUnit(tier);
  const contributions: SurvivalTagContribution[] = [];

  for (const tagId of normalizeMercTagIds(merc)) {
    const rules = findInterpretations(TAG_MISSION_INTERPRETATIONS, tagId, {
      tier,
    }).filter((r) => SURVIVAL_JUDGMENT_AXES.has(r.judgmentAxis));

    for (const rule of rules) {
      if (rule.reading === "positive") {
        contributions.push({
          tagId,
          labelKo: rule.designNoteKo ?? tagId,
          reading: "positive",
          value: bonusUnit,
        });
      } else if (rule.reading === "negative") {
        contributions.push({
          tagId,
          labelKo: rule.designNoteKo ?? tagId,
          reading: "negative",
          value: penaltyUnit,
        });
      }
    }
  }
  return contributions;
}

export function getSurvivalTagBonusPercent(tier: Tier, merc: Mercenary): number {
  return getSurvivalTagContributions(tier, merc).reduce(
    (sum, c) => sum + c.value,
    0
  );
}

export function mercTriggersJokerForMissionType(
  merc: Mercenary,
  missionType: string,
  loadout?: DispatchLoadoutContext
): boolean {
  const tagIds = new Set(normalizeMercTagIds(merc));
  if (loadout) {
    for (const attr of resolveLoadoutTagAttributions(merc.mercId, loadout)) {
      tagIds.add(attr.tagId);
    }
  }
  for (const tagId of tagIds) {
    const rules = findInterpretations(TAG_MISSION_INTERPRETATIONS, tagId, {
      missionType,
    }).filter((r) => r.judgmentAxis === "joker_card" && r.reading === "special");

    if (rules.length > 0) return true;
  }
  return false;
}
