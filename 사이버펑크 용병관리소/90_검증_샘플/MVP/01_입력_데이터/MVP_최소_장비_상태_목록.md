# MVP 최소 장비/상태 목록

이 문서는 MVP 테스트 문서군에 실제 등장한 장비, 임플란트, 상태만 최소 필드로 정리한다.

목적은 전체 장비/상태 사전을 만드는 것이 아니라, `MVP_1턴_수동_테스트_절차.md`와 `MVP_최소_데이터_필드.md`를 실제 데이터로 옮길 때 필요한 최소 항목을 고정하는 것이다.

---

## 1. 작성 원칙

- 항목 수는 MVP 문서에 실제 등장한 것만 사용한다.
- 이름 톤은 혼합형으로 둔다.
  - `display_name_ko`: 플레이어가 보는 브랜드형/분위기형 이름.
  - `function_name_ko`: 기획/데이터에서 기능을 바로 알 수 있는 이름.
- 보험 계산은 MVP에서 제외한다.
- 정비/수리 비용은 `repair_cost`만 사용한다.
- 상태 강도는 `minor`, `moderate`, `severe`, `critical` 4단계만 사용한다.

---

## 2. 사용 방식 기준

### 2.1 장비 사용 방식

```text
fixed: 고정 장비. 장착 후 반복 사용 가능.
consumable: 소모품. 사용 후 사라짐.
semi_consumable: 반소모품. 사용 후 정비/재충전/교체가 필요함.
```

### 2.2 확정 기준

- 절연 안전화: `fixed`
- 손목 인증 우회기: `fixed`
- 인공 DNA 유전자 스킨 패치: `semi_consumable`
- 상층 고고도 기압 보정기: `fixed`

---

## 3. MVP 장비 목록

### 3.1 러버세인트 절연 부츠

```text
gear_id: gear_feet_insulated_boots_01
display_name_ko: 러버세인트 절연 부츠
function_name_ko: 산업용 절연 안전화
gear_slot: feet
gear_type: protective
usage_type: fixed
visibility_value: 5
is_required_gear: true
condition_state: normal
durability_state: worn_light
effect_summary_ko: 고전압 지대 통과 시 감전 피해를 줄인다.
repair_cost: 700
insurance_group: industrial_protective
mvp_source: 하층 변전소 미션, 차단기 결과 보고서
```

MVP 사용처:

- 하층 변전소 미션의 필수 기어.
- 차단기 성공 샘플에서 경미 마모 발생.

### 3.2 글래스리스트 인증 팔찌

```text
gear_id: gear_wrist_auth_bypass_bracelet_01
display_name_ko: 글래스리스트 인증 팔찌
function_name_ko: 손목형 근거리 인증 우회기
gear_slot: wrist
gear_type: access
usage_type: fixed
visibility_value: 8
is_required_gear: false
condition_state: overheated
durability_state: worn_light
effect_summary_ko: 근거리 인증 기록을 덮어씌워 검문/출입 판정을 흔든다.
repair_cost: 1200
insurance_group: stealth_access
mvp_source: 몰트 이력서, 중층 클럽 부분 성공 결과
```

MVP 사용처:

- 중층 클럽 미션에서 스캐너 기만을 설명하는 핵심 장비.
- 부분 성공 샘플에서 과열 흔적 발생.

### 3.3 세컨드페이스 DNA 스킨 패치

```text
gear_id: gear_skin_dna_patch_01
display_name_ko: 세컨드페이스 DNA 스킨 패치
function_name_ko: 인공 DNA 유전자 스킨 패치
gear_slot: face
gear_type: stealth
usage_type: semi_consumable
visibility_value: 2
is_required_gear: true
condition_state: normal
durability_state: single_contract
effect_summary_ko: 바이오메트릭 대조에서 임시 신원 위장층을 제공한다.
repair_cost: 0
insurance_group: none
mvp_source: 상층 펜트하우스 미션, 벨벳 나이프 매칭
```

MVP 사용처:

- 상층 펜트하우스 미션의 필수 기어.
- 사용 후 재사용 여부는 MVP에서는 `semi_consumable`로 처리한다.

### 3.4 헤븐프레셔 고도 보정기

```text
gear_id: gear_lung_high_altitude_regulator_01
display_name_ko: 헤븐프레셔 고도 보정기
function_name_ko: 상층 고고도 기압 보정기
gear_slot: utility
gear_type: protective
usage_type: fixed
visibility_value: 6
is_required_gear: true
condition_state: normal
durability_state: normal
effect_summary_ko: 상층 고고도 환경에서 폐와 신경계 압력 부담을 줄인다.
repair_cost: 1800
insurance_group: upper_life_support
mvp_source: 상층 펜트하우스 미션, 벨벳 나이프 매칭
```

MVP 사용처:

- 상층 펜트하우스 미션의 필수 기어.
- 몰트 상층 조건부 출격 케이스에서도 임시 지급 후보.

### 3.5 로우시그 은닉 슬롯

```text
gear_id: gear_body_hidden_slot_01
display_name_ko: 로우시그 은닉 슬롯
function_name_ko: 은닉형 보관 슬롯
gear_slot: body
gear_type: stealth
usage_type: fixed
visibility_value: 3
is_required_gear: false
condition_state: normal
durability_state: normal
effect_summary_ko: 소형 장비나 칩을 신체 검사에서 숨길 수 있게 한다.
repair_cost: 900
insurance_group: stealth_access
mvp_source: 중층 클럽 미션, 몰트 매칭
```

MVP 사용처:

- 중층 클럽 미션의 조건부 유리 장비.
- 몰트의 은닉 침투 성격을 데이터로 잡기 위한 장비.

### 3.6 소형 접이식 권총

```text
gear_id: gear_weapon_fold_pistol_01
display_name_ko: 슬림폴드 권총
function_name_ko: 소형 접이식 권총
gear_slot: weapon
gear_type: weapon
usage_type: fixed
visibility_value: 12
is_required_gear: false
condition_state: normal
durability_state: normal
effect_summary_ko: 낮은 가시성으로 숨길 수 있는 소형 화기.
repair_cost: 600
insurance_group: small_weapon
mvp_source: 몰트 이력서
```

MVP 사용처:

- 중층 은닉 침투용 저가시성 무장 예시.

### 3.7 세라믹 단검

```text
gear_id: gear_weapon_ceramic_knife_01
display_name_ko: 무음 세라믹 단검
function_name_ko: 세라믹 단검
gear_slot: weapon
gear_type: weapon
usage_type: fixed
visibility_value: 4
is_required_gear: false
condition_state: normal
durability_state: normal
effect_summary_ko: 금속 탐지를 피하기 쉬운 근접 은닉 무기.
repair_cost: 400
insurance_group: small_weapon
mvp_source: 벨벳 나이프 이력서
```

MVP 사용처:

- 상층 저가시성 위장 침투용 무장 예시.

---

## 4. MVP 임플란트 목록

### 4.1 핸드토크 구형 보조 관절

```text
implant_id: implant_wrist_torque_joint_01
display_name_ko: 핸드토크 구형 보조 관절
function_name_ko: 구형 손목 토크 보조 관절
body_part: wrist
implant_type: support
visibility_value: 6
condition_state: worn
effect_summary_ko: 손목 힘과 미세 분해 작업을 보조한다.
malfunction_risk_ko: 고전압 노출 시 관절부 절연 코팅이 먼저 손상된다.
repair_cost: 1500
insurance_group: industrial_support_implant
mvp_source: 차단기 이력서, 하층 변전소 결과 보고서
```

### 4.2 마이크로페이스 표정 안정기

```text
implant_id: implant_face_expression_stabilizer_01
display_name_ko: 마이크로페이스 표정 안정기
function_name_ko: 표정 근육 안정기
body_part: face
implant_type: social_stealth
visibility_value: 1
condition_state: normal
effect_summary_ko: 긴장 상황에서도 표정 노이즈를 낮춘다.
malfunction_risk_ko: 과부하 시 표정 반응이 늦어져 위장 판정에 흔적을 남길 수 있다.
repair_cost: 2200
insurance_group: upper_social_implant
mvp_source: 벨벳 나이프 이력서
```

### 4.3 더마포트 인공 피부 패치 포트

```text
implant_id: implant_skin_patch_port_01
display_name_ko: 더마포트 인공 피부 패치 포트
function_name_ko: 인공 피부 패치 포트
body_part: skin
implant_type: stealth
visibility_value: 1
condition_state: normal
effect_summary_ko: 피부 위장 패치와 신원 위장 소모품을 안정적으로 고정한다.
malfunction_risk_ko: 손상 시 신원 위장 유지 비용이 크게 오른다.
repair_cost: 3000
insurance_group: upper_stealth_implant
mvp_source: 벨벳 나이프 이력서
```

### 4.4 붐암 고출력 산탄 암

```text
implant_id: implant_arm_shotgun_01
display_name_ko: 붐암 고출력 산탄 암
function_name_ko: 고출력 산탄 암
body_part: arm
implant_type: weapon
visibility_value: 35
condition_state: overheated
effect_summary_ko: 근거리 교전에서 강하지만 은닉성이 낮다.
malfunction_risk_ko: 과열 시 팔 신경계 통증과 장비 화재 위험이 있다.
repair_cost: 6500
insurance_group: illegal_weapon_implant
mvp_source: 크롬쇼 이력서, 중층 클럽 실패 결과
```

### 4.5 쇼플레이트 노출형 상체 장갑판

```text
implant_id: implant_torso_exposed_armor_01
display_name_ko: 쇼플레이트 노출형 상체 장갑판
function_name_ko: 노출형 상체 장갑판
body_part: torso
implant_type: armor
visibility_value: 30
condition_state: cracked
effect_summary_ko: 정면 교전 생존력을 높이지만 가시성이 매우 높다.
malfunction_risk_ko: 파손 시 통증 반응과 장비 가시성이 함께 증가한다.
repair_cost: 4200
insurance_group: heavy_visible_implant
mvp_source: 크롬쇼 이력서, 중층 클럽 실패 결과
```

### 4.6 숄더잭 강화 어깨 프레임

```text
implant_id: implant_torso_shoulder_frame_01
display_name_ko: 숄더잭 강화 어깨 프레임
function_name_ko: 강화 어깨 프레임
body_part: torso
implant_type: support
visibility_value: 18
condition_state: cracked
effect_summary_ko: 상체 힘과 충격 버팀을 강화한다.
malfunction_risk_ko: 장갑판 균열과 함께 악화되면 팔 무기 운용 안정성이 떨어진다.
repair_cost: 2800
insurance_group: heavy_visible_implant
mvp_source: 크롬쇼 이력서
```

---

## 5. MVP 상태 목록

### 5.1 수면부족

```text
status_id: status_fatigue_sleep_debt
display_name_ko: 수면부족
status_category: fatigue
severity: minor
source_type: initial_profile
effect_summary_ko: 장기 대기나 잠복 상황에서 집중력 저하 위험이 생긴다.
duration_type: temporary
recovery_condition_ko: 휴식 1턴.
next_mission_risk_ko: 감시/잠복형 미션에서 실수 위험 증가.
mvp_source: 몰트 이력서
```

### 5.2 수면부족 심화

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
mvp_source: 몰트 중층 클럽 부분 성공 결과
```

### 5.3 감전 잔향

```text
status_id: status_neural_electric_afterimage
display_name_ko: 감전 잔향
status_category: mental
severity: minor
source_type: initial_profile
effect_summary_ko: 금속성 스파크나 전기음에 짧게 반응이 굳을 수 있다.
duration_type: chronic
recovery_condition_ko: MVP에서는 회복 조건 미정.
next_mission_risk_ko: 고전압/전력망 미션에서 돌발 경직 위험.
mvp_source: 차단기 이력서
```

### 5.4 전뇌 단락 충격

```text
status_id: status_neural_shortshock
display_name_ko: 전뇌 단락 충격
status_category: implant_damage
severity: severe
source_type: mission_result
effect_summary_ko: 신경계와 의체 제어 신호가 불안정해진다.
duration_type: persistent
recovery_condition_ko: 정비/치료 필요.
next_mission_risk_ko: 전기/해킹/기계 조작 판정에서 오작동 위험 증가.
mvp_source: 하층 변전소 실패 후보, 매칭 케이스표
```

### 5.5 어깨 장갑판 균열

```text
status_id: status_gear_shoulder_armor_crack
display_name_ko: 어깨 장갑판 균열
status_category: gear_damage
severity: moderate
source_type: initial_profile
effect_summary_ko: 노출형 장갑판의 방호력과 외형 가시성에 문제가 생긴다.
duration_type: persistent
recovery_condition_ko: 정비비 지불.
next_mission_risk_ko: 전투 지속 시 통증 반응과 장비 파손 위험 증가.
mvp_source: 크롬쇼 이력서
```

### 5.6 어깨 장갑판 균열 악화

```text
status_id: status_gear_shoulder_armor_crack_worse
display_name_ko: 어깨 장갑판 균열 악화
status_category: gear_damage
severity: severe
source_type: mission_result
effect_summary_ko: 장갑판 파손이 커져 방호력보다 가시성 부담이 더 커진다.
duration_type: persistent
recovery_condition_ko: 정비비 지불.
next_mission_risk_ko: 은닉/검문형 미션에서 불리 신호 증가.
mvp_source: 크롬쇼 중층 클럽 실패 결과
```

### 5.7 탄환 관통흔

```text
status_id: status_injury_bullet_puncture
display_name_ko: 탄환 관통흔
status_category: injury
severity: severe
source_type: mission_result
effect_summary_ko: 총상과 의체 외장 손상이 함께 남는다.
duration_type: persistent
recovery_condition_ko: 치료와 장비 정비 필요.
next_mission_risk_ko: 장시간 교전과 은닉 이동에서 통증/가시성 위험 증가.
mvp_source: 크롬쇼 중층 클럽 실패 결과
```

### 5.8 우회기 과열 흔적

```text
status_id: status_gear_auth_bypass_overheat
display_name_ko: 우회기 과열 흔적
status_category: gear_damage
severity: moderate
source_type: mission_result
effect_summary_ko: 손목형 인증 우회기의 냉각 성능이 떨어져 재사용 전 정비가 필요하다.
duration_type: persistent
recovery_condition_ko: 정비비 1,200 크레딧.
next_mission_risk_ko: 검문/출입 인증 계열 미션에서 장비 실패 위험 증가.
mvp_source: 몰트 중층 클럽 부분 성공 결과
```

### 5.9 절연 안전화 경미 마모

```text
status_id: status_gear_insulated_boots_worn_light
display_name_ko: 절연 안전화 경미 마모
status_category: gear_damage
severity: minor
source_type: mission_result
effect_summary_ko: 절연 외피가 닳았지만 즉시 사용 불능은 아니다.
duration_type: persistent
recovery_condition_ko: 정비비 700 크레딧.
next_mission_risk_ko: 연속 고전압 미션에서 감전 위험 증가.
mvp_source: 차단기 하층 변전소 성공 결과
```

### 5.10 흥분도 높음

```text
status_id: status_mental_overaroused
display_name_ko: 흥분도 높음
status_category: mental
severity: moderate
source_type: initial_profile
effect_summary_ko: 대기 명령이나 은밀한 접근에서 행동이 거칠어질 위험이 있다.
duration_type: temporary
recovery_condition_ko: 휴식 또는 진정 처리.
next_mission_risk_ko: 잠입/검문형 미션에서 경보 유발 위험 증가.
mvp_source: 크롬쇼 이력서
```

### 5.11 약물성 수면 보조제 복용

```text
status_id: status_med_sleep_aid
display_name_ko: 약물성 수면 보조제 복용
status_category: mental
severity: minor
source_type: initial_profile
effect_summary_ko: 안정 상태를 유지하지만 장기 피로 누적의 단서가 될 수 있다.
duration_type: temporary
recovery_condition_ko: 휴식 또는 약물 관리.
next_mission_risk_ko: 장기 작전에서 반응 지연 가능성.
mvp_source: 벨벳 나이프 이력서
```

---

## 6. MVP에서 제외하는 장비/상태 확장

아래는 이번 목록에서 만들지 않는다.

- 전체 브랜드 라인업.
- 장비 등급표.
- 보험 상품별 계산식.
- 치료/정비 시간표.
- 모든 부상 상태 사전.
- 모든 태그와 상태의 상호작용표.
- 캐치업 모드 전용 장비.

---

## 7. 다음 반영 위치

- `90_검증_샘플/MVP/01_입력_데이터/MVP_최소_데이터_필드.md`의 장비/임플란트/상태 필드 예시를 실제 항목으로 검증할 때 사용한다.
- `90_검증_샘플/MVP/03_테스트_절차/MVP_1턴_수동_테스트_절차.md`에서 바로 정산 후 상태/장비 반영을 확인할 때 사용한다.
- 구현 또는 스프레드시트 테스트에서는 이 문서의 ID를 우선 사용한다.
