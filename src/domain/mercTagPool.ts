import { ENTITY_TAG_LINKS } from "../data/entityTagLinks";
import { resolveTagId } from "../data/tagRegistry";
import type { Mercenary, TagSourceType } from "../data/types";
import type { DispatchLoadoutContext } from "./gearStatBonus";

export interface TaggedAttribution {
  tagId: string;
  sourceType: TagSourceType;
  sourceId: string;
}

function linksForOwned(
  mercId: string,
  ownerMap: Record<string, string> | undefined,
  entityType: "gear" | "implant"
): TaggedAttribution[] {
  if (!ownerMap) return [];
  const out: TaggedAttribution[] = [];
  for (const [entityId, owner] of Object.entries(ownerMap)) {
    if (owner !== mercId) continue;
    for (const link of ENTITY_TAG_LINKS) {
      if (link.entityType === entityType && link.entityId === entityId) {
        out.push({ tagId: link.tagId, sourceType: entityType, sourceId: entityId });
      }
    }
  }
  return out;
}

/** 용병 고유 태그 — systemTags + mercenary entity links (gear/implant 제외) */
export function resolveMercenaryTagAttributions(merc: Mercenary): TaggedAttribution[] {
  const seen = new Map<string, TaggedAttribution>();

  const push = (tagId: string, sourceId: string) => {
    const canonical = resolveTagId(tagId) ?? tagId;
    const key = `mercenary:${canonical}`;
    if (!seen.has(key)) {
      seen.set(key, { tagId: canonical, sourceType: "mercenary", sourceId });
    }
  };

  for (const raw of merc.systemTags ?? []) {
    push(raw, merc.mercId);
  }
  for (const link of ENTITY_TAG_LINKS) {
    if (link.entityType === "mercenary" && link.entityId === merc.mercId) {
      push(link.tagId, merc.mercId);
    }
  }

  return [...seen.values()];
}

/** 장비·임플란트 태그만 — 용병 풀과 분리 */
export function resolveLoadoutTagAttributions(
  mercId: string,
  loadout?: DispatchLoadoutContext
): TaggedAttribution[] {
  if (!loadout) return [];
  return [
    ...linksForOwned(mercId, loadout.gearOwner, "gear"),
    ...linksForOwned(mercId, loadout.implantOwner, "implant"),
  ];
}

export function mercenaryTagIds(attributions: TaggedAttribution[]): string[] {
  return [...new Set(attributions.map((a) => a.tagId))];
}

export function loadoutTagIds(attributions: TaggedAttribution[]): string[] {
  return [...new Set(attributions.map((a) => a.tagId))];
}

/** T-S0-1: 용병 풀과 loadout 풀에 동일 tagId가 겹치지 않도록 검증용 */
export function tagPoolsDisjoint(
  mercTags: TaggedAttribution[],
  loadoutTags: TaggedAttribution[]
): boolean {
  const mercIds = new Set(mercTags.map((t) => t.tagId));
  return loadoutTags.every((t) => !mercIds.has(t.tagId));
}
