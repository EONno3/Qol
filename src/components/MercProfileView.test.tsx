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
});

function renderProfile(level: number, overrides: Partial<Parameters<typeof MercProfileView>[0]> = {}) {
  return render(
    <MercProfileView
      merc={sampleMerc}
      mercAnalysisLevel={level}
      onBack={vi.fn()}
      {...overrides}
    />
  );
}

describe("MercProfileView 독립 용병 프로필 (T-DD-MERC-PROFILE)", () => {
  it("T-DD-MERC-PROFILE-1: L0이면 Phase 0만, L1이면 Phase 1 추가, L2이면 Phase 2까지 렌더링된다", () => {
    const { unmount: u0 } = renderProfile(0);
    expect(screen.getByText("Phase0 기본 이력 텍스트")).toBeInTheDocument();
    expect(screen.queryByText("Phase1 활동 성향 텍스트")).not.toBeInTheDocument();
    expect(screen.queryByText("Phase2 태그 상세 텍스트")).not.toBeInTheDocument();
    u0();

    const { unmount: u1 } = renderProfile(1);
    expect(screen.getByText("Phase0 기본 이력 텍스트")).toBeInTheDocument();
    expect(screen.getByText("Phase1 활동 성향 텍스트")).toBeInTheDocument();
    expect(screen.queryByText("Phase2 태그 상세 텍스트")).not.toBeInTheDocument();
    u1();

    renderProfile(2);
    expect(screen.getByText("Phase0 기본 이력 텍스트")).toBeInTheDocument();
    expect(screen.getByText("Phase1 활동 성향 텍스트")).toBeInTheDocument();
    expect(screen.getByText("Phase2 태그 상세 텍스트")).toBeInTheDocument();
  });

  it("T-DD-MERC-PROFILE-1b: 시장(미고용) 용병은 Phase 0만 노출된다", () => {
    renderProfile(0, { isMarketMerc: true });
    expect(screen.getByText("Phase0 기본 이력 텍스트")).toBeInTheDocument();
    expect(screen.queryByText("Phase1 활동 성향 텍스트")).not.toBeInTheDocument();
    expect(screen.queryByText("Phase2 태그 상세 텍스트")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "이력서" })).toBeInTheDocument();
  });

  it("T-DD-MERC-PROFILE-2: StationView 소속·시장 목록에서 프로필 진입 콜백이 호출된다", () => {
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
        onAssignMercSlot={vi.fn()}
        onAssignMissionSlot={vi.fn()}
        onOpenMercProfile={onOpenMercProfile}
      />
    );

    fireEvent.click(screen.getByText("용병 고용소"));

    const hiredProfileBtn = screen.getByRole("button", {
      name: new RegExp(`${seedMerc.aliasKo}.*프로필`),
    });
    fireEvent.click(hiredProfileBtn);
    expect(onOpenMercProfile).toHaveBeenCalledWith(seedMerc.mercId);

    const marketProfileBtn = screen.getByRole("button", {
      name: new RegExp(`${marketMerc.aliasKo}.*프로필`),
    });
    fireEvent.click(marketProfileBtn);
    expect(onOpenMercProfile).toHaveBeenCalledWith(marketMerc.mercId);
  });
});
