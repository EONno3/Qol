import { GAME_CONFIG } from "../data/config";

export type DeployMode = "assign" | "catchUp";

export interface DroneCatchUpViewProps {
  visible: boolean;
  catchUpOn: boolean;
  onCatchUpChange: (on: boolean) => void;
  baseCommandCost: number;
  effectiveCommandCost: number;
  /** predict Lv<2 — 인런 HUD 저해상도 예고 */
  lowHudResolution: boolean;
}

export function DroneCatchUpView({
  visible,
  catchUpOn,
  onCatchUpChange,
  baseCommandCost,
  effectiveCommandCost,
  lowHudResolution,
}: DroneCatchUpViewProps) {
  if (!visible) return null;

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
            <span className="drone-catchup-hud__value">{effectiveCommandCost} OP</span>
            <span className="drone-catchup-hud__meta">
              (기본 {baseCommandCost} ×{GAME_CONFIG.catchUp.costMultiplier}, 올림)
            </span>
          </div>

          <p className="drone-catchup-nodes__hint">
            출격 후 드론 관제 화면에서 노드마다 [개입] / [패스]를 선택합니다. 개입 상한: 미션 노드의{" "}
            {Math.round(GAME_CONFIG.catchUp.interventionRatio * 100)}% (올림).
          </p>

          {lowHudResolution && (
            <div className="drone-glitch" data-testid="drone-l0-glitch" role="alert">
              <div className="drone-glitch__scanline" aria-hidden="true" />
              <div className="drone-glitch__label">SIGNAL DEGRADED</div>
              <p className="drone-glitch__body">
                매칭 예측 Lv.2 미만 — 인런 드론 HUD 해상도가 제한됩니다. 개입은 가능합니다.
              </p>
              <p className="drone-glitch__hint">심층 분석 Lv.2 이상에서 노드 상세 HUD 해금</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
