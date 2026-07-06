# MVP 최소 데이터 필드

이 문서는 현재 MVP 문서군을 실제 구현 또는 스프레드시트 테스트로 옮기기 위한 최소 데이터 필드를 정의한다.

목적은 모든 데이터를 확정하는 것이 아니다.  
MVP 테스트에 필요한 데이터만 필드 기준으로 자르고, 이후 확장 가능한 이름 규칙을 세우는 것이다.

---

## 1. 공통 원칙

- 데이터 기준은 문장형 설명이 아니라 **필드 기준**으로 둔다.
- 내부 필드명은 영문 `snake_case`를 사용한다.
- 플레이어에게 보이는 값은 별도의 한글 표시 필드로 둔다.
- 한글 표시명은 스탯, 팩션, 태그, 장비, 상태, 결과 타입 등 유저가 볼 수 있는 모든 데이터에 적용한다.
- MVP에서는 필요한 필드만 둔다. 전체 태그 사전, 전체 장비 사전, 세부 확률식은 만들지 않는다.
- 문체용 설명과 시스템 판정값은 분리한다.

예:

```text
stat_key: frame
display_name_ko: 프레임
```

```text
tag_key: high_voltage_grid_tech
display_name_ko: 고압망 기술
```

---

## 2. ID 규칙

ID는 사람이 읽을 수 있어야 하며, 자주 필터링하는 축을 앞쪽에 둔다.

### 2.1 공통 형식

```text
{type}_{major_filter}_{name}_{number}
```

단, 모든 타입에 같은 축을 억지로 적용하지 않는다.  
미션은 구역/목표, 장비는 장착 부위, 태그는 카테고리, 상태는 상태 계열을 우선한다.

### 2.2 타입별 ID 규칙

```text
mission_{tier}_{area}_{objective}_{number}
merc_{alias_or_role}_{number}
faction_{tier_or_type}_{name}
tag_{category}_{name}
status_{category}_{name}
gear_{slot}_{name}_{number}
implant_{body_part}_{name}_{number}
report_{mission_id}_{merc_id}_{result_type}
match_{mission_id}_{merc_id}
```

### 2.3 예시

```text
mission_lower_fuse_capacitor_01
merc_breaker_01
merc_malt_01
faction_mid_lanada
tag_origin_slum_native
tag_gear_scanner_deception
status_neural_shortshock
gear_feet_insulated_boots_01
gear_wrist_auth_bypass_bracelet_01
implant_arm_shotgun_01
implant_skin_dna_patch_01
report_mission_lower_fuse_capacitor_01_merc_breaker_01_success
match_mission_mid_elneon_backdoor_01_merc_malt_01
```

### 2.4 장비/임플란트 ID 판단

장비와 임플란트는 부위를 앞에 둔다.

이유:

- 장착 슬롯 필터링이 자주 발생한다.
- 미션 필수 조건이 특정 부위 장비를 요구할 수 있다.
- 장비 파손/보험/정비가 부위 기준으로 묶일 가능성이 높다.
- UI에서도 부위별 장착창을 먼저 보여줄 가능성이 높다.

따라서 `gear_insulated_boots_01`보다 `gear_feet_insulated_boots_01`을 우선한다.

---

## 3. 공통 표시 필드

모든 주요 데이터는 최소한 아래 표시 필드를 가진다.

```text
id
display_name_ko
short_description_ko
internal_note
is_mvp
```

| 필드 | 의미 |
|---|---|
| `id` | 내부 참조용 고유 ID |
| `display_name_ko` | 플레이어에게 보이는 한글 이름 |
| `short_description_ko` | 플레이어 또는 기획자가 읽는 짧은 설명 |
| `internal_note` | 구현/밸런스/검증용 메모 |
| `is_mvp` | MVP 테스트 사용 여부 |

---

## 4. 스탯 필드

MVP 스탯은 5개만 사용한다.

```text
frame
cool
wire
cypher
pulse
```

### 4.1 스탯 정의 필드

```text
stat_key
display_name_ko
description_ko
```

예:

```text
stat_key: frame
display_name_ko: 프레임
description_ko: 육체, 하드웨어 수용성, 전투 생존, 중화기 운용.
```

### 4.2 스탯 값 필드

용병과 미션 요구 조건에서 아래 형식을 사용한다.

```text
frame_value
cool_value
wire_value
cypher_value
pulse_value
```

미션 요구 조건은 아래처럼 별도 필드로 둔다.

```text
required_stats
recommended_stats
bonus_stats
```

---

## 5. 미션 최소 필드

```text
mission_id
display_name_ko
tier
area_id
mission_type
difficulty_stars
node_count
reward_credits
early_withdrawal_penalty
required_gear_ids
primary_stat_keys
recommended_stats
bonus_condition
phase_0_briefing_ko
phase_1_hints
phase_2_requirements
threat_profile
success_rewards
failure_losses
reputation_changes
```

### 5.1 필드 설명

| 필드 | 의미 |
|---|---|
| `mission_id` | 미션 고유 ID |
| `display_name_ko` | 미션 표시명 |
| `tier` | `lower`, `mid`, `upper` |
| `area_id` | 구역 ID |
| `mission_type` | 지원, 잠입, 비밀 등 |
| `difficulty_stars` | 1~5 |
| `node_count` | 난이도 기반 기본 노드 수 |
| `reward_credits` | 기본 보상 |
| `early_withdrawal_penalty` | 조기 철수 패널티 |
| `required_gear_ids` | 필수 장비 ID 목록 |
| `primary_stat_keys` | 주 판정 스탯 |
| `recommended_stats` | 권장 스탯 수치 |
| `bonus_condition` | 추가 보상 조건 |
| `phase_0_briefing_ko` | Phase 0 브리핑 |
| `phase_1_hints` | Phase 1 힌트 |
| `phase_2_requirements` | Phase 2 정량 요구 |
| `threat_profile` | 위협 프로필 요약 |
| `success_rewards` | 성공 시 보상 |
| `failure_losses` | 실패 시 손실 |
| `reputation_changes` | 평판 변화 |

---

## 6. 용병 최소 필드

```text
merc_id
display_name_ko
alias_ko
origin_ko
employment_status
contract_terms_ko
stats
gear_ids
implant_ids
visibility_level
current_status_ids
phase_0_profile_ko
phase_1_analysis
phase_2_tags
story_hooks
result_update_slots
```

### 6.1 필드 설명

| 필드 | 의미 |
|---|---|
| `merc_id` | 용병 고유 ID |
| `display_name_ko` | 본명 또는 표시명 |
| `alias_ko` | 별칭 |
| `origin_ko` | 출신 |
| `employment_status` | 고용 가능, 부상, 계약 중 등 |
| `contract_terms_ko` | 계약 조건 |
| `stats` | 5대 스탯 값 |
| `gear_ids` | 보유/장착 장비 ID |
| `implant_ids` | 보유 임플란트 ID |
| `visibility_level` | 장비/외형 노출 수준 |
| `current_status_ids` | 현재 상태 ID |
| `phase_0_profile_ko` | Phase 0 이력 텍스트 |
| `phase_1_analysis` | Phase 1 대표 분석 |
| `phase_2_tags` | Phase 2 공개 태그 |
| `story_hooks` | 이야기 단서 |
| `result_update_slots` | 결과 반영 가능 위치 |

---

## 7. 장비 최소 필드

```text
gear_id
display_name_ko
gear_slot
gear_type
visibility_value
is_required_gear
condition_state
durability_state
effect_summary_ko
repair_cost
insurance_group
```

### 7.1 장비 슬롯 MVP 값

```text
head
face
body
hand
wrist
feet
back
utility
weapon
```

### 7.2 장비 타입 MVP 값

```text
protective
stealth
weapon
tool
consumable
access
```

### 7.3 예시

```text
gear_id: gear_feet_insulated_boots_01
display_name_ko: 고무 재질 전신 절연 안전화
gear_slot: feet
gear_type: protective
visibility_value: 5
is_required_gear: true
condition_state: normal
durability_state: worn_light
effect_summary_ko: 고전압 지대 통과 시 감전 피해를 줄인다.
repair_cost: 700
insurance_group: industrial_protective
```

---

## 8. 임플란트 최소 필드

```text
implant_id
display_name_ko
body_part
implant_type
visibility_value
condition_state
effect_summary_ko
malfunction_risk_ko
repair_cost
insurance_group
```

### 8.1 신체 부위 MVP 값

```text
arm
leg
eye
skin
lung
neural
torso
wrist
```

### 8.2 예시

```text
implant_id: implant_arm_shotgun_01
display_name_ko: 고출력 산탄 암
body_part: arm
implant_type: weapon
visibility_value: 35
condition_state: overheated
effect_summary_ko: 근거리 교전에서 강하지만 은닉성이 낮다.
malfunction_risk_ko: 과열 시 팔 신경계 통증과 장비 화재 위험.
repair_cost: 6500
insurance_group: illegal_weapon_implant
```

---

## 9. 태그 최소 필드

```text
tag_id
display_name_ko
tag_category
tag_type
description_ko
visibility_phase
is_system_tag
is_story_tag
mvp_usage_note
```

### 9.1 태그 카테고리 MVP 값

```text
origin
operation
gear
implant
personality
condition
faction
story
```

### 9.2 예시

```text
tag_id: tag_gear_scanner_deception
display_name_ko: 스캐너 기만
tag_category: gear
tag_type: system
description_ko: 검문/스캐너 계열 판정에서 흔적을 흐리는 장비 운용 습관.
visibility_phase: 2
is_system_tag: true
is_story_tag: false
mvp_usage_note: 중층 클럽 미션 매칭 검증에 사용.
```

---

## 10. 상태 최소 필드

```text
status_id
display_name_ko
status_category
severity
source_type
effect_summary_ko
duration_type
recovery_condition_ko
next_mission_risk_ko
```

### 10.1 상태 카테고리 MVP 값

```text
injury
fatigue
gear_damage
implant_damage
exposure
mental
debt
```

### 10.2 심각도 MVP 값

```text
minor
moderate
severe
critical
```

### 10.3 예시

```text
status_id: status_fatigue_sleep_debt_deep
display_name_ko: 수면부족 심화
status_category: fatigue
severity: moderate
source_type: mission_result
effect_summary_ko: 장기 대기/잠복 판정에서 집중력 저하 위험이 증가한다.
duration_type: temporary
recovery_condition_ko: 휴식 1턴 또는 저가 안정제 사용.
next_mission_risk_ko: 잠복/감시형 미션에서 실수 위험 증가.
```

---

## 11. 매칭 결과 최소 필드

```text
match_id
mission_id
merc_id
merc_analysis_level
mission_analysis_level
match_level
deployment_verdict
advantage_signals
disadvantage_signals
conditional_signals
unknown_signals
success_outlook
loss_outlook
expected_result_type
result_report_focus
```

### 11.1 출격 판정 값

```text
clear
warning
locked
```

표시명:

```text
clear: 가능
warning: 경고
locked: 불가
```

### 11.2 전망 값

```text
high
medium
low
```

표시명:

```text
high: 높음
medium: 보통
low: 낮음
```

---

## 12. 결과 보고서 최소 필드

```text
report_id
mission_id
merc_id
result_type
summary_log_ko
fulfilled_conditions
missing_conditions
triggered_risk_nodes
joker_triggered
reward_credits
extra_reward_credits
lost_credits
acquired_item_ids
missed_benefits
new_status_ids
updated_gear_ids
updated_implant_ids
reputation_changes
followup_hooks
next_reflection_targets
```

### 12.1 결과 타입 5종

```text
success
partial_success
failure
early_withdrawal
incident
```

표시명:

```text
success: 성공
partial_success: 부분 성공
failure: 실패
early_withdrawal: 조기 철수
incident: 사고
```

### 12.2 결과 타입 설명

| 값 | 의미 |
|---|---|
| `success` | 목표를 달성하고 핵심 손실이 없다 |
| `partial_success` | 목표는 달성했지만 보상/상태/관계 손실이 있다 |
| `failure` | 목표 달성 실패 |
| `early_withdrawal` | 목표 완료 전 철수 |
| `incident` | 목표 여부와 별개로 중대한 사고 또는 예외 이벤트 발생 |

---

## 13. MVP에서 아직 만들지 않을 필드

아래는 현재 보류한다.

- 모든 노드의 개별 확률식.
- 전체 장비/임플란트 등급표.
- 전체 태그 상호작용 행렬.
- 장기 경제 밸런스 필드.
- AI 생성 프롬프트 필드.
- UI 레이아웃 좌표/아이콘 필드.
- 세부 보험 상품 필드.
- 세부 치료/정비 시간표.

---

## 14. 수동 테스트 연결

이 문서의 필드는 `90_검증_샘플/MVP/03_테스트_절차/MVP_1턴_수동_테스트_절차.md`에서 실제 1턴 흐름을 검증할 때 사용한다.

해당 절차서에서는 아래 흐름을 확인한다.

```text
미션 3개 공개
-> 용병 4명 확인
-> 분석 레벨 조합 선택
-> 매칭 결과 확인
-> 출격 선택
-> 결과 보고서 출력
-> 상태/장비/평판 반영
-> 테스트 통과/실패 기록
```
