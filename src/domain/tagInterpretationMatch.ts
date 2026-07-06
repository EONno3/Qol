import type {
  MissionTypeKey,
  NodeRole,
  TagInterpretationContext,
  TagMissionInterpretation,
  Tier,
} from "../data/types";

export interface InterpretationQuery {
  missionType?: string;
  tier?: Tier;
  nodeRole?: NodeRole;
  nodeKind?: "basic_gate" | "emergency" | "joker";
  challengeTag?: string;
}

function matchesScalar<T>(ruleVal: T | T[] | undefined, queryVal: T | undefined): boolean {
  if (ruleVal === undefined) return true;
  if (queryVal === undefined) return true;
  const allowed = Array.isArray(ruleVal) ? ruleVal : [ruleVal];
  return allowed.includes(queryVal);
}

/** 해석 규칙의 context가 쿼리 맥락과 일치하는지 */
export function interpretationContextMatches(
  ctx: TagInterpretationContext,
  query: InterpretationQuery
): boolean {
  if (!matchesScalar(ctx.missionType, query.missionType as MissionTypeKey | undefined)) return false;
  if (!matchesScalar(ctx.tier, query.tier)) return false;
  if (!matchesScalar(ctx.nodeRole, query.nodeRole)) return false;
  if (!matchesScalar(ctx.nodeKind, query.nodeKind)) return false;
  if (!matchesScalar(ctx.challengeTag, query.challengeTag)) return false;
  return true;
}

export function findInterpretations(
  rules: TagMissionInterpretation[],
  tagId: string,
  query: InterpretationQuery
): TagMissionInterpretation[] {
  return rules.filter(
    (r) => r.tagId === tagId && interpretationContextMatches(r.context, query)
  );
}
