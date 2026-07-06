import generatedMissionsRaw from "./generated_missions.json";
import { GAME_CONFIG } from "./config";
import type {
  FactionDef,
  GearDef,
  ImplantDef,
  MatchCase,
  Mercenary,
  Mission,
  ResultReport,
  StatDef,
  StatusDef,
} from "./types";
import { STATUS_DEFINITIONS } from "./statusDefinitions";
import { mapDangerTextToMissionTags } from "./missionTagMapping";
import { assignNodeChallenges } from "../domain/assignNodeChallenges";
import { resolveMissionNodes } from "../domain/missionNodes";

export const stats: StatDef[] = [
  { statKey: "frame", displayNameKo: "프레임", descriptionKo: "육체, 하드웨어 수용성, 전투 생존, 중화기 운용." },
  { statKey: "cool", displayNameKo: "쿨", descriptionKo: "침착함, 정신 마모 저항, 협상, 사이버싸이코 억제." },
  { statKey: "wire", displayNameKo: "와이어", descriptionKo: "네트워크, 해킹, 기계 조작, 지원." },
  { statKey: "cypher", displayNameKo: "사이퍼", descriptionKo: "은닉, 흔적 제거, 현장 분석, 잠입." },
  { statKey: "pulse", displayNameKo: "펄스", descriptionKo: "직관, 돌발 감지, 비정형 위기 대응." },
];

// 정적 미션: 일반 게임 보드에는 노출되지 않는다(보드는 AI 생성 미션만 사용).
// 용도 (1) 결정론적 테스트 픽스처 — 매칭(matchCase)/보고서(report)가 미리 정의되어 있어
//        matching/settlement/App 통합 테스트의 고정 검증값으로 쓰인다.
//      (2) AI 생성 미션이 0개일 때의 보드 폴백 (state.createInitialState 참고)
//      (3) 향후 스토리 퀘스트를 정적 미션으로 추가할 때의 작성 틀
export const staticMissions: Mission[] = [
  {
    missionId: "mission_lower_fuse_capacitor_01",
    displayNameKo: "더 퓨즈 제3변전소 고압 캐패시터 적출",
    tier: "lower",
    missionType: "지원",
    difficultyStars: 2,
    nodeCount: 4,
    rewardCredits: 16500,
    earlyWithdrawalPenalty: 3000,
    durationMs: 60000, // 1분 (테스트용)
    phase0BriefingKo: "『발신: [암호화됨] / 수신: 픽서』 하층 '더 퓨즈' 제3변전소의 고압 캐패시터가 필요하다. 보안 넷러너가 눈치채기 전에 물리적으로 '적출'할 손빠른 놈을 보내. 감전으로 튀겨지든 말든 내 알 바 아니지만, 기판에 흠집이 나면 보수는 없다.",
    phase1SummaryKo:
      "『분석소 코멘트』 이 구역 송전망은 스파게티 코드 그 자체야. 전자기 방전에 익숙한 슬럼 출신이 아니면 통구이가 되기 십상이지. 금속제 크롬을 떡칠한 놈은 피하는 게 상책이다.",
    phase2SummaryKo: "『시스템 경고: 필수 장비 누락 시 치명적 결과 초래』 고무 재질 전신 절연 안전화 필수. 요구 스탯 [프레임 50+] [와이어 45+].",
    successSummaryKo: "『작전 완료 로그』 16,500 cr 입금 확인. 캐패시터 유닛 온전함. 현지 '더 퓨즈' 패거리들이 우리 솜씨를 눈여겨보기 시작했다. (평판 +5)",
    failureSummaryKo: "『작전 실패 로그』 목표물 회수 실패. 더 퓨즈 구역 내 신뢰도 하락 (평판 -2).",
    missionTags: ["tag_threat_electric", "tag_context_industrial"],
  },
  {
    missionId: "mission_mid_elneon_backdoor_01",
    displayNameKo: "클럽 엘 네온 VIP 백도어 탈취",
    tier: "mid",
    missionType: "잠입",
    difficultyStars: 3,
    nodeCount: 5,
    rewardCredits: 24000,
    earlyWithdrawalPenalty: 5000,
    durationMs: 120000, // 2분
    phase0BriefingKo: "『픽서 브리핑』 중층 유흥가 한복판에 있는 클럽 '엘 네온' VIP 룸에 침투해 백도어 코어를 빼온다. 총질할 생각은 마라. 바운서들 스캐너를 피해 유령처럼 들어갔다 나와야 해.",
    phase1SummaryKo:
      "『분석소 코멘트』 VIP 구역은 떡대들이 24시간 감시 중이다. 불심검문 스캐너를 속일 수 있는 놈이나 유흥가 생리에 빠삭한 놈이 필요해. 군용 중화기나 무식하게 큰 임플란트를 단 놈은 입구 컷이다.",
    phase2SummaryKo: "『은닉 장비 필수』 무장 가시성 총합 40 이하 유지. 요구 스탯 [사이퍼 50+] [쿨 45+].",
    successSummaryKo: "『작전 완료 로그』 24,000 cr 입금 확인. 백도어 코어 세트 확보. 픽서 네트워크 신용 상승 (+4). 라 나다 패거리가 분노함 (-4).",
    failureSummaryKo: "『작전 실패 로그』 경보 작동으로 코어 탈취 실패. 라 나다 패거리에게 꼬리를 밟혔음 (평판 -6).",
  },
  {
    missionId: "mission_hidden_fuse_ledger_01",
    displayNameKo: "[단서] 더 퓨즈 비선 전력망 해킹",
    tier: "lower",
    missionType: "추적",
    difficultyStars: 4,
    nodeCount: 4,
    rewardCredits: 45000,
    earlyWithdrawalPenalty: 8000,
    requiredHookId: "hook_lower_fuse_power_ledger_01",
    durationMs: 90000,
    phase0BriefingKo: "『픽서 브리핑』 이전 작전에서 확보한 전력 장부를 분석했다. 더 퓨즈 패거리가 숨겨둔 무허가 암시장 서버에 꽂힌 전력선 좌표가 나왔다. 가서 메인 브레이커를 내리고 데이터를 빼내라.",
    phase1SummaryKo: "『분석소 코멘트』 상대는 자기 앞마당이 털린 걸 알고 바짝 독이 올라 있다. 전면전이 벌어질 확률이 아주 높으니, 확실히 밀어버릴 수 있는 녀석이 필요하다.",
    phase2SummaryKo: "『주의』 고가시성 장비 제약 없음. 압도적 [프레임] 혹은 [와이어] 요구. 더 퓨즈 세력과 전면전 각오.",
    successSummaryKo: "『작전 완료 로그』 45,000 cr 입금 완료. 더 퓨즈의 비선 서버 파괴 성공. 놈들은 막대한 손해를 입었다 (평판 -20).",
    failureSummaryKo: "『작전 실패 로그』 매복에 걸려 후퇴. 장부 단서의 가치가 소멸했다.",
  },
];

// QA 전용 정적 미션: B-2 진입 게이트 차단 / B-3 가시성 경고 UI를 결정론적으로 육안 검증하기 위한 픽스처.
// 보드에는 qaMissions로 항상 병합 노출된다(state.createInitialState 참고). 생성기 재실행에도 안전.
export const qaMissions: Mission[] = [
  {
    missionId: "mission_qa_entrygate_block_01",
    displayNameKo: "[QA] 진입 게이트 차단 검증 — 봉인된 코어 볼트",
    tier: "mid",
    missionType: "잠입",
    difficultyStars: 3,
    nodeCount: 4,
    rewardCredits: 20000,
    earlyWithdrawalPenalty: 6000,
    durationMs: 60000,
    phase0BriefingKo: "『QA 픽서 브리핑』 이 볼트는 군용 넷러너 인증(와이어 99+) 없이는 문턱조차 넘지 못한다. 자격 미달자는 입구에서 즉시 차단된다.",
    phase1SummaryKo: "『분석소 코멘트』 진입 게이트가 하드 락으로 걸려 있다. 필수 조건 미달 시 출격 자체가 불가하다.",
    phase2SummaryKo: "『시스템 경고』 진입 필수 조건: 와이어 99+. 미충족 시 진입 차단(block).",
    successSummaryKo: "『작전 완료 로그』 볼트 코어 확보.",
    failureSummaryKo: "『작전 실패 로그』 진입 실패.",
    missionTags: ["tag_context_generic"],
    entryGate: {
      requirements: [{ kind: "stat", statKey: "wire", minValue: 99 }],
      failureMode: "block",
    },
  },
  {
    missionId: "mission_qa_visibility_stealth_01",
    displayNameKo: "[QA] 가시성 경고 검증 — 무음 침투 구역",
    tier: "mid",
    missionType: "잠입",
    difficultyStars: 3,
    nodeCount: 4,
    rewardCredits: 20000,
    earlyWithdrawalPenalty: 6000,
    durationMs: 60000,
    phase0BriefingKo: "『QA 픽서 브리핑』 이 구역은 초정밀 센서망으로 도배되어 있다. 가시성 한계(20)를 넘기는 순간 강제 적발이 예정된다.",
    phase1SummaryKo: "『분석소 코멘트』 가시성 한계 20. 은신 특화가 아닌 용병은 즉시 노출된다.",
    phase2SummaryKo: "『시스템 경고』 가시성 한계 20 초과 시 강제 적발 위험 노드가 삽입된다.",
    successSummaryKo: "『작전 완료 로그』 무음 침투 성공.",
    failureSummaryKo: "『작전 실패 로그』 노출로 인한 작전 실패.",
    missionTags: ["tag_challenge_gear_detection"],
    mechanics: {
      visibility_limit: 20,
      primary_stat: "cypher",
      secondary_stat: "cool",
    },
  },
  {
    missionId: "mission_qa_entrygate_forcerisk_01",
    displayNameKo: "[QA] 강제 위험 진입 검증 — 반쯤 열린 뒷문",
    tier: "mid",
    missionType: "잠입",
    difficultyStars: 3,
    nodeCount: 4,
    rewardCredits: 20000,
    earlyWithdrawalPenalty: 6000,
    durationMs: 60000,
    phase0BriefingKo: "『QA 픽서 브리핑』 인증(와이어 99+)이 없어도 뒷문으로 비집고 들어갈 수는 있다. 다만 그 순간 순찰조와 마주칠 각오는 해야 한다.",
    phase1SummaryKo: "『분석소 코멘트』 진입 게이트가 하드 락은 아니다. 조건 미달 시 차단되지 않고, 대신 강제 위험 노드가 추가된다.",
    phase2SummaryKo: "『시스템 경고』 진입 권장 조건: 와이어 99+. 미충족 시 「돌발 순찰조 조우」 위험 노드가 강제 삽입된다(출격 자체는 가능).",
    successSummaryKo: "『작전 완료 로그』 위험을 뚫고 목표 확보.",
    failureSummaryKo: "『작전 실패 로그』 순찰조에 걸려 작전 실패.",
    missionTags: ["tag_context_generic"],
    entryGate: {
      requirements: [{ kind: "stat", statKey: "wire", minValue: 99 }],
      failureMode: "force_risk",
      forcedRiskNodeNameKo: "돌발 순찰조 조우",
    },
  },
];

// ─── AI 생성 미션 매핑 헬퍼 ────────────────────────────────────────────────────

const STAT_KO_BY_KEY: Record<string, string> = Object.fromEntries(
  stats.map((s) => [s.statKey, s.displayNameKo])
);

/** 영문/소문자 스탯키를 한국어 스탯명으로. 미지정 시 빈 문자열. */
function statKoName(key?: string): string {
  if (!key) return "";
  return STAT_KO_BY_KEY[String(key).toLowerCase()] ?? String(key);
}

/** 난이도(별)에 따른 요구 스탯 커트라인. engine.ts 판정 허들과 동일 공식. */
function statCutline(stars: number): number {
  return (
    GAME_CONFIG.difficulty.statThresholdBase +
    stars * GAME_CONFIG.difficulty.statThresholdPerStar
  );
}

function dangerText(danger: unknown): string {
  if (Array.isArray(danger)) return danger.join(", ");
  if (typeof danger === "string" && danger.length > 0) return danger;
  return "불명";
}

function isUsableProse(text: unknown): text is string {
  return typeof text === "string" && text.trim().length > 0 && !text.startsWith("[MOCK");
}

/**
 * AI 생성 미션 원본(JSON) → 게임 내 Mission 객체로 매핑하는 순수 함수.
 *
 * - Phase 0/1/2 모두 AI 줄글(briefing / phase1Brief / phase2Brief)을 본문으로 사용
 * - Phase 2에는 시스템이 결정하는 정량 요구 스탯 커트라인을 한국어로 부착
 * - 옛 데이터(프로즈 필드 없음)나 MOCK 텍스트에 대한 폴백 포함
 */
export function mapGeneratedMission(gen: any, idx: number): Mission {
  let tierVal: "lower" | "mid" | "upper" = "lower";
  if (gen.location?.layer === "상층") tierVal = "upper";
  else if (gen.location?.layer === "중층") tierVal = "mid";
  else tierVal = "lower"; // 하층 (그 외 미지정 계층도 하층으로 폴백)

  const stars = gen.difficulty ?? 2;
  const credits = gen.economy?.reward_credits || 1000;
  const location = gen.location;
  const locStr = location ? `${location.layer} — ${location.zone} ${location.spot ?? ""}` : "불명";

  const primaryKo = statKoName(gen.mechanics?.primary_stat);
  const secondaryKo = statKoName(gen.mechanics?.secondary_stat);
  const cutline = statCutline(stars);
  const subCutline = Math.max(GAME_CONFIG.difficulty.statThresholdBase, cutline - 5);
  const dangerStr = dangerText(gen.danger);
  const mandatory = gen.requirements?.mandatory?.join(", ") || "없음";
  const recommended = gen.requirements?.recommended?.length
    ? gen.requirements.recommended.join(", ")
    : null;
  const detailOrType = gen.missionDetail || gen.missionType || "불명";

  // Phase 0: AI 의뢰 개요. MOCK/누락 시 구조화 폴백.
  const phase0 = isUsableProse(gen.briefing)
    ? gen.briefing
    : `익명 채널로 ${detailOrType} 의뢰가 들어왔다. 지목된 장소는 ${locStr}. ` +
      `현장에는 ${dangerStr}의 정황이 어른거리고, 의뢰자는 자세한 말을 아꼈다. ` +
      `누구를 보낼지는 픽서의 몫이다.`;

  // Phase 1: AI 1차 분석 줄글 + 시스템 코멘트(유리 자질 + 권장/필수 장비·정비).
  const phase1Prose = isUsableProse(gen.phase1Brief)
    ? gen.phase1Brief
    : `들어온 정보만으로는 ${detailOrType} 성격의 작전으로 분류된다. 어떤 자질의 용병이 유리할지 가늠하려면 좀 더 정보가 필요하다.`;
  let phase1SummaryKo =
    `${phase1Prose}\n\n『분석소 1차 코멘트』 이번 작전의 성패는 ` +
    `${primaryKo || "주력"} 계열 역량에서 갈릴 공산이 크다.`;
  if (mandatory && mandatory !== "없음") phase1SummaryKo += ` 필수 준비 장비: ${mandatory}.`;
  if (recommended) phase1SummaryKo += ` 권장 장비: ${recommended}.`;

  // Phase 2: AI 심화 분석 줄글 + 시스템 정량 요구 조건(현장 위협 + 요구 수치).
  const phase2Prose = isUsableProse(gen.phase2Brief)
    ? gen.phase2Brief
    : `준비 없이 진입하면 현장 변수에 그대로 노출된다. 요구 역량을 갖추지 못한 용병은 작전 중반부터 통제력을 잃기 쉽다.`;
  let phase2SummaryKo =
    `${phase2Prose}\n\n『분석소 2차 — 현장 위협 및 요구 조건』 감지된 현장 위험: ${dangerStr}. ` +
    `요구 주력 스탯: ${primaryKo || "주력"} ${cutline}+`;
  if (secondaryKo) phase2SummaryKo += ` / 보조 ${secondaryKo} ${subCutline}+`;
  phase2SummaryKo += `.`;

  // 노드(역할 포함)를 판정 엔진이 쓸 수 있도록 Mission으로 옮긴다.
  // 역할 정보(objective/exit)가 온전치 않은 옛 데이터는 undefined로 두어 엔진이 nodeCount로 파생하게 한다.
  const VALID_ROLES = ["entry", "obstacle", "objective", "exit"];
  let nodes: Mission["nodes"];
  if (Array.isArray(gen.nodes) && gen.nodes.length > 0) {
    const mapped = gen.nodes.map((n: any) => ({
      nameKo: typeof n?.name === "string" && n.name.trim() ? n.name : "관문",
      role: VALID_ROLES.includes(n?.role) ? n.role : "obstacle",
      statCheck: (n?.stat_check
        ? String(n.stat_check).toLowerCase()
        : gen.mechanics?.primary_stat?.toLowerCase() ?? "frame") as any,
    }));
    const hasObjective = mapped.some((n: any) => n.role === "objective");
    const hasExit = mapped.some((n: any) => n.role === "exit");
    nodes = hasObjective && hasExit ? mapped : undefined;
  }

  const draft: Mission = {
    missionId: `mission_gen_${idx}`,
    displayNameKo: `[${gen.missionType}] ${gen.missionDetail ? gen.missionDetail + " ─ " : ""}${locStr}`,
    tier: tierVal,
    missionType: gen.missionType,
    difficultyStars: stars,
    missionTags: mapDangerTextToMissionTags(gen.danger),
    nodeCount: gen.nodes?.length || 3,
    nodes,
    rewardCredits: credits,
    earlyWithdrawalPenalty: Math.floor(credits * 0.3),
    durationMs: 60000 * (gen.difficulty || 2),
    phase0BriefingKo: phase0,
    phase1SummaryKo,
    phase2SummaryKo,
    successSummaryKo: "『작전 완료 로그』 미션 목표 달성 및 보수 입금 완료.",
    failureSummaryKo: "『작전 실패 로그』 미션 수행 중 치명적 문제 발생.",
    mechanics: gen.mechanics
      ? {
          visibility_limit: gen.mechanics.visibility_limit,
          primary_stat: gen.mechanics.primary_stat?.toLowerCase() as any,
          secondary_stat: gen.mechanics.secondary_stat?.toLowerCase() as any,
        }
      : undefined,
  };

  const nodesWithChallenges = assignNodeChallenges({
    ...draft,
    nodes: resolveMissionNodes(draft),
  });

  return { ...draft, nodes: nodesWithChallenges };
}

export const generatedMissions: Mission[] = generatedMissionsRaw.map((gen: any, idx: number) =>
  mapGeneratedMission(gen, idx)
);

// 정적 시드 미션은 항상 포함. 생성 미션은 추가 병합.
// 테스트가 의존하는 ID(mission_lower_fuse_capacitor_01 등)가 사라지지 않아야 한다.
export const missions: Mission[] = [...staticMissions, ...generatedMissions];

/** missionId → Mission 조회용 전체 집합 (보드 fallback 중복을 피하려 QA는 여기서만 병합). */
export const allMissions: Mission[] = [...missions, ...qaMissions];

export const mercenaries: Mercenary[] = [
  {
    mercId: "merc_breaker_01",
    displayNameKo: "백건우",
    aliasKo: "차단기",
    originKo: "하층 전력 하청 숙소",
    contractTermsKo: "장비 파손 보험금 선입금 필수. 찌릿한 건 딱 질색이니까.",
    stats: { frame: 54, cool: 38, wire: 48, cypher: 31, pulse: 42 },
    maxHp: 108,
    visibilityLevel: "low",
    commandCost: 4,
    phase0ProfileKo: "[스캔 완료] 하층 전력망 유지보수 하청업체 출신. 낡아빠진 고압 변전기 앞에서도 숨소리 하나 안 변할 정도로 전자기 흐름에 익숙하다.",
    phase1SummaryKo:
      "▶ [분석] 강점: 낡은 산업 설비 and 전력 계통 앞에서 비정상적일 정도로 침착함. 위험: 귀찮은 보안 절차를 몽땅 건너뛰는 고질적인 버릇이 있음.",
    phase2SummaryKo: "▶ [태그] 고압망_작업, 슬럼_출신, 절연_장비_작업_습관, 감전_잔향_상태.",
    systemTags: ["tag_operation_high_voltage_grid_tech", "tag_origin_slum_native"],
  },
  {
    mercId: "merc_malt_01",
    displayNameKo: "한서윤",
    aliasKo: "몰트",
    originKo: "중층 유흥가 폐업 바텐더 조합",
    contractTermsKo: "선금 30%. 현장 내 민간인 피해 발생 시 보너스 감산 조항 요구.",
    stats: { frame: 34, cool: 49, wire: 42, cypher: 56, pulse: 39 },
    maxHp: 88,
    visibilityLevel: "low",
    commandCost: 3,
    phase0ProfileKo: "[스캔 완료] 중층 클럽 바텐더 출신. 칵테일을 말기보다 손님의 결제용 손목 임플란트를 먼저 스캔하는 눈치 9단의 정보상.",
    phase1SummaryKo:
      "▶ [분석] 강점: 군중 속에 녹아드는 동선, 보안 직원의 패턴 판독에 최적화됨. 위험: 유흥가 지하에 오래된 채무 관계가 얽혀 있어 돌발 빚쟁이와 조우할 확률 높음.",
    phase2SummaryKo: "▶ [태그] 유흥가_출신, 민간인_위장, 스캐너_기만, 은닉_슬롯, 채무_그림자.",
    systemTags: ["tag_origin_nightlife_worker"],
  },
  {
    mercId: "merc_velvet_knife_01",
    displayNameKo: "라일라 라쉬드",
    aliasKo: "벨벳 나이프",
    originKo: "상층 예법 교육 하청 가문",
    contractTermsKo: "신원 삭제 비용 별도 청구. 싸구려 모텔 방은 거부한다.",
    stats: { frame: 36, cool: 64, wire: 41, cypher: 58, pulse: 47 },
    maxHp: 90,
    visibilityLevel: "very_low",
    commandCost: 6,
    phase0ProfileKo: "[스캔 완료] 상층 식탁에서 예법을 생존 기술로 배운 의전 하청 가문 출신. 사람을 죽일 때도 냅킨으로 입가를 닦는 부류.",
    phase1SummaryKo:
      "▶ [분석] 강점: 고압적인 기업 임원의 시선 검사를 우습게 넘기며, 격식 공간에서 행동 노이즈 0%. 위험: 전신 반사면 앞에서는 자기애적 강박으로 인한 미세 반응 지연 현상 발견.",
    phase2SummaryKo: "▶ [태그] 상층_예법, 유전자_기만, 단정한_인상, 반사면_지연_반응.",
    systemTags: ["tag_origin_upper_etiquette"],
  },
  {
    mercId: "merc_chromeshow_01",
    displayNameKo: "도마 준",
    aliasKo: "크롬쇼",
    originKo: "중층 불법 격투장",
    contractTermsKo: "위험 수당 선지급. 관절 윤활유 값은 별도 청구할 테니 알아서 해.",
    stats: { frame: 57, cool: 26, wire: 22, cypher: 24, pulse: 33 },
    maxHp: 120,
    visibilityLevel: "very_high",
    commandCost: 5,
    phase0ProfileKo: "[스캔 완료] 불법 사이버웨어 격투장 출신. 문을 조용히 여는 것보다 문틀째 뜯어버리는 일에 훨씬 익숙한 걸어 다니는 쇳덩이.",
    phase1SummaryKo:
      "▶ [분석] 강점: 정면 충돌과 초근접 교전에서는 무적에 가까움. 위험: 장비 노출도가 극도로 높아 은밀한 침투 작전에서는 걸어 다니는 사이렌 수준. 대기 명령 불복종 빈번.",
    phase2SummaryKo: "▶ [태그] 불법_격투장_출신, 노출형_크롬, 고출력_산탄_암, 감전_과민, 명령_불복종.",
    systemTags: ["tag_origin_illegal_arena"],
  },
];

export const matchCases: MatchCase[] = [
  {
    matchId: "match_mission_lower_fuse_capacitor_01_merc_breaker_01",
    missionId: "mission_lower_fuse_capacitor_01",
    mercId: "merc_breaker_01",
    deploymentVerdict: "clear",
    successOutlook: "high",
    lossOutlook: "low",
    expectedResultType: "success",
    signals: [
      { signalType: "advantage", textKo: "고압망 작업 습관" },
      { signalType: "advantage", textKo: "산업 설비 경험" },
      { signalType: "disadvantage", textKo: "보안 절차 무시 경향" },
      { signalType: "conditional", textKo: "절연 장비 상태" },
    ],
  },
  {
    matchId: "match_mission_mid_elneon_backdoor_01_merc_malt_01",
    missionId: "mission_mid_elneon_backdoor_01",
    mercId: "merc_malt_01",
    deploymentVerdict: "clear",
    successOutlook: "high",
    lossOutlook: "medium",
    expectedResultType: "partial_success",
    signals: [
      { signalType: "advantage", textKo: "시민 위장" },
      { signalType: "advantage", textKo: "스캐너 기만" },
      { signalType: "advantage", textKo: "낮은 가시성" },
      { signalType: "disadvantage", textKo: "채무 관계" },
      { signalType: "conditional", textKo: "은닉형 슬롯 유지" },
      { signalType: "conditional", textKo: "저가시성 무장 유지" },
    ],
  },
  {
    matchId: "match_mission_upper_almadinat_memory_01_merc_velvet_knife_01",
    missionId: "mission_upper_almadinat_memory_01",
    mercId: "merc_velvet_knife_01",
    deploymentVerdict: "clear",
    successOutlook: "high",
    lossOutlook: "medium",
    expectedResultType: "success",
    signals: [
      { signalType: "advantage", textKo: "유전자 기만" },
      { signalType: "advantage", textKo: "단정한 인상" },
      { signalType: "advantage", textKo: "상층 예법" },
      { signalType: "disadvantage", textKo: "반사면 지연 반응" },
      { signalType: "conditional", textKo: "고도 보정기 완비" },
      { signalType: "conditional", textKo: "DNA 패치 완비" },
    ],
  },
  {
    matchId: "match_mission_mid_elneon_backdoor_01_merc_chromeshow_01",
    missionId: "mission_mid_elneon_backdoor_01",
    mercId: "merc_chromeshow_01",
    deploymentVerdict: "locked",
    successOutlook: "low",
    lossOutlook: "high",
    expectedResultType: "failure",
    signals: [
      { signalType: "advantage", textKo: "교전 발생 시 생존력" },
      { signalType: "disadvantage", textKo: "매우 높은 가시성" },
      { signalType: "disadvantage", textKo: "낮은 사이퍼/쿨" },
      { signalType: "disadvantage", textKo: "노출형 크롬" },
      { signalType: "conditional", textKo: "장비 대폭 해체 필요" },
    ],
  },
];

export const resultReports: ResultReport[] = [
  {
    reportId: "report_mission_lower_fuse_capacitor_01_merc_breaker_01_success",
    missionId: "mission_lower_fuse_capacitor_01",
    mercId: "merc_breaker_01",
    resultType: "success",
    rewardCredits: 16500,
    extraRewardCredits: 0,
    lostCredits: 2200,
    summaryLogKo: "캐패시터 유닛 회수 성공. 절연 부츠가 경미하게 마모되고 손목 보조 관절 정비 필요.",
    fulfilledConditionsKo: "필수 절연 장비 보유; 프레임/와이어 기준 충족.",
    missingConditionsKo: "사이퍼 보너스 회로 다운 없음.",
    nodeLogKo: [
      "[1노드 / 침투] 뒷담 넘어 제3변전소 진입. 누전음이 사방에서 울리는데 익숙한 소리라 심박수 변화 없음. 관제 카메라 각도 파악하고 사각지대 루트로 접근.",
      "[2노드 / 검문 통과] 무전기 스캔 검문소. 절연 부츠 덕에 스캐너 반응 없이 통과. 담당자가 의심 없이 통과시켜줌. 보안 허술한 편.",
      "[3노드 / 캐패시터 적출] 제어망 사이에서 유닛 위치 특정. 볼트가 열전으로 달궈져 있어서 손목에 충격 있었는데 안전 장갑이 버텨줌. 유닛 상태 양호.",
      "[4노드 / 이탈] 들어올 때보다 빠르게 빠져나옴. 귀환 중 강풍에 절연 부츠 하단이 긁혔음. 수리 비용 있을 것 같으니 정산 시 처리 바람."
    ],
    statusChanges: [
      { statusId: "status_gear_insulated_boots_worn_light", changeType: "add", noteKo: "절연 부츠가 고전압 환경에서 경미하게 마모됨." },
    ],
    gearUpdates: [
      { gearId: "gear_feet_insulated_boots_01", updateType: "worn", repairCost: 700, noteKo: "절연 부츠 경미 마모. 정산 손실 700 크레딧과 연결." },
    ],
    implantUpdates: [
      { implantId: "implant_wrist_torque_joint_01", updateType: "worn", repairCost: 1500, noteKo: "고전압 작업 이후 손목 토크 보조 관절 정비 필요." },
    ],
    reputationChanges: [
      { factionId: "faction_lower_fuse", reputationDelta: 5, noteKo: "하층 더 퓨즈 의뢰 성공으로 현지 평판 상승." },
    ],
    followupHooks: [
      { hookId: "hook_lower_fuse_power_ledger_01", displayNameKo: "더 퓨즈 전력 장부", hookSummaryKo: "캐패시터 회수 과정에서 전력 배분 장부 단서가 남는다." },
    ],
  },
  {
    reportId: "report_mission_mid_elneon_backdoor_01_merc_malt_01_partial_success",
    missionId: "mission_mid_elneon_backdoor_01",
    mercId: "merc_malt_01",
    resultType: "partial_success",
    rewardCredits: 24000,
    extraRewardCredits: 0,
    lostCredits: 4200,
    summaryLogKo: "백도어 코어 세트 회수. 검문은 통과했지만 우회기 과열과 채무 단서가 남음.",
    fulfilledConditionsKo: "낮은 가시성 유지; 시민 위장; 스캐너 기만.",
    missingConditionsKo: "VIP 홀 잔여 거래 데이터 회수 실패.",
    nodeLogKo: [
      "[1노드 / 입구 검문] 바운서들이 위아래로 훑어보는데 바텐더 양복 그대로라 그냥 통과. 스캐너가 팔찌를 인식하려 했지만 기만 반응이 먼저 먹혔음.",
      "[2노드 / VIP구역 침투] VIP 홀 안에서 거래 이야기 나누는 사람들 사이로 자리 잡음. 오래된 채무 관련 낯익은 얼굴 발견. 자리 뜨기 전에 데이터 일부 건드렸지만 전부 가져오진 못함.",
      "[3노드 / 코어 탈취] 백도어 서버 위치 특정에는 성공. 우회기가 예상보다 빠르게 달아올랐음. 코어 세트 확보.",
      "[4노드 / 이탈] 채무자로 보이는 인물이 뒤를 알아챈 기색. 빠르게 혼잡한 군중 속으로 녹아들었음. 우회기 과열 흔적 남아 다음 사용 시 주의 필요.",
      "[5노드 / 현장 정리] 흔적 최소화 후 귀환. 수면 처리 나중에 받겠음."
    ],
    statusChanges: [
      { statusId: "status_fatigue_sleep_debt_deep", changeType: "worsen", noteKo: "기존 수면부족이 장시간 잠입 이후 심화됨." },
      { statusId: "status_gear_auth_bypass_overheat", changeType: "add", noteKo: "인증 우회기가 반복 사용으로 과열 흔적을 남김." },
    ],
    gearUpdates: [
      { gearId: "gear_wrist_auth_bypass_bracelet_01", updateType: "overheated", repairCost: 1200, noteKo: "인증 우회기 과열 흔적. 다음 검문 우회 안정성 저하." },
    ],
    implantUpdates: [],
    reputationChanges: [
      { factionId: "faction_fixer_network", reputationDelta: 3, noteKo: "백도어 코어 회수로 픽서 네트워크 평판 상승." },
      { factionId: "faction_mid_lanada", reputationDelta: -3, noteKo: "라 나다 장부와 채무 단서가 남아 현지 평판 하락." },
    ],
    followupHooks: [
      { hookId: "hook_malt_debt_ledger_01", displayNameKo: "몰트 채무 장부", hookSummaryKo: "라 나다 장부에 남은 몰트의 예전 빚이 후속 압박으로 이어진다." },
    ],
  },
  {
    reportId: "report_mission_mid_elneon_backdoor_01_merc_chromeshow_01_failure",
    missionId: "mission_mid_elneon_backdoor_01",
    mercId: "merc_chromeshow_01",
    resultType: "failure",
    rewardCredits: 0,
    extraRewardCredits: 0,
    lostCredits: 6500,
    summaryLogKo: "높은 가시성과 노출형 크롬 때문에 진입 단계에서 경보가 폭증. 장비 파손과 평판 손실 발생.",
    fulfilledConditionsKo: "교전 발생 시 생존력은 일부 확인.",
    missingConditionsKo: "암호 칩 회수 실패; 거래 데이터 회수 실패.",
    nodeLogKo: [
      "[1노드 / 입구] 들어서자마자 바운서가 나를 위아래로 훑음. 외관상으로도 이미 위화감 있었을 것. 산탄 암 외관이 스캐너에 즉시 반응. 경보 울림.",
      "[2노드 / 진입 실패] 두 번째 바운서가 지원 요청하는 순간 사이드 입구까지 봉쇄됨. 상황 보고할 여유 없이 전면 대치 상황 전환.",
      "[3노드 / 교전] 진입 실패했어도 교전 자체는 나쁘지 않았음. 상대 여럿 제압. 다만 목표 물건은 이미 이송 완료된 상태라 빈손.",
      "[4노드 / 이탈] 카메라에 내 얼굴 다 찍혔을 것임. 어깨 장갑판 균열 이전보다 심해짐. 수리보다 교체 권고."
    ],
    statusChanges: [
      { statusId: "status_gear_shoulder_armor_crack_worse", changeType: "worsen", noteKo: "기존 어깨 장갑판 균열이 실패한 교전으로 악화됨." },
      { statusId: "status_injury_bullet_puncture", changeType: "add", noteKo: "진입 실패 후 총격 과정에서 탄환 관통흔 발생." },
    ],
    gearUpdates: [],
    implantUpdates: [
      { implantId: "implant_arm_shotgun_01", updateType: "damaged", repairCost: 6500, noteKo: "진입 실패 후 교전 과정에서 산탄 암 손상 위험 발생." },
      { implantId: "implant_torso_exposed_armor_01", updateType: "damaged", repairCost: 4200, noteKo: "노출형 상체 장갑판 균열 악화와 연결." },
    ],
    reputationChanges: [
      { factionId: "faction_mid_lanada", reputationDelta: -6, noteKo: "클럽 진입 실패와 경보 폭증으로 라 나다 평판 크게 하락." },
      { factionId: "faction_fixer_network", reputationDelta: -2, noteKo: "의뢰 실패로 픽서 네트워크 신뢰 하락." },
    ],
    followupHooks: [
      { hookId: "hook_lanada_bounty_chromeshow_01", displayNameKo: "라 나다 크롬쇼 현상금", hookSummaryKo: "클럽 진입 실패 이후 라 나다가 크롬쇼를 표적으로 올린다." },
    ],
  },
];

export const statusDefs: StatusDef[] = STATUS_DEFINITIONS;

export const gearDefs: GearDef[] = [
  { gearId: "gear_feet_insulated_boots_01", displayNameKo: "러버세인트 절연 부츠", statBonuses: { wire: 6, frame: 3 } },
  { gearId: "gear_wrist_auth_bypass_bracelet_01", displayNameKo: "글래스리스트 인증 팔찌", statBonuses: { cypher: 8, wire: 3 } },
  { gearId: "gear_skin_dna_patch_01", displayNameKo: "세컨드페이스 DNA 스킨 패치", statBonuses: { cypher: 10, cool: 5 } },
  { gearId: "gear_lung_high_altitude_regulator_01", displayNameKo: "헤븐프레셔 고도 보정기", statBonuses: { pulse: 6, cool: 4 } },
  { gearId: "gear_body_hidden_slot_01", displayNameKo: "로우시그 은닉 슬롯", statBonuses: { cypher: 5 } },
  { gearId: "gear_weapon_fold_pistol_01", displayNameKo: "슬림폴드 권총", statBonuses: { frame: 4 } },
  { gearId: "gear_weapon_ceramic_knife_01", displayNameKo: "무음 세라믹 단검", statBonuses: { cypher: 4, frame: 2 } },
];

export const implantDefs: ImplantDef[] = [
  { implantId: "implant_wrist_torque_joint_01", displayNameKo: "핸드토크 구형 보조 관절", statBonuses: { frame: 5, wire: 5 } },
  { implantId: "implant_face_expression_stabilizer_01", displayNameKo: "마이크로페이스 표정 안정기", statBonuses: { cool: 8 } },
  { implantId: "implant_skin_patch_port_01", displayNameKo: "더마포트 인공 피부 패치 포트", statBonuses: { cypher: 6, cool: 3 } },
  { implantId: "implant_arm_shotgun_01", displayNameKo: "붐암 고출력 산탄 암", statBonuses: { frame: 10 } },
  { implantId: "implant_torso_exposed_armor_01", displayNameKo: "쇼플레이트 노출형 상체 장갑판", statBonuses: { frame: 8 } },
  { implantId: "implant_torso_shoulder_frame_01", displayNameKo: "숄더잭 강화 어깨 프레임", statBonuses: { frame: 5 } },
];

export const factionDefs: FactionDef[] = [
  { factionId: "faction_lower_fuse", displayNameKo: "더 퓨즈" },
  { factionId: "faction_mid_lanada", displayNameKo: "라 나다" },
  { factionId: "faction_fixer_network", displayNameKo: "픽서 네트워크" },
  { factionId: "faction_almadinat_subcontract", displayNameKo: "알-마디낫 하청" },
  { factionId: "faction_almadinat_family", displayNameKo: "알-마디낫 가문" },
  // 도시 시스템 팩션
  { factionId: "faction_lower_nulls", displayNameKo: "더 널스 (UNzone)" },
  { factionId: "faction_lower_valve", displayNameKo: "더 밸브 (Pipe)" },
  { factionId: "faction_lower_damper", displayNameKo: "더 댓퍼 (Vent)" },
  // 메가코프
  { factionId: "faction_corp_bairui", displayNameKo: "바이루이" },
  { factionId: "faction_corp_masada", displayNameKo: "마사다" },
  { factionId: "faction_corp_kikumoto", displayNameKo: "키쿠모토" },
  { factionId: "faction_corp_almadinat", displayNameKo: "알-마디낫" },
  // 중층 독립
  { factionId: "faction_mid_noclaim", displayNameKo: "노 클레임" },
  { factionId: "faction_mid_plusone", displayNameKo: "플러스 원" },
  { factionId: "faction_mid_rattle", displayNameKo: "래틀" },
  { factionId: "faction_mid_onemore", displayNameKo: "원 모어" },
  { factionId: "faction_mid_tenmen", displayNameKo: "텐 멘" },
];
