import { factionName, gearName, implantName, statusName } from "../data/lookups";
import { mercenaries } from "../data/seed";
import type { GameState } from "../domain/state";

interface Props {
  state: GameState;
  onTimeSkip: () => void;
  onNextTurn?: () => void;
  canAdvanceTurn?: boolean;
  onToggleAiNarrator?: (enabled: boolean) => void;
}

export function StatePanel({ state, onTimeSkip, onNextTurn, canAdvanceTurn = true, onToggleAiNarrator }: Props) {
  // 고용된 용병만 보여줌
  const hiredIds = state.hiredMercs ?? [];
  const hiredMercList = mercenaries.filter(m => hiredIds.includes(m.mercId));

  const reputationEntries = Object.entries(state.factionReputation)
    .filter(([, val]) => val !== 0); // 0은 표시 불필요
  const gearEntries = Object.entries(state.gearStates);
  const implantEntries = Object.entries(state.implantStates);

  return (
    <aside className="state-panel">
      <h3>스테이션 상태</h3>

      <div className="state-block">
        <div className="state-label">현재 일차</div>
        <div className="state-ledger" style={{ color: "var(--cyan)" }}>
          Day {state.turnCount}
        </div>
      </div>

      <div className="state-block">
        <div className="state-label">지휘력 (OP)</div>
        <div className="state-ledger">
          {state.currentCommandPoints} / {state.maxCommandPoints} OP
        </div>
      </div>

      <div className="state-block">
        <div className="state-label">잔고</div>
        <div className="state-ledger">{state.ledger.toLocaleString()} cr</div>
      </div>

      <div className="state-block">
        <div className="state-label">소속 용병 컨디션</div>
        {hiredMercList.length === 0 ? (
          <div className="muted">고용된 용병 없음</div>
        ) : (
          <ul>
            {hiredMercList.map((merc) => (
              <li key={merc.mercId}>
                <strong>{merc.aliasKo}</strong>
                <div className="muted">
                  {(state.mercStatuses[merc.mercId] ?? []).map(statusName).join(", ") || "이상 없음"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {gearEntries.length > 0 && (
        <div className="state-block">
          <div className="state-label">장비 파손 현황 (픽서 보유)</div>
          <ul>
            {gearEntries.map(([id, st]) => (
              <li key={id} className="muted">
                {gearName(id)} · <span style={{ color: "var(--danger)" }}>{st}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {implantEntries.length > 0 && (
        <div className="state-block">
          <div className="state-label">임플란트 이상 현황</div>
          <ul>
            {implantEntries.map(([id, st]) => (
              <li key={id} className="muted">
                {implantName(id)} · <span style={{ color: "var(--danger)" }}>{st}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reputationEntries.length > 0 && (
        <div className="state-block">
          <div className="state-label">팩션 평판</div>
          <ul>
            {reputationEntries.map(([id, val]) => (
              <li key={id} className="muted">
                {factionName(id)}{" "}
                <span style={{ color: val > 0 ? "var(--green)" : "var(--danger)" }}>
                  {val > 0 ? "+" : ""}{val}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.followupHooks.length > 0 && (
        <div className="state-block">
          <div className="state-label">후속 단서</div>
          <div className="muted">{state.followupHooks.length}건 확보 — 새 미션이 게시판에 해금됨</div>
        </div>
      )}

      <div className="state-block" style={{ marginTop: "auto", borderTop: "1px dashed var(--cyan)" }}>
        {onNextTurn && (
          canAdvanceTurn ? (
            <button className="primary" onClick={onNextTurn} style={{ width: "100%", marginTop: "1rem" }}>
              다음 날로 넘어가기
            </button>
          ) : (
            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <p className="warning" style={{ color: "var(--danger)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                ⚠️ 파견 중인 미션 대기 필요
              </p>
              <button className="primary" disabled style={{ width: "100%", cursor: "not-allowed" }}>
                다음 날로 넘어가기
              </button>
            </div>
          )
        )}
        <button className="secondary" onClick={onTimeSkip} style={{ width: "100%", marginTop: "0.5rem" }}>
          [Debug: 시간 가속]
        </button>
        <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            id="ai-narrator-toggle"
            checked={state.aiNarratorEnabled}
            onChange={(e) => onToggleAiNarrator?.(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          <label htmlFor="ai-narrator-toggle" style={{ fontSize: "0.85rem", cursor: "pointer", userSelect: "none" }}>
            로컬 AI 브리핑 활성화
          </label>
        </div>
        <p className="muted" style={{ fontSize: "0.75rem", textAlign: "center", marginTop: "0.5rem" }}>
          시간 가속은 진행 중인 파견 즉시 완료
        </p>
      </div>
    </aside>
  );
}

