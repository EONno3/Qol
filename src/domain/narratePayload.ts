import type {
  GearDef,
  ImplantDef,
  Mercenary,
  Mission,
  NodeResolutionLog,
  NodeRole,
  NarrativeMode,
  ResultReport,
  TriggeredTag,
} from "../data/types";
import type { ChallengeTagReaction } from "../data/challengeTagPool";
import { CHALLENGE_TAG_POOL } from "../data/challengeTagPool";
import { TAG_MISSION_INTERPRETATIONS } from "../data/tagMissionInterpretations";
import { getTagDef } from "../data/tagRegistry";

/** /narrate POST 본문 — triggeredTags 출처 팩트 포함 (Phase 4) */
export interface NarrateTriggeredTagFact {
  tagId: string;
  sourceType: string;
  sourceId: string;
  ruleId: string;
  reading: string;
  sourceDisplayNameKo?: string;
  contributionKo?: string;
}

/** /narrate POST — 노드별 풀 팩트 (Phase 5) */
export interface NarrateNodeResolutionFact {
  nodeInstanceId: string;
  nameKo: string;
  role: NodeRole;
  roleLabelKo: string;
  outcome: string;
  passChance: number;
  tagPassChanceDelta: number;
  challengeTags: string[];
  triggeredTags: NarrateTriggeredTagFact[];
  /** 캐치업(현장 개입) 노드 여부 — AI 서사에 픽서 개입 팩트 반영용 */
  intervened: boolean;
}

export interface NarratePayload {
  missionName: string;
  mercName: string;
  mercId: string;
  resultType: string;
  summaryLogKo: string;
  nodeLogs: string[];
  triggeredTags: NarrateTriggeredTagFact[];
  nodeResolutions: NarrateNodeResolutionFact[];
  /** AI 서사 화자 모드 — 어사인=merc_diary / 캐치업=fixer_field_log */
  narrativeMode: NarrativeMode;
}

export function resolveNarrativeMode(report: ResultReport): NarrativeMode {
  return report.catchUpActive ? "fixer_field_log" : "merc_diary";
}

export interface NarratePayloadContext {
  gearDefs?: GearDef[];
  implantDefs?: ImplantDef[];
}

const CHALLENGE_THREAT_LABEL: Record<string, string> = {
  tag_threat_electric: "전기 위협",
  tag_challenge_gear_detection: "장비 탐지",
  tag_context_lower_damp: "습기",
  tag_context_lower_stench: "악취",
  tag_context_lower_wastewater: "폐수",
  tag_context_mid_machine_noise: "기계 소음",
  tag_context_industrial: "산업 현장",
  tag_context_upper_dry: "건조 공기",
  tag_context_upper_disinfectant: "소독약",
};

const POOL_RULE_BY_ID = new Map<string, { challengeTagId: string; reaction: ChallengeTagReaction }>();
for (const entry of CHALLENGE_TAG_POOL) {
  for (const reaction of entry.reactions) {
    POOL_RULE_BY_ID.set(reaction.ruleId, { challengeTagId: entry.challengeTagId, reaction });
  }
}

const ROLE_LABEL_KO: Record<NodeRole, string> = {
  entry: "진입",
  obstacle: "관문",
  objective: "목표",
  exit: "이탈",
};

function resolveSourceDisplayNameKo(
  tag: TriggeredTag,
  merc: Mercenary,
  context?: NarratePayloadContext
): string {
  if (tag.sourceType === "gear") {
    const def = context?.gearDefs?.find((g) => g.gearId === tag.sourceId);
    if (def?.displayNameKo) return def.displayNameKo;
  }
  if (tag.sourceType === "implant") {
    const def = context?.implantDefs?.find((i) => i.implantId === tag.sourceId);
    if (def?.displayNameKo) return def.displayNameKo;
  }
  if (tag.sourceType === "mercenary" && tag.sourceId === merc.mercId) {
    return merc.aliasKo || merc.displayNameKo;
  }
  const tagDef = getTagDef(tag.tagId);
  return tagDef?.displayNameKo ?? tag.sourceId;
}

function buildContributionKo(tag: TriggeredTag, sourceDisplayNameKo: string): string {
  const poolRule = POOL_RULE_BY_ID.get(tag.ruleId);
  if (poolRule) {
    const envLabel = CHALLENGE_THREAT_LABEL[poolRule.challengeTagId] ?? "현장 환경";
    if (tag.reading === "positive") {
      return `${sourceDisplayNameKo}이(가) ${envLabel} 구간 통과에 기여했다`;
    }
    if (tag.reading === "negative") {
      return `${sourceDisplayNameKo}이(가) ${envLabel} 구간에서 불리하게 작용했다`;
    }
  }

  const rule = TAG_MISSION_INTERPRETATIONS.find((r) => r.ruleId === tag.ruleId);
  const challengeTag = rule?.context.challengeTag;
  const threatKey = typeof challengeTag === "string" ? challengeTag : undefined;
  const threatLabel = threatKey ? CHALLENGE_THREAT_LABEL[threatKey] : undefined;

  if (tag.reading === "positive") {
    if (threatLabel) {
      return `${sourceDisplayNameKo}가 ${threatLabel} 관문 통과에 기여했다`;
    }
    return `${sourceDisplayNameKo}이(가) 현장 판정에 도움이 되었다`;
  }
  if (tag.reading === "negative") {
    if (threatLabel) {
      return `${sourceDisplayNameKo}이(가) ${threatLabel} 관문에서 불리하게 작용했다`;
    }
    return `${sourceDisplayNameKo}이(가) 현장에서 불리하게 작용했다`;
  }
  return `${sourceDisplayNameKo}이(가) 특수하게 관여했다`;
}

function enrichTriggeredTag(
  tag: TriggeredTag,
  merc: Mercenary,
  context?: NarratePayloadContext
): NarrateTriggeredTagFact {
  const sourceDisplayNameKo = resolveSourceDisplayNameKo(tag, merc, context);
  return {
    tagId: tag.tagId,
    sourceType: tag.sourceType,
    sourceId: tag.sourceId,
    ruleId: tag.ruleId,
    reading: tag.reading,
    sourceDisplayNameKo,
    contributionKo: buildContributionKo(tag, sourceDisplayNameKo),
  };
}

function enrichNodeResolution(
  node: NodeResolutionLog,
  merc: Mercenary,
  context?: NarratePayloadContext
): NarrateNodeResolutionFact {
  return {
    nodeInstanceId: node.nodeInstanceId,
    nameKo: node.nameKo,
    role: node.role,
    roleLabelKo: ROLE_LABEL_KO[node.role],
    outcome: node.outcome,
    passChance: node.passChance,
    tagPassChanceDelta: node.tagPassChanceDelta,
    challengeTags: node.challengeTags ?? [],
    triggeredTags: (node.triggeredTags ?? []).map((tag) => enrichTriggeredTag(tag, merc, context)),
    intervened: node.intervened ?? false,
  };
}

export function buildNarratePayload(
  report: ResultReport,
  mission: Mission,
  merc: Mercenary,
  context?: NarratePayloadContext
): NarratePayload {
  const triggeredTags = (report.triggeredTags ?? []).map((tag) =>
    enrichTriggeredTag(tag, merc, context)
  );
  const nodeResolutions = (report.nodeResolutions ?? []).map((node) =>
    enrichNodeResolution(node, merc, context)
  );

  return {
    missionName: mission.displayNameKo,
    mercName: merc.aliasKo,
    mercId: merc.mercId,
    resultType: report.resultType,
    summaryLogKo: report.summaryLogKo,
    nodeLogs: report.nodeLogKo ?? [],
    triggeredTags,
    nodeResolutions,
    narrativeMode: resolveNarrativeMode(report),
  };
}
