import { reactionsForChallengeTag } from "../data/challengeTagPool";
import type { TriggeredTag } from "../data/types";
import type { TaggedAttribution } from "./mercTagPool";

export interface ResolveNodeTriggeredTagsInput {
  challengeTags: string[];
  attributions: TaggedAttribution[];
}

/**
 * Gap B — 노드 challengeTags에 대해 용병/장비 태그 중 레지스트리에 매칭되는 TriggeredTag만 반환.
 */
export function resolveNodeTriggeredTags(
  input: ResolveNodeTriggeredTagsInput
): TriggeredTag[] {
  const { challengeTags, attributions } = input;
  if (challengeTags.length === 0 || attributions.length === 0) {
    return [];
  }

  const ownedByTagId = new Map<string, TaggedAttribution>();
  for (const attr of attributions) {
    if (!ownedByTagId.has(attr.tagId)) {
      ownedByTagId.set(attr.tagId, attr);
    }
  }

  const triggered: TriggeredTag[] = [];
  const seen = new Set<string>();

  for (const challengeTag of challengeTags) {
    for (const reaction of reactionsForChallengeTag(challengeTag)) {
      const attr = ownedByTagId.get(reaction.tagId);
      if (!attr) continue;

      const key = `${reaction.ruleId}:${attr.sourceType}:${attr.sourceId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      triggered.push({
        tagId: attr.tagId,
        sourceType: attr.sourceType,
        sourceId: attr.sourceId,
        ruleId: reaction.ruleId,
        reading: reaction.reading,
      });
    }
  }

  return triggered;
}
