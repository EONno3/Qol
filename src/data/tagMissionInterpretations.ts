import type { TagMissionInterpretation } from "./types";

/**
 * 미션 해석 규칙 — 정성적 reading만. 수치는 domain/tags.ts MVP 브리지가 GAME_CONFIG로 해석.
 * 기존 engine/survival 하드코딩을 이관한 MVP 최소 세트.
 */
export const TAG_MISSION_INTERPRETATIONS: TagMissionInterpretation[] = [
  // ── 하층 생존 긍정 (gate_modifier + positive @ lower) ──
  { ruleId: "interp_slum_surv_lower", tagId: "tag_origin_slum_native", context: { tier: "lower" }, reading: "positive", judgmentAxis: "gate_modifier", designNoteKo: "하층 슬럼 적응" },
  { ruleId: "interp_grid_surv_lower", tagId: "tag_operation_high_voltage_grid_tech", context: { tier: "lower" }, reading: "positive", judgmentAxis: "gate_modifier", designNoteKo: "하층 고압망 적응" },
  // ── 중층 생존 긍정 ──
  { ruleId: "interp_nightlife_surv_mid", tagId: "tag_origin_nightlife_worker", context: { tier: "mid" }, reading: "positive", judgmentAxis: "gate_modifier", designNoteKo: "중층 유흥가 적응" },
  { ruleId: "interp_scanner_surv_mid", tagId: "tag_gear_scanner_deception", context: { tier: "mid" }, reading: "positive", judgmentAxis: "gate_modifier", designNoteKo: "중층 검문/스캐너 대응" },
  // ── 상층 생존 긍정 ──
  { ruleId: "interp_upper_etiq_surv_upper", tagId: "tag_origin_upper_etiquette", context: { tier: "upper" }, reading: "positive", judgmentAxis: "gate_modifier", designNoteKo: "상층 예법 적응" },
  // ── 노출형 크롬: 전 구역 부정 ──
  { ruleId: "interp_showy_lower", tagId: "tag_implant_showy_chrome", context: { tier: "lower" }, reading: "negative", judgmentAxis: "gate_modifier" },
  { ruleId: "interp_showy_mid", tagId: "tag_implant_showy_chrome", context: { tier: "mid" }, reading: "negative", judgmentAxis: "gate_modifier" },
  { ruleId: "interp_showy_upper", tagId: "tag_implant_showy_chrome", context: { tier: "upper" }, reading: "negative", judgmentAxis: "gate_modifier" },
  // ── 상층 불법 격투장: 상층 부정 ──
  { ruleId: "interp_arena_surv_upper", tagId: "tag_origin_illegal_arena", context: { tier: "upper" }, reading: "negative", judgmentAxis: "gate_modifier" },
  // ── 상층 슬럼 출신 약점 (survival_modifier) ──
  { ruleId: "interp_slum_surv_upper", tagId: "tag_origin_slum_native", context: { tier: "upper" }, reading: "negative", judgmentAxis: "survival_modifier", designNoteKo: "상층 슬럼 출신 약점" },
  // ── 조커 (joker_card + special) ──
  { ruleId: "interp_joker_infil_scanner", tagId: "tag_gear_scanner_deception", context: { missionType: "잠입" }, reading: "special", judgmentAxis: "joker_card" },
  { ruleId: "interp_joker_infil_nightlife", tagId: "tag_origin_nightlife_worker", context: { missionType: "잠입" }, reading: "special", judgmentAxis: "joker_card" },
  { ruleId: "interp_joker_support_grid", tagId: "tag_operation_high_voltage_grid_tech", context: { missionType: ["지원", "교섭", "추적"] }, reading: "special", judgmentAxis: "joker_card" },
  { ruleId: "interp_joker_support_slum", tagId: "tag_origin_slum_native", context: { missionType: ["지원", "교섭", "추적"] }, reading: "special", judgmentAxis: "joker_card" },
  { ruleId: "interp_joker_combat_showy", tagId: "tag_implant_showy_chrome", context: { missionType: "전투" }, reading: "special", judgmentAxis: "joker_card" },
  { ruleId: "interp_joker_combat_arena", tagId: "tag_origin_illegal_arena", context: { missionType: "전투" }, reading: "special", judgmentAxis: "joker_card" },
  // ── node_modifier (challengeTag × loadout/merc tag) — 범용 데이터 규칙 ──
  { ruleId: "node_insulated_vs_electric", tagId: "tag_gear_insulated_work_habit", context: { challengeTag: "tag_threat_electric" }, reading: "positive", judgmentAxis: "node_modifier", designNoteKo: "절연 장비 vs 전기 위협" },
  { ruleId: "node_showy_vs_electric", tagId: "tag_implant_showy_chrome", context: { challengeTag: "tag_threat_electric" }, reading: "negative", judgmentAxis: "node_modifier" },
  { ruleId: "node_visible_gear_vs_detection", tagId: "tag_gear_weapon_visible", context: { challengeTag: "tag_challenge_gear_detection" }, reading: "negative", judgmentAxis: "node_modifier" },
  { ruleId: "node_concealed_vs_detection", tagId: "tag_gear_concealed_carry", context: { challengeTag: "tag_challenge_gear_detection" }, reading: "positive", judgmentAxis: "node_modifier" },
  { ruleId: "node_hidden_slot_vs_detection", tagId: "tag_gear_hidden_slot", context: { challengeTag: "tag_challenge_gear_detection" }, reading: "positive", judgmentAxis: "node_modifier" },
];
