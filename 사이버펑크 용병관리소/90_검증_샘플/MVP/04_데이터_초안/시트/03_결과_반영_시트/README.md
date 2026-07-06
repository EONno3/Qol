# 결과 반영 시트

이 폴더는 결과 보고서가 실제 게임 상태에 반영되는 값을 행 단위로 펼치는 위치다.

작성 완료 파일:

```text
report_status_changes.csv
report_gear_updates.csv
report_implant_updates.csv
report_reputation_changes.csv
report_followup_hooks.csv
```

현재 작성 범위:

- 결과 보고서가 추가하거나 악화시키는 상태.
- 결과 보고서가 마모, 과열, 손상시키는 장비.
- 결과 보고서가 손상 또는 정비 대상으로 올리는 임플란트.
- 결과 보고서가 바꾸는 팩션 평판.
- 결과 보고서가 다음 턴 후보로 남기는 후속 단서.

이 폴더까지 작성되면 MVP 1턴 루프는 `미션 -> 매칭 -> 출격 -> 결과 보고서 -> 바로 정산`까지 데이터상으로 닫힌다.
