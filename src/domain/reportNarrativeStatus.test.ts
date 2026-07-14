import { describe, expect, it } from "vitest";
import { createMockResultReport } from "../test/factories";
import {
  deskNarrativeStatusLabel,
  isReportNarrativeGenerating,
  isReportNarrativeReady,
} from "./reportNarrativeStatus";

describe("reportNarrativeStatus (T-DUX-DESK)", () => {
  it("T-DUX-DESK-1: GENERATING이면 미열람·동기화 문구", () => {
    const report = createMockResultReport({ aiNarrativeKo: "GENERATING" });
    expect(isReportNarrativeReady(report)).toBe(false);
    expect(isReportNarrativeGenerating(report)).toBe(true);
    expect(deskNarrativeStatusLabel(report).label).toMatch(/컴파일 중/);
  });

  it("T-DUX-DESK-2: catchUp + GENERATING이면 관제 동기화 문구", () => {
    const report = createMockResultReport({
      catchUpActive: true,
      aiNarrativeKo: "GENERATING",
    });
    expect(deskNarrativeStatusLabel(report).label).toMatch(/관제 로그 동기화/);
  });

  it("T-DUX-DESK-3: AI/FALLBACK이면 열람 가능", () => {
    expect(isReportNarrativeReady(createMockResultReport({ aiNarrativeKo: "본문" }))).toBe(
      true,
    );
    expect(isReportNarrativeReady(createMockResultReport({ aiNarrativeKo: "FALLBACK" }))).toBe(
      true,
    );
  });
});
