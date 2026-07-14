/** ResultReport AI 서사 생성 대기 — A-MVP 문구만 (폴리싱은 Phase E) */

export const ASSIGN_NARRATIVE_LOADING_KO = "데이터 복호화 및 보고서 컴파일 중...";
export const CATCHUP_NARRATIVE_LOADING_KO = "현장 관제 로그 동기화 중...";

export function resolveNarrativeLoadingMessage(catchUpActive: boolean): string {
  return catchUpActive ? CATCHUP_NARRATIVE_LOADING_KO : ASSIGN_NARRATIVE_LOADING_KO;
}

export interface ReportNarrativeLoadingProps {
  catchUpActive?: boolean;
}

export function ReportNarrativeLoading({ catchUpActive = false }: ReportNarrativeLoadingProps) {
  const message = resolveNarrativeLoadingMessage(catchUpActive);
  return (
    <div
      className="report-narrative-loading"
      data-testid="report-narrative-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="report-narrative-loading__pulse" aria-hidden="true">
        ◈
      </div>
      <p className="report-narrative-loading__message">{message}</p>
      <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
        스테이션 AI 링크 대기 중 — 완료되면 자동으로 갱신됩니다.
      </p>
    </div>
  );
}
