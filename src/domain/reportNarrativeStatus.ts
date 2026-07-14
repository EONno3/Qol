import type { ResultReport } from "../data/types";

/** AI 서사 열람 가능 여부 — GENERATING·미설정은 대기 */
export function isReportNarrativeReady(report: ResultReport | undefined): boolean {
  if (!report) return false;
  const n = report.aiNarrativeKo;
  return n !== undefined && n !== "GENERATING";
}

export function isReportNarrativeGenerating(report: ResultReport | undefined): boolean {
  if (!report) return false;
  return report.aiNarrativeKo === undefined || report.aiNarrativeKo === "GENERATING";
}

export function deskNarrativeStatusLabel(
  report: ResultReport | undefined,
): { ready: boolean; label: string } {
  if (!report) {
    return { ready: false, label: "보고서 수신 대기 중..." };
  }
  if (isReportNarrativeGenerating(report)) {
    return {
      ready: false,
      label: report.catchUpActive
        ? "현장 관제 로그 동기화 중..."
        : "데이터 복호화 및 보고서 컴파일 중...",
    };
  }
  if (report.aiNarrativeKo === "FALLBACK") {
    return { ready: true, label: "보고서 준비됨 (오프라인 폴백). 열람 가능." };
  }
  return { ready: true, label: "보고서 준비됨. 열람 가능." };
}
