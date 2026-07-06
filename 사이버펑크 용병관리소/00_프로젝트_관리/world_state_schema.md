# World State 전체 스키마 — 확정본 (Phase D)

> **목적:** 미션 생성기, AI 파이프라인, 보고서 정산이 공통으로 읽고 쓰는 영속 게임 상태 데이터 구조.  
> **기준일:** 2026-06-11  
> **우선순위:** ✅ Phase D 필수 | 🔶 Phase D 스키마만 | ⏳ 고도화

---

## 확정 결정 사항 (2026-06-11)

| 항목 | 결정 |
|---|---|
| 픽서 캐릭터 생성 시점 | **게임 시작 시** 강제 생성 |
| 출신지 | **7종** 확정 (→ `static_data_spec.md` 상세 정의) |
| 명성 / 악명 | **독립 수치 분리** (Fame 0~100 / Infamy 0~100, 단일 스펙트럼 아님) |
| 스테이션 노출도(Visibility) | **폐기** — 위치(Tier) × 시설 타입 가중치 곱산으로 대체 |
| 팩션 분쟁 이벤트 | **고도화** 이월 (`world_event_log`, `active_rumors` 스키마만 보존) |

---

## 1. `fixer_profile` — 픽서 기본 정보 ✅

```json
{
  "fixer_id": "fixer_01",
  "name": "픽서 이름",
  "codename": "코드명",
  "origin": "하층_언존_태생 | 살아남은_폐기체 | 버려진_사생아 | 추방자 | 몰락자 | 상실자 | 무지한_외부인",
  "background_tag": "#슬럼_출신 | #신원_말소 | #혈연_연줄 | #추방낙인 | #몰락_귀족 | #기억_공백 | #외부인_낙인",
  "initial_connection_faction": "팩션명 | null",
  "created_at": "2026-06-11"
}
```

> [!NOTE]
> `origin` 선택 시 초기 팩션 호감도, 배경 태그, 초기 크레딧, 스테이션 위치 제한이 자동 세팅된다.  
> 세부 효과는 `static_data_spec.md` → 출신지 7종 효과 테이블 참조.

---

## 2. `station_state` — 스테이션 현황 ✅

```json
{
  "station_id": "station_fixer_01",
  "fixer_id": "fixer_01",
  "category": "숙박 | 유흥 | 식사 | 장비 | 업무",
  "facility_name": "보이드 생크텀",
  "location_tier": "하층 | 중층 | 상층",
  "location_area": "언존 | 파이프 구역 | 상가 지구 | 스카이 펜트하우스 ...",
  "level": 1,
  "operating_cost_per_turn": 500,
  "analysis_mission_lv": 0,
  "analysis_merc_lv": 0,
  "active_service_slot": null,
  "facility_weight_profile": {
    "mission_type_modifier": {
      "잠입": 1.5,
      "비밀": 1.3,
      "전투": 0.8,
      "지원": 0.9,
      "기업": 1.0
    },
    "merc_tag_affinity": ["#신원세탁", "Cypher_high"],
    "client_tier_modifier": {
      "하층": 1.0,
      "중층": 0.9,
      "상층": 0.6
    }
  }
}
```

> [!NOTE]
> **`visibility` 필드 없음** — 폐기 결정.  
> **최종 가중치 = `location_tier 가중치` × `facility_weight_profile 가중치` × `faction_states 가중치`**  
> `facility_weight_profile`은 시설 선택 시 시스템이 자동으로 채운다. 세부 테이블은 `static_data_spec.md` 참조.

---

## 3. `faction_states` — 팩션별 현재 상태 ✅

```json
{
  "faction_id": "더 밸브",
  "tier": "하층",
  "current_power": 65,
  "is_in_conflict": true,
  "conflict_target": "더 퓨즈",
  "conflict_intensity": 3,
  "fixer_reputation": 20,
  "available_mission_weight_modifier": 1.5,
  "available_merc_weight_modifier": 1.2,
  "last_updated_turn": 14
}
```

---

## 4. `faction_relations` — 팩션 간 관계값 🔶

```json
{
  "faction_a": "더 밸브",
  "faction_b": "더 퓨즈",
  "relation_type": "적대 | 경쟁 | 중립 | 협력 | 동맹",
  "relation_value": -70,
  "conflict_reason": "전력망 차단에 따른 폐수 방류 보복",
  "is_active_conflict": true
}
```

---

## 5. `area_states` — 구역별 현재 상태 🔶

```json
{
  "area_id": "area_lower_pipe",
  "name": "하층 파이프 구역",
  "tier": "하층",
  "controlling_faction": "더 밸브",
  "security_level": 2,
  "lockdown": false,
  "environmental_hazard": "폐수 누출",
  "recent_events": ["더 밸브 세력 충돌", "배수로 폭발"],
  "mission_weight_modifier": 1.3,
  "danger_weight_modifier": 1.5
}
```

---

## 6. `player_behavioral_stats` — 플레이어 행동 누적 🔶

```json
{
  "fixer_id": "fixer_01",
  "fame": 35,
  "infamy": 10,
  "mission_count_by_type": {
    "잠입": 8,
    "전투": 12,
    "지원": 3,
    "기업": 5,
    "비밀": 2
  },
  "expertise_tags": ["#전장_브로커"],
  "total_credits_earned": 485000,
  "total_mercs_lost": 2,
  "area_influence": {
    "area_lower_pipe": 30,
    "area_mid_club_district": 15
  },
  "behavioral_flags": {
    "prefers_netrunning": false,
    "prefers_stealth": false,
    "civilian_incident_count": 1,
    "chase_escape_count": 4
  }
}
```

> [!NOTE]
> **Fame / Infamy는 독립 수치다.** 둘 다 높을 수 있음.  
> - `Fame` 높음 = "일 잘 처리하는 픽서"로 소문. 용병 고용 풀 확장, 안정적인 의뢰 접근.  
> - `Infamy` 높음 = "건드리면 위험한 픽서"로 소문. 협박 고용 가능, 일부 팩션 경계 혹은 오히려 특정 팩션 접근 용이.  
> Fame을 깎아서 Infamy를 올리는 구조가 아님.

**전문성 태그 후보 (미션 타입 반복 시 자동 부여):**

| 태그 | 조건 |
|---|---|
| `#전장_브로커` | 전투 미션 10회 이상 |
| `#그림자_픽서` | 잠입 미션 10회 이상 |
| `#넷러너_의뢰인` | 지원(와이어) 미션 10회 이상 |
| `#정보_중개인` | 비밀 미션 10회 이상 |

---

## 7. `mission_pool_weights` — 미션 등장 가중치 🔶

> [!IMPORTANT]
> 아래 JSON의 수치는 **예시값**이다. 특정 픽서가 특정 플레이 시점에 계산된 결과를 보여주는 샘플일 뿐,  
> 모든 픽서에게 공통 적용되는 고정값이 아니다. 실제 수치는 픽서마다, 턴마다 다르게 계산된다.

```json
// 예시: 하층 언존 태생 픽서 / 에이펙스 사나토리움 / 더 밸브 호감도 높음 / 14턴 시점
{
  "fixer_id": "fixer_01",
  "tier_weights": {
    "하층": 1.0,
    "중층": 0.7,
    "상층": 0.2
  },
  "type_weights": {
    "잠입": 1.0,
    "전투": 1.8,
    "지원": 1.0,
    "기업": 1.2,
    "비밀": 0.8
  },
  "faction_weights": {
    "더 밸브": 1.5,
    "더 퓨즈": 0.8,
    "바이루이": 1.0
  }
}
```

> [!NOTE]
> 이 가중치는 `station_state.facility_weight_profile` × `faction_states` × `player_behavioral_stats`를 조합해 **픽서별, 턴마다 자동 재계산**된다.  
> 기준이 되는 기본 가중치 테이블은 `static_data_spec.md` 참조.  
> 의뢰인(client_faction)은 `null`일 수 있다. 특히 상층 미션은 50% 확률로 익명 의뢰.

---

## 8. `merc_pool_weights` — 용병 등장 가중치 🔶

> [!IMPORTANT]
> 아래 JSON의 수치는 **예시값**이다. 특정 픽서의 특정 플레이 시점 상태를 보여주는 샘플이며,  
> 모든 픽서에게 공통 적용되는 고정값이 아니다. 픽서의 스테이션·팩션 관계·행동 누적에 따라 달라진다.

```json
// 예시: 에이펙스 사나토리움 / 더 밸브 호감도 높음 / 전투 전문성 축적 시점
{
  "fixer_id": "fixer_01",
  "faction_affinity_weights": {
    "더 밸브": 1.3,
    "라 나다": 0.9
  },
  "specialty_weights": {
    "잠입": 1.0,
    "전투": 1.6,
    "지원": 0.8
  },
  "excluded_mercs": []
}
```

---

## 9. `world_event_log` — 세계 이벤트 이력 ⏳ (고도화)

```json
{
  "event_id": "event_001",
  "event_type": "팩션 분쟁",
  "related_factions": ["더 밸브", "더 퓨즈"],
  "related_area": "area_lower_pipe",
  "turn_started": 10,
  "turn_ended": null,
  "is_active": true,
  "effect_summary": "해당 구역 전투 미션 가중치 +1.5, 보상 +20%"
}
```

---

## 10. `active_rumors` — 현재 유통 소문 ⏳ (고도화)

```json
{
  "rumor_id": "rumor_042",
  "acquired_from": "인텔리전스 허브",
  "hint_text": "더 댐퍼가 상층 공기 공급 계약을 비밀리에 재협상 중이라는 소문",
  "related_mission_type": "비밀",
  "related_faction": "더 댐퍼",
  "expires_at_turn": 20
}
```

---

## 가중치 계산 흐름 요약

```
[미션 생성 시 최종 가중치]

1. 기본값: 미션 타입 × 구역별 기본 비율 (static_data_spec.md)
2. × station location_tier 가중치
3. × station facility_weight_profile 가중치
4. × faction_states (해당 팩션 fixer_reputation, conflict 여부)
5. × player_behavioral_stats (expertise_tags, area_influence)
6. → mission_pool_weights 최종값으로 저장
7. → AI 프롬프트에 world_state 스냅샷으로 주입 (ai_ontology_spec.md)
```

---

## 구현 우선순위

| 단계 | 항목 |
|---|---|
| **Phase D 즉시** | `fixer_profile`, `station_state`, `faction_states`, `player_behavioral_stats` 스키마 + React 연결 |
| **Phase D 구현** | `faction_relations`, `area_states`, `mission_pool_weights`, `merc_pool_weights` 가중치 계산 로직 |
| **고도화** | `world_event_log`, `active_rumors`, 팩션 분쟁 트리거, 용병 충성도 이벤트 |
