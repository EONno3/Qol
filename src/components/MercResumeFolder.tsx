import type { Mercenary } from "../data/types";

export interface MercResumeFolderProps {
  merc: Mercenary;
}

/** 용병 이력서 Phase 0~2 전체 상시 공개 (Option B: 분석 게이트 폐지). */
export function MercResumeFolder({ merc }: MercResumeFolderProps) {
  return (
    <div className="folder" style={{ marginTop: "12px", background: "var(--panel-2)" }}>
      <div className="folder-tab" style={{ background: "var(--cyan)", color: "#042024" }}>
        용병 이력서 ({merc.aliasKo})
      </div>
      <div
        className="folder-paper"
        style={{ padding: "14px", background: "var(--paper)", color: "var(--paper-ink)" }}
      >
        <div className="folder-page-section">
          <div className="folder-page-label" style={{ color: "#6a4a12", fontWeight: 700 }}>
            이력서 프로필 (기본)
          </div>
          <p className="folder-page-body" style={{ margin: "4px 0 12px" }}>
            {merc.phase0ProfileKo}
          </p>
        </div>

        {merc.phase1SummaryKo && (
          <div
            className="folder-page-section"
            style={{ borderTop: "1px dashed #cfc7b6", paddingTop: "10px" }}
          >
            <div className="folder-page-label" style={{ color: "#6a4a12", fontWeight: 700 }}>
              Phase 1 · 활동 성향 (강점/위험)
            </div>
            <p className="folder-page-body" style={{ margin: "4px 0 12px" }}>
              {merc.phase1SummaryKo}
            </p>
          </div>
        )}

        {merc.phase2SummaryKo && (
          <div
            className="folder-page-section"
            style={{ borderTop: "1px dashed #cfc7b6", paddingTop: "10px" }}
          >
            <div className="folder-page-label" style={{ color: "#6a4a12", fontWeight: 700 }}>
              Phase 2 · 보유 자질 및 상태 태그
            </div>
            <p className="folder-page-body" style={{ margin: "4px 0 0" }}>
              {merc.phase2SummaryKo}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
