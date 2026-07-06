import { ENTITY_TAG_LINKS } from "../data/entityTagLinks";
import { TAG_MISSION_INTERPRETATIONS } from "../data/tagMissionInterpretations";
import type { Mercenary, TagJudgmentAxis } from "../data/types";

/** systemTags에 반드시 포함되어야 하는 판정 축 (생존 gate/survival_modifier · 조커 joker_card) */
const GAMEPLAY_JUDGMENT_AXES: TagJudgmentAxis[] = [
  "gate_modifier",
  "survival_modifier",
  "joker_card",
];

/** 해석 규칙이 존재하는 gameplay 태그 ID 집합 */
export function getGameplayTagIdsFromInterpretations(): Set<string> {
  const ids = new Set<string>();
  for (const rule of TAG_MISSION_INTERPRETATIONS) {
    if (GAMEPLAY_JUDGMENT_AXES.includes(rule.judgmentAxis)) {
      ids.add(rule.tagId);
    }
  }
  return ids;
}

/** entityTagLinks 기준 — 해당 용병이 seed.systemTags에 넣어야 할 canonical tag_id 목록 */
export function getExpectedSystemTagsForMerc(mercId: string): string[] {
  const gameplay = getGameplayTagIdsFromInterpretations();
  return ENTITY_TAG_LINKS.filter(
    (l) => l.entityType === "mercenary" && l.entityId === mercId && gameplay.has(l.tagId)
  )
    .map((l) => l.tagId)
    .sort();
}

export interface SystemTagSyncResult {
  valid: boolean;
  missing: string[];
  extra: string[];
}

export function validateMercSystemTags(merc: Mercenary): SystemTagSyncResult {
  const expected = new Set(getExpectedSystemTagsForMerc(merc.mercId));
  const actual = new Set(merc.systemTags ?? []);
  const missing = [...expected].filter((id) => !actual.has(id)).sort();
  const extra = [...actual].filter((id) => !expected.has(id)).sort();
  return { valid: missing.length === 0 && extra.length === 0, missing, extra };
}
