// ⚠️ C경로 전용 (단위 테스트): 정적 픽스처(퓨즈·엘네온·차단기 등)를 의도적으로 사용.
// 본편(A경로) 보드에는 이 ID들이 노출되지 않는다.
import { describe, expect, it } from "vitest";
import { createInitialState } from "./state";
import { applySettlement, netCredits, getReport } from "./settlement";

describe("resolveReport", () => {
  it("미션과 용병 조합으로 올바른 보고서를 찾는다", () => {
    const report = getReport("mission_lower_fuse_capacitor_01", "merc_breaker_01");
    expect(report?.reportId).toBe(
      "report_mission_lower_fuse_capacitor_01_merc_breaker_01_success",
    );
    expect(report?.resultType).toBe("success");
  });
});

describe("applySettlement - 성공 케이스 (차단기 x 하층 변전소)", () => {
  const report = getReport("mission_lower_fuse_capacitor_01", "merc_breaker_01")!;

  it("순이익이 ledger에 반영된다", () => {
    const next = applySettlement(createInitialState(), report);
    expect(next.ledger).toBe(netCredits(report));
    expect(next.ledger).toBe(16500 - 2200);
  });

  it("절연 부츠 마모 상태가 추가된다", () => {
    const next = applySettlement(createInitialState(), report);
    expect(next.mercStatuses.merc_breaker_01).toContain(
      "status_gear_insulated_boots_worn_light",
    );
  });

  it("더 퓨즈 평판이 상승한다", () => {
    const next = applySettlement(createInitialState(), report);
    expect(next.factionReputation.faction_lower_fuse).toBe(5);
  });

  it("후속 단서가 추가된다", () => {
    const next = applySettlement(createInitialState(), report);
    expect(next.followupHooks).toContain("hook_lower_fuse_power_ledger_01");
  });

  it("장비와 임플란트의 소유주(gearOwner, implantOwner) 정보가 동기화된다", () => {
    const next = applySettlement(createInitialState(), report);
    expect(next.gearOwner["gear_feet_insulated_boots_01"]).toBe("merc_breaker_01");
    expect(next.implantOwner["implant_wrist_torque_joint_01"]).toBe("merc_breaker_01");
  });
});

describe("applySettlement - 부분 성공 케이스 (몰트 x 중층 클럽)", () => {
  const report = getReport("mission_mid_elneon_backdoor_01", "merc_malt_01")!;

  it("수면부족 심화와 우회기 과열이 반영된다", () => {
    const next = applySettlement(createInitialState(), report);
    expect(next.mercStatuses.merc_malt_01).toContain("status_fatigue_sleep_debt_deep");
    expect(next.mercStatuses.merc_malt_01).toContain("status_gear_auth_bypass_overheat");
  });

  it("라 나다는 하락하고 픽서 네트워크는 상승한다", () => {
    const next = applySettlement(createInitialState(), report);
    expect(next.factionReputation.faction_mid_lanada).toBe(-3);
    expect(next.factionReputation.faction_fixer_network).toBe(3);
  });
});

describe("applySettlement - 실패 케이스 (크롬쇼 x 중층 클럽)", () => {
  const report = getReport("mission_mid_elneon_backdoor_01", "merc_chromeshow_01")!;

  it("보상은 없고 손실만 반영된다", () => {
    const next = applySettlement(createInitialState(), report);
    expect(next.ledger).toBe(-6500);
  });

  it("장갑판 균열 악화와 탄환 관통흔이 추가된다", () => {
    const next = applySettlement(createInitialState(), report);
    expect(next.mercStatuses.merc_chromeshow_01).toContain(
      "status_gear_shoulder_armor_crack_worse",
    );
    expect(next.mercStatuses.merc_chromeshow_01).toContain("status_injury_bullet_puncture");
  });

  it("임플란트가 손상 상태로 갱신된다", () => {
    const next = applySettlement(createInitialState(), report);
    expect(next.implantStates.implant_arm_shotgun_01).toBe("damaged");
    expect(next.implantStates.implant_torso_exposed_armor_01).toBe("damaged");
  });

  it("라 나다 평판이 크게 하락한다", () => {
    const next = applySettlement(createInitialState(), report);
    expect(next.factionReputation.faction_mid_lanada).toBe(-6);
  });
});

describe("applySettlement - 중복 정산 방지", () => {
  const report = getReport("mission_lower_fuse_capacitor_01", "merc_breaker_01")!;

  it("같은 보고서를 두 번 정산해도 한 번만 반영된다", () => {
    const once = applySettlement(createInitialState(), report);
    const twice = applySettlement(once, report);
    expect(twice.ledger).toBe(once.ledger);
    expect(twice).toBe(once);
  });
});

describe("applySettlement - playerBehavioralStats 갱신", () => {
  it("성공 정산 후 지원 미션 카운트가 1 오른다", () => {
    const report = getReport("mission_lower_fuse_capacitor_01", "merc_breaker_01")!;
    const next = applySettlement(createInitialState(), report);
    // mission_lower_fuse_capacitor_01의 missionType = "지원"
    expect(next.playerBehavioralStats.missionCountByType["지원"]).toBe(1);
    expect(next.playerBehavioralStats.missionCountByType["잠입"]).toBe(0);
  });

  it("성공 정산 후 Fame +2, Infamy는 변하지 않는다", () => {
    const report = getReport("mission_lower_fuse_capacitor_01", "merc_breaker_01")!;
    const next = applySettlement(createInitialState(), report);
    expect(next.playerBehavioralStats.fame).toBe(2);
    expect(next.playerBehavioralStats.infamy).toBe(0);
  });

  it("성공 정산 후 순이익이 totalCreditsEarned에 반영된다", () => {
    const report = getReport("mission_lower_fuse_capacitor_01", "merc_breaker_01")!;
    const next = applySettlement(createInitialState(), report);
    // netCredits = 16500 - 2200 = 14300
    expect(next.playerBehavioralStats.totalCreditsEarned).toBe(14300);
  });

  it("실패 정산 후 Infamy +2, Fame은 변하지 않는다", () => {
    const report = getReport("mission_mid_elneon_backdoor_01", "merc_chromeshow_01")!;
    const next = applySettlement(createInitialState(), report);
    expect(next.playerBehavioralStats.infamy).toBe(2);
    expect(next.playerBehavioralStats.fame).toBe(0);
  });

  it("실패 정산 시 손실은 totalCreditsEarned에 반영되지 않는다", () => {
    const report = getReport("mission_mid_elneon_backdoor_01", "merc_chromeshow_01")!;
    const next = applySettlement(createInitialState(), report);
    // netCredits = -6500 → max(0, -6500) = 0
    expect(next.playerBehavioralStats.totalCreditsEarned).toBe(0);
  });

  it("부분 성공 정산 후 Fame +1만 오른다", () => {
    const report = getReport("mission_mid_elneon_backdoor_01", "merc_malt_01")!;
    const next = applySettlement(createInitialState(), report);
    expect(next.playerBehavioralStats.fame).toBe(1);
    expect(next.playerBehavioralStats.infamy).toBe(0);
  });
});

