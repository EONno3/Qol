import { useEffect, useState } from "react";
import { getMercenary, getMission, missionTypeName } from "../data/lookups";
import type { ActiveDispatch, CompletedDispatch, ResultReport } from "../data/types";
import { deskNarrativeStatusLabel } from "../domain/reportNarrativeStatus";

interface Props {
  activeDispatches: ActiveDispatch[];
  completedDispatches: CompletedDispatch[];
  settledReports: string[];
  generatedReports: Record<string, ResultReport>;
  onViewReport: (dispatchId: string, missionId: string, mercId: string) => void;
}

export function DeskView({
  activeDispatches,
  completedDispatches,
  settledReports,
  generatedReports,
  onViewReport,
}: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pendingDispatches = completedDispatches.filter((cd) => {
    const report = generatedReports[cd.dispatchId];
    if (!report) return false;
    return !settledReports.includes(report.reportId);
  });
  const settledDispatches = completedDispatches.filter((cd) => !pendingDispatches.includes(cd));

  return (
    <section className="desk-view">
      <div className="section-head">
        <h2>파견 관제소 (Desk View)</h2>
      </div>
      <p className="muted">
        다중 임무 파견 및 모니터링 시스템. 용병들은 지시된 작전 시간에 따라 복귀할 것이다.
      </p>

      {activeDispatches.length === 0 && completedDispatches.length === 0 && (
        <div className="empty-state">
          현재 진행 중인 파견 작전이 없다. 미션을 수주하고 용병을 할당하라.
        </div>
      )}

      {pendingDispatches.length > 0 && (
        <div className="completed-dispatches" style={{ marginBottom: "2rem" }}>
          <h3
            style={{
              color: "var(--cyan)",
              borderBottom: "1px solid var(--cyan)",
              paddingBottom: "8px",
              marginBottom: "16px",
            }}
          >
            보고서 수신 — 정산 대기 중
          </h3>
          <div className="dispatch-list">
            {pendingDispatches.map((cd, idx) => {
              const mission = getMission(cd.missionId);
              const merc = getMercenary(cd.mercId);
              const report = generatedReports[cd.dispatchId];
              const status = deskNarrativeStatusLabel(report);

              return (
                <div
                  key={`comp-${cd.dispatchId}-${idx}`}
                  className="dispatch-card"
                  data-testid={`desk-pending-${cd.dispatchId}`}
                  data-narrative-ready={status.ready ? "true" : "false"}
                  style={{
                    background: "var(--panel)",
                    border: status.ready ? "1px solid var(--green)" : "1px solid var(--amber)",
                    padding: "16px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div className="muted">
                        {mission?.tier} · {mission ? missionTypeName(mission.missionType) : ""}
                        {report?.catchUpActive ? " · 캐치업" : ""}
                      </div>
                      <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                        {mission?.displayNameKo}
                      </div>
                      <div
                        style={{
                          color: status.ready ? "var(--green)" : "var(--amber)",
                          marginTop: "4px",
                        }}
                        data-testid={`desk-status-${cd.dispatchId}`}
                      >
                        {status.ready
                          ? `작전 종료 (${merc?.aliasKo}). ${status.label}`
                          : `${status.label} (${merc?.aliasKo})`}
                      </div>
                    </div>
                    <button
                      className="primary"
                      disabled={!status.ready}
                      aria-label={status.ready ? "보고서 열람" : "보고서 동기화 중"}
                      onClick={() => onViewReport(cd.dispatchId, cd.missionId, cd.mercId)}
                    >
                      {status.ready ? "보고서 열람" : "동기화 중…"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {settledDispatches.length > 0 && (
        <div className="settled-dispatches" style={{ marginBottom: "2rem" }}>
          <h3
            style={{
              color: "var(--cyan)",
              borderBottom: "1px solid var(--cyan)",
              paddingBottom: "8px",
              marginBottom: "16px",
            }}
          >
            정산 완료 — 복귀 확인 대기 중 ({settledDispatches.length}건)
          </h3>
          <div className="dispatch-list">
            {settledDispatches.map((cd, idx) => {
              const mission = getMission(cd.missionId);
              const merc = getMercenary(cd.mercId);
              return (
                <div
                  key={`settled-${cd.dispatchId}-${idx}`}
                  className="dispatch-card"
                  style={{
                    background: "var(--panel)",
                    border: "1px solid var(--cyan)",
                    padding: "16px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div className="muted">
                        {mission?.tier} · {mission ? missionTypeName(mission.missionType) : ""}
                      </div>
                      <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                        {mission?.displayNameKo}
                      </div>
                      <div style={{ color: "var(--cyan)", marginTop: "4px" }}>
                        정산 완료. 대기소 복귀 확인 대기 중 ({merc?.aliasKo}).
                      </div>
                    </div>
                    <button
                      className="primary"
                      onClick={() => onViewReport(cd.dispatchId, cd.missionId, cd.mercId)}
                    >
                      복귀 확인
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeDispatches.length > 0 && (
        <div className="active-dispatches">
          <h3
            style={{
              color: "var(--muted)",
              borderBottom: "1px solid var(--panel-2)",
              paddingBottom: "8px",
              marginBottom: "16px",
            }}
          >
            진행 중인 작전
          </h3>
          <div className="dispatch-list">
            {activeDispatches.map((d) => {
              const mission = getMission(d.missionId);
              const merc = getMercenary(d.mercId);
              const total = d.endTime - d.startTime;
              const elapsed = now - d.startTime;
              const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
              const remainingSec = Math.max(0, Math.ceil((d.endTime - now) / 1000));

              return (
                <div
                  key={d.dispatchId}
                  className="dispatch-card"
                  style={{
                    background: "var(--panel)",
                    border: "1px solid var(--panel-2)",
                    padding: "16px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <div>
                      <div className="muted">
                        {mission?.tier} · {mission ? missionTypeName(mission.missionType) : ""}
                      </div>
                      <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                        {mission?.displayNameKo}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="muted">파견 용병</div>
                      <div style={{ color: "var(--cyan)" }}>{merc?.aliasKo}</div>
                    </div>
                  </div>

                  <div className="status-row" style={{ marginTop: "12px" }}>
                    <div className="progress-track" style={{ flex: 1, marginRight: "12px" }}>
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="muted" style={{ minWidth: "60px", textAlign: "right" }}>
                      {remainingSec}초 남음
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
