import { useState } from "react";
import { factionName, gearName, implantName, statusName } from "../data/lookups";
import type { Mercenary, Mission, ResultReport as Report } from "../data/types";
import { netCredits } from "../domain/settlement";
import { calcCompensationSplit } from "../domain/mercCompensation";
import { buildFallbackNarrative } from "../domain/fallbackNarrative";
import { resultClass, resultTypeLabel, tierClass } from "./labels";
import { ReportNarrativeLoading } from "./ReportNarrativeLoading";

interface Props {
  report: Report;
  mission: Mission;
  merc: Mercenary;
  onSettle: (mercShareRate: number) => void;
}

export function ResultReport({ report, mission, merc, onSettle }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const defaultSharePercent = Math.round((merc.expectedShareRate ?? 0.35) * 100);
  const [sharePercent, setSharePercent] = useState(defaultSharePercent);
  const mercShareRate = sharePercent / 100;
  const net = netCredits(report);
  const { fixerCredits, mercCredits } = calcCompensationSplit(net, mercShareRate);
  const expectedSharePercent = Math.round((merc.expectedShareRate ?? 0.35) * 100);
  const belowExpected = net > 0 && mercShareRate + 1e-9 < (merc.expectedShareRate ?? 0.35);
  const repairTotal =
    report.gearUpdates.reduce((sum, g) => sum + g.repairCost, 0) +
    report.implantUpdates.reduce((sum, i) => sum + i.repairCost, 0);

  const isCatchUp = report.catchUpActive === true;
  const isGenerating = report.aiNarrativeKo === "GENERATING";
  // GENERATING → 로딩 게이트 / AI 본문 / FALLBACK·미설정 → 1인칭 폴백 (무한 로딩 방지)
  const displayNarrative =
    isGenerating
      ? null
      : report.aiNarrativeKo && report.aiNarrativeKo !== "FALLBACK"
        ? report.aiNarrativeKo
        : buildFallbackNarrative(report, mission, merc);

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

          <div
            className="narrative-box"
            style={{
              padding: "20px",
              background: "var(--paper)",
              color: "var(--paper-ink)",
              borderLeft: isCatchUp ? "4px solid var(--amber)" : "4px solid var(--cyan)",
              fontSize: "1.15rem",
              lineHeight: "1.7",
              fontStyle: isCatchUp || isGenerating ? "normal" : "italic",
              borderRadius: "0 4px 4px 0",
              whiteSpace: "pre-line",
              minHeight: "80px",
            }}
          >
            {isGenerating ? (
              <ReportNarrativeLoading catchUpActive={isCatchUp} />
            ) : (
              displayNarrative
            )}
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
              <span>정산 예정 (픽ser 몫)</span>
              <span>{fixerCredits.toLocaleString()} cr</span>
            </div>
            {net > 0 && (
              <div className="ledger-row">
                <span>용병 지급 예정</span>
                <span>{mercCredits.toLocaleString()} cr</span>
              </div>
            )}
          </div>
        </div>

        {net > 0 && (
          <div className="report-block" style={{ marginTop: "1rem" }}>
            <h4>보수 배분</h4>
            <p className="muted" style={{ marginTop: 0 }}>
              {merc.aliasKo} 요구 지분: {expectedSharePercent}% · 슬라이더로 이번 정산 지분을 조정한다.
            </p>
            <label htmlFor="merc-share-slider" style={{ display: "block", marginBottom: "0.5rem" }}>
              용병 지분: {sharePercent}%
            </label>
            <input
              id="merc-share-slider"
              type="range"
              min={0}
              max={80}
              step={5}
              value={sharePercent}
              aria-label="용병 보수 배분율"
              onChange={(e) => setSharePercent(Number(e.target.value))}
              style={{ width: "100%", maxWidth: "320px" }}
            />
            {belowExpected && (
              <p style={{ color: "var(--amber)", marginTop: "0.5rem", fontSize: "0.9rem" }}>
                ⚠ 요구 지분 미달 — 정산 시 불만도가 누적될 수 있다.
              </p>
            )}
          </div>
        )}

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
        <button className="primary" onClick={() => onSettle(mercShareRate)}>
          정산 처리 및 결과 반영
        </button>
      </div>
    </section>
  );
}
