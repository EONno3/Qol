import type { TagDef } from "./types";
import { TAG_DEFINITIONS } from "./tagDefinitions";

export { TAG_DEFINITIONS };

const byId = new Map(TAG_DEFINITIONS.map((t) => [t.tagId, t]));

const aliasToId = new Map<string, string>();
for (const tag of TAG_DEFINITIONS) {
  aliasToId.set(tag.tagId, tag.tagId);
  for (const alias of tag.legacyAliases ?? []) {
    aliasToId.set(alias, tag.tagId);
  }
  for (const alias of tag.docAliases ?? []) {
    aliasToId.set(alias, tag.tagId);
    aliasToId.set(alias.replace(/^#/, ""), tag.tagId);
  }
}

const LEGACY_GAMEPLAY_ALIASES = [
  "고압망_작업",
  "슬럼_출신",
  "유흥가_출신",
  "스캐너_기만",
  "상층_예법",
  "노출형_크롬",
  "불법_격투장_출신",
] as const;

export function getTagDef(tagId: string): TagDef | undefined {
  return byId.get(tagId);
}

export function resolveTagId(raw: string): string | null {
  const direct = aliasToId.get(raw);
  if (direct) return direct;
  if (raw.startsWith("#")) return aliasToId.get(raw) ?? null;
  return null;
}

export function allLegacyAliasesResolve(): boolean {
  return LEGACY_GAMEPLAY_ALIASES.every((alias) => resolveTagId(alias) !== null);
}
