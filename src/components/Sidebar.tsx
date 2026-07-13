interface Props {
  active: "board" | "accepted" | "desk" | "station" | "other";
  acceptedCount: number;
  activeCount: number;
  completedCount: number;
  stationPredictBase: number;
  stationMissionBase: number;
  missionSlotTargetId: string | null;
  missionSlotProgress: number;
  onGoBoard: () => void;
  onGoAccepted: () => void;
  onGoDesk: () => void;
  onGoStation: () => void;
  onResetGame: () => void;
}

export function Sidebar({
  active,
  acceptedCount,
  activeCount,
  completedCount,
  stationPredictBase,
  stationMissionBase,
  missionSlotTargetId,
  missionSlotProgress,
  onGoBoard,
  onGoAccepted,
  onGoDesk,
  onGoStation,
  onResetGame,
}: Props) {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        용병관리소
        <span className="sidebar-brand-sub">MVP</span>
      </div>

      <ul className="sidebar-menu">
        <li>
          <button className={active === "board" ? "active" : ""} onClick={onGoBoard}>
            미션 게시판
          </button>
        </li>
        <li>
          <button className={active === "accepted" ? "active" : ""} onClick={onGoAccepted}>
            수주 미션 ({acceptedCount})
          </button>
        </li>
        <li>
          <button className={active === "other" ? "active" : ""} onClick={onGoDesk}>
            파견 관제소 ({activeCount})
            {completedCount > 0 && <span className="badge">{completedCount}</span>}
          </button>
        </li>
        <li>
          <button className={active === "station" ? "active" : ""} onClick={onGoStation}>
            스테이션 관리
          </button>
        </li>
        <li>
          <button className="danger" onClick={onResetGame}>
            데이터 초기화
          </button>
        </li>
      </ul>

      <div className="sidebar-analysis">
        <div className="sidebar-section-label">분석 기관 (베이스)</div>
        <div className="muted" style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
          미션 Lv.{stationMissionBase}
          {missionSlotTargetId && (
            <span style={{ color: "var(--cyan)" }}>
              {" "}
              · 슬롯 +{missionSlotProgress}
            </span>
          )}
        </div>
        <div className="muted" style={{ fontSize: "0.9rem", lineHeight: 1.5, marginTop: "0.25rem" }}>
          매칭 예측 Lv.{stationPredictBase}
          <span style={{ color: "var(--muted)" }}> (슬롯 준비 중)</span>
        </div>
        <div className="sidebar-effective" style={{ marginTop: "0.5rem" }}>
          슬롯 배치는 스테이션 「분석 기관」 탭에서 설정
        </div>
      </div>
    </nav>
  );
}
