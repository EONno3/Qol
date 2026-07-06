import { describe, expect, it } from "vitest";
import { TAG_MISSION_INTERPRETATIONS } from "../data/tagMissionInterpretations";
import { findInterpretations } from "./tagInterpretationMatch";

describe("tagInterpretationMatch", () => {
  it("tier 맥락이 일치하는 gate_modifier 규칙만 반환한다", () => {
    const rules = findInterpretations(TAG_MISSION_INTERPRETATIONS, "tag_origin_slum_native", {
      tier: "lower",
    });
    expect(rules.some((r) => r.judgmentAxis === "gate_modifier" && r.reading === "positive")).toBe(true);
    expect(
      findInterpretations(TAG_MISSION_INTERPRETATIONS, "tag_origin_slum_native", { tier: "upper" })
        .filter((r) => r.judgmentAxis === "gate_modifier" && r.reading === "positive")
    ).toHaveLength(0);
  });

  it("missionType 배열 맥락에 조커 규칙이 매칭된다", () => {
    const rules = findInterpretations(
      TAG_MISSION_INTERPRETATIONS,
      "tag_operation_high_voltage_grid_tech",
      { missionType: "교섭" }
    );
    expect(rules.some((r) => r.judgmentAxis === "joker_card")).toBe(true);
  });
});
