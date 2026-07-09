import { GAME_CONFIG } from "../data/config";

export interface DroneCatchUpViewProps {
  visible: boolean;
  catchUpOn: boolean;
  onCatchUpChange: (on: boolean) => void;
  baseCommandCost: number;
  effectiveCommandCost: number;
  canPickNodes: boolean;
  selectableNodeNames: string[];
  pickedNodes: string[];
  onToggleNodePick: (name: string) => void;
  interventionCap: number;
  catchUpNeedsNodes: boolean;
}

export function DroneCatchUpView({
  visible,
  catchUpOn,
  onCatchUpChange,
  baseCommandCost,
  effectiveCommandCost,
  canPickNodes,
  selectableNodeNames,
  pickedNodes,
  onToggleNodePick,
  interventionCap,
  catchUpNeedsNodes,
}: DroneCatchUpViewProps) {
  if (!visible) return null;

  return (
    <div
      className="catchup-panel"
      style={{
        border: `1px solid ${catchUpOn ? "var(--amber)" : "var(--border)"}`,
        borderRadius: "6px",
        padding: "0.75rem",
        marginBottom: "0.5rem",
      }}
    >
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={catchUpOn}
          onChange={(e) => onCatchUpChange(e.target.checked)}
          aria-label="캐치업 현장 개입 모드"
        />
        <strong>[현장 개입] 캐치업 모드</strong>
      </label>

      {catchUpOn && (
        <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
          <p style={{ color: "var(--amber)", margin: "0 0 0.4rem" }}>
            현장 개입 코스트: {effectiveCommandCost} OP (기본 {baseCommandCost} ×1.5, 올림)
          </p>
          {canPickNodes ? (
            <div>
              <p style={{ margin: "0 0 0.3rem", color: "var(--muted)" }}>
                개입할 노드 선택 (최대 {interventionCap}개 — 부정 확률 +
                {GAME_CONFIG.catchUp.nodePenaltyPercent}%p, 성공 시 추가 보상)
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                {selectableNodeNames.map((name) => (
                  <label key={name} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <input
                      type="checkbox"
                      checked={pickedNodes.includes(name)}
                      onChange={() => onToggleNodePick(name)}
                      disabled={
                        !pickedNodes.includes(name) && pickedNodes.length >= interventionCap
                      }
                    />
                    {name}
                  </label>
                ))}
              </div>
              {catchUpNeedsNodes && (
                <p style={{ color: "var(--danger)", margin: "0.3rem 0 0" }}>
                  개입할 노드를 최소 1개 선택하세요.
                </p>
              )}
            </div>
          ) : (
            <p style={{ color: "var(--muted)", margin: 0 }}>
              ⚠️ 현장 정보 부족: 개입 노드를 지정할 수 없어 <strong>무작위 {Math.round(
                GAME_CONFIG.catchUp.interventionRatio * 100
              )}% 구간</strong>에 개입합니다. (심층 분석 Lv.2 이상에서 직접 지정 가능)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
