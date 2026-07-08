import { useState } from "react";
import { factionName, gearName, implantName, statusName } from "../data/lookups";
import type { Mercenary, Mission, ResultReport as Report } from "../data/types";
import { netCredits } from "../domain/settlement";
import { buildFallbackNarrative } from "../domain/fallbackNarrative";
import { resultClass, resultTypeLabel, tierClass } from "./labels";

interface Props {
  report: Report;
  mission: Mission;
  merc: Mercenary;
  onSettle: () => void;
}

export function ResultReport({ report, mission, merc, onSettle }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const repairTotal =
    report.gearUpdates.reduce((sum, g) => sum + g.repairCost, 0) +
    report.implantUpdates.reduce((sum, i) => sum + i.repairCost, 0);

  // AI 브리핑 또는 폴백 1인칭 내레이션 결정
  // - GENERATING: 생성 대기 중 안내
  // - 실제 AI 텍스트: 그대로 노출
  // - FALLBACK/미연결: 기계식 summaryLogKo 대신 용병 1인칭 일지로 재구성
  const displayNarrative =
    report.aiNarrativeKo === "GENERATING"
      ? "작전 현장 데이터 스트림 판독 중..."
      : report.aiNarrativeKo && report.aiNarrativeKo !== "FALLBACK"
      ? report.aiNarrativeKo
      : buildFallbackNarrative(report, mission, merc);

  const isCatchUp = report.catchUpActive === true;
  const narrativeLabel = isCatchUp
    ? "현장 개입 기록 (관제소 로그)"
    : "현장 보고 (용병 일지)";
  const reportKindLabel = isCatchUp ? "캐치업 · 관제소 기록" : "어사인 보고";

  return (
    <section>
      <h2>결과 보고서</h2>
      <p className="muted">
        {mission.displayNameKo} · {merc.aliasKo} · {reportKindLabel}
      </p>

      <div className={`report-folder ${tierClass(mission.tier)}`}>
        <div className="report-nodelog" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="folder-page-label">{narrativeLabel}</div>
          
          <div className="narrative-box" style={{
            padding: "20px",
            background: "var(--paper)",
            color: "var(--paper-ink)",
            borderLeft: isCatchUp ? "4px solid var(--amber)" : "4px solid var(--cyan)",
            fontSize: "1.15rem",
            lineHeight: "1.7",
            fontStyle: isCatchUp ? "normal" : "italic",
            borderRadius: "0 4px 4px 0",
            whiteSpace: "pre-line",
            minHeight: "80px"
          }}>
            {displayNarrative}
          </div>

          {/* 접이식 상세 텔레메트리 기계식 로그 */}
          <div style={{ marginTop: "10px" }}>
            <button 
              className="ghost" 
              onClick={() => setShowDetails(!showDetails)}
              style={{
                fontSize: "0.85rem",
                color: "var(--muted)",
                padding: "6px 12px",
                border: "1px dashed var(--panel-2)",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                borderRadius: "4px"
              }}
            >
              {showDetails ? "▼ 상세 시스템 로그 닫기" : "▶ 상세 시스템 로그 판독 (기계식 수치 정보)"}
            </button>

            {showDetails && (
              <ul className="nodelog" style={{ marginTop: "12px", borderTop: "1px solid var(--panel-2)", paddingTop: "12px" }}>
                {report.nodeLogKo && report.nodeLogKo.length > 0 ? (
                  report.nodeLogKo.map((log, idx) => (
                    <li key={idx}>
                      <span className="node-tag">현장</span>
                      {log}
                    </li>
                  ))
                ) : (
                  <>
                    <li>
                      <span className="node-tag">진입</span>
                      {mission.phase0BriefingKo}
                    </li>
                    <li>
                      <span className="node-tag">달성</span>
                      {report.fulfilledConditionsKo}
                    </li>
                    <li>
                      <span className="node-tag">미달</span>
                      {report.missingConditionsKo}
                    </li>
                  </>
                )}
                <li>
                  <span className="node-tag">종결</span>
                  {report.summaryLogKo}
                </li>
              </ul>
            )}
          </div>
        </div>

        <div className="report-split">
          <div className="report-outcome">
            <div className={`result-banner ${resultClass(report.resultType)}`}>
              {resultTypeLabel[report.resultType]}
            </div>
            {report.catchUpBonusEarned && (
              <div style={{ marginTop: "8px", color: "var(--amber)", fontWeight: 600 }}>
                [현장 개입 성공] 픽서 직접 개입으로 추가 보상 자격 확보
              </div>
            )}
          </div>

          <div className="report-ledger">
            <div className="ledger-row">
              <span>보상</span>
              <span>{report.rewardCredits.toLocaleString()} cr</span>
            </div>
            <div className="ledger-row">
              <span>손실/리스크</span>
              <span>{report.lostCredits.toLocaleString()} cr</span>
            </div>
            <div className="ledger-row">
              <span>수리비 예상</span>
              <span>{repairTotal.toLocaleString()} cr</span>
            </div>
            <div className="ledger-row net">
              <span>정산 예정</span>
              <span>{netCredits(report).toLocaleString()} cr</span>
            </div>
          </div>
        </div>

        {report.statusChanges.length > 0 && (
          <div className="report-block">
            <h4>상태 변화</h4>
            <ul>
              {report.statusChanges.map((c) => (
                <li key={c.statusId}>
                  {statusName(c.statusId)} · {c.noteKo}
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.gearUpdates.length > 0 && (
          <div className="report-block">
            <h4>장비 변화</h4>
            <ul>
              {report.gearUpdates.map((g) => (
                <li key={g.gearId}>
                  {gearName(g.gearId)} · {g.updateType} · 수리비 {g.repairCost.toLocaleString()} cr
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.implantUpdates.length > 0 && (
          <div className="report-block">
            <h4>임플란트 변화</h4>
            <ul>
              {report.implantUpdates.map((i) => (
                <li key={i.implantId}>
                  {implantName(i.implantId)} · {i.updateType} · 수리비{" "}
                  {i.repairCost.toLocaleString()} cr
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.reputationChanges.length > 0 && (
          <div className="report-block">
            <h4>평판 변화</h4>
            <ul>
              {report.reputationChanges.map((r) => (
                <li key={r.factionId}>
                  {factionName(r.factionId)} {r.reputationDelta > 0 ? "+" : ""}
                  {r.reputationDelta} · {r.noteKo}
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.followupHooks.length > 0 && (
          <div className="report-block">
            <h4>후속 단서</h4>
            <ul>
              {report.followupHooks.map((h) => (
                <li key={h.hookId}>
                  {h.displayNameKo} · {h.hookSummaryKo}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="actions">
        <button className="primary" onClick={onSettle}>
          정산 처리 및 결과 반영
        </button>
      </div>
    </section>
  );
}
