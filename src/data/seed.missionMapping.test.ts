import { describe, it, expect } from "vitest";
import { mapGeneratedMission } from "./seed";

/**
 * AI 생성 미션(JSON) → Mission 매핑 정합성 테스트.
 *
 * 기획 정정 사항 반영:
 *  - 영문 스탯키([Pulse]) 노출 금지 → 한국어(펄스) 표기
 *  - Phase 2에 정량 요구 스탯 커트라인(시스템 결정 수치) 부착
 *  - Phase 1/2는 AI 줄글(phase1Brief/phase2Brief)을 본문으로 사용
 *  - 옛 데이터(프로즈 필드 없음)에서도 빈 문자열 없이 폴백
 */

const baseGen = {
  difficulty: 3,
  missionType: "비밀",
  missionDetail: "조사",
  clientFaction: "더 밸브",
  targetFaction: "No Claim",
  missionGoal: { type: "의문의 변사체 조사", detail: "사망자 식별." },
  location: { layer: "하층", zone: "언존", structure: "광장", spot: "배급 광장" },
  danger: "불안정한 구조물 붕괴",
  economy: { reward_credits: 29000 },
  mechanics: { visibility_limit: 80, primary_stat: "Pulse", secondary_stat: "Cool" },
  nodes: [{ step: 1, name: "수색", stat_check: "Pulse" }],
  briefing: "의뢰가 새벽에 들어왔다. 배급 광장에서 변사체가 발견됐다는 제보다.",
  phase1Brief: "단순 변사체로 보기 어렵다. 현장 직관이 뛰어난 자가 필요하다.",
  phase2Brief: "구조물이 붕괴 직전이다. 진입 타이밍을 놓치면 매몰될 수 있다.",
};

describe("mapGeneratedMission", () => {
  it("Phase 2에 영문 스탯키 대신 한국어 스탯명을 쓴다", () => {
    const m = mapGeneratedMission(baseGen, 0);
    expect(m.phase2SummaryKo).toContain("펄스");
    expect(m.phase2SummaryKo).not.toContain("[Pulse]");
    expect(m.phase2SummaryKo).not.toContain("Pulse");
  });

  it("Phase 2에 난이도 기반 정량 커트라인 수치를 부착한다 (3성 = 30 + 3*5 = 45)", () => {
    const m = mapGeneratedMission(baseGen, 0);
    expect(m.phase2SummaryKo).toContain("45");
  });

  it("Phase 1/2 본문에 AI 줄글(phase1Brief/phase2Brief)이 포함된다", () => {
    const m = mapGeneratedMission(baseGen, 0);
    expect(m.phase1SummaryKo).toContain("현장 직관이 뛰어난 자가 필요하다");
    expect(m.phase2SummaryKo).toContain("매몰될 수 있다");
  });

  it("정보 단계 정합: 현장 위험은 Phase 2, 권장/필수 장비는 Phase 1에 배치한다", () => {
    const gen = {
      ...baseGen,
      requirements: { mandatory: ["밀폐 보호복"], recommended: ["휴대 산소"] },
    };
    const m = mapGeneratedMission(gen, 0);
    // 현장 위험(danger) = Phase 2 전용
    expect(m.phase2SummaryKo).toContain("불안정한 구조물 붕괴");
    expect(m.phase1SummaryKo).not.toContain("불안정한 구조물 붕괴");
    // 장비/정비 = Phase 1 전용
    expect(m.phase1SummaryKo).toContain("밀폐 보호복");
    expect(m.phase1SummaryKo).toContain("휴대 산소");
    expect(m.phase2SummaryKo).not.toContain("밀폐 보호복");
  });

  it("Phase 0 브리핑은 AI 개요를 그대로 쓴다", () => {
    const m = mapGeneratedMission(baseGen, 0);
    expect(m.phase0BriefingKo).toContain("배급 광장에서 변사체가 발견");
  });

  it("AI 프로즈 필드가 없는 옛 데이터도 빈 문자열 없이 폴백한다", () => {
    const old = { ...baseGen, phase1Brief: undefined, phase2Brief: undefined };
    const m = mapGeneratedMission(old, 0);
    expect(m.phase1SummaryKo.trim().length).toBeGreaterThan(0);
    expect(m.phase2SummaryKo.trim().length).toBeGreaterThan(0);
    expect(m.phase2SummaryKo).toContain("펄스");
  });

  it("MOCK 브리핑은 구조화 폴백으로 대체한다", () => {
    const mock = { ...baseGen, briefing: "[MOCK AI 생성 텍스트: ...]" };
    const m = mapGeneratedMission(mock, 0);
    expect(m.phase0BriefingKo).not.toContain("[MOCK");
  });

  it("구역 계층을 tier로 매핑한다", () => {
    expect(mapGeneratedMission({ ...baseGen, location: { layer: "상층" } }, 0).tier).toBe("upper");
    expect(mapGeneratedMission({ ...baseGen, location: { layer: "중층" } }, 0).tier).toBe("mid");
    expect(mapGeneratedMission({ ...baseGen, location: { layer: "하층" } }, 0).tier).toBe("lower");
  });

  it("T-S1-5: danger 검문 → nodes 중 1개 이상 adverse gear_detection 배정", () => {
    const gen = {
      ...baseGen,
      missionType: "잠입",
      danger: "입구 검문 스캔",
      nodes: [
        { name: "진입", role: "entry", stat_check: "cypher" },
        { name: "목표", role: "objective", stat_check: "cypher" },
        { name: "이탈", role: "exit", stat_check: "cypher" },
      ],
    };
    const m = mapGeneratedMission(gen, 42);

    expect(m.missionTags).toContain("tag_challenge_gear_detection");
    const detectionNodes = (m.nodes ?? []).filter((n) =>
      (n.challengeTags ?? []).includes("tag_challenge_gear_detection")
    );
    expect(detectionNodes.length).toBeGreaterThanOrEqual(1);
    expect(detectionNodes[0].defaultPolarity).toBe("adverse");
  });
});
