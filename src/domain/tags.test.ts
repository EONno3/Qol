import { describe, expect, it } from "vitest";
import type { Mercenary } from "../data/types";
import {
  mercHasTag,
  getSurvivalTagBonusPercent,
  mercTriggersJokerForMissionType,
} from "./tags";

const baseMerc: Mercenary = {
  mercId: "test",
  displayNameKo: "T",
  aliasKo: "T",
  originKo: "하층",
  contractTermsKo: "-",
  stats: { frame: 50, cool: 50, wire: 50, cypher: 50, pulse: 50 },
  maxHp: 100,
  visibilityLevel: "low",
  commandCost: 3,
  phase0ProfileKo: "",
  phase1SummaryKo: "",
  phase2SummaryKo: "",
  systemTags: [],
};

describe("tags domain helpers", () => {
  it("canonical tagId와 레거시 별칭 모두 mercHasTag로 인식한다", () => {
    const merc: Mercenary = {
      ...baseMerc,
      systemTags: ["tag_origin_slum_native"],
    };
    expect(mercHasTag(merc, "tag_origin_slum_native")).toBe(true);
    expect(mercHasTag(merc, "슬럼_출신")).toBe(true);

    const legacyMerc: Mercenary = { ...baseMerc, systemTags: ["슬럼_출신"] };
    expect(mercHasTag(legacyMerc, "tag_origin_slum_native")).toBe(true);
  });

  it("getSurvivalTagBonusPercent는 tier별 보정을 합산한다", () => {
    const merc: Mercenary = { ...baseMerc, systemTags: ["tag_origin_slum_native"] };
    expect(getSurvivalTagBonusPercent("lower", merc)).toBe(15);
    expect(getSurvivalTagBonusPercent("upper", merc)).toBe(-30);
  });

  it("mercTriggersJokerForMissionType은 미션 타입별 조커 태그를 판별한다", () => {
    const merc: Mercenary = {
      ...baseMerc,
      systemTags: ["tag_operation_high_voltage_grid_tech"],
    };
    expect(mercTriggersJokerForMissionType(merc, "지원")).toBe(true);
    expect(mercTriggersJokerForMissionType(merc, "잠입")).toBe(false);
  });
});
