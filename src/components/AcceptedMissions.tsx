import { useMemo, useState } from "react";
import type { Mission, Tier } from "../data/types";
import { tierClass, tierLabel } from "./labels";
import { missionTypeName } from "../data/lookups";

interface Props {
  missions: Mission[];
  onSelect: (missionId: string) => void;
}

export function AcceptedMissions({ missions, onSelect }: Props) {
  const [tierFilter, setTierFilter] = useState<Tier | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortDiff, setSortDiff] = useState<"recent" | "diff_desc">("recent");

  const types = useMemo(
    () => Array.from(new Set(missions.map((m) => m.missionType))),
    [missions],
  );

  const filtered = useMemo(() => {
    let list = missions.filter(
      (m) =>
        (tierFilter === "all" || m.tier === tierFilter) &&
        (typeFilter === "all" || m.missionType === typeFilter),
    );
    if (sortDiff === "diff_desc") {
      list = [...list].sort((a, b) => b.difficultyStars - a.difficultyStars);
    }
    return list;
  }, [missions, tierFilter, typeFilter, sortDiff]);

  return (
    <section>
      <div className="section-head">
        <h2>수주 미션 목록</h2>
        <div className="filters">
          <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value as Tier | "all")}>
            <option value="all">구역 전체</option>
            <option value="lower">하층</option>
            <option value="mid">중층</option>
            <option value="upper">상층</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">타입 전체</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {missionTypeName(t)}
              </option>
            ))}
          </select>
          <select value={sortDiff} onChange={(e) => setSortDiff(e.target.value as typeof sortDiff)}>
            <option value="recent">최근 수주순</option>
            <option value="diff_desc">난이도 높은순</option>
          </select>
        </div>
      </div>

      {missions.length === 0 ? (
        <p className="muted">아직 수주한 의뢰가 없다.</p>
      ) : filtered.length === 0 ? (
        <p className="muted">필터에 맞는 의뢰가 없다.</p>
      ) : (
        <div className="board-grid">
          {filtered.map((mission) => (
            <button
              key={mission.missionId}
              className={`board-card dimmed ${tierClass(mission.tier)}`}
              onClick={() => onSelect(mission.missionId)}
            >
              <div className="board-card-top">
                <span className="board-card-tier">{tierLabel[mission.tier]}</span>
                <span className="board-card-type">{missionTypeName(mission.missionType)}</span>
              </div>
              <div className="board-card-title">{mission.displayNameKo}</div>
              <div className="board-card-bottom">
                <span className="board-card-diff">{"★".repeat(mission.difficultyStars)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
