export type StatKey = "frame" | "cool" | "wire" | "cypher" | "pulse";

export type Tier = "lower" | "mid" | "upper";

/** 스테이션 및 미션 위치 레이어 (한글 표현) */
export type LocationTier = "하층" | "중층" | "상층";

/** 장비/임플란트의 상태값. normal은 정상 상태. */
export type GearStateValue = "normal" | "worn" | "damaged" | "overheated" | "repaired" | "lost" | "destroyed";

// --- World State Phase D 타입 ---

export type FixerOrigin =
  | "하층_언존_태생"
  | "살아남은_폐기체"
  | "버려진_사생아"
  | "추방자"
  | "몰락자"
  | "상실자"
  | "무지한_외부인";

export type StationCategory = "숙박" | "유흥" | "식사" | "장비" | "업무";

export type FacilityId =
  | "lodging_patch_den"
  | "entertainment_alley_bar"
  | "meal_field_kitchen"
  | "gear_shadow_pawn"
  | "work_signal_relay";

export type StationFacilityTier = 1 | 2;
export type MissionTypeKey = "잠입" | "전투" | "지원" | "기업" | "비밀" | "교섭" | "추적";

// --- 태그 시스템 (03_태그_사전 / 미션 태그 해석 규칙.md) ---

/** 시스템 태그 vs 이야기 태그 */
export type TagKind = "system" | "story";

/** 공용 vs 전용 */
export type TagScope = "common" | "dedicated";

/** 주 분류 10개 (태그 분류 규칙.md §3) */
export type TagPrimaryClass =
  | "appearance_visibility"
  | "personality_behavior"
  | "origin_affiliation"
  | "skill_technique"
  | "weapon"
  | "implant"
  | "relationship_reputation"
  | "contract_economy"
  | "status_trait"
  | "story_secret";

/** 관계 묶음 9개 (00_태그 관계도.md §2) */
export type TagRelationshipBundle =
  | "gear_operation"
  | "operation_condition"
  | "appearance_visibility"
  | "world_affiliation"
  | "commission_structure"
  | "personality_disposition"
  | "economy_contract"
  | "status_aftereffect"
  | "production_distribution";

/** 태그가 붙을 수 있는 대상 */
export type TagAttachableEntity =
  | "mercenary"
  | "gear"
  | "implant"
  | "mission"
  | "region"
  | "faction"
  | "npc";

/** 분석 Phase (정보 노출 강도 규칙.md) */
export type AnalysisPhase = 0 | 1 | 2;

/** 미션이 태그를 읽는 4가지 방식 (미션 태그 해석 규칙.md §2) */
export type TagMissionReading = "positive" | "negative" | "ignore" | "special";

/** 시스템 태그 판정 축 (시스템 태그 규칙.md §6) */
export type TagJudgmentAxis =
  | "entry_gate"
  | "gate_modifier"
  | "survival_modifier"
  | "node_modifier"
  | "emergency_node"
  | "joker_card"
  | "settlement";

/** 태그 부착 출처 (AI 서사·triggeredTags용) */
export type TagSourceType = "mercenary" | "gear" | "implant" | "status";

/** 판정에 실제 기여한 태그 — 출처 분리 */
export interface TriggeredTag {
  tagId: string;
  sourceType: TagSourceType;
  sourceId: string;
  ruleId: string;
  reading: "positive" | "negative" | "special";
}

/** 미션 조건 3단계 (미션 태그 해석 규칙.md §4) */
export type MissionConditionTier = "mandatory" | "recommended" | "bonus";

/** MVP CSV mercenary_tags.csv 호환 카테고리 */
export type MvpCsvTagCategory =
  | "operation"
  | "origin"
  | "gear"
  | "implant"
  | "appearance"
  | "condition"
  | "behavior";

/**
 * 태그 마스터 — 속성만 정의. 수치·효과 필드 금지.
 */
export interface TagDef {
  tagId: string;
  displayNameKo: string;
  kind: TagKind;
  scope: TagScope;
  primaryClass: TagPrimaryClass;
  relationshipBundles?: TagRelationshipBundle[];
  attachableTo: TagAttachableEntity[];
  visibility: TagPhaseVisibility;
  dedicatedContext?: TagDedicatedContext;
  legacyAliases?: string[];
  docAliases?: string[];
  mvpCsvCategory?: MvpCsvTagCategory;
  noteKo?: string;
}

export interface TagPhaseVisibility {
  nameRevealFromPhase: AnalysisPhase;
  mayHideThroughPhase2?: boolean;
}

export interface TagDedicatedContext {
  factionId?: string;
  regionId?: string;
  scopeRef?: string;
}

/** 미션 해석 규칙 적용 맥락 — 미지정 필드는 와일드카드 */
export interface TagInterpretationContext {
  missionType?: MissionTypeKey | MissionTypeKey[];
  tier?: Tier | Tier[];
  nodeRole?: NodeRole | NodeRole[];
  nodeKind?: "basic_gate" | "emergency" | "joker";
  /** 노드가 읽는 challenge tag_id (와일드카드: 미지정) */
  challengeTag?: string | string[];
}

/**
 * 미션이 특정 맥락에서 태그를 어떻게 읽는지. 수치 필드 없음.
 */
export interface TagMissionInterpretation {
  ruleId: string;
  tagId: string;
  context: TagInterpretationContext;
  reading: TagMissionReading;
  readPriority?: "high" | "low";
  judgmentAxis: TagJudgmentAxis;
  designNoteKo?: string;
}

/** 엔티티 ↔ 태그 부착 (mercenary_tags.csv) */
export interface EntityTagLink {
  entityType: TagAttachableEntity;
  entityId: string;
  tagId: string;
  visibilityPhase: AnalysisPhase;
  noteKo?: string;
}

/** 용병 ↔ 런타임 상태 (mercenary_statuses.csv) */
export interface MercenaryStatusLink {
  mercId: string;
  statusId: string;
  noteKo?: string;
}

export type MissionConditionTarget =
  | { kind: "tag"; tagId: string }
  | { kind: "gear"; gearId: string }
  | { kind: "implant"; implantId: string }
  | { kind: "stat"; statKey: StatKey; minValue: number }
  | { kind: "visibility"; maxLevel: string };

export interface MissionTagCondition {
  missionId: string;
  tier: MissionConditionTier;
  target: MissionConditionTarget;
  phase0HintKo?: string;
  noteKo?: string;
}

/** B-2: 미션 출격 전 필수 조건 — 미충족 시 block 또는 force_risk */
export type EntryGateFailureMode = "block" | "force_risk";

export interface EntryGateSpec {
  requirements: MissionConditionTarget[];
  failureMode: EntryGateFailureMode;
  /** force_risk 시 주입할 위험 노드 표시명 */
  forcedRiskNodeNameKo?: string;
}

export type EntryGateOutcome = "clear" | "blocked" | "forced_risk";

export interface EntryGateEvaluation {
  outcome: EntryGateOutcome;
  unmetRequirements: MissionConditionTarget[];
  logKo?: string;
}

export interface FixerProfile {
  fixerId: string;
  name: string;
  codename: string;
  origin: FixerOrigin;
  backgroundTag: string;
  initialConnectionFaction: string | null;
  createdAt: string;
}

export interface StationState {
  stationId: string;
  fixerId: string;
  category: StationCategory;
  facilityId: FacilityId;
  facilityTier: StationFacilityTier;
  facilityName: string;
  locationTier: LocationTier;
  locationArea: string;
  level: number;
  operatingCostPerTurn: number;
  analysisMissionLv: number;
  predictAnalysisLv: number;
}

export interface PlayerBehavioralStats {
  fixerId: string;
  fame: number;    // 신뢰 기반 명성. 0~100. Fame을 깎아서 Infamy 올리는 구조 아님.
  infamy: number;  // 공포 기반 악명. 0~100. Fame과 독립.
  missionCountByType: Record<MissionTypeKey, number>;
  expertiseTags: string[];
  totalCreditsEarned: number;
  totalMercsLost: number;
  areaInfluence: Record<string, number>;
}

// --- 기존 타입 ---


export type DeploymentVerdict = "clear" | "warning" | "locked";

export type ResultType =
  | "success"
  | "partial_success"
  | "failure"
  | "early_withdrawal"
  | "incident";

export type Outlook = "low" | "medium" | "high";

export interface StatDef {
  statKey: StatKey;
  displayNameKo: string;
  descriptionKo: string;
}

/** 노드의 역할. 성공/실패의 '의미'가 역할마다 다르다. */
export type NodeRole = "entry" | "obstacle" | "objective" | "exit";

export type NodeKind = "basic_gate" | "emergency" | "joker";

/** neutral: 스탯 중심 / adverse: 디폴트 불리(걸리면 손해) */
export type NodePolarity = "neutral" | "adverse";

/** 미션을 구성하는 개별 노드(관문). 역할과 판정 스탯을 가진다. */
export interface MissionNode {
  nameKo: string;
  role: NodeRole;
  statCheck: StatKey;
  /** 이 노드가 읽는 challenge tag_id 목록 */
  challengeTags?: string[];
  defaultPolarity?: NodePolarity;
}

/** 실행 큐에 올라가는 노드 인스턴스 */
export interface QueuedNode {
  nodeInstanceId: string;
  templateId?: string;
  nameKo: string;
  role: NodeRole;
  statCheck: StatKey;
  nodeKind: NodeKind;
  challengeTags: string[];
  defaultPolarity: NodePolarity;
}

export type NodeOutcome = "pass" | "minor" | "critical";

export interface NodeResolutionLog {
  nodeInstanceId: string;
  nameKo: string;
  role: NodeRole;
  outcome: NodeOutcome;
  logKo: string;
  challengeTags: string[];
  triggeredTags: TriggeredTag[];
  /** 노드 판정 시점 통과 확률 (내부 팩트 — 서사·Phase 2용) */
  passChance: number;
  /** 태그 해석으로 인한 통과 확률 변동 (%p) */
  tagPassChanceDelta: number;
  /** 캐치업(현장 개입) 대상 노드였는지 — 서사에 픽서 개입 팩트 전달용 */
  intervened?: boolean;
}

export interface MissionRunContext {
  missionId: string;
  mercId: string;
  flags: Record<string, boolean | number | string>;
  seizedGearIds: string[];
  detectedAtNodeIndex: number | null;
  visibilityAccumulated: number;
  emergencyCount: number;
  allTriggeredTags: TriggeredTag[];
}

export type RoutingDecision =
  | { action: "continue" }
  | { action: "inject"; position: "next" | "before_exit"; nodes: QueuedNode[] }
  | { action: "goto_phase"; phase: "survival" | "settlement" }
  | { action: "goto_node"; nodeInstanceId: string };

export interface Mission {
  missionId: string;
  displayNameKo: string;
  tier: Tier;
  missionType: string;
  difficultyStars: number;
  nodeCount: number;
  /** 생성기가 부여하는 미션 맥락 태그 (가중·노드 조립은 다음 스프린트) */
  missionTags?: string[];
  /** 역할이 부여된 노드 목록. 없으면 nodeCount로 기본 역할을 파생한다. */
  nodes?: MissionNode[];
  rewardCredits: number;
  earlyWithdrawalPenalty: number;
  durationMs?: number; // MVP 테스트용 파견 소요 시간
  requiredHookId?: string; // 특정 후속 단서가 있어야 해금되는 미션
  phase0BriefingKo: string;
  phase1SummaryKo: string;
  phase2SummaryKo: string;
  successSummaryKo: string;
  failureSummaryKo: string;
  mechanics?: {
    visibility_limit: number;
    primary_stat: StatKey;
    secondary_stat: StatKey;
  };
  /** B-2: 진입 게이트 — 출격 전 필수 조건 판정 */
  entryGate?: EntryGateSpec;
}

export interface AnalysisSlotEntry {
  targetId: string | null;
  progress: number;
}

export interface AnalysisSlotsState {
  /** 미션 분석 슬롯 1칸 (용병 슬롯은 Option B에서 폐지) */
  mission: AnalysisSlotEntry;
}

export interface GameState {
  // 기존 필드 (변경 없음)
  availableMissions: string[];
  acceptedMissions: string[];
  activeDispatches: ActiveDispatch[];
  completedDispatches: CompletedDispatch[];
  hiredMercs: string[]; // 새로 추가: 고용된 용병 ID 목록
  ledger: number;
  mercStatuses: Record<string, string[]>;
  /** 용병별 불만도 스택 (D-F). E-9 만족도 이벤트 토대 */
  mercDissatisfactionStacks: Record<string, number>;
  /** 액티브 분석 슬롯 — 미션 기관 1칸 (Option B: 용병 슬롯 폐지) */
  analysisSlots: AnalysisSlotsState;
  /** 게시판 미션별 방치 잔여 턴 (missionId → turns). D-E Decay 정지 연동 */
  missionDecayTimers: Record<string, number>;
  gearStates: Record<string, GearStateValue>;
  implantStates: Record<string, GearStateValue>;
  gearOwner: Record<string, string>; // 새로 추가: 장비 ID별 소유 용병 ID 매핑
  implantOwner: Record<string, string>; // 새로 추가: 임플란트 ID별 소유 용병 ID 매핑
  aiNarratorEnabled: boolean; // 새로 추가: 로컬 AI 브리핑 활성화 여부
  factionReputation: Record<string, number>;
  followupHooks: string[];
  settledReports: string[];
  generatedReports: Record<string, ResultReport>;

  // World State Phase D 필드
  /** 게임 시작 시 캐릭터 생성으로 세팅된다. 생성 전에는 null. */
  fixerProfile: FixerProfile | null;
  /** 픽서의 스테이션 정보. 캐릭터 생성 시 세팅. 생성 전에는 null. */
  stationState: StationState | null;
  /** 플레이어 행동 누적 통계. Fame/Infamy 독립 수치. */
  playerBehavioralStats: PlayerBehavioralStats;

  // 턴(Turn) 및 지휘력(Command Capacity) 필드
  turnCount: number;
  maxCommandPoints: number;
  currentCommandPoints: number;
}

export interface ActiveDispatch {
  dispatchId: string;
  missionId: string;
  mercId: string;
  startTime: number;
  endTime: number;
}

export interface CompletedDispatch {
  dispatchId: string;
  missionId: string;
  mercId: string;
}

export interface Mercenary {
  mercId: string;
  displayNameKo: string;
  aliasKo: string;
  originKo: string;
  contractTermsKo: string;
  stats: Record<StatKey, number>;
  maxHp: number;
  visibilityLevel: string;
  commandCost: number; // 픽서의 지휘력을 소모하는 코스트
  hiringCost?: number; // 고용 시 필요한 크레딧 비용
  phase0ProfileKo: string;
  phase1SummaryKo: string;
  phase2SummaryKo: string;
  /** canonical tagId (`tagDefinitions.ts`). 레거시 한글 별칭도 판정 시 해석된다. */
  systemTags: string[];
  /** 이야기 태그 — 판정 직결 없음, 서사·이벤트용 (이야기 태그 규칙.md) */
  storyTags?: string[];
  /** 용병 요구 보수 지분 (0~1). 정산 시 미달하면 불만도 누적 (D-F) */
  expectedShareRate?: number;
}

export type SignalType = "advantage" | "disadvantage" | "conditional" | "unknown";

export interface MatchSignal {
  signalType: SignalType;
  textKo: string;
}

export interface MatchCase {
  matchId: string;
  missionId: string;
  mercId: string;
  deploymentVerdict: DeploymentVerdict;
  successOutlook: Outlook;
  lossOutlook: Outlook;
  expectedResultType: ResultType;
  signals: MatchSignal[];
}

export type StatusChangeType = "add" | "worsen" | "remove" | "maintain";
export type GearUpdateType = "worn" | "damaged" | "overheated" | "repaired" | "lost";

export interface StatusChange {
  statusId: string;
  changeType: StatusChangeType;
  noteKo: string;
}

export interface GearUpdate {
  gearId: string;
  updateType: GearUpdateType;
  repairCost: number;
  noteKo: string;
}

export interface ImplantUpdate {
  implantId: string;
  updateType: GearUpdateType;
  repairCost: number;
  noteKo: string;
}

export interface ReputationChange {
  factionId: string;
  reputationDelta: number;
  noteKo: string;
}

export interface FollowupHook {
  hookId: string;
  displayNameKo: string;
  hookSummaryKo: string;
}

/** 캐치업(현장 개입) 설정 — 실행기 옵트인 파라미터 */
export interface CatchUpConfig {
  /** 픽서가 직접 개입할 노드들의 표시 이름(nameKo) 목록 */
  interventionNodeNamesKo: string[];
}

/** AI 작전 일지 서사 모드 — 어사인=용병 1인칭 / 캐치업=픽서(관제소) 1인칭 */
export type NarrativeMode = "merc_diary" | "fixer_field_log";

export interface ResultReport {
  reportId: string;
  missionId: string;
  mercId: string;
  resultType: ResultType;
  rewardCredits: number;
  extraRewardCredits: number;
  lostCredits: number;
  summaryLogKo: string;
  fulfilledConditionsKo: string;
  missingConditionsKo: string;
  /** 용병이 마주친 노드별 현장 서술. 순서대로 노드차를 설명. */
  nodeLogKo?: string[];
  /** 구조화 노드 판정 로그 (triggeredTags 포함) */
  nodeResolutions?: NodeResolutionLog[];
  /** 캐치업 개입 노드가 하나라도 통과해 추가 보상 자격을 얻었는지 (캐치업 미사용 시 undefined) */
  catchUpBonusEarned?: boolean;
  /** 캐치업(현장 개입) 모드로 파견되었는지 — UI·서사 모드 분기용 */
  catchUpActive?: boolean;
  /** 미션 전체 triggeredTags 합집합 — AI 1차 입력 */
  triggeredTags?: TriggeredTag[];
  /** 파견 임시 상태 스냅샷 (압수·플래그 등) */
  runContextSnapshot?: Partial<MissionRunContext>;
  statusChanges: StatusChange[];
  gearUpdates: GearUpdate[];
  implantUpdates: ImplantUpdate[];
  reputationChanges: ReputationChange[];
  followupHooks: FollowupHook[];
  aiNarrativeKo?: string;
}

export type StatusCategory =
  | "fatigue"
  | "mental"
  | "injury"
  | "gear_damage"
  | "implant_damage"
  | "exposure";

export type StatusSeverity = "minor" | "moderate" | "severe";
export type StatusSourceType = "preexisting" | "result";
export type StatusDurationType = "temporary" | "persistent";

/**
 * 상태 태그 마스터 (statuses.csv) — TagDef와 별도 체계.
 */
export interface StatusDef {
  statusId: string;
  displayNameKo: string;
  category: StatusCategory;
  severity: StatusSeverity;
  sourceType: StatusSourceType;
  effectSummaryKo: string;
  durationType: StatusDurationType;
  recoveryConditionKo?: string;
  nextMissionRiskKo?: string;
  revealImmediatelyOnAcquire: boolean;
  isMvp?: boolean;
}

export interface GearDef {
  gearId: string;
  displayNameKo: string;
  /** 노드 판정 시 해당 스탯에 가산되는 보정값 (기획: 스탯 + 장비 보정) */
  statBonuses?: Partial<Record<StatKey, number>>;
}

export interface ImplantDef {
  implantId: string;
  displayNameKo: string;
  statBonuses?: Partial<Record<StatKey, number>>;
}

export interface FactionDef {
  factionId: string;
  displayNameKo: string;
}
