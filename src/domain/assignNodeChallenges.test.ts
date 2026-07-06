import { describe, expect, it } from "vitest";
import { createMockMission } from "../test/factories";
import type { Mission, MissionNode, StatKey, Tier } from "../data/types";
import {
  MISSION_TAG_NODE_CANDIDATES,
  ROLE_WEIGHT_BY_MISSION_TYPE,
  TIER_CONTEXT_TAGS,
} from "../data/missionTagMapping";
import { assignNodeChallenges } from "./assignNodeChallenges";

function fourNodeMission(overrides: Partial<Mission> = {}): Mission {
  const nodes: MissionNode[] = [
    { nameKo: "진입", role: "entry", statCheck: "frame" },
    { nameKo: "관문 A", role: "obstacle", statCheck: "frame" },
    { nameKo: "목표", role: "objective", statCheck: "frame" },
    { nameKo: "이탈", role: "exit", statCheck: "frame" },
  ];
  return createMockMission({ nodeCount: 4, nodes, ...overrides });
}

function nodesWithChallengeTag(nodes: MissionNode[], tagId: string): MissionNode[] {
  return nodes.filter((n) => (n.challengeTags ?? []).includes(tagId));
}

/** Gap A — 모든 노드가 최소 1개 challengeTag를 갖는지 검증 */
function assertEveryNodeHasChallengeTag(nodes: MissionNode[]): void {
  for (const node of nodes) {
    expect(
      node.challengeTags?.length ?? 0,
      `노드 "${node.nameKo}"(${node.role})에 challengeTags가 비어 있음`
    ).toBeGreaterThanOrEqual(1);
  }
}

function starNodeMission(stars: number, tier: Tier = "lower"): Mission {
  const roles = ["entry", "obstacle", "objective", "exit", "obstacle"] as const;
  const stats: StatKey[] = ["frame", "wire", "cypher", "cool", "pulse"];
  const nodes: MissionNode[] = Array.from({ length: stars }, (_, i) => ({
    nameKo: `노드 ${i + 1}`,
    role: roles[Math.min(i, roles.length - 1)],
    statCheck: stats[i % stats.length],
  }));
  return createMockMission({
    missionId: `mission_gap_a_${stars}star_${tier}`,
    difficultyStars: stars,
    nodeCount: stars,
    tier,
    nodes,
    missionTags: undefined,
  });
}

describe("missionTagMapping (Step 1 data)", () => {
  it("MISSION_TAG_NODE_CANDIDATES에 electric·gear_detection adverse 매핑이 있다", () => {
    expect(MISSION_TAG_NODE_CANDIDATES["tag_threat_electric"]).toEqual({
      challengeTags: ["tag_threat_electric"],
      defaultPolarity: "adverse",
    });
    expect(MISSION_TAG_NODE_CANDIDATES["tag_challenge_gear_detection"]).toEqual({
      challengeTags: ["tag_challenge_gear_detection"],
      defaultPolarity: "adverse",
    });
  });

  it("ROLE_WEIGHT_BY_MISSION_TYPE에 잠입 entry 가중이 있다", () => {
    expect(ROLE_WEIGHT_BY_MISSION_TYPE["잠입"]?.entry).toBeGreaterThan(
      ROLE_WEIGHT_BY_MISSION_TYPE["잠입"]?.obstacle ?? 0
    );
  });
});

describe("assignNodeChallenges (T-S1-1 ~ T-S1-4)", () => {
  it("T-S1-1: missionTags 없음 → 전 노드 neutral, tier context tag 폴백", () => {
    const mission = fourNodeMission({ missionTags: undefined });
    const result = assignNodeChallenges(mission);

    expect(result).toHaveLength(4);
    const lowerPool = new Set(TIER_CONTEXT_TAGS.lower);
    for (const node of result) {
      expect(node.defaultPolarity ?? "neutral").toBe("neutral");
      expect(node.challengeTags?.length ?? 0).toBeGreaterThanOrEqual(1);
      expect(lowerPool.has(node.challengeTags![0])).toBe(true);
    }
  });

  it("T-S1-1b: tag_context_generic만 있을 때 → 전 노드 neutral context 폴백", () => {
    const mission = fourNodeMission({ missionTags: ["tag_context_generic"] });
    const result = assignNodeChallenges(mission);

    const lowerPool = new Set(TIER_CONTEXT_TAGS.lower);
    for (const node of result) {
      expect(node.defaultPolarity ?? "neutral").toBe("neutral");
      expect(node.challengeTags?.length ?? 0).toBeGreaterThanOrEqual(1);
      expect(lowerPool.has(node.challengeTags![0])).toBe(true);
    }
  });

  it("T-S1-2: tag_threat_electric → 정확히 1노드 adverse (고정 RNG)", () => {
    const mission = fourNodeMission({
      missionTags: ["tag_threat_electric"],
    });
    const result = assignNodeChallenges(mission, () => 0);

    const electric = nodesWithChallengeTag(result, "tag_threat_electric");
    expect(electric).toHaveLength(1);
    expect(electric[0].defaultPolarity).toBe("adverse");

    const others = result.filter((n) => !electric.includes(n));
    const lowerPool = new Set(TIER_CONTEXT_TAGS.lower);
    for (const node of others) {
      expect(node.challengeTags?.length ?? 0).toBeGreaterThanOrEqual(1);
      expect(node.defaultPolarity ?? "neutral").toBe("neutral");
      expect(lowerPool.has(node.challengeTags![0])).toBe(true);
    }
  });

  it("T-S1-3: tag_challenge_gear_detection + 잠입 → entry 배정 비율이 obstacle보다 높고 100%는 아님", () => {
    let entryHits = 0;
    let obstacleHits = 0;

    for (let i = 0; i < 100; i++) {
      const mission = fourNodeMission({
        missionId: `mission_infil_weight_${i}`,
        missionType: "잠입",
        missionTags: ["tag_challenge_gear_detection"],
      });
      const result = assignNodeChallenges(mission);
      const assigned = nodesWithChallengeTag(result, "tag_challenge_gear_detection");
      expect(assigned).toHaveLength(1);
      if (assigned[0].role === "entry") entryHits++;
      if (assigned[0].role === "obstacle") obstacleHits++;
    }

    expect(entryHits).toBeGreaterThan(obstacleHits);
    expect(entryHits).toBeLessThan(100);
  });

  it("T-S1-4: 동일 challengeTag가 2노드 이상에 붙지 않는다", () => {
    const mission = fourNodeMission({
      missionTags: [
        "tag_threat_electric",
        "tag_challenge_gear_detection",
        "tag_threat_electric",
      ],
    });
    const result = assignNodeChallenges(mission, () => 0.5);

    const electricNodes = nodesWithChallengeTag(result, "tag_threat_electric");
    const detectionNodes = nodesWithChallengeTag(result, "tag_challenge_gear_detection");

    expect(electricNodes.length).toBeLessThanOrEqual(1);
    expect(detectionNodes.length).toBeLessThanOrEqual(1);
    expect(electricNodes.length + detectionNodes.length).toBeLessThanOrEqual(2);
  });
});

/** Gap A — 전 노드 Context Tag 폴백 (RED → GREEN) */
describe("Gap A — 전 노드 Context Tag 폴백 (T-GA)", () => {
  describe("TIER_CONTEXT_TAGS (Gap A 데이터)", () => {
    it("T-GA-0: lower/mid/upper 각 tier에 neutral context tag 풀이 1개 이상 있다", () => {
      for (const tier of ["lower", "mid", "upper"] as const) {
        expect(TIER_CONTEXT_TAGS[tier].length).toBeGreaterThanOrEqual(1);
        for (const tagId of TIER_CONTEXT_TAGS[tier]) {
          expect(tagId).toMatch(/^tag_context_/);
        }
      }
    });
  });

  it("T-GA-1: missionTags 없음(4노드) → 모든 노드 challengeTags.length >= 1", () => {
    const mission = fourNodeMission({ missionTags: undefined, difficultyStars: 4 });
    const result = assignNodeChallenges(mission);

    expect(result).toHaveLength(4);
    assertEveryNodeHasChallengeTag(result);
  });

  it("T-GA-2: tag_context_generic만 있을 때도 → 모든 노드에 context tag 부여", () => {
    const mission = fourNodeMission({ missionTags: ["tag_context_generic"] });
    const result = assignNodeChallenges(mission);

    expect(result).toHaveLength(4);
    assertEveryNodeHasChallengeTag(result);
    for (const node of result) {
      expect(node.defaultPolarity ?? "neutral").toBe("neutral");
    }
  });

  it("T-GA-3: adverse 1노드 할당 후 나머지 3노드도 context fallback (neutral)", () => {
    const mission = fourNodeMission({ missionTags: ["tag_threat_electric"] });
    const result = assignNodeChallenges(mission, () => 0);

    assertEveryNodeHasChallengeTag(result);

    const electric = nodesWithChallengeTag(result, "tag_threat_electric");
    expect(electric).toHaveLength(1);
    expect(electric[0].defaultPolarity).toBe("adverse");

    const others = result.filter((n) => !electric.includes(n));
    expect(others).toHaveLength(3);
    for (const node of others) {
      expect(node.defaultPolarity ?? "neutral").toBe("neutral");
      expect(node.challengeTags!.length).toBeGreaterThanOrEqual(1);
      expect(node.challengeTags).not.toContain("tag_threat_electric");
    }
  });

  it("T-GA-4: N성 미션 N노드 — difficultyStars와 nodes.length가 같을 때 전 노드 태그", () => {
    for (const stars of [1, 2, 3, 4, 5]) {
      const mission = starNodeMission(stars);
      const result = assignNodeChallenges(mission);

      expect(result).toHaveLength(stars);
      assertEveryNodeHasChallengeTag(result);
    }
  });

  it("T-GA-5: tier별 context tag — 하층 노드는 lower 풀, 중층은 mid 풀에서만 선택", () => {
    const lowerMission = starNodeMission(3, "lower");
    const midMission = starNodeMission(3, "mid");

    const lowerResult = assignNodeChallenges(lowerMission);
    const midResult = assignNodeChallenges(midMission);

    assertEveryNodeHasChallengeTag(lowerResult);
    assertEveryNodeHasChallengeTag(midResult);

    const lowerPool = new Set(TIER_CONTEXT_TAGS.lower);
    const midPool = new Set(TIER_CONTEXT_TAGS.mid);

    for (const node of lowerResult) {
      const tags = node.challengeTags ?? [];
      const contextTags = tags.filter((t) => t.startsWith("tag_context_"));
      if (contextTags.length > 0) {
        expect(contextTags.every((t) => lowerPool.has(t))).toBe(true);
      }
    }
    for (const node of midResult) {
      const tags = node.challengeTags ?? [];
      const contextTags = tags.filter((t) => t.startsWith("tag_context_"));
      if (contextTags.length > 0) {
        expect(contextTags.every((t) => midPool.has(t))).toBe(true);
      }
    }
  });
});
