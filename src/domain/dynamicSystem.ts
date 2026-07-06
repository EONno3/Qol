import type { MatchCase, MatchSignal, Mercenary, Mission, Outlook, ResultReport, ResultType } from "../data/types";
import { GAME_CONFIG } from "../data/config";
import type { DispatchLoadoutContext } from "./gearStatBonus";
import { getEffectiveStatForNode } from "./gearStatBonus";
import { MISSION_TAG_NODE_CANDIDATES } from "../data/missionTagMapping";
import { TAG_MISSION_INTERPRETATIONS } from "../data/tagMissionInterpretations";
import { resolveLoadoutTagAttributions, resolveMercenaryTagAttributions } from "./mercTagPool";

const visibilityNum: Record<string, number> = {
  very_low: 20,
  low: 40,
  medium: 60,
  high: 80,
  very_high: 100,
};

const CHALLENGE_SIGNAL_LABEL: Record<string, string> = {
  tag_threat_electric: "전기",
  tag_challenge_gear_detection: "장비 탐지",
};

function appendChallengeTagSignals(
  mission: Mission,
  merc: Mercenary,
  loadout: DispatchLoadoutContext | undefined,
  signals: MatchSignal[]
): { advantage: number; disadvantage: number } {
  let advantage = 0;
  let disadvantage = 0;
  const missionTags = (mission.missionTags ?? []).filter(
    (t) => t !== "tag_context_generic" && MISSION_TAG_NODE_CANDIDATES[t]
  );
  if (missionTags.length === 0) return { advantage: 0, disadvantage: 0 };

  const attributed = [
    ...resolveMercenaryTagAttributions(merc),
    ...(loadout ? resolveLoadoutTagAttributions(merc.mercId, loadout) : []),
  ];
  const seenRules = new Set<string>();

  for (const missionTag of missionTags) {
    const challengeTag = MISSION_TAG_NODE_CANDIDATES[missionTag].challengeTags[0];
    const label = CHALLENGE_SIGNAL_LABEL[challengeTag] ?? "현장";

    for (const rule of TAG_MISSION_INTERPRETATIONS) {
      if (rule.judgmentAxis !== "node_modifier") continue;
      if (rule.context.challengeTag !== challengeTag) continue;
      if (seenRules.has(rule.ruleId)) continue;
      if (!attributed.some((a) => a.tagId === rule.tagId)) continue;
      seenRules.add(rule.ruleId);

      if (rule.reading === "positive") {
        signals.push({ signalType: "advantage", textKo: `${label} 위협 대응 자질 보유` });
        advantage++;
      } else if (rule.reading === "negative") {
        signals.push({ signalType: "disadvantage", textKo: `${label} 위협에 취약한 자질` });
        disadvantage++;
      }
    }
  }

  return { advantage, disadvantage };
}

export function calculateDynamicMatch(
  mission: Mission,
  merc: Mercenary,
  loadout?: DispatchLoadoutContext
): MatchCase {
  const signals: MatchSignal[] = [];
  let advantageCount = 0;
  let disadvantageCount = 0;

  if (mission.mechanics) {
    const { primary_stat, secondary_stat, visibility_limit } = mission.mechanics;

    const statThreshold =
      GAME_CONFIG.difficulty.statThresholdBase +
      mission.difficultyStars * GAME_CONFIG.difficulty.statThresholdPerStar;

    const primaryVal = getEffectiveStatForNode(
      merc.mercId,
      merc.stats[primary_stat] ?? 0,
      primary_stat,
      loadout
    );
    if (primaryVal >= statThreshold + 10) {
      signals.push({ signalType: "advantage", textKo: `압도적인 주요 스탯 (${primary_stat})` });
      advantageCount += 2;
    } else if (primaryVal >= statThreshold) {
      signals.push({ signalType: "advantage", textKo: `안정적인 주요 스탯 (${primary_stat})` });
      advantageCount += 1;
    } else {
      signals.push({ signalType: "disadvantage", textKo: `부족한 주요 스탯 (${primary_stat})` });
      disadvantageCount += 2;
    }

    const secondaryVal = getEffectiveStatForNode(
      merc.mercId,
      merc.stats[secondary_stat] ?? 0,
      secondary_stat,
      loadout
    );
    if (secondaryVal >= statThreshold) {
      signals.push({ signalType: "advantage", textKo: `우수한 보조 스탯 (${secondary_stat})` });
      advantageCount += 1;
    } else if (secondaryVal < statThreshold - 10) {
      signals.push({ signalType: "disadvantage", textKo: `취약한 보조 스탯 (${secondary_stat})` });
      disadvantageCount += 1;
    }

    const mercVis = visibilityNum[merc.visibilityLevel] ?? 60;
    if (mercVis > visibility_limit) {
      signals.push({ signalType: "disadvantage", textKo: `가시성 한계 초과 위험` });
      disadvantageCount += 3;
    } else if (mercVis <= visibility_limit - 20) {
      signals.push({ signalType: "advantage", textKo: `은밀한 기동 가능` });
      advantageCount += 1;
    }
  } else {
    signals.push({ signalType: "unknown", textKo: `AI 현장 지표 미확인` });
  }

  const challengeFx = appendChallengeTagSignals(mission, merc, loadout, signals);
  advantageCount += challengeFx.advantage;
  disadvantageCount += challengeFx.disadvantage;

  let deploymentVerdict: "clear" | "warning" | "locked" = "clear";
  let successOutlook: Outlook = "medium";
  let lossOutlook: Outlook = "low";
  let expectedResultType: ResultType = "success";

  const score = advantageCount - disadvantageCount;

  if (score >= 2) {
    deploymentVerdict = "clear";
    successOutlook = "high";
    lossOutlook = "low";
    expectedResultType = "success";
  } else if (score >= -1) {
    deploymentVerdict = "clear";
    successOutlook = "medium";
    lossOutlook = "medium";
    expectedResultType = "partial_success";
  } else if (score >= -3) {
    deploymentVerdict = "warning";
    successOutlook = "low";
    lossOutlook = "high";
    expectedResultType = "failure";
  } else {
    deploymentVerdict = "locked";
    successOutlook = "low";
    lossOutlook = "high";
    expectedResultType = "incident";
  }

  return {
    matchId: `dyn_match_${mission.missionId}_${merc.mercId}`,
    missionId: mission.missionId,
    mercId: merc.mercId,
    deploymentVerdict,
    successOutlook,
    lossOutlook,
    expectedResultType,
    signals,
  };
}

export function calculateDynamicReport(mission: Mission, merc: Mercenary, match: MatchCase): ResultReport {
  let reward = 0;
  let summary = "";

  if (match.expectedResultType === "success") {
    reward = mission.rewardCredits;
    summary = "작전 목표를 성공적으로 달성하고 무사히 복귀했습니다.";
  } else if (match.expectedResultType === "partial_success") {
    reward = Math.floor(mission.rewardCredits * 0.7);
    summary = "일부 차질이 있었으나 주요 목표물은 확보했습니다.";
  } else {
    reward = 0;
    summary = "현장의 변수에 밀려 작전을 실패하고 퇴각했습니다.";
  }

  const nodeLogKo = [];
  for (let i = 0; i < mission.nodeCount; i++) {
    const nodeData = (mission as { nodes?: { name: string }[] }).nodes?.[i];
    const nodeName = nodeData ? nodeData.name : `진행 단계 ${i + 1}`;
    nodeLogKo.push(`[${i + 1}노드] ${nodeName} - 현장 대응 완료.`);
  }

  return {
    reportId: `dyn_report_${mission.missionId}_${merc.mercId}`,
    missionId: mission.missionId,
    mercId: merc.mercId,
    resultType: match.expectedResultType,
    rewardCredits: reward,
    extraRewardCredits: 0,
    lostCredits: match.expectedResultType === "success" ? 0 : Math.floor(mission.rewardCredits * 0.2),
    summaryLogKo: summary,
    fulfilledConditionsKo: "AI 동적 분석 결과 반영됨",
    missingConditionsKo: "없음",
    nodeLogKo,
    statusChanges: [],
    gearUpdates: [],
    implantUpdates: [],
    reputationChanges: [],
    followupHooks: [],
  };
}
