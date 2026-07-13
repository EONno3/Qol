import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MercProfileView } from "./MercProfileView";
import { StationView } from "./StationView";
import { createMockGameState, createMockMercenary, createMockStationState } from "../test/factories";
import { mercenaries } from "../data/seed";

const sampleMerc = createMockMercenary({
  mercId: "profile_merc",
  aliasKo: "프로파일러",
  phase0ProfileKo: "Phase0 기본 이력 텍스트",
  phase1SummaryKo: "Phase1 활동 성향 텍스트",
  phase2SummaryKo: "Phase2 태그 상세 텍스트",
  systemTags: ["tag_test_alpha", "tag_test_beta"],
  stats: { frame: 60, cool: 55, wire: 70, cypher: 45, pulse: 50 },
});

function renderProfile(overrides: Partial<Parameters<typeof MercProfileView>[0]> = {}) {
  return render(
    <MercProfileView
      merc={sampleMerc}
      onBack={vi.fn()}
      {...overrides}
    />
  );
}

describe("MercProfileView 독립 용병 프로필 (T-MERC-PROFILE-FREE-1)", () => {
  it("T-MERC-PROFILE-FREE-1: 분석 레벨과 무관하게 5대 스탯·시스템 태그·Phase 0~2 이력서가 항상 노출된다", () => {
    renderProfile();

    expect(screen.getByTestId("merc-profile-view")).toBeInTheDocument();
    expect(screen.getByTestId("merc-profile-stats")).toBeInTheDocument();
    expect(screen.getByTestId("merc-profile-tags")).toBeInTheDocument();
    expect(screen.getByTestId("merc-profile-gear")).toBeInTheDocument();

    expect(screen.getByText("프레임")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("tag_test_alpha")).toBeInTheDocument();
    expect(screen.getByText("tag_test_beta")).toBeInTheDocument();

    expect(screen.getByText("Phase0 기본 이력 텍스트")).toBeInTheDocument();
    expect(screen.getByText("Phase1 활동 성향 텍스트")).toBeInTheDocument();
    expect(screen.getByText("Phase2 태그 상세 텍스트")).toBeInTheDocument();
  });

  it("T-MERC-PROFILE-FREE-1b: 장착 장비·의체 이름이 전달되면 목록에 표시된다", () => {
    renderProfile({
      equippedGearNames: ["절연 부츠"],
      equippedImplantNames: ["신경 증폭기"],
    });
    expect(screen.getByText("절연 부츠")).toBeInTheDocument();
    expect(screen.getByText("신경 증폭기")).toBeInTheDocument();
  });

  it("T-MERC-PROFILE-FREE-1c: 관계 탭은 Phase E placeholder로 비활성화된다", () => {
    renderProfile();
    const relationTab = screen.getByRole("tab", { name: /관계 \(Phase E 예정\)/ });
    expect(relationTab).toBeDisabled();
  });
});

describe("StationView roster/market 분리 (T-STATION-ROSTER-1)", () => {
  it("T-STATION-ROSTER-1: roster·market 탭이 분리되고 프로필 콜백이 각 탭에서 호출된다", () => {
    const onOpenMercProfile = vi.fn();
    const seedMerc = mercenaries[0];
    const marketMerc = mercenaries.find((m) => m.mercId !== seedMerc.mercId) ?? mercenaries[1];
    const state = createMockGameState({
      ledger: 200000,
      hiredMercs: [seedMerc.mercId],
      stationState: createMockStationState({ level: 1 }),
    });

    render(
      <StationView
        state={state}
        onUpgrade={vi.fn()}
        onUpgradeFacility={vi.fn()}
        onHire={vi.fn()}
        onFire={vi.fn()}
        onReplaceGear={vi.fn()}
        onAssignMissionSlot={vi.fn()}
        onOpenMercProfile={onOpenMercProfile}
      />
    );

    fireEvent.click(screen.getByTestId("station-tab-roster"));
    expect(screen.getByTestId("station-roster-panel")).toBeInTheDocument();
    expect(screen.getByTestId(`roster-card-${seedMerc.mercId}`)).toBeInTheDocument();
    expect(screen.queryByText(marketMerc.aliasKo)).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(`${seedMerc.aliasKo} 프로필`));
    expect(onOpenMercProfile).toHaveBeenCalledWith(seedMerc.mercId);

    fireEvent.click(screen.getByTestId("station-tab-market"));
    expect(screen.getByTestId("station-market-panel")).toBeInTheDocument();
    expect(screen.getByText(marketMerc.aliasKo)).toBeInTheDocument();
    expect(screen.queryByTestId(`roster-card-${seedMerc.mercId}`)).not.toBeInTheDocument();

    const marketProfileBtn = screen.getByRole("button", {
      name: new RegExp(`${marketMerc.aliasKo}.*프로필`),
    });
    fireEvent.click(marketProfileBtn);
    expect(onOpenMercProfile).toHaveBeenCalledWith(marketMerc.mercId);
  });
});
