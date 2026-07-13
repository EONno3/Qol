import { useState } from "react";
import type { Mercenary, StatKey } from "../data/types";
import { MercResumeFolder } from "./MercResumeFolder";

export interface MercProfileViewProps {
  merc: Mercenary;
  equippedGearNames?: string[];
  equippedImplantNames?: string[];
  onBack: () => void;
}

type ProfileTab = "resume" | "relation";

const STAT_LABEL: Record<StatKey, string> = {
  frame: "프레임",
  cool: "쿨",
  wire: "와이어",
  cypher: "사이퍼",
  pulse: "펄스",
};

export function MercProfileView({
  merc,
  equippedGearNames = [],
  equippedImplantNames = [],
  onBack,
}: MercProfileViewProps) {
  const [tab, setTab] = useState<ProfileTab>("resume");

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
          출신: {merc.originKo} · 지휘력 코스트: {merc.commandCost} OP
        </div>
      </div>

      <div
        className="merc-profile-stats"
        data-testid="merc-profile-stats"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "0.5rem",
          marginBottom: "1rem",
          padding: "0.75rem",
          background: "var(--panel-2)",
          border: "1px solid var(--panel-3)",
        }}
      >
        {(Object.keys(STAT_LABEL) as StatKey[]).map((key) => (
          <div key={key}>
            <div className="muted" style={{ fontSize: "0.85rem" }}>
              {STAT_LABEL[key]}
            </div>
            <div style={{ fontWeight: 700 }}>{merc.stats[key]}</div>
          </div>
        ))}
      </div>

      <div
        className="merc-profile-tags"
        data-testid="merc-profile-tags"
        style={{ marginBottom: "1rem" }}
      >
        <div className="muted" style={{ marginBottom: "0.35rem" }}>
          시스템 태그
        </div>
        {merc.systemTags.length === 0 ? (
          <div className="muted">등록된 태그 없음</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            {merc.systemTags.map((tagId) => (
              <li key={tagId}>{tagId}</li>
            ))}
          </ul>
        )}
      </div>

      <div
        className="merc-profile-gear"
        data-testid="merc-profile-gear"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div>
          <div className="muted" style={{ marginBottom: "0.35rem" }}>
            장착 장비
          </div>
          {equippedGearNames.length === 0 ? (
            <div className="muted">없음</div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
              {equippedGearNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className="muted" style={{ marginBottom: "0.35rem" }}>
            장착 의체
          </div>
          {equippedImplantNames.length === 0 ? (
            <div className="muted">없음</div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
              {equippedImplantNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          )}
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
          <MercResumeFolder merc={merc} />
        </div>
      )}
    </section>
  );
}
