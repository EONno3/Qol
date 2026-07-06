interface Props {
  active: "board" | "accepted" | "desk" | "station" | "other";
  acceptedCount: number;
  activeCount: number;
  completedCount: number;
  mercAnalysisLevel: number;
  missionAnalysisLevel: number;
  onGoBoard: () => void;
  onGoAccepted: () => void;
  onGoDesk: () => void;
  onGoStation: () => void;
  onResetGame: () => void;
  onMercLevel: (level: number) => void;
  onMissionLevel: (level: number) => void;
}

export function Sidebar({
  active,
  acceptedCount,
  activeCount,
  completedCount,
  mercAnalysisLevel,
  missionAnalysisLevel,
  onGoBoard,
  onGoAccepted,
  onGoDesk,
  onGoStation,
  onResetGame,
  onMercLevel,
  onMissionLevel,
}: Props) {
  const effective = Math.min(mercAnalysisLevel, missionAnalysisLevel);

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
        <div className="sidebar-section-label">분석소 레벨</div>
        <label>
          용병 분석
          <select
            value={mercAnalysisLevel}
            onChange={(e) => onMercLevel(Number(e.target.value))}
          >
            <option value={0}>Lv.0</option>
            <option value={1}>Lv.1</option>
            <option value={2}>Lv.2</option>
          </select>
        </label>
        <label>
          미션 분석
          <select
            value={missionAnalysisLevel}
            onChange={(e) => onMissionLevel(Number(e.target.value))}
          >
            <option value={0}>Lv.0</option>
            <option value={1}>Lv.1</option>
            <option value={2}>Lv.2</option>
          </select>
        </label>
        <div className="sidebar-effective">노출 적용 Lv.{effective} (min 규칙)</div>
      </div>
    </nav>
  );
}
