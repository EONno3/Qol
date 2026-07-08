import { describe, expect, it } from "vitest";
import { createMockMission } from "../test/factories";
import { maxCatchUpInterventions, selectCatchUpNodes } from "./catchUp";

function missionWithNodes(names: string[]) {
  return createMockMission({
    nodes: names.map((nameKo, i) => ({
      nameKo,
      role: i === 0 ? "entry" : i === names.length - 1 ? "exit" : "objective",
      statCheck: "frame" as const,
    })),
  });
}

describe("maxCatchUpInterventions (ceil 30%, 최소 1)", () => {
  it("노드 수별 상한을 올림·최소 1로 계산한다", () => {
    expect(maxCatchUpInterventions(0)).toBe(0);
    expect(maxCatchUpInterventions(3)).toBe(1); // ceil(0.9)
    expect(maxCatchUpInterventions(4)).toBe(2); // ceil(1.2)
    expect(maxCatchUpInterventions(5)).toBe(2); // ceil(1.5)
    expect(maxCatchUpInterventions(10)).toBe(3); // ceil(3.0)
  });
});

describe("selectCatchUpNodes (정보 분리 게이팅)", () => {
  it("L>=2: 픽서가 지정한 노드만 반환하되 상한을 넘지 않고 유효 이름만 남긴다", () => {
    const mission = missionWithNodes(["진입", "목표", "이탈"]); // cap 1
    const picked = ["목표", "없는노드", "진입"];
    const result = selectCatchUpNodes({ mission, analysisLevel: 2, picked });
    expect(result).toEqual(["목표"]); // 유효 첫 항목, cap=1
  });

  it("L<2: 픽서 지정을 무시하고 결정론적으로 cap개를 선택한다 (정보 분리)", () => {
    const mission = missionWithNodes(["진입", "목표", "이탈", "추가"]); // cap 2
    const a = selectCatchUpNodes({ mission, analysisLevel: 1, picked: ["진입"] });
    const b = selectCatchUpNodes({ mission, analysisLevel: 0, picked: ["이탈"] });
    expect(a.length).toBe(2);
    expect(a).toEqual(b); // missionId 시드 → 동일 입력 동일 출력
    a.forEach((n) => expect(["진입", "목표", "이탈", "추가"]).toContain(n));
  });

  it("명시 노드가 없는 미션은 파생 노드 기준으로 선택된다", () => {
    const mission = createMockMission({ nodes: undefined, nodeCount: 3 });
    const result = selectCatchUpNodes({ mission, analysisLevel: 1, picked: [] });
    expect(result.length).toBe(1); // 파생 3노드 → cap 1
  });
});
