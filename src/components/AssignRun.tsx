import { useEffect, useState } from "react";
import { statusName, missionTypeName } from "../data/lookups";
import type { Mercenary, Mission } from "../data/types";

interface Props {
  mission: Mission;
  merc: Mercenary;
  mercStatuses: string[];
  onComplete: () => void;
}

export function AssignRun({ mission, merc, mercStatuses, onComplete }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 20;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, 500);
    return () => clearInterval(timer);
  }, [mission.missionId, merc.mercId]);

  const done = progress >= 100;
  const nodeStep = Math.min(mission.nodeCount, Math.round((progress / 100) * mission.nodeCount));
  const alertActive = progress >= 40 && progress <= 80;

  const currentHp = alertActive ? Math.round(merc.maxHp * 0.8) : merc.maxHp;
  const hpPercent = (currentHp / merc.maxHp) * 100;

  return (
    <section className="assign">
      <h2>어사인 출격</h2>
      <p className="muted">
        {merc.aliasKo} 파견 · {mission.displayNameKo} · 유저 개입 없이 관찰
      </p>

      <div className="assign-monitor">
        <div className="pixer" style={{ transition: "color 0.3s" }}>
          <div className="pixer-figure" style={{ color: alertActive ? "var(--red)" : "var(--cyan)" }}>
            {alertActive ? "🚨" : "▟"}
          </div>
          <div className="pixer-caption" style={{ color: alertActive ? "var(--red)" : "var(--muted)" }}>
            {alertActive ? "픽서 [긴장]" : "픽서 [관망]"}
          </div>
        </div>
        <div className="monitor-bank">
          <div className="monitor-screen">진행 노드 {nodeStep} / {mission.nodeCount}</div>
          <div className="monitor-screen">{mission.tier} · {missionTypeName(mission.missionType)}</div>
          <div className={`monitor-screen ${alertActive ? "alert animate-blink" : ""}`}>
            {alertActive ? "⚠️ 돌발 위험 대응 중!" : "돌발 신호 없음"}
          </div>
        </div>
      </div>

      <div className="assign-status">
        <div className="status-row">
          <span className="status-label">{merc.aliasKo} HP</span>
          <div className="hp-track">
            <div className="hp-fill" style={{ width: `${hpPercent}%`, background: alertActive ? "var(--red)" : "linear-gradient(90deg, var(--green), var(--cyan))", transition: "width 0.2s, background 0.2s" }} />
          </div>
          <span className="muted">
            {currentHp} / {merc.maxHp}
          </span>
        </div>

        <div className="status-row">
          <span className="status-label">장비 상태</span>
          <span className="muted">
            {alertActive ? "⚠️ 일부 부품 과부하 및 노이즈 발생" : (mercStatuses.length > 0 ? mercStatuses.map(statusName).join(", ") : "이상 없음")}
          </span>
        </div>

        <div className="status-row">
          <span className="status-label">진행도</span>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="muted">{progress}%</span>
        </div>
      </div>

      <div className="actions">
        <button className="primary" disabled={!done} onClick={onComplete}>
          {done ? "결과 보고서 확인" : "진행 중..."}
        </button>
      </div>
    </section>
  );
}
