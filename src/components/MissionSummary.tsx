import { useState } from "react";
import type { Mission } from "../data/types";
import { tierClass, tierLabel } from "./labels";
import { missionTypeName } from "../data/lookups";

interface Props {
  mission: Mission;
  analysisLevel: number;
  onProceed: (missionId: string) => void;
  onBack: () => void;
}

export function MissionSummary({ mission, analysisLevel, onProceed, onBack }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section>
      <h2>미션 요약</h2>

      <div className={`folder ${tierClass(mission.tier)}`}>
        <div className="folder-tab">{tierLabel[mission.tier]} 구역 · 출격 전 요약</div>

        <div className="folder-paper">
          <table className="brief-table">
            <tbody>
              <tr>
                <th>목표</th>
                <td colSpan={3}>{mission.displayNameKo}</td>
              </tr>
              <tr>
                <th>타입</th>
                <td>{missionTypeName(mission.missionType)}</td>
                <th>난이도</th>
                <td>{"★".repeat(mission.difficultyStars)}</td>
              </tr>
              <tr>
                <th>보상</th>
                <td>{mission.rewardCredits.toLocaleString()} cr</td>
                <th>노드 수</th>
                <td>{mission.nodeCount}</td>
              </tr>
            </tbody>
          </table>

          {expanded && (
            <div className="folder-page">
              <div className="folder-page-label">브리핑</div>
              <p className="folder-page-body">{mission.phase0BriefingKo}</p>
              {analysisLevel >= 1 && (
                <>
                  <div className="folder-page-label">Phase 1 · 분석 힌트</div>
                  <p className="folder-page-body">{mission.phase1SummaryKo}</p>
                </>
              )}
              {analysisLevel >= 2 && (
                <>
                  <div className="folder-page-label">Phase 2 · 요구 조건</div>
                  <p className="folder-page-body">{mission.phase2SummaryKo}</p>
                </>
              )}
            </div>
          )}

          <div className="folder-pager">
            <button className="pager-btn" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "브리핑 접기" : "브리핑·추가 정보 펼치기"}
            </button>
          </div>
        </div>

        <div className="folder-actions">
          <button className="ghost" onClick={onBack}>
            돌아가기
          </button>
          <button className="primary" onClick={() => onProceed(mission.missionId)}>
            용병 매칭으로
          </button>
        </div>
      </div>
    </section>
  );
}
