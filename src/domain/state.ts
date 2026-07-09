import { missions, generatedMissions, qaMissions } from "../data/seed";
import { GAME_CONFIG } from "../data/config";
import { createEmptyAnalysisSlots } from "./analysisSlot";
import type {
  FixerOrigin,
  FixerProfile,
  GameState,
  MissionTypeKey,
  PlayerBehavioralStats,
  StationCategory,
  StationState,
} from "../data/types";
import {
  DEFAULT_FACILITY_BY_CATEGORY,
  FACILITY_DEFINITIONS,
} from "../data/stationFacilities";

export type { GameState };


// ─── 팩션 ID 상수 ───────────────────────────────────────────────────────────

export const FACTION_IDS = {
  // 메가코프
  BAIRUI: "faction_corp_bairui",
  MASADA: "faction_corp_masada",
  KIKUMOTO: "faction_corp_kikumoto",
  ALMADINAT: "faction_corp_almadinat",
  // 하층 인프라
  NULLS: "faction_lower_nulls",
  VALVE: "faction_lower_valve",
  FUSE: "faction_lower_fuse",
  DAMPER: "faction_lower_damper",
  // 중층 독립
  LANADA: "faction_mid_lanada",
  NO_CLAIM: "faction_mid_noclaim",
  PLUS_ONE: "faction_mid_plusone",
  RATTLE: "faction_mid_rattle",
  ONE_MORE: "faction_mid_onemore",
  TEN_MEN: "faction_mid_tenmen",
} as const;

// ─── 초기 행동 통계 생성 ─────────────────────────────────────────────────────

const MISSION_TYPES: MissionTypeKey[] = ["잠입", "전투", "지원", "기업", "비밀", "교섭", "추적"];

export function createInitialPlayerBehavioralStats(fixerId: string): PlayerBehavioralStats {
  const missionCountByType = Object.fromEntries(
    MISSION_TYPES.map((t) => [t, 0])
  ) as Record<MissionTypeKey, number>;

  return {
    fixerId,
    fame: 0,
    infamy: 0,
    missionCountByType,
    expertiseTags: [],
    totalCreditsEarned: 0,
    totalMercsLost: 0,
    areaInfluence: {},
  };
}

// ─── 출신지별 픽서 생성 ──────────────────────────────────────────────────────

export interface FixerCreationOptions {
  /** 추방자 출신지 선택 시 필요 */
  exileFactionId?: string;
  /** 버려진 사생아 출신지 선택 시 필요 (메가코프 1개) */
  bloodlineFactionId?: string;
  /** 몰락자 출신지 선택 시 필요 (중층/상층 팩션 1개) */
  fallenNetworkFactionId?: string;
}

export interface FixerCreationResult {
  profile: FixerProfile;
  initialCredits: number;
  factionReputation: Record<string, number>;
  stationCategory: StationCategory;
}

const LOWER_FACTIONS = [
  FACTION_IDS.NULLS,
  FACTION_IDS.VALVE,
  FACTION_IDS.FUSE,
  FACTION_IDS.DAMPER,
];

const UPPER_CORP_FACTIONS = [
  FACTION_IDS.BAIRUI,
  FACTION_IDS.MASADA,
  FACTION_IDS.KIKUMOTO,
  FACTION_IDS.ALMADINAT,
];

const ORIGIN_CONFIG: Record<
  FixerOrigin,
  {
    backgroundTag: string;
    initialCredits: number;
    getFactionReputation: (opts: FixerCreationOptions) => Record<string, number>;
  }
> = {
  하층_언존_태생: {
    backgroundTag: "#슬럼_출신",
    initialCredits: GAME_CONFIG.originCredits.하층_언존_태생,
    getFactionReputation: () => ({
      ...Object.fromEntries(LOWER_FACTIONS.map((id) => [id, 20])),
      ...Object.fromEntries(UPPER_CORP_FACTIONS.map((id) => [id, -10])),
      [FACTION_IDS.LANADA]: -5,
      [FACTION_IDS.NO_CLAIM]: -5,
      [FACTION_IDS.PLUS_ONE]: -5,
      [FACTION_IDS.RATTLE]: -5,
      [FACTION_IDS.ONE_MORE]: -5,
      [FACTION_IDS.TEN_MEN]: -5,
    }),
  },
  살아남은_폐기체: {
    backgroundTag: "#신원_말소",
    initialCredits: GAME_CONFIG.originCredits.살아남은_폐기체,
    getFactionReputation: () => ({
      [FACTION_IDS.BAIRUI]: -40,
      [FACTION_IDS.NULLS]: 15,
    }),
  },
  버려진_사생아: {
    backgroundTag: "#혈연_연줄",
    initialCredits: GAME_CONFIG.originCredits.버려진_사생아,
    getFactionReputation: ({ bloodlineFactionId }) =>
      bloodlineFactionId ? { [bloodlineFactionId]: 15 } : {},
  },
  추방자: {
    backgroundTag: "#추방낙인",
    initialCredits: GAME_CONFIG.originCredits.추방자,
    getFactionReputation: ({ exileFactionId }) =>
      exileFactionId ? { [exileFactionId]: -50 } : {},
  },
  몰락자: {
    backgroundTag: "#몰락_귀족",
    initialCredits: GAME_CONFIG.originCredits.몰락자,
    getFactionReputation: ({ fallenNetworkFactionId }) => ({
      ...Object.fromEntries(LOWER_FACTIONS.map((id) => [id, -5])),
      ...(fallenNetworkFactionId ? { [fallenNetworkFactionId]: 10 } : {}),
    }),
  },
  상실자: {
    backgroundTag: "#기억_공백",
    initialCredits: GAME_CONFIG.originCredits.상실자,
    getFactionReputation: () => ({}),
  },
  무지한_외부인: {
    backgroundTag: "#외부인_낙인",
    initialCredits: GAME_CONFIG.originCredits.무지한_외부인,
    getFactionReputation: () => ({}),
  },
};

export function createFixerProfileFromOrigin(
  origin: FixerOrigin,
  name: string,
  codename: string,
  opts: FixerCreationOptions = {},
  stationCategory: StationCategory = "업무",
): FixerCreationResult {
  const config = ORIGIN_CONFIG[origin];
  const fixerId = `fixer_${Date.now()}`;

  const profile: FixerProfile = {
    fixerId,
    name,
    codename,
    origin,
    backgroundTag: config.backgroundTag,
    initialConnectionFaction: opts.bloodlineFactionId ?? opts.fallenNetworkFactionId ?? null,
    createdAt: new Date().toISOString().slice(0, 10),
  };

  return {
    profile,
    initialCredits: config.initialCredits,
    factionReputation: config.getFactionReputation(opts),
    stationCategory,
  };
}

export function createDefaultStation(
  fixerId: string,
  category: StationCategory = "업무",
): StationState {
  const facilityId = DEFAULT_FACILITY_BY_CATEGORY[category];
  const facilityDef = FACILITY_DEFINITIONS[facilityId];
  return {
    stationId: `station_${Date.now()}`,
    fixerId,
    category,
    facilityId,
    facilityTier: 1,
    facilityName: facilityDef.nameKo,
    locationTier: "하층",
    locationArea: "이름 없는 거리",
    level: 1,
    operatingCostPerTurn: 1000,
    analysisMissionLv: 0,
    analysisMercLv: 0,
  };
}

/** 구세이브: facilityId/facilityTier 누락 시 업무 기본 시설로 보강 (기존 analysis 레벨 유지) */
export function migrateLegacyStationState(station: StationState): StationState {
  if (station.facilityId && station.facilityTier) {
    return station;
  }
  const category = station.category ?? "업무";
  const facilityId = DEFAULT_FACILITY_BY_CATEGORY[category];
  const facilityDef = FACILITY_DEFINITIONS[facilityId];
  return {
    ...station,
    category,
    facilityId,
    facilityTier: station.facilityTier ?? 1,
    facilityName:
      station.facilityName === "낡은 임대 아지트"
        ? facilityDef.nameKo
        : station.facilityName,
  };
}

// ─── 초기 상태 ───────────────────────────────────────────────────────────────

const initialMercStatuses: Record<string, string[]> = {
  merc_breaker_01: ["status_neural_electric_afterimage"],
  merc_malt_01: ["status_fatigue_sleep_debt"],
  merc_velvet_knife_01: ["status_med_sleep_aid"],
  merc_chromeshow_01: ["status_gear_shoulder_armor_crack", "status_mental_overaroused"],
};

export function createInitialState(): GameState {
  return {
    // 게시판에는 AI가 생성한 미션만 노출한다. 정적 미션은 테스트/조회용 픽스처로만 유지하며
    // 생성 미션이 하나도 없을 때(생성 실패 등)에만 정적 미션으로 폴백한다.
    availableMissions: [
      ...qaMissions,
      ...(generatedMissions.length > 0 ? generatedMissions : missions),
    ]
      .filter((m) => !m.requiredHookId)
      .map((m) => m.missionId),
    acceptedMissions: [],
    activeDispatches: [],
    completedDispatches: [],
    hiredMercs: ["merc_breaker_01", "merc_velvet_knife_01"], // 초기 용병 2명
    ledger: 0,
    mercStatuses: structuredClone(initialMercStatuses),
    mercDissatisfactionStacks: {},
    analysisSlots: createEmptyAnalysisSlots(),
    gearStates: {
      gear_feet_insulated_boots_01: "normal",
      gear_wrist_auth_bypass_bracelet_01: "normal",
      gear_skin_dna_patch_01: "normal",
      gear_weapon_ceramic_knife_01: "normal",
      gear_body_hidden_slot_01: "normal",
      gear_weapon_fold_pistol_01: "normal",
    },
    implantStates: {
      implant_wrist_torque_joint_01: "normal",
      implant_face_expression_stabilizer_01: "normal",
      implant_arm_shotgun_01: "normal",
      implant_torso_exposed_armor_01: "damaged", // 도마 준의 초기 손상 상태 반영
      implant_torso_shoulder_frame_01: "normal",
    },
    gearOwner: {
      gear_feet_insulated_boots_01: "merc_breaker_01",
      gear_wrist_auth_bypass_bracelet_01: "merc_malt_01",
      gear_skin_dna_patch_01: "merc_velvet_knife_01",
      gear_weapon_ceramic_knife_01: "merc_velvet_knife_01",
      gear_body_hidden_slot_01: "merc_malt_01",
      gear_weapon_fold_pistol_01: "merc_malt_01",
    },
    implantOwner: {
      implant_wrist_torque_joint_01: "merc_breaker_01",
      implant_face_expression_stabilizer_01: "merc_velvet_knife_01",
      implant_arm_shotgun_01: "merc_chromeshow_01",
      implant_torso_exposed_armor_01: "merc_chromeshow_01",
      implant_torso_shoulder_frame_01: "merc_chromeshow_01",
    },
    aiNarratorEnabled: GAME_CONFIG.ai.aiNarratorEnabled,
    factionReputation: {},
    followupHooks: [],
    settledReports: [],
    generatedReports: {},
    // World State Phase D
    fixerProfile: null,
    stationState: null,
    playerBehavioralStats: createInitialPlayerBehavioralStats("fixer_unknown"),
    // 턴 및 지휘력 초기값
    turnCount: 1,
    maxCommandPoints: 10,
    currentCommandPoints: 10,
  };
}
