import type { QueuedNode, TagMissionInterpretation } from "../data/types";

/** 테스트 전용 challenge tag_id — 특정 미션 시나리오 아님 */
export const TEST_CHALLENGE_ELECTRIC = "tag_threat_electric";
export const TEST_CHALLENGE_GEAR_DETECTION = "tag_challenge_gear_detection";

export const TEST_GEAR_VISIBLE_ID = "gear_test_visible_01";
export const TEST_GEAR_CONCEALED_ID = "gear_test_concealed_01";
export const TEST_GEAR_INSULATED_ID = "gear_test_insulated_01";

export function createTestNeutralNode(overrides: Partial<QueuedNode> = {}): QueuedNode {
  return {
    nodeInstanceId: "test_node_neutral",
    nameKo: "일반 관문",
    role: "obstacle",
    statCheck: "frame",
    nodeKind: "basic_gate",
    challengeTags: [],
    defaultPolarity: "neutral",
    ...overrides,
  };
}

export function createTestAdverseNode(
  challengeTags: string[],
  overrides: Partial<QueuedNode> = {}
): QueuedNode {
  return createTestNeutralNode({
    nodeInstanceId: "test_node_adverse",
    defaultPolarity: "adverse",
    challengeTags,
    ...overrides,
  });
}

/** 최소 해석 규칙 — 프로덕션 TAG_MISSION_INTERPRETATIONS와 분리 */
export const TEST_NODE_INTERPRETATIONS: TagMissionInterpretation[] = [
  {
    ruleId: "test_insulated_electric",
    tagId: "tag_gear_insulated_work_habit",
    context: { challengeTag: TEST_CHALLENGE_ELECTRIC },
    reading: "positive",
    judgmentAxis: "node_modifier",
  },
  {
    ruleId: "test_visible_detection",
    tagId: "tag_gear_weapon_visible",
    context: { challengeTag: TEST_CHALLENGE_GEAR_DETECTION },
    reading: "negative",
    judgmentAxis: "node_modifier",
  },
  {
    ruleId: "test_concealed_detection",
    tagId: "tag_gear_concealed_carry",
    context: { challengeTag: TEST_CHALLENGE_GEAR_DETECTION },
    reading: "positive",
    judgmentAxis: "node_modifier",
  },
];
