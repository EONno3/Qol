import { describe, expect, it } from "vitest";
import {
  TAG_DEFINITIONS,
  getTagDef,
  resolveTagId,
  allLegacyAliasesResolve,
} from "./tagRegistry";
import { TAG_MISSION_INTERPRETATIONS } from "./tagMissionInterpretations";
import { findInterpretations } from "../domain/tagInterpretationMatch";

describe("tagRegistry", () => {
  it("MVP CSV tag_id 체계의 고유 tagId를 가진다", () => {
    const ids = TAG_DEFINITIONS.map((t) => t.tagId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith("tag_"))).toBe(true);
  });

  it("레거시 한글 별칭을 canonical tagId로 해석한다", () => {
    expect(resolveTagId("고압망_작업")).toBe("tag_operation_high_voltage_grid_tech");
    expect(resolveTagId("슬럼_출신")).toBe("tag_origin_slum_native");
    expect(resolveTagId("tag_origin_slum_native")).toBe("tag_origin_slum_native");
  });

  it("알 수 없는 태그는 null을 반환한다", () => {
    expect(resolveTagId("없는_태그")).toBeNull();
  });

  it("판정에 쓰이던 레거시 별칭이 모두 등록되어 있다", () => {
    expect(allLegacyAliasesResolve()).toBe(true);
  });

  it("TagDef에는 효과 필드가 없고 해석 규칙은 별도 테이블에 있다", () => {
    const slum = getTagDef("tag_origin_slum_native");
    expect(slum?.primaryClass).toBe("origin_affiliation");
    expect(slum).not.toHaveProperty("survivalBonus");

    const interp = findInterpretations(TAG_MISSION_INTERPRETATIONS, "tag_operation_high_voltage_grid_tech", {
      missionType: "지원",
    });
    expect(interp.some((r) => r.judgmentAxis === "joker_card")).toBe(true);
  });
});
