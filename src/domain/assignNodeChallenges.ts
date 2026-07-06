import type { Mission, MissionNode, NodeRole, Tier } from "../data/types";
import {
  MISSION_TAG_NODE_CANDIDATES,
  ROLE_WEIGHT_BY_MISSION_TYPE,
  TIER_CONTEXT_TAGS,
} from "../data/missionTagMapping";
import { resolveMissionNodes } from "./missionNodes";

const GENERIC_MISSION_TAG = "tag_context_generic";

const BASE_ROLE_WEIGHT: Record<NodeRole, number> = {
  entry: 4,
  obstacle: 3,
  objective: 2,
  exit: 1,
};

function hashMissionId(missionId: string): number {
  let h = 0;
  for (let i = 0; i < missionId.length; i++) {
    h = (Math.imul(31, h) + missionId.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

/** missionId 기반 결정론적 RNG (매칭·실행·테스트 동일 시드) */
export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function roleWeight(missionType: string, role: NodeRole): number {
  const base = BASE_ROLE_WEIGHT[role];
  const multiplier = ROLE_WEIGHT_BY_MISSION_TYPE[missionType]?.[role] ?? 1;
  return base * multiplier;
}

function weightedPickIndex(indices: number[], weights: number[], rng: () => number): number {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return indices[0];
  let roll = rng() * total;
  for (let i = 0; i < indices.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return indices[i];
  }
  return indices[indices.length - 1];
}

function assignableMissionTags(missionTags: string[] | undefined): string[] {
  if (!missionTags?.length) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of missionTags) {
    if (tag === GENERIC_MISSION_TAG) continue;
    if (!MISSION_TAG_NODE_CANDIDATES[tag]) continue;
    if (seen.has(tag)) continue;
    seen.add(tag);
    result.push(tag);
  }
  return result;
}

function normalizeNode(node: MissionNode): MissionNode {
  return {
    ...node,
    challengeTags: node.challengeTags ?? [],
    defaultPolarity: node.defaultPolarity ?? "neutral",
  };
}

function contextTagPoolForTier(tier: Tier): string[] {
  return TIER_CONTEXT_TAGS[tier] ?? TIER_CONTEXT_TAGS.lower;
}

/** 위협 태그 미할당 노드에 tier별 neutral context tag 1개씩 폴백 */
function applyContextTagFallback(
  nodes: MissionNode[],
  tier: Tier,
  rng: () => number
): MissionNode[] {
  const pool = contextTagPoolForTier(tier);
  return nodes.map((node) => {
    if ((node.challengeTags?.length ?? 0) > 0) return node;
    const tag = pool[Math.floor(rng() * pool.length)];
    return {
      ...node,
      challengeTags: [tag],
      defaultPolarity: "neutral",
    };
  });
}

/**
 * missionTags + 역할 가중으로 노드 challengeTags/defaultPolarity를 부여한다.
 * rng 미지정 시 missionId 해시 시드 사용 (결정론적).
 */
export function assignNodeChallenges(mission: Mission, rng?: () => number): MissionNode[] {
  const baseNodes = (mission.nodes?.length ? mission.nodes : resolveMissionNodes(mission)).map(
    (n) => ({ ...n })
  );
  const random = rng ?? createSeededRng(hashMissionId(mission.missionId));
  const tagsToAssign = assignableMissionTags(mission.missionTags);
  const assignedIndices = new Set<number>();

  for (const missionTag of tagsToAssign) {
    const candidate = MISSION_TAG_NODE_CANDIDATES[missionTag];
    const available = baseNodes
      .map((_, i) => i)
      .filter((i) => !assignedIndices.has(i));
    if (available.length === 0) break;

    const weights = available.map((i) => roleWeight(mission.missionType, baseNodes[i].role));
    const picked = weightedPickIndex(available, weights, random);
    assignedIndices.add(picked);

    baseNodes[picked] = {
      ...baseNodes[picked],
      challengeTags: [...candidate.challengeTags],
      defaultPolarity: candidate.defaultPolarity,
    };
  }

  const withFallback = applyContextTagFallback(baseNodes, mission.tier, random);
  return withFallback.map(normalizeNode);
}
