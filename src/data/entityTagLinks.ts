import type { EntityTagLink } from "./types";

/**
 * 엔티티↔태그 부착 SSOT — 계층 분리.
 * 용병: 출신·행동·상태 / 장비·임플란트: 물리 속성만.
 */
export const ENTITY_TAG_LINKS: EntityTagLink[] = [
  // ── mercenary ──
  { entityType: "mercenary", entityId: "merc_breaker_01", tagId: "tag_operation_high_voltage_grid_tech", visibilityPhase: 2, noteKo: "고압망 작업 숙련." },
  { entityType: "mercenary", entityId: "merc_breaker_01", tagId: "tag_origin_slum_native", visibilityPhase: 2, noteKo: "하층 슬럼 출신." },
  { entityType: "mercenary", entityId: "merc_breaker_01", tagId: "tag_condition_electric_afterimage", visibilityPhase: 2, noteKo: "감전 잔향 상태." },
  { entityType: "mercenary", entityId: "merc_malt_01", tagId: "tag_origin_nightlife_worker", visibilityPhase: 2, noteKo: "중층 유흥가 출신." },
  { entityType: "mercenary", entityId: "merc_malt_01", tagId: "tag_operation_civilian_disguise", visibilityPhase: 2, noteKo: "민간인 위장 운용." },
  { entityType: "mercenary", entityId: "merc_malt_01", tagId: "tag_condition_debt_shadow", visibilityPhase: 2, noteKo: "채무 관계 리스크." },
  { entityType: "mercenary", entityId: "merc_velvet_knife_01", tagId: "tag_origin_upper_etiquette", visibilityPhase: 2, noteKo: "상층 예법 출신." },
  { entityType: "mercenary", entityId: "merc_velvet_knife_01", tagId: "tag_operation_gene_deception", visibilityPhase: 2, noteKo: "유전자 기만 운용." },
  { entityType: "mercenary", entityId: "merc_velvet_knife_01", tagId: "tag_appearance_clean_profile", visibilityPhase: 2, noteKo: "단정한 인상." },
  { entityType: "mercenary", entityId: "merc_velvet_knife_01", tagId: "tag_condition_reflection_delay", visibilityPhase: 2, noteKo: "반사면 지연 반응." },
  { entityType: "mercenary", entityId: "merc_chromeshow_01", tagId: "tag_origin_illegal_arena", visibilityPhase: 2, noteKo: "불법 격투장 출신." },
  { entityType: "mercenary", entityId: "merc_chromeshow_01", tagId: "tag_condition_electric_sensitivity", visibilityPhase: 2, noteKo: "감전 과민." },
  { entityType: "mercenary", entityId: "merc_chromeshow_01", tagId: "tag_behavior_wait_order_disobedience", visibilityPhase: 2, noteKo: "명령 불복종." },
  // ── gear ──
  { entityType: "gear", entityId: "gear_feet_insulated_boots_01", tagId: "tag_gear_insulated_work_habit", visibilityPhase: 2, noteKo: "절연 안전화 속성." },
  { entityType: "gear", entityId: "gear_wrist_auth_bypass_bracelet_01", tagId: "tag_gear_scanner_deception", visibilityPhase: 2, noteKo: "스캐너 기만 장비." },
  { entityType: "gear", entityId: "gear_body_hidden_slot_01", tagId: "tag_gear_hidden_slot", visibilityPhase: 2, noteKo: "은닉 슬롯." },
  { entityType: "gear", entityId: "gear_body_hidden_slot_01", tagId: "tag_gear_concealed_carry", visibilityPhase: 2, noteKo: "은닉 운반 가능." },
  { entityType: "gear", entityId: "gear_weapon_fold_pistol_01", tagId: "tag_gear_weapon_visible", visibilityPhase: 2, noteKo: "외장 무기 가시." },
  { entityType: "gear", entityId: "gear_weapon_ceramic_knife_01", tagId: "tag_gear_weapon_visible", visibilityPhase: 2, noteKo: "외장 무기 가시." },
  // ── implant ──
  { entityType: "implant", entityId: "implant_torso_exposed_armor_01", tagId: "tag_implant_showy_chrome", visibilityPhase: 2, noteKo: "노출형 크롬." },
  { entityType: "implant", entityId: "implant_arm_shotgun_01", tagId: "tag_implant_high_output_shotgun_arm", visibilityPhase: 2, noteKo: "고출력 산탄 암." },
  { entityType: "implant", entityId: "implant_arm_shotgun_01", tagId: "tag_gear_weapon_visible", visibilityPhase: 2, noteKo: "내장 무기도 검문 시 노출 리스크." },
];

export function getEntityTagLinks(entityType: EntityTagLink["entityType"], entityId: string): EntityTagLink[] {
  return ENTITY_TAG_LINKS.filter((l) => l.entityType === entityType && l.entityId === entityId);
}
