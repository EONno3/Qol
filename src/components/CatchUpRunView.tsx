import type { CatchUpRunState, QueuedNode } from "../data/types";
import { GAME_CONFIG } from "../data/config";
import type { CatchUpNodeAction } from "../domain/catchUpRun";

export interface CatchUpRunViewProps {
  run: CatchUpRunState;
  currentNode: QueuedNode | null;
  onAction: (action: CatchUpNodeAction) => void;
}

function blurNodeName(name: string, level: number): string {
  if (level >= 2) return name;
  if (level === 1) return name.length > 4 ? `${name.slice(0, 2)}···` : "???";
  return "████";
}

export function CatchUpRunView({ run, currentNode, onAction }: CatchUpRunViewProps) {
  const level = run.predictAnalysisLevel;
  const canIntervene = run.interventionsLeft > 0 && run.status === "active" && !!currentNode;

  return (
    <section className="catchup-run" data-testid="catchup-run-view" role="region" aria-label="관제 드론 인런">
      <div className="drone-catchup-header">
        <span className="drone-catchup-header__icon" aria-hidden="true">
          ◈
        </span>
        <span className="drone-catchup-header__title">관제 드론 — LIVE FEED</span>
        <span className="drone-catchup-header__badge">D-C-2</span>
      </div>

      <div className="drone-catchup-hud">
        <span>남은 개입: {run.interventionsLeft}회</span>
        <span>사용: {run.intervenedCount}회</span>
        <span>HUD Lv.{level}</span>
      </div>

      {run.status === "active" && currentNode ? (
        <div className="catchup-run-node" data-testid="catchup-current-node">
          <h3>현재 노드</h3>
          <p className="catchup-run-node__name">{blurNodeName(currentNode.nameKo, level)}</p>
          {level >= 2 && (
            <p className="muted">
              역할: {currentNode.role} · 검정: {currentNode.statCheck}
            </p>
          )}
          <div className="catchup-run-actions">
            <button
              type="button"
              className="primary"
              disabled={!canIntervene}
              onClick={() => onAction("intervene")}
            >
              [개입] (−{GAME_CONFIG.catchUp.nodePenaltyPercent}%p)
            </button>
            <button type="button" className="ghost" onClick={() => onAction("pass")}>
              [패스]
            </button>
          </div>
        </div>
      ) : (
        <p className="muted">노드 처리 완료 — 결과를 집계 중…</p>
      )}

      {run.logs.length > 0 && (
        <div className="catchup-run-log" data-testid="catchup-run-log">
          <h4>관제 로그</h4>
          <ul>
            {run.logs.slice(-6).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
