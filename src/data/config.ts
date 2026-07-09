export const GAME_CONFIG = {
  // 출신지별 초기 크레딧
  originCredits: {
    하층_언존_태생: 15000,
    살아남은_폐기체: 0,
    버려진_사생아: 35000,
    추방자: 30000,
    몰락자: 20000,
    상실자: 30000,
    무지한_외부인: 50000,
  },
  // 스테이션 관련 밸런스
  station: {
    upgradeCostMultiplier: 25000,
    operatingCostBaseMultiplier: 1000,
    /** 시설 Tier 1 → 2 업그레이드 비용 */
    facilityUpgradeCost: 20000,
  },
  // 용병 관련 밸런스
  mercenary: {
    hiringCostMultiplier: 5000,
    replacementCost: 15000,
    /** 구역별 긍정 태그 생존율 보정 (%) — 하·중층 +15, 상층 +20 */
    tagSurvivalBonusByTier: {
      lower: 15,
      mid: 15,
      upper: 20,
    },
    /** 구역별 부정 태그 생존율 페널티 (%) — 하층 -20, 중층 -25, 상층 -30 */
    tagSurvivalPenaltyByTier: {
      lower: -20,
      mid: -25,
      upper: -30,
    },
    /** 기대 지분 대비 1%p 미달당 불만도 스택 (D-F) */
    dissatisfactionPerPercentShortfall: 1,
  },
  // 미션 방치(Decay) — 게시판 미션 카드 방치 시간(턴)
  mission: {
    /** 신규 게시 미션 기본 방치 잔여 턴 */
    decayTurnsDefault: 3,
  },
  // 미션 난이도 밸런스
  difficulty: {
    /** 기본 스탯 허들. statThreshold = base + (stars * perStar) */
    statThresholdBase: 30,
    statThresholdPerStar: 5,
    /** 난이도별 노드당 피로도. 인덱스 0은 미사용(1성부터 시작). */
    fatiguePerNodeByDifficulty: [0, 3, 5, 8, 12, 18],
  },
  /** 노드 태그 해석 브리지 (node_modifier 축) */
  judgment: {
    nodePositivePercent: 18,
    nodeNegativePercent: -22,
    adverseBasePenaltyPercent: -12,
  },
  // 캐치업(현장 개입) 모드
  catchUp: {
    costMultiplier: 1.5, // 지휘력 코스트 배수 (올림 적용)
    nodePenaltyPercent: 15, // 개입 노드 부정 확률 +15%p (통과 확률 -15)
    interventionRatio: 0.3, // 최대 개입 노드 비율 (ceil)
    bonusRewardPercent: 15, // 개입 노드 통과 + 보상 발생 시 extraRewardCredits 가산 (%)
  },
  // AI 관련 밸런스
  ai: {
    aiNarratorEnabled: true, // run_mvp / 로컬 AI 모드 기본 ON (출격 후 토글 시 FALLBACK 고착 방지)
  }
} as const;

