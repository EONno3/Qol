import { useState } from "react";
import type { Mission } from "../data/types";
import { tierClass, tierLabel } from "./labels";
import { missionTypeName } from "../data/lookups";

interface Props {
  mission: Mission;
  analysisLevel: number;
  onAccept: (missionId: string) => void;
  onBack: () => void;
}

export function MissionDetail({ mission, analysisLevel, onAccept, onBack }: Props) {
  const [showAttachment, setShowAttachment] = useState(false);

  return (
    <section>
      <h2>의뢰 서류철</h2>

      <div className={`folder ${tierClass(mission.tier)}`}>
        <div className="folder-tab">{tierLabel[mission.tier]} 구역 의뢰</div>

        <div className="folder-paper">
          <div className="folder-head">
            <button
              className="attachment-chip"
              onClick={() => setShowAttachment(true)}
              title="첨부 자료 보기"
            >
              <span className="attachment-icon">▣</span>
              현장 칩
            </button>

            <table className="brief-table">
              <tbody>
                <tr>
                  <th>미션 타입</th>
                  <td>{missionTypeName(mission.missionType)}</td>
                  <th>난이도</th>
                  <td>{"★".repeat(mission.difficultyStars)}</td>
                </tr>
                <tr>
                  <th>목표</th>
                  <td colSpan={3}>{mission.displayNameKo}</td>
                </tr>
                <tr>
                  <th>보상</th>
                  <td>{mission.rewardCredits.toLocaleString()} cr</td>
                  <th>위약금</th>
                  <td>{mission.earlyWithdrawalPenalty.toLocaleString()} cr</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="folder-page" style={{ display: "grid", gap: "16px", marginTop: "18px" }}>
            <div className="folder-page-section">
              <div className="folder-page-label">의뢰 개요 (Phase 0)</div>
              <p
                className="folder-page-body"
                style={{ margin: "6px 0 0", whiteSpace: "pre-line", lineHeight: 1.75 }}
              >
                {mission.phase0BriefingKo}
              </p>
            </div>

            {analysisLevel >= 1 ? (
              <div className="folder-page-section" style={{ borderTop: "1px dashed #cfc7b6", paddingTop: "12px" }}>
                <div className="folder-page-label">분석소 1차 해석 (Phase 1)</div>
                <p
                  className="folder-page-body"
                  style={{ margin: "6px 0 0", whiteSpace: "pre-line", lineHeight: 1.75 }}
                >
                  {mission.phase1SummaryKo}
                </p>
              </div>
            ) : (
              <div className="folder-page-section" style={{ borderTop: "1px dashed #cfc7b6", paddingTop: "12px" }}>
                <div className="folder-page-label">분석소 1차 해석 (Phase 1)</div>
                <p className="folder-page-body muted" style={{ margin: "6px 0 0" }}>
                  미션 분석 기관 Lv.1 이상이 필요합니다. 스테이션에서 분석소를 증설하면 의뢰의 성격과 위험 신호가 해석됩니다.
                </p>
              </div>
            )}

            {analysisLevel >= 2 ? (
              <div className="folder-page-section" style={{ borderTop: "1px dashed #cfc7b6", paddingTop: "12px" }}>
                <div className="folder-page-label">분석소 심화 분석 (Phase 2)</div>
                <p
                  className="folder-page-body"
                  style={{ margin: "6px 0 0", whiteSpace: "pre-line", lineHeight: 1.75 }}
                >
                  {mission.phase2SummaryKo}
                </p>
              </div>
            ) : (
              <div className="folder-page-section" style={{ borderTop: "1px dashed #cfc7b6", paddingTop: "12px" }}>
                <div className="folder-page-label">분석소 심화 분석 (Phase 2)</div>
                <p className="folder-page-body muted" style={{ margin: "6px 0 0" }}>
                  미션 분석 기관 Lv.2 이상이 필요합니다. 위협 프로필과 정량 요구 조건이 해금됩니다.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="folder-actions">
          <button className="ghost" onClick={onBack}>
            돌아가기
          </button>
          <button className="primary" onClick={() => onAccept(mission.missionId)}>
            서명하여 수주
          </button>
        </div>
      </div>

      {showAttachment && (
        <div className="modal-backdrop" onClick={() => setShowAttachment(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>현장 칩 · 첨부 자료</h3>
            <p className="muted">
              (프로토타입 placeholder) 현장 흔적/증거 샘플이 들어갈 자리. 클릭 시 시각 정보나
              물품 상세가 팝업으로 표시된다.
            </p>
            <button className="primary" onClick={() => setShowAttachment(false)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
