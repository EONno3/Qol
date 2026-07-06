import type { Mission } from "../data/types";
import { tierClass, tierLabel } from "./labels";
import { missionTypeName } from "../data/lookups";

interface Props {
  missions: Mission[];
  onSelect: (missionId: string) => void;
}

export function MissionBoard({ missions, onSelect }: Props) {
  return (
    <section>
      <h2>미션 게시판</h2>
      <p className="muted">의뢰는 3시간마다 갱신된다. (MVP: 고정 3건)</p>
      {missions.length === 0 ? (
        <p className="muted">게시판에 남은 의뢰가 없다.</p>
      ) : (
        <div className="board-grid">
          {missions.map((mission) => (
            <button
              key={mission.missionId}
              className={`board-card ${tierClass(mission.tier)}`}
              onClick={() => onSelect(mission.missionId)}
            >
              <div className="board-card-top">
                <span className="board-card-tier">{tierLabel[mission.tier]}</span>
                <span className="board-card-type">{missionTypeName(mission.missionType)}</span>
              </div>
              <div className="board-card-title">{mission.displayNameKo}</div>
              <div className="board-card-bottom">
                <span className="board-card-diff">{"★".repeat(mission.difficultyStars)}</span>
                <span className="board-card-reward">
                  {mission.rewardCredits.toLocaleString()} cr
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
