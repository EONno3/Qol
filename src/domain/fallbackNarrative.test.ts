import { describe, it, expect } from "vitest";
import { buildFallbackNarrative } from "./fallbackNarrative";
import { createMockMission, createMockResultReport, createMockMercenary } from "../test/factories";
import { STATUS_KIA } from "../data/constants";

/**
 * D-A 2-1: AI 미연결(FALLBACK) 시, 1인칭 일지 자리에 기계식 시스템 문장이
 * 그대로 노출되던 문제를 해결하기 위한 순수 함수 테스트.
 *
 * 핵심 보증:
 *  1. 결과 유형별로 서로 다른 1인칭 서술을 만든다.
 *  2. "확률 / 굴림 / 스탯 / % / 요구" 같은 기계식 수치 토큰을 절대 포함하지 않는다.
 *  3. 용병 호칭(aliasKo)을 활용한 몰입형 텍스트를 생성한다.
 */

const MECHANICAL_TOKENS = ["확률", "굴림", "스탯", "%", "요구 수치", "성공률"];

function expectNoMechanicalTokens(text: string) {
  for (const token of MECHANICAL_TOKENS) {
    expect(text).not.toContain(token);
  }
}

describe("buildFallbackNarrative", () => {
  const merc = createMockMercenary({ aliasKo: "차단기" });

  it("성공 결과는 임무 완수 톤의 1인칭 일지를 만든다", () => {
    const report = createMockResultReport({ resultType: "success" });
    const mission = createMockMission();

    const text = buildFallbackNarrative(report, mission, merc);

    expect(text.length).toBeGreaterThan(10);
    expectNoMechanicalTokens(text);
  });

  it("부분 성공 결과는 대가를 치른 생환 톤을 만든다", () => {
    const report = createMockResultReport({ resultType: "partial_success" });
    const mission = createMockMission();

    const text = buildFallbackNarrative(report, mission, merc);

    expectNoMechanicalTokens(text);
    expect(text).not.toBe(buildFallbackNarrative(createMockResultReport({ resultType: "success" }), mission, merc));
  });

  it("실패 + 생환(KIA 아님)은 치명상 생환 톤을 만든다", () => {
    const report = createMockResultReport({
      resultType: "failure",
      statusChanges: [],
    });
    const mission = createMockMission();

    const text = buildFallbackNarrative(report, mission, merc);

    expectNoMechanicalTokens(text);
    expect(text.length).toBeGreaterThan(10);
  });

  it("실패 + 사망(KIA)은 사망을 암시하는 최후 기록 톤을 만든다", () => {
    const report = createMockResultReport({
      resultType: "failure",
      statusChanges: [
        { statusId: STATUS_KIA, changeType: "add", noteKo: "사생결단 생존 판정의 결과" },
      ],
    });
    const mission = createMockMission();

    const text = buildFallbackNarrative(report, mission, merc);

    expectNoMechanicalTokens(text);
    // 사망 케이스는 생환 케이스와 달라야 한다
    const survivedText = buildFallbackNarrative(
      createMockResultReport({ resultType: "failure", statusChanges: [] }),
      mission,
      merc
    );
    expect(text).not.toBe(survivedText);
  });

  it("조기 철수 결과는 임무 포기 톤을 만든다", () => {
    const report = createMockResultReport({ resultType: "early_withdrawal" });
    const mission = createMockMission();

    const text = buildFallbackNarrative(report, mission, merc);

    expectNoMechanicalTokens(text);
    expect(text.length).toBeGreaterThan(10);
  });

  it("어떤 결과 유형이든 빈 문자열을 반환하지 않는다", () => {
    const types = ["success", "partial_success", "failure", "early_withdrawal", "incident"] as const;
    const mission = createMockMission();

    for (const t of types) {
      const text = buildFallbackNarrative(createMockResultReport({ resultType: t }), mission, merc);
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });
});
