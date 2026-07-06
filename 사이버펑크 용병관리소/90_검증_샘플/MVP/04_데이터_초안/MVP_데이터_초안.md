# MVP 데이터 초안

이 문서는 MVP 문서군을 실제 구현 또는 스프레드시트 테스트로 옮기기 위한 첫 데이터 초안이다.

기준 문서:

- `90_검증_샘플/MVP/01_입력_데이터/MVP_최소_데이터_필드.md`
- `90_검증_샘플/MVP/01_입력_데이터/MVP_최소_장비_상태_목록.md`
- `90_검증_샘플/MVP/00_개요/MVP_테스트_세트.md`
- `90_검증_샘플/MVP/02_판정_케이스/MVP_매칭_케이스표.md`
- `90_검증_샘플/MVP/02_판정_케이스/MVP_결과_보고서_샘플.md`

주의:

- 이 문서는 최종 데이터베이스 스키마가 아니다.
- MVP 수동 테스트와 스프레드시트 입력을 위한 초안이다.
- 값은 임시값이며, 필드 구조와 참조 관계 검증을 우선한다.

---

## 1. Stats

```yaml
stats:
  - stat_key: frame
    display_name_ko: 프레임
    description_ko: 육체, 하드웨어 수용성, 전투 생존, 중화기 운용.

  - stat_key: cool
    display_name_ko: 쿨
    description_ko: 침착함, 정신 마모 저항, 협상, 사이버싸이코 억제.

  - stat_key: wire
    display_name_ko: 와이어
    description_ko: 네트워크, 해킹, 기계 조작, 지원.

  - stat_key: cypher
    display_name_ko: 사이퍼
    description_ko: 은닉, 흔적 제거, 현장 분석, 잠입.

  - stat_key: pulse
    display_name_ko: 펄스
    description_ko: 직관, 돌발 감지, 비정형 위기 대응.
```

---

## 2. Missions

```yaml
missions:
  - mission_id: mission_lower_fuse_capacitor_01
    display_name_ko: 더 퓨즈 제3변전소 고압 캐패시터 절도
    tier: lower
    area_id: area_lower_fuse
    mission_type: support
    difficulty_stars: 2
    node_count: 4
    reward_credits: 16500
    early_withdrawal_penalty: 3000
    required_gear_ids:
      - gear_feet_insulated_boots_01
    primary_stat_keys:
      - frame
      - wire
    recommended_stats:
      frame: 50
      wire: 45
    bonus_condition:
      stat_key: cypher
      minimum_value: 35
      reward_ko: 송전소 내부 전력 분배 제어판을 원격 무선 해킹해 감전 위협을 사전 소멸.
    phase_0_briefing_ref: 04_미션/04_하층_변전소_캐패시터_탈취.md
    phase_1_hints:
      advantage_hint_ko: 전자기 방전 흐름 제어 및 슬럼 송전 구조 이해 자질.
      disadvantage_hint_ko: 전도성이 높은 미절연 금속제 크롬 신체 및 누전 과민 소인.
      conditional_hint_ko: 절연 장비 구비 상태.
    phase_2_requirements:
      required_gear_ko: 고무 재질 전신 절연 안전화
      required_stats_ko: 프레임 50 이상, 와이어 45 이상
    threat_profile:
      - threat_id: lower_fuse_high_voltage_cable
        display_name_ko: 초고압 전력 케이블 방전 지대
        stat_key: frame
        target_value: 50
      - threat_id: lower_fuse_capacitor_disassembly
        display_name_ko: 변압기 격실 물리 해체
        stat_key: wire
        target_value: 45
    success_rewards:
      credits: 16500
      item_ids:
        - item_masada_capacitor_unit_01
      reputation:
        faction_lower_fuse: 5
    failure_losses:
      credits: 0
      reputation:
        faction_lower_fuse: -2

  - mission_id: mission_mid_elneon_backdoor_01
    display_name_ko: 클럽 엘 네온 백도어 강탈
    tier: mid
    area_id: area_mid_club_district_04
    mission_type: infiltration
    difficulty_stars: 3
    node_count: 5
    reward_credits: 24000
    early_withdrawal_penalty: 5000
    required_gear_ids: []
    required_conditions:
      max_visibility_value: 40
    primary_stat_keys:
      - cypher
      - cool
    recommended_stats:
      cypher: 50
      cool: 45
    bonus_condition:
      stat_key: pulse
      minimum_value: 35
      reward_ko: VIP 홀 가상 베팅 서버의 잔여 거래 데이터 회수.
    phase_0_briefing_ref: 04_미션/02_중층_클럽_엘네온_강탈.md
    phase_1_hints:
      advantage_hint_ko: 불심검문 스캐너 기만 기술 및 현지 유흥가 연줄 자질.
      disadvantage_hint_ko: 무장 가시성이 높은 중화기 세팅 및 군용 대형 임플란트.
      conditional_hint_ko: 은닉형 보관 슬롯 유무.
    phase_2_requirements:
      required_gear_ko: 장비 Visibility 총합 40 이하
      required_stats_ko: 사이퍼 50 이상, 쿨 45 이상
    threat_profile:
      - threat_id: mid_elneon_biometric_gate
        display_name_ko: 바이오메트릭 인식 검색 게이트
        stat_key: cypher
        target_value: 40
      - threat_id: mid_elneon_vip_guard_clone_check
        display_name_ko: VIP 가드 무단 복제 검사
        stat_key: cypher
        target_value: 50
    success_rewards:
      credits: 24000
      item_ids:
        - item_encrypted_backdoor_core_set_01
      reputation:
        faction_mid_lanada: -4
        faction_fixer_network: 4
    failure_losses:
      credits: 0
      reputation:
        faction_mid_lanada: -6

  - mission_id: mission_upper_almadinat_memory_01
    display_name_ko: 알-마디낫 후계자 전뇌 말소
    tier: upper
    area_id: area_upper_garden_penthouse
    mission_type: secret
    difficulty_stars: 4
    node_count: 6
    reward_credits: 58000
    early_withdrawal_penalty: 17400
    required_gear_ids:
      - gear_lung_high_altitude_regulator_01
      - gear_skin_dna_patch_01
    primary_stat_keys:
      - cool
      - cypher
    recommended_stats:
      cool: 60
      cypher: 55
    bonus_condition:
      stat_key: pulse
      minimum_value: 50
      reward_ko: 타겟 침실 내부 오프라인 스토리지의 금융 지분 데이터 추출.
    phase_0_briefing_ref: 04_미션/03_상층_펜트하우스_스파이.md
    phase_1_hints:
      advantage_hint_ko: 완벽한 바이오 위장 자질 및 사교 예법 기만 능력.
      disadvantage_hint_ko: 하층 슬럼 슬랭 고착 자질 및 거친 조작 습관.
      conditional_hint_ko: 고고도 공기압 보정기와 유전자 바이오 패치 구비.
    phase_2_requirements:
      required_gear_ko: 상층 고고도 기압 보정기, 인공 DNA 유전자 스킨 패치
      required_stats_ko: 쿨 60 이상, 사이퍼 55 이상
    threat_profile:
      - threat_id: upper_almadinat_biometric_net
        display_name_ko: 실시간 바이오메트릭 감시망
        stat_key: cypher
        target_value: 50
      - threat_id: upper_almadinat_masked_gala
        display_name_ko: 가면 무도회 사교 연회장
        stat_key: cool
        target_value: 55
      - threat_id: upper_almadinat_drone_escape
        display_name_ko: 요격 드론 감시 활강 철수
        stat_key: cool
        target_value: 60
    success_rewards:
      credits: 58000
      item_ids:
        - item_tariq_memory_core_01
      reputation:
        faction_almadinat_subcontract: 8
    failure_losses:
      credits: 0
      reputation:
        faction_almadinat_family: -12
      survival_risk_note_ko: 용병 전뇌 회생 불가 사망 확률 30% 연산.
```

---

## 3. Mercenaries

```yaml
mercenaries:
  - merc_id: merc_breaker_01
    display_name_ko: 백건우
    alias_ko: 차단기
    origin_ko: 하층 전력 하청 숙소
    employment_status: available
    contract_terms_ko: 장비 파손 보험 없이는 고전압 작업 계약을 거부한다.
    stats:
      frame: 54
      cool: 38
      wire: 48
      cypher: 31
      pulse: 42
    gear_ids:
      - gear_feet_insulated_boots_01
    implant_ids:
      - implant_wrist_torque_joint_01
    visibility_level: low
    current_status_ids:
      - status_neural_electric_afterimage
    phase_0_profile_ko: 하층 전력 하청 숙소 출신. 낡은 설비와 전력 계통 앞에서 오래 버틴다.
    phase_1_analysis:
      strengths:
        - 낡은 산업 설비와 전력 계통 앞에서 침착한 작업 흐름.
        - 피복이 벗겨진 장비를 만질 때도 몸을 먼저 빼지 않음.
      risks:
        - 보안 절차를 건너뛰는 경향.
      conditional:
        - 절연 장비 상태가 중요.
    phase_2_tags:
      - tag_operation_high_voltage_grid_tech
      - tag_origin_slum_native
      - tag_gear_insulated_work_habit
      - tag_condition_electric_afterimage
    story_hooks:
      - 과거 감전 사고 기록 일부가 보험 파일에서 잘려 있음.
    result_update_slots:
      - current_status_ids
      - gear_ids
      - implant_ids

  - merc_id: merc_malt_01
    display_name_ko: 한서윤
    alias_ko: 몰트
    origin_ko: 중층 유흥가 폐업 바텐더 조합
    employment_status: available
    contract_terms_ko: 선금 30%, 현장 내 민간인 피해 보너스 감산 조항 요구.
    stats:
      frame: 34
      cool: 49
      wire: 42
      cypher: 56
      pulse: 39
    gear_ids:
      - gear_wrist_auth_bypass_bracelet_01
      - gear_body_hidden_slot_01
      - gear_weapon_fold_pistol_01
    implant_ids: []
    visibility_level: low
    current_status_ids:
      - status_fatigue_sleep_debt
    phase_0_profile_ko: 중층 클럽 바 뒤에서 손님보다 결제 손목을 먼저 읽던 사람.
    phase_1_analysis:
      strengths:
        - 사람 많은 공간에서 눈에 띄지 않는 동선.
        - 출입 관리와 현장 보안 직원의 습관 판독.
      risks:
        - 오래된 채무 관계.
      conditional:
        - 낮은 무장 가시성 유지 필요.
    phase_2_tags:
      - tag_origin_nightlife_worker
      - tag_operation_civilian_disguise
      - tag_gear_scanner_deception
      - tag_gear_hidden_slot
      - tag_condition_debt_shadow
    story_hooks:
      - 라 나다 장부에 예전 술집 빚이 남아 있음.
    result_update_slots:
      - current_status_ids
      - gear_ids
      - faction_reputation

  - merc_id: merc_velvet_knife_01
    display_name_ko: 라일라 라쉬드
    alias_ko: 벨벳 나이프
    origin_ko: 상층 예법 교육 하청 가문
    employment_status: available
    contract_terms_ko: 신원 삭제 비용을 별도 청구한다.
    stats:
      frame: 36
      cool: 64
      wire: 41
      cypher: 58
      pulse: 47
    gear_ids:
      - gear_skin_dna_patch_01
      - gear_lung_high_altitude_regulator_01
      - gear_weapon_ceramic_knife_01
    implant_ids:
      - implant_face_expression_stabilizer_01
      - implant_skin_patch_port_01
    visibility_level: very_low
    current_status_ids:
      - status_med_sleep_aid
    phase_0_profile_ko: 상층 식탁에서 예법을 생존 기술로 배운 의전 하청 출신.
    phase_1_analysis:
      strengths:
        - 고압적인 대화와 시선 검사를 오래 버팀.
        - 격식 있는 공간에서 행동 노이즈가 적음.
      risks:
        - 반사면 앞에서 미세 반응 지연.
      conditional:
        - 피부 패치와 호흡 보정 장비 완비 필요.
    phase_2_tags:
      - tag_origin_upper_etiquette
      - tag_operation_gene_deception
      - tag_appearance_clean_profile
      - tag_condition_reflection_delay
    story_hooks:
      - 봉인된 상층 계약 기록.
    result_update_slots:
      - current_status_ids
      - gear_ids
      - implant_ids
      - faction_reputation

  - merc_id: merc_chromeshow_01
    display_name_ko: 도마 준
    alias_ko: 크롬쇼
    origin_ko: 중층 불법 격투장
    employment_status: available
    contract_terms_ko: 위험 수당 선지급, 장비 파손 비용 일부 의뢰자 부담 요구.
    stats:
      frame: 57
      cool: 26
      wire: 22
      cypher: 24
      pulse: 33
    gear_ids: []
    implant_ids:
      - implant_arm_shotgun_01
      - implant_torso_exposed_armor_01
      - implant_torso_shoulder_frame_01
    visibility_level: very_high
    current_status_ids:
      - status_gear_shoulder_armor_crack
      - status_mental_overaroused
    phase_0_profile_ko: 불법 격투장 출신. 문을 조용히 여는 일보다 문틀째 뜯는 일에 익숙하다.
    phase_1_analysis:
      strengths:
        - 정면 충돌과 짧은 교전에서 밀리지 않음.
        - 낮은 수준의 위협을 외형으로 눌러 버림.
      risks:
        - 장비 노출도가 높고 은밀한 접근에 부적합.
      conditional:
        - 공개적인 무력 시위가 허용되는 계약에서만 효율적.
    phase_2_tags:
      - tag_origin_illegal_arena
      - tag_implant_showy_chrome
      - tag_implant_high_output_shotgun_arm
      - tag_condition_electric_sensitivity
      - tag_behavior_wait_order_disobedience
    story_hooks:
      - 감전 사고 이후 신경계 과민 반응.
    result_update_slots:
      - current_status_ids
      - implant_ids
      - faction_reputation
```

---

## 4. Gear And Implants

```yaml
gear_refs:
  - gear_id: gear_feet_insulated_boots_01
    display_name_ko: 러버세인트 절연 부츠
    function_name_ko: 산업용 절연 안전화
    usage_type: fixed
    repair_cost: 700

  - gear_id: gear_wrist_auth_bypass_bracelet_01
    display_name_ko: 글래스리스트 인증 팔찌
    function_name_ko: 손목형 근거리 인증 우회기
    usage_type: fixed
    repair_cost: 1200

  - gear_id: gear_skin_dna_patch_01
    display_name_ko: 세컨드페이스 DNA 스킨 패치
    function_name_ko: 인공 DNA 유전자 스킨 패치
    usage_type: semi_consumable
    repair_cost: 0

  - gear_id: gear_lung_high_altitude_regulator_01
    display_name_ko: 헤븐프레셔 고도 보정기
    function_name_ko: 상층 고고도 기압 보정기
    usage_type: fixed
    repair_cost: 1800

  - gear_id: gear_body_hidden_slot_01
    display_name_ko: 로우시그 은닉 슬롯
    function_name_ko: 은닉형 보관 슬롯
    usage_type: fixed
    repair_cost: 900

  - gear_id: gear_weapon_fold_pistol_01
    display_name_ko: 슬림폴드 권총
    function_name_ko: 소형 접이식 권총
    usage_type: fixed
    repair_cost: 600

  - gear_id: gear_weapon_ceramic_knife_01
    display_name_ko: 무음 세라믹 단검
    function_name_ko: 세라믹 단검
    usage_type: fixed
    repair_cost: 400

implant_refs:
  - implant_id: implant_wrist_torque_joint_01
    display_name_ko: 핸드토크 구형 보조 관절
    function_name_ko: 구형 손목 토크 보조 관절
    repair_cost: 1500

  - implant_id: implant_face_expression_stabilizer_01
    display_name_ko: 마이크로페이스 표정 안정기
    function_name_ko: 표정 근육 안정기
    repair_cost: 2200

  - implant_id: implant_skin_patch_port_01
    display_name_ko: 더마포트 인공 피부 패치 포트
    function_name_ko: 인공 피부 패치 포트
    repair_cost: 3000

  - implant_id: implant_arm_shotgun_01
    display_name_ko: 붐암 고출력 산탄 암
    function_name_ko: 고출력 산탄 암
    repair_cost: 6500

  - implant_id: implant_torso_exposed_armor_01
    display_name_ko: 쇼플레이트 노출형 상체 장갑판
    function_name_ko: 노출형 상체 장갑판
    repair_cost: 4200

  - implant_id: implant_torso_shoulder_frame_01
    display_name_ko: 숄더잭 강화 어깨 프레임
    function_name_ko: 강화 어깨 프레임
    repair_cost: 2800
```

---

## 5. Statuses

```yaml
statuses:
  - status_id: status_fatigue_sleep_debt
    display_name_ko: 수면부족
    status_category: fatigue
    severity: minor

  - status_id: status_fatigue_sleep_debt_deep
    display_name_ko: 수면부족 심화
    status_category: fatigue
    severity: moderate

  - status_id: status_neural_electric_afterimage
    display_name_ko: 감전 잔향
    status_category: mental
    severity: minor

  - status_id: status_neural_shortshock
    display_name_ko: 전뇌 단락 충격
    status_category: implant_damage
    severity: severe

  - status_id: status_gear_shoulder_armor_crack
    display_name_ko: 어깨 장갑판 균열
    status_category: gear_damage
    severity: moderate

  - status_id: status_gear_shoulder_armor_crack_worse
    display_name_ko: 어깨 장갑판 균열 악화
    status_category: gear_damage
    severity: severe

  - status_id: status_injury_bullet_puncture
    display_name_ko: 탄환 관통흔
    status_category: injury
    severity: severe

  - status_id: status_gear_auth_bypass_overheat
    display_name_ko: 우회기 과열 흔적
    status_category: gear_damage
    severity: moderate

  - status_id: status_gear_insulated_boots_worn_light
    display_name_ko: 절연 안전화 경미 마모
    status_category: gear_damage
    severity: minor

  - status_id: status_mental_overaroused
    display_name_ko: 흥분도 높음
    status_category: mental
    severity: moderate

  - status_id: status_med_sleep_aid
    display_name_ko: 약물성 수면 보조제 복용
    status_category: mental
    severity: minor
```

---

## 6. Matching Cases

```yaml
matching_cases:
  - match_id: match_mission_lower_fuse_capacitor_01_merc_breaker_01
    mission_id: mission_lower_fuse_capacitor_01
    merc_id: merc_breaker_01
    deployment_verdict: clear
    success_outlook: high
    loss_outlook: low
    expected_result_type: success
    advantage_signals:
      - 고압망 작업 습관
      - 산업 설비 경험
    disadvantage_signals:
      - 보안 절차 무시 경향
    conditional_signals:
      - 절연 장비 상태
    result_report_focus:
      - 절연 장비 내구도
      - 캐패시터 손상 여부

  - match_id: match_mission_mid_elneon_backdoor_01_merc_malt_01
    mission_id: mission_mid_elneon_backdoor_01
    merc_id: merc_malt_01
    deployment_verdict: clear
    success_outlook: high
    loss_outlook: medium
    expected_result_type: partial_success
    advantage_signals:
      - 시민 위장
      - 스캐너 기만
      - 낮은 가시성
    disadvantage_signals:
      - 채무 관계
    conditional_signals:
      - 은닉형 슬롯 유지
      - 저가시성 무장 유지
    result_report_focus:
      - 검문 통과
      - 채무 단서 발생 여부
      - 우회기 과열 여부

  - match_id: match_mission_upper_almadinat_memory_01_merc_velvet_knife_01
    mission_id: mission_upper_almadinat_memory_01
    merc_id: merc_velvet_knife_01
    deployment_verdict: clear
    success_outlook: high
    loss_outlook: medium
    expected_result_type: success
    advantage_signals:
      - 유전자 기만
      - 단정한 인상
      - 상층 예법
    disadvantage_signals:
      - 반사면 지연 반응
    conditional_signals:
      - 고도 보정기 완비
      - DNA 패치 완비
    result_report_focus:
      - 바이오게이트 통과
      - 반사면 리스크
      - 신원 삭제 비용

  - match_id: match_mission_mid_elneon_backdoor_01_merc_chromeshow_01
    mission_id: mission_mid_elneon_backdoor_01
    merc_id: merc_chromeshow_01
    deployment_verdict: locked
    success_outlook: low
    loss_outlook: high
    expected_result_type: failure
    advantage_signals:
      - 교전 발생 시 생존력
    disadvantage_signals:
      - 매우 높은 가시성
      - 낮은 Cypher/Cool
      - 노출형 크롬
    conditional_signals:
      - 장비 대폭 해체 필요
    result_report_focus:
      - 진입 차단
      - 경보 폭증
      - 장비 파손
      - 라 나다 평판 손실
```

---

## 7. Result Reports

```yaml
result_reports:
  - report_id: report_mission_lower_fuse_capacitor_01_merc_breaker_01_success
    mission_id: mission_lower_fuse_capacitor_01
    merc_id: merc_breaker_01
    result_type: success
    reward_credits: 16500
    extra_reward_credits: 0
    lost_credits: 700
    acquired_item_ids:
      - item_masada_capacitor_unit_01
    missed_benefits:
      - 사이퍼 보너스 회로 다운 없음
    new_status_ids:
      - status_gear_insulated_boots_worn_light
    updated_gear_ids:
      - gear_feet_insulated_boots_01
    updated_implant_ids:
      - implant_wrist_torque_joint_01
    reputation_changes:
      faction_lower_fuse: 5
    followup_hooks:
      - hook_lower_fuse_power_ledger_01
    next_reflection_targets:
      - merc_current_status
      - gear_state
      - faction_reputation

  - report_id: report_mission_mid_elneon_backdoor_01_merc_malt_01_partial_success
    mission_id: mission_mid_elneon_backdoor_01
    merc_id: merc_malt_01
    result_type: partial_success
    reward_credits: 24000
    extra_reward_credits: 0
    lost_credits: 4200
    acquired_item_ids:
      - item_encrypted_backdoor_core_set_01
    missed_benefits:
      - VIP 홀 잔여 거래 데이터 회수 실패
    new_status_ids:
      - status_fatigue_sleep_debt_deep
      - status_gear_auth_bypass_overheat
    updated_gear_ids:
      - gear_wrist_auth_bypass_bracelet_01
    updated_implant_ids: []
    reputation_changes:
      faction_fixer_network: 3
      faction_mid_lanada: -3
    followup_hooks:
      - hook_malt_debt_ledger_01
    next_reflection_targets:
      - merc_current_status
      - gear_state
      - faction_reputation
      - followup_mission

  - report_id: report_mission_mid_elneon_backdoor_01_merc_chromeshow_01_failure
    mission_id: mission_mid_elneon_backdoor_01
    merc_id: merc_chromeshow_01
    result_type: failure
    reward_credits: 0
    extra_reward_credits: 0
    lost_credits: 6500
    acquired_item_ids: []
    missed_benefits:
      - 암호 칩 회수 실패
      - 거래 데이터 회수 실패
    new_status_ids:
      - status_gear_shoulder_armor_crack_worse
      - status_injury_bullet_puncture
    updated_gear_ids: []
    updated_implant_ids:
      - implant_arm_shotgun_01
      - implant_torso_exposed_armor_01
    reputation_changes:
      faction_mid_lanada: -6
      faction_fixer_network: -2
    followup_hooks:
      - hook_lanada_bounty_chromeshow_01
    next_reflection_targets:
      - merc_current_status
      - implant_state
      - faction_reputation
      - followup_mission
```

---

## 8. Next Data Tasks

다음 데이터화 단계에서 보강할 것:

- `04_데이터_초안/` 안에 스프레드시트용 CSV 분리안 작성.
- `missions`, `mercenaries`, `gear`, `implants`, `statuses`, `matches`, `reports` 시트 분리 검토.
- 현재 텍스트 배열 값을 실제 테이블 행으로 펼칠지 결정.
- 미션 3개 외 보조 샘플 `유앤존 폐기물 인양`을 데이터에 포함할지 보류 판단.
