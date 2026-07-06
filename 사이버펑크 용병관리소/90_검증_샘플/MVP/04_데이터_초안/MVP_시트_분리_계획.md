# MVP 시트 분리 계획

이 문서는 `90_검증_샘플/MVP/04_데이터_초안/MVP_데이터_초안.md`를 실제 스프레드시트 또는 CSV 파일로 옮기기 위한 시트 분리 기준을 정의한다.

목적은 데이터베이스 정규화를 완성하는 것이 아니라, MVP 수동 테스트와 초기 프로토타입에서 다룰 수 있는 최소 시트 구조를 정하는 것이다.

---

## 1. 분리 원칙

- 한 행은 하나의 주요 개체를 표현한다.
- 사람이 직접 수정해야 하는 값은 한 시트 안에서 최대한 읽기 쉽게 둔다.
- 배열 필드는 MVP에서는 쉼표 구분 문자열로 둘 수 있다.
- 단, 보상/평판/상태 변화처럼 결과 보고서에서 반복 검증해야 하는 값은 보조 시트로 분리한다.
- 긴 설명문은 본문 전체를 복사하지 않고 문서 경로 참조 또는 짧은 요약으로 둔다.
- ID는 `MVP_최소_데이터_필드.md`의 규칙을 따른다.

---

## 2. MVP 시트 목록

### 2.1 핵심 시트

```text
stats
missions
mercenaries
gear
implants
statuses
matching_cases
result_reports
```

### 2.2 보조 시트

```text
mission_required_gear
mission_primary_stats
mission_recommended_stats
mission_threats
mercenary_gear
mercenary_implants
mercenary_statuses
mercenary_tags
matching_signals
report_status_changes
report_gear_updates
report_implant_updates
report_reputation_changes
report_followup_hooks
```

### 2.3 보류 시트

```text
tags
factions
items
areas
nodes
economy_balance
insurance_rules
ai_generation_prompts
```

보류 이유:

- MVP 데이터 초안에는 참조 ID만 있으면 충분하다.
- 전체 태그/팩션/아이템/구역 사전을 지금 만들면 MVP 범위를 벗어난다.
- 노드와 경제 밸런스는 수동 테스트 이후 확정한다.

---

## 3. 핵심 시트 정의

### 3.1 stats

역할: 5대 스탯 정의.

컬럼:

```text
stat_key
display_name_ko
description_ko
```

데이터 수:

```text
5행
```

비고:

- `frame`, `cool`, `wire`, `cypher`, `pulse`만 사용한다.

---

### 3.2 missions

역할: 미션 3개의 기본 데이터.

컬럼:

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
required_conditions
bonus_condition_summary_ko
phase_0_briefing_ref
phase_1_summary_ko
phase_2_summary_ko
success_summary_ko
failure_summary_ko
is_mvp
```

데이터 수:

```text
3행
```

한 셀 유지:

- `required_conditions`
- `bonus_condition_summary_ko`
- `phase_1_summary_ko`
- `phase_2_summary_ko`

별도 시트 분리:

- 필수 장비: `mission_required_gear`
- 주 판정 스탯: `mission_primary_stats`
- 권장 스탯: `mission_recommended_stats`
- 위협 프로필: `mission_threats`

---

### 3.3 mercenaries

역할: 테스트 용병 4명의 기본 데이터.

컬럼:

```text
merc_id
display_name_ko
alias_ko
origin_ko
employment_status
contract_terms_ko
frame_value
cool_value
wire_value
cypher_value
pulse_value
visibility_level
phase_0_profile_ko
phase_1_summary_ko
phase_2_summary_ko
story_hook_summary_ko
is_mvp
```

데이터 수:

```text
4행
```

한 셀 유지:

- `phase_0_profile_ko`
- `phase_1_summary_ko`
- `phase_2_summary_ko`
- `story_hook_summary_ko`

별도 시트 분리:

- 보유 장비: `mercenary_gear`
- 보유 임플란트: `mercenary_implants`
- 현재 상태: `mercenary_statuses`
- 공개 태그: `mercenary_tags`

---

### 3.4 gear

역할: MVP 등장 장비 데이터.

컬럼:

```text
gear_id
display_name_ko
function_name_ko
gear_slot
gear_type
usage_type
visibility_value
is_required_gear
condition_state
durability_state
effect_summary_ko
repair_cost
insurance_group
is_mvp
```

데이터 수:

```text
7행
```

비고:

- 보험 계산은 하지 않는다.
- `insurance_group`은 향후 확장을 위한 참조값으로만 둔다.

---

### 3.5 implants

역할: MVP 등장 임플란트 데이터.

컬럼:

```text
implant_id
display_name_ko
function_name_ko
body_part
implant_type
visibility_value
condition_state
effect_summary_ko
malfunction_risk_ko
repair_cost
insurance_group
is_mvp
```

데이터 수:

```text
6행
```

비고:

- 장비와 임플란트는 같은 시트로 합치지 않는다.
- 이유: 부위, 수리, 손상, 가시성은 비슷하지만 향후 장착 규칙이 달라질 가능성이 높다.

---

### 3.6 statuses

역할: MVP 등장 상태 데이터.

컬럼:

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
is_mvp
```

데이터 수:

```text
11행
```

비고:

- 상태 강도는 `minor`, `moderate`, `severe`, `critical` 4단계만 사용한다.

---

### 3.7 matching_cases

역할: 미션-용병 조합 판정의 중심 행.

컬럼:

```text
match_id
mission_id
merc_id
deployment_verdict
success_outlook
loss_outlook
expected_result_type
summary_ko
is_mvp
```

데이터 수:

```text
최소 4행
확장 시 12행
```

MVP 첫 입력 기준:

- 데이터 초안에 들어간 핵심 4개 매칭만 먼저 입력한다.
- 이후 12개 전체 조합으로 확장한다.

별도 시트 분리:

- 유리/불리/조건부/미확인 신호: `matching_signals`

---

### 3.8 result_reports

역할: 결과 보고서 3개 샘플의 중심 행.

컬럼:

```text
report_id
mission_id
merc_id
result_type
reward_credits
extra_reward_credits
lost_credits
summary_log_ko
fulfilled_conditions_ko
missing_conditions_ko
joker_triggered
triggered_risk_nodes_ko
is_mvp
```

데이터 수:

```text
3행
```

별도 시트 분리:

- 상태 변화: `report_status_changes`
- 장비 변화: `report_gear_updates`
- 임플란트 변화: `report_implant_updates`
- 평판 변화: `report_reputation_changes`
- 후속 단서: `report_followup_hooks`

---

## 4. 보조 시트 정의

### 4.1 mission_required_gear

```text
mission_id
gear_id
is_hard_required
note_ko
```

용도:

- 미션 하나가 여러 필수 장비를 요구할 수 있으므로 별도 시트로 둔다.

---

### 4.2 mission_primary_stats

```text
mission_id
stat_key
priority_order
note_ko
```

용도:

- `frame, wire`처럼 복수 주 스탯을 한 셀에 넣지 않고 검색 가능하게 만든다.

---

### 4.3 mission_recommended_stats

```text
mission_id
stat_key
recommended_value
requirement_type
note_ko
```

`requirement_type` 값:

```text
recommended
bonus
minimum
```

---

### 4.4 mission_threats

```text
threat_id
mission_id
display_name_ko
stat_key
target_value
threat_summary_ko
```

용도:

- Phase 2 위협 프로필을 데이터화한다.

---

### 4.5 mercenary_gear

```text
merc_id
gear_id
equip_state
note_ko
```

`equip_state` 값:

```text
equipped
owned
loan_required
damaged
```

---

### 4.6 mercenary_implants

```text
merc_id
implant_id
condition_state
note_ko
```

---

### 4.7 mercenary_statuses

```text
merc_id
status_id
status_source
note_ko
```

---

### 4.8 mercenary_tags

```text
merc_id
tag_id
tag_category
visibility_phase
note_ko
```

비고:

- MVP에서는 태그 사전을 따로 만들지 않는다.
- 이 시트는 용병 문서에 이미 등장한 태그 후보를 임시 연결하는 용도다.

---

### 4.9 matching_signals

```text
match_id
signal_type
signal_text_ko
source_ref
```

`signal_type` 값:

```text
advantage
disadvantage
conditional
unknown
```

---

### 4.10 report_status_changes

```text
report_id
status_id
change_type
note_ko
```

`change_type` 값:

```text
add
worsen
remove
maintain
```

---

### 4.11 report_gear_updates

```text
report_id
gear_id
update_type
repair_cost
note_ko
```

`update_type` 값:

```text
worn
damaged
overheated
repaired
lost
```

---

### 4.12 report_implant_updates

```text
report_id
implant_id
update_type
repair_cost
note_ko
```

---

### 4.13 report_reputation_changes

```text
report_id
faction_id
reputation_delta
note_ko
```

비고:

- 팩션 사전은 MVP에서 만들지 않는다.
- `faction_id`는 임시 참조값으로 둔다.

---

### 4.14 report_followup_hooks

```text
report_id
hook_id
display_name_ko
hook_summary_ko
is_mvp_followup
```

비고:

- 후속 의뢰를 실제 생성하지 않는다.
- 결과 보고서가 다음 선택으로 이어질 수 있는지 검증하는 용도다.

---

## 5. 한 셀 유지 vs 별도 시트 분리 기준

### 5.1 한 셀 유지

아래는 MVP 단계에서 한 셀에 둔다.

- 짧은 설명문.
- Phase 요약.
- 브리핑 문서 참조.
- 단일 조건 요약.
- 내부 메모.

이유:

- 사람이 직접 읽고 수정해야 한다.
- 반복 검색이나 집계가 아직 중요하지 않다.

### 5.2 별도 시트 분리

아래는 별도 시트로 뺀다.

- 하나의 개체에 여러 개가 붙는 장비/임플란트/상태.
- 스탯 요구치.
- 매칭 신호.
- 결과 보고서의 상태/장비/평판 변화.
- 후속 단서.

이유:

- 반복 행으로 관리해야 검색/필터/검증이 쉽다.
- 한 셀 문자열로 두면 이후 구현 전환 때 다시 풀어야 한다.

---

## 6. MVP 첫 시트 작성 순서

1. `stats`
2. `gear`
3. `implants`
4. `statuses`
5. `missions`
6. `mercenaries`
7. `mission_required_gear`
8. `mission_primary_stats`
9. `mission_recommended_stats`
10. `mission_threats`
11. `mercenary_gear`
12. `mercenary_implants`
13. `mercenary_statuses`
14. `matching_cases`
15. `matching_signals`
16. `result_reports`
17. `report_status_changes`
18. `report_gear_updates`
19. `report_implant_updates`
20. `report_reputation_changes`
21. `report_followup_hooks`

이 순서가 필요한 이유:

- 참조되는 ID를 먼저 만든다.
- 이후 관계 시트를 채운다.
- 마지막에 결과 보고서 반영 시트를 검증한다.

---

## 7. 다음 작업

다음 단계는 실제 시트 초안 작성이다.

권장 위치:

```text
90_검증_샘플/MVP/04_데이터_초안/시트/
```

현재 폴더 구조:

```text
90_검증_샘플/MVP/04_데이터_초안/시트/
  README.md
  01_핵심_시트/
  02_관계_시트/
  03_결과_반영_시트/
```

권장 파일:

```text
stats.csv
missions.csv
mercenaries.csv
gear.csv
implants.csv
statuses.csv
matching_cases.csv
result_reports.csv
```

작성 완료:

```text
01_핵심_시트/stats.csv
01_핵심_시트/missions.csv
01_핵심_시트/mercenaries.csv
01_핵심_시트/gear.csv
01_핵심_시트/implants.csv
01_핵심_시트/statuses.csv
01_핵심_시트/matching_cases.csv
01_핵심_시트/result_reports.csv
```

추가 작성 완료:

```text
02_관계_시트/mission_required_gear.csv
02_관계_시트/mission_primary_stats.csv
02_관계_시트/mission_recommended_stats.csv
02_관계_시트/mission_threats.csv
02_관계_시트/mercenary_gear.csv
02_관계_시트/mercenary_implants.csv
02_관계_시트/mercenary_statuses.csv
02_관계_시트/mercenary_tags.csv
02_관계_시트/matching_signals.csv
```

결과 반영 시트 작성 완료:

```text
03_결과_반영_시트/report_status_changes.csv
03_결과_반영_시트/report_gear_updates.csv
03_결과_반영_시트/report_implant_updates.csv
03_결과_반영_시트/report_reputation_changes.csv
03_결과_반영_시트/report_followup_hooks.csv
```

이제 MVP CSV는 `미션 -> 용병 -> 매칭 -> 결과 보고서 -> 바로 정산` 흐름을 데이터상으로 한 번 닫을 수 있다.

---

## 다음 단계 (2026-06-05 기준)

CSV 작성 이후 진행된 작업:

1. CSV 기준 1턴 수동 테스트 시뮬레이션 → 결과 반영 시트 필수 확인 (완료)
2. 로컬 웹 프로토타입 구축 → `prototype/mvp-web/` (완료)
3. `UI/미션 화면 흐름.md` UI 반영 (완료)

**현재 단계:** 기획자가 웹 프로토타입을 직접 플레이해 흐름·가독성 판단.

전체 진행: `00_프로젝트_관리/해야 할것.md` · MVP 세부: `MVP_문서_평가.md` §5
