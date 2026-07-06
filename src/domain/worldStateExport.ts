import type { GameState } from "./state";
import type { LocationTier } from "../data/types";
import { FACTION_IDS } from "./state";

const STATION_LAYER_WEIGHTS: Record<LocationTier, { 하층: number; 중층: number; 상층: number }> = {
  하층: { 하층: 1.5, 중층: 0.7, 상층: 0.2 },
  중층: { 하층: 0.8, 중층: 1.4, 상층: 0.6 },
  상층: { 하층: 0.3, 중층: 0.8, 상층: 1.8 },
};

const FACTION_NAME_BY_ID: Record<string, string> = {
  [FACTION_IDS.BAIRUI]: "바이루이",
  [FACTION_IDS.MASADA]: "마사다",
  [FACTION_IDS.KIKUMOTO]: "키쿠모토",
  [FACTION_IDS.ALMADINAT]: "알-마디낫",
  [FACTION_IDS.NULLS]: "더 널스",
  [FACTION_IDS.VALVE]: "더 밸브",
  [FACTION_IDS.FUSE]: "더 퓨즈",
  [FACTION_IDS.DAMPER]: "더 댐퍼",
  [FACTION_IDS.LANADA]: "La Nada",
  [FACTION_IDS.NO_CLAIM]: "No Claim",
  [FACTION_IDS.PLUS_ONE]: "Plus One",
  [FACTION_IDS.RATTLE]: "Rattle",
  [FACTION_IDS.ONE_MORE]: "One More",
  [FACTION_IDS.TEN_MEN]: "Ten Men",
};

function reputationStatus(rep: number): string {
  if (rep >= 30) return "우호";
  if (rep <= -30) return "적대";
  return "긴장";
}

export function buildNarratorWorldState(state: GameState) {
  const fixer = state.fixerProfile;
  const station = state.stationState;
  const stats = state.playerBehavioralStats;

  const stationTier: LocationTier = station?.locationTier ?? "중층";
  const poolWeights = STATION_LAYER_WEIGHTS[stationTier];

  const notableFactionStates = Object.entries(state.factionReputation)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 6)
    .map(([id, rep]) => ({
      faction: FACTION_NAME_BY_ID[id] ?? id,
      status: reputationStatus(rep),
      fixer_rep: rep,
    }));

  return {
    current_turn: state.turnCount,
    fixer_summary: {
      codename: fixer?.codename ?? "UNKNOWN",
      origin: fixer?.origin ?? "UNKNOWN",
      fame: stats.fame,
      infamy: stats.infamy,
      expertise_tags: stats.expertiseTags,
      station: station ? `${station.locationTier} | ${station.facilityName}` : "미배치",
    },
    station_state: {
      location_tier: stationTier,
      grade: station?.level ?? 1,
      facility: station?.facilityName ?? "기본 시설",
    },
    mission_pool_weights: poolWeights,
    notable_faction_states: notableFactionStates,
    area_alerts: [],
    recent_player_actions: [],
  };
}
