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

  const interventionPercent = Math.round(GAME_CONFIG.catchUp.interventionRatio * 100);

  return (
    <div
      className={`catchup-panel drone-catchup-panel${catchUpOn ? " drone-catchup-panel--active" : ""}`}
    >
      <label className="drone-catchup-toggle">
        <input
          type="checkbox"
          checked={catchUpOn}
          onChange={(e) => onCatchUpChange(e.target.checked)}
          aria-label="캐치업 현장 개입 모드"
        />
        <strong>[현장 개입] 캐치업 모드</strong>
      </label>

      {catchUpOn && (
        <div
          className="drone-catchup-active"
          data-testid="drone-catchup-active"
          role="region"
          aria-label="관제 드론"
        >
          <div className="drone-catchup-header">
            <span className="drone-catchup-header__icon" aria-hidden="true">
              ◈
            </span>
            <span className="drone-catchup-header__title">관제 드론 — 현장 개입</span>
            <span className="drone-catchup-header__badge">LIVE FEED</span>
          </div>

          <div className="drone-catchup-hud">
            <span className="drone-catchup-hud__label">OP 소모</span>
            <span className="drone-catchup-hud__value">
              {effectiveCommandCost} OP
            </span>
            <span className="drone-catchup-hud__meta">
              (기본 {baseCommandCost} ×1.5, 올림)
            </span>
          </div>

          {canPickNodes ? (
            <div className="drone-catchup-nodes">
              <p className="drone-catchup-nodes__hint">
                개입할 노드 선택 (최대 {interventionCap}개 — 부정 확률 +
                {GAME_CONFIG.catchUp.nodePenaltyPercent}%p, 성공 시 추가 보상)
              </p>
              <div className="drone-catchup-nodes__list">
                {selectableNodeNames.map((name) => (
                  <label key={name} className="drone-catchup-node">
                    <input
                      type="checkbox"
                      checked={pickedNodes.includes(name)}
                      onChange={() => onToggleNodePick(name)}
                      disabled={
                        !pickedNodes.includes(name) && pickedNodes.length >= interventionCap
                      }
                    />
                    <span>{name}</span>
                  </label>
                ))}
              </div>
              {catchUpNeedsNodes && (
                <p className="drone-catchup-nodes__error">
                  개입할 노드를 최소 1개 선택하세요.
                </p>
              )}
            </div>
          ) : (
            <div
              className="drone-glitch"
              data-testid="drone-l0-glitch"
              role="alert"
            >
              <div className="drone-glitch__scanline" aria-hidden="true" />
              <div className="drone-glitch__label">SIGNAL DEGRADED</div>
              <p className="drone-glitch__body">
                드론 피드 해상도 불충분 — 개입 구간을 식별할 수 없음.
                <strong> 무작위 {interventionPercent}% 구간</strong>에 강제 개입됩니다.
              </p>
              <p className="drone-glitch__hint">
                심층 분석 Lv.2 이상에서 노드 직접 지정 가능
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
