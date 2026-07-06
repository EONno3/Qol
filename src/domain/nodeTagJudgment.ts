import { GAME_CONFIG } from "../data/config";
import { TAG_MISSION_INTERPRETATIONS } from "../data/tagMissionInterpretations";
import type {
  Mercenary,
  Mission,
  NodeOutcome,
  QueuedNode,
  StatKey,
  TagMissionInterpretation,
  TriggeredTag,
} from "../data/types";
import { computeNodePassChance } from "./nodePassChance";
import { getEffectiveStatForNode, type DispatchLoadoutContext } from "./gearStatBonus";
import type { TaggedAttribution } from "./mercTagPool";
import { findInterpretations } from "./tagInterpretationMatch";
import { resolveNodeTriggeredTags } from "./resolveNodeTriggeredTags";

export interface NodeJudgmentResult {
  outcome: NodeOutcome;
  passChance: number;
  effectiveStat: number;
  tagPassChanceDelta: number;
  triggeredTags: TriggeredTag[];
  logKo: string;
  routing: import("../data/types").RoutingDecision;
}

export interface NodeJudgmentParams {
  stars: number;
  merc: Mercenary;
  node: QueuedNode;
  mission: Pick<Mission, "tier" | "missionType">;
  loadout?: DispatchLoadoutContext;
  mercenaryTags: TaggedAttribution[];
  loadoutTags: TaggedAttribution[];
  rng: () => number;
  interpretations?: TagMissionInterpretation[];
}

const CRIT_MARGIN = 25;

function readingToDelta(reading: TriggeredTag["reading"]): number {
  if (reading === "positive") return GAME_CONFIG.judgment.nodePositivePercent;
  if (reading === "negative") return GAME_CONFIG.judgment.nodeNegativePercent;
  return 0;
}

function mergeTriggeredDeduped(...groups: TriggeredTag[][]): TriggeredTag[] {
  const seen = new Set<string>();
  const merged: TriggeredTag[] = [];
  for (const group of groups) {
    for (const tag of group) {
      const key = `${tag.ruleId}:${tag.sourceType}:${tag.sourceId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(tag);
    }
  }
  return merged;
}

function triggeredDelta(triggered: TriggeredTag[]): number {
  return triggered.reduce((sum, tag) => sum + readingToDelta(tag.reading), 0);
}

function evaluateTagEffects(
  node: QueuedNode,
  mission: Pick<Mission, "tier" | "missionType">,
  mercenaryTags: TaggedAttribution[],
  loadoutTags: TaggedAttribution[],
  interpretations: TagMissionInterpretation[]
): { delta: number; triggered: TriggeredTag[] } {
  if (node.challengeTags.length === 0) {
    return { delta: 0, triggered: [] };
  }

  const candidates = [...loadoutTags, ...mercenaryTags];
  let interpretationTriggered: TriggeredTag[] = [];
  const seen = new Set<string>();

  for (const challengeTag of node.challengeTags) {
    const query = {
      missionType: mission.missionType,
      tier: mission.tier,
      nodeRole: node.role,
      nodeKind: node.nodeKind,
      challengeTag,
    };

    for (const attr of candidates) {
      const rules = findInterpretations(interpretations, attr.tagId, query).filter(
        (r) => r.judgmentAxis === "node_modifier"
      );

      for (const rule of rules) {
        if (rule.reading !== "positive" && rule.reading !== "negative") continue;
        const key = `${rule.ruleId}:${attr.sourceType}:${attr.sourceId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        interpretationTriggered.push({
          tagId: attr.tagId,
          sourceType: attr.sourceType,
          sourceId: attr.sourceId,
          ruleId: rule.ruleId,
          reading: rule.reading,
        });
      }
    }
  }

  const poolTriggered = resolveNodeTriggeredTags({
    challengeTags: node.challengeTags,
    attributions: candidates,
  });
  const triggered = mergeTriggeredDeduped(interpretationTriggered, poolTriggered);
  const delta = triggeredDelta(triggered);

  return { delta, triggered };
}

export function resolveNodeJudgment(params: NodeJudgmentParams): NodeJudgmentResult {
  const {
    stars,
    merc,
    node,
    mission,
    loadout,
    mercenaryTags,
    loadoutTags,
    rng,
    interpretations = TAG_MISSION_INTERPRETATIONS,
  } = params;

  const statKey = node.statCheck as StatKey;
  const baseStat = merc.stats[statKey] ?? 0;
  const effectiveStat = getEffectiveStatForNode(merc.mercId, baseStat, statKey, loadout);

  let tagDelta = 0;
  let triggeredTags: TriggeredTag[] = [];

  if (node.challengeTags.length > 0) {
    const fx = evaluateTagEffects(node, mission, mercenaryTags, loadoutTags, interpretations);
    tagDelta += fx.delta;
    triggeredTags = fx.triggered;

    if (node.defaultPolarity === "adverse") {
      tagDelta += GAME_CONFIG.judgment.adverseBasePenaltyPercent;
    }
  }

  const basePass = computeNodePassChance(stars, effectiveStat);
  const passChance = Math.max(5, Math.min(98, basePass + tagDelta));
  const roll = Math.floor(rng() * 100) + 1;

  let outcome: NodeOutcome;
  if (roll <= passChance) outcome = "pass";
  else outcome = roll - passChance >= CRIT_MARGIN ? "critical" : "minor";

  const roleLabel: Record<QueuedNode["role"], string> = {
    entry: "진입",
    obstacle: "관문",
    objective: "목표",
    exit: "이탈",
  };
  const label = roleLabel[node.role];
  let logKo: string;
  if (outcome === "pass") logKo = `[${label} 통과] ${node.nameKo}`;
  else if (outcome === "minor") logKo = `[${label} 차질] ${node.nameKo} — 가까스로 넘겼지만 대가를 치렀다.`;
  else logKo = `[${label} 치명] ${node.nameKo} — 상황이 심각하게 어긋났다.`;

  return {
    outcome,
    passChance,
    effectiveStat,
    tagPassChanceDelta: tagDelta,
    triggeredTags,
    logKo,
    routing: { action: "continue" },
  };
}
