/**
 * 테스트 전용 Mock 팩토리 (Option B: 상태 오염 방지 설계)
 *
 * - 각 `createMock*()` 함수는 호출마다 독립된 새 객체를 반환한다.
 * - `Partial<T>` 오버라이드를 지원하여 특정 필드만 교체해서 테스트 가능.
 * - seed.ts / 실제 GameState에 의존하지 않으므로 스위트 간 상태 오염이 없다.
 */

import type {
  GameState,
  Mercenary,
  Mission,
  StationState,
  ResultReport,
  MatchCase,
  PlayerBehavioralStats,
  FixerProfile,
} from "../data/types";

// ─── 기본 도메인 Mock ─────────────────────────────────────────────────────────

export function createMockMercenary(overrides: Partial<Mercenary> = {}): Mercenary {
  return {
    mercId: "mock_merc_01",
    displayNameKo: "테스트 용병",
    aliasKo: "테스터",
    originKo: "하층",
    contractTermsKo: "없음",
    stats: { frame: 50, cool: 50, wire: 50, cypher: 50, pulse: 50 },
    maxHp: 100,
    visibilityLevel: "low",
    commandCost: 3,
    phase0ProfileKo: "프로필 텍스트",
    phase1SummaryKo: "Phase 1 요약",
    phase2SummaryKo: "Phase 2 상세",
    systemTags: [],
    ...overrides,
  };
}

export function createMockMission(overrides: Partial<Mission> = {}): Mission {
  return {
    missionId: "mock_mission_01",
    displayNameKo: "테스트 미션",
    tier: "lower",
    missionType: "지원",
    difficultyStars: 2,
    nodeCount: 3,
    rewardCredits: 10000,
    earlyWithdrawalPenalty: 3000,
    phase0BriefingKo: "테스트 브리핑",
    phase1SummaryKo: "Phase 1 분석",
    phase2SummaryKo: "Phase 2 조건",
    successSummaryKo: "성공 요약",
    failureSummaryKo: "실패 요약",
    mechanics: {
      visibility_limit: 80,
      primary_stat: "frame",
      secondary_stat: "wire",
    },
    ...overrides,
  };
}

export function createMockResultReport(overrides: Partial<ResultReport> = {}): ResultReport {
  return {
    reportId: "mock_report_01",
    missionId: "mock_mission_01",
    mercId: "mock_merc_01",
    resultType: "success",
    rewardCredits: 10000,
    extraRewardCredits: 0,
    lostCredits: 0,
    summaryLogKo: "기본 정산 완료 로그",
    fulfilledConditionsKo: "조건 충족",
    missingConditionsKo: "없음",
    statusChanges: [],
    gearUpdates: [],
    implantUpdates: [],
    reputationChanges: [],
    followupHooks: [],
    ...overrides,
  };
}

export function createMockMatchCase(overrides: Partial<MatchCase> = {}): MatchCase {
  return {
    matchId: "mock_match_01",
    missionId: "mock_mission_01",
    mercId: "mock_merc_01",
    deploymentVerdict: "clear",
    successOutlook: "high",
    lossOutlook: "low",
    expectedResultType: "success",
    signals: [
      { signalType: "advantage", textKo: "안정적인 주요 스탯 (frame)" },
    ],
    ...overrides,
  };
}

// ─── StationState Mock ────────────────────────────────────────────────────────

export function createMockStationState(overrides: Partial<StationState> = {}): StationState {
  return {
    stationId: "mock_station_01",
    fixerId: "mock_fixer_01",
    category: "업무",
    facilityName: "테스트 아지트",
    locationTier: "하층",
    locationArea: "UNzone",
    level: 1,
    operatingCostPerTurn: 1000,
    analysisMercLv: 0,
    analysisMissionLv: 0,
    ...overrides,
  };
}

// ─── FixerProfile Mock ────────────────────────────────────────────────────────

export function createMockFixerProfile(overrides: Partial<FixerProfile> = {}): FixerProfile {
  return {
    fixerId: "mock_fixer_01",
    name: "테스트 픽서",
    codename: "테스터",
    origin: "상실자",
    backgroundTag: "#기억_공백",
    initialConnectionFaction: null,
    createdAt: "2026-06-18",
    ...overrides,
  };
}

// ─── PlayerBehavioralStats Mock ───────────────────────────────────────────────

export function createMockPlayerStats(overrides: Partial<PlayerBehavioralStats> = {}): PlayerBehavioralStats {
  return {
    fixerId: "mock_fixer_01",
    fame: 0,
    infamy: 0,
    missionCountByType: { 잠입: 0, 전투: 0, 지원: 0, 기업: 0, 비밀: 0, 교섭: 0, 추적: 0 },
    expertiseTags: [],
    totalCreditsEarned: 0,
    totalMercsLost: 0,
    areaInfluence: {},
    ...overrides,
  };
}

// ─── GameState Mock ───────────────────────────────────────────────────────────

/**
 * 완전히 독립된 GameState Mock 반환.
 * seed.ts를 전혀 참조하지 않아 테스트 격리가 보장된다.
 */
export function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    availableMissions: [],
    acceptedMissions: [],
    activeDispatches: [],
    completedDispatches: [],
    hiredMercs: [],
    ledger: 10000,
    mercStatuses: {},
    gearStates: {},
    implantStates: {},
    gearOwner: {},
    implantOwner: {},
    aiNarratorEnabled: false,
    factionReputation: {},
    followupHooks: [],
    settledReports: [],
    generatedReports: {},
    fixerProfile: null,
    stationState: null,
    playerBehavioralStats: createMockPlayerStats(),
    turnCount: 1,
    maxCommandPoints: 10,
    currentCommandPoints: 10,
    ...overrides,
  };
}
