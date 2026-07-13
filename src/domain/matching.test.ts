// ⚠️ C경로 전용 (단위 테스트): 정적 픽스처(퓨즈·엘네온·차단기 등)를 의도적으로 사용.
// 본편(A경로) 보드에는 이 ID들이 노출되지 않는다.
import { describe, expect, it } from "vitest";
import { canDeploy, effectiveAnalysisLevel, getMatch, visibleMatchInfo } from "./matching";

describe("getMatch", () => {
  it("차단기 x 하층 변전소는 clear/success", () => {
    const match = getMatch("mission_lower_fuse_capacitor_01", "merc_breaker_01");
    expect(match?.deploymentVerdict).toBe("clear");
    expect(match?.expectedResultType).toBe("success");
  });

  it("몰트 x 중층 클럽은 clear/partial_success", () => {
    const match = getMatch("mission_mid_elneon_backdoor_01", "merc_malt_01");
    expect(match?.deploymentVerdict).toBe("clear");
    expect(match?.expectedResultType).toBe("partial_success");
  });

  it("크롬쇼 x 중층 클럽은 locked/failure", () => {
    const match = getMatch("mission_mid_elneon_backdoor_01", "merc_chromeshow_01");
    expect(match?.deploymentVerdict).toBe("locked");
    expect(match?.expectedResultType).toBe("failure");
  });
});

describe("canDeploy", () => {
  it("locked 판정은 출격 불가", () => {
    const match = getMatch("mission_mid_elneon_backdoor_01", "merc_chromeshow_01")!;
    expect(canDeploy(match)).toBe(false);
  });

  it("clear 판정은 출격 가능", () => {
    const match = getMatch("mission_lower_fuse_capacitor_01", "merc_breaker_01")!;
    expect(canDeploy(match)).toBe(true);
  });
});

describe("effectiveAnalysisLevel (Option B: predict 단일 축)", () => {
  it("predictAnalysisLv를 그대로 게이트 레벨로 쓴다", () => {
    expect(effectiveAnalysisLevel(2)).toBe(2);
    expect(effectiveAnalysisLevel(0)).toBe(0);
    expect(effectiveAnalysisLevel(1)).toBe(1);
  });
});

describe("visibleMatchInfo", () => {
  const match = getMatch("mission_lower_fuse_capacitor_01", "merc_breaker_01")!;

  it("Lv.0에서는 신호와 손익이 숨겨진다", () => {
    const info = visibleMatchInfo(match, 0);
    expect(info.signals).toHaveLength(0);
    expect(info.successOutlook).toBeNull();
  });

  it("Lv.1에서는 신호가 보이지만 손익은 숨겨진다", () => {
    const info = visibleMatchInfo(match, 1);
    expect(info.signals.length).toBeGreaterThan(0);
    expect(info.successOutlook).toBeNull();
  });

  it("Lv.2에서는 신호와 손익이 모두 보인다", () => {
    const info = visibleMatchInfo(match, 2);
    expect(info.signals.length).toBeGreaterThan(0);
    expect(info.successOutlook).toBe("high");
    expect(info.lossOutlook).toBe("low");
  });
});
