# MVP 시트 폴더

이 폴더는 `MVP_데이터_초안.md`와 `MVP_시트_분리_계획.md`를 실제 CSV/스프레드시트 초안으로 옮기는 작업 공간이다.

---

## 폴더 구조

```text
시트/
  01_핵심_시트/
  02_관계_시트/
  03_결과_반영_시트/
```

---

## 01_핵심_시트

현재 실제 데이터가 들어간 1차 CSV 위치다.

포함 파일:

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

역할:

- MVP 1턴 수동 테스트에 필요한 주요 개체를 먼저 입력한다.
- 배열/복합 값은 아직 보조 시트로 완전히 펼치지 않고 요약 문자열로 보존한다.
- 다음 단계의 관계 시트 작성 기준이 된다.

---

## 02_관계_시트

작성 완료된 ID 연결 시트 위치다.

포함 파일:

```text
mission_required_gear.csv
mission_primary_stats.csv
mission_recommended_stats.csv
mission_threats.csv
mercenary_gear.csv
mercenary_implants.csv
mercenary_statuses.csv
mercenary_tags.csv
matching_signals.csv
```

역할:

- 한 개체에 여러 값이 붙는 관계를 행 단위로 펼친다.
- 검색, 필터, 검증이 필요한 값을 한 셀 문자열에서 분리한다.

---

## 03_결과_반영_시트

작성 완료된 결과 보고서 반영 시트 위치다.

포함 파일:

```text
report_status_changes.csv
report_gear_updates.csv
report_implant_updates.csv
report_reputation_changes.csv
report_followup_hooks.csv
```

역할:

- 파견 결과가 용병 상태, 장비, 임플란트, 평판, 후속 단서에 어떻게 반영되는지 행 단위로 검증한다.
- 1턴 수동 테스트의 마지막 단계인 즉시 정산 검증에 사용한다.

---

## 현재 상태

- 핵심 CSV 8개: 작성 완료.
- 관계 CSV 9개: 작성 완료.
- 결과 반영 CSV 5개: 작성 완료.
- CSV → TypeScript seed 변환: 완료 (`prototype/mvp-web/src/data/seed.ts`).
- 로컬 웹 프로토타입 구축: 완료 (`prototype/mvp-web/`).

## 다음 단계

CSV 데이터는 웹 프로토타입에 반영됐다. 다음은 **기획자 플레이테스트**다.

- 실행: `prototype/mvp-web/README.md` 참고
- 프로젝트 전체 진행: `00_프로젝트_관리/해야 할것.md`
- MVP 세부: `90_검증_샘플/MVP/00_개요/MVP_문서_평가.md` §5.1
