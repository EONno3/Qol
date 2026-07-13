import { useState } from "react";
import type { Mercenary } from "../data/types";
import { MercResumeFolder } from "./MercResumeFolder";

export interface MercProfileViewProps {
  merc: Mercenary;
  mercAnalysisLevel: number;
  /** 시장(미고용) 용병은 분석 슬롯 배치 불가로 Phase 0만 노출 */
  isMarketMerc?: boolean;
  onBack: () => void;
}

type ProfileTab = "resume" | "relation";

export function MercProfileView({
  merc,
  mercAnalysisLevel,
  isMarketMerc = false,
  onBack,
}: MercProfileViewProps) {
  const [tab, setTab] = useState<ProfileTab>("resume");
  const displayLevel = isMarketMerc ? 0 : mercAnalysisLevel;

  return (
    <section className="merc-profile-view" data-testid="merc-profile-view">
      <div className="section-head">
        <h2>용병 프로필</h2>
        <button className="ghost" onClick={onBack}>
          돌아가기
        </button>
      </div>

      <div className="merc-profile-header" style={{ marginBottom: "1rem" }}>
        <div style={{ fontWeight: 700, fontSize: "1.15rem", color: "var(--cyan)" }}>
          {merc.aliasKo}
          <span className="muted" style={{ marginLeft: "0.5rem", fontWeight: 400, fontSize: "0.95rem" }}>
            ({merc.displayNameKo})
          </span>
        </div>
        <div className="muted" style={{ marginTop: "0.25rem" }}>
          출신: {merc.originKo} · 지휘력 코스트: {merc.commandCost} OP · 분석 Lv.{displayLevel}
          {isMarketMerc && " (시장 — Phase 0만)"}
        </div>
      </div>

      <div
        className="merc-profile-tabs"
        role="tablist"
        aria-label="용병 프로필 탭"
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1rem",
          borderBottom: "1px solid var(--line)",
          paddingBottom: "0.5rem",
        }}
      >
        <button
          role="tab"
          aria-selected={tab === "resume"}
          className={`tab-btn ${tab === "resume" ? "active" : ""}`}
          onClick={() => setTab("resume")}
          style={{
            background: "none",
            border: "none",
            color: tab === "resume" ? "var(--cyan)" : "var(--muted)",
            fontWeight: tab === "resume" ? "bold" : "normal",
            cursor: "pointer",
            fontSize: "1.05rem",
          }}
        >
          이력서
        </button>
        <button
          role="tab"
          aria-selected={tab === "relation"}
          aria-disabled="true"
          disabled
          title="Phase E에서 호감도·관계 시스템이 추가됩니다"
          style={{
            background: "none",
            border: "none",
            color: "var(--muted)",
            cursor: "not-allowed",
            fontSize: "1.05rem",
            opacity: 0.55,
          }}
        >
          관계 (Phase E 예정)
        </button>
      </div>

      {tab === "resume" && (
        <div role="tabpanel" aria-label="이력서">
          <MercResumeFolder merc={merc} mercAnalysisLevel={displayLevel} />
        </div>
      )}
    </section>
  );
}
