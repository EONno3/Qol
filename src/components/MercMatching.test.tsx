import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MercMatching } from "./MercMatching";
import { createMockMercenary, createMockMission } from "../test/factories";
import { gearDefs, implantDefs, mercenaries, qaMissions } from "../data/seed";
import type { DispatchLoadoutContext } from "../domain/gearStatBonus";

const mockMission = createMockMission({ missionId: "mock_mission_no_match" });
const mockMerc = createMockMercenary({ mercId: "mock_merc_no_match", aliasKo: "테스터" });

const breakerLoadout: DispatchLoadoutContext = {
  gearOwner: { gear_feet_insulated_boots_01: "merc_breaker_01" },
  implantOwner: {},
  gearDefs,
  implantDefs,
};

function renderMatching(overrides: Partial<Parameters<typeof MercMatching>[0]> = {}) {
  const defaults = {
    mission: mockMission,
    mercenaries: [mockMerc],
    mercAnalysisLevel: 2,
    missionAnalysisLevel: 2,
    selectedMercId: null as string | null,
    currentCommandPoints: 10,
    busyMercIds: [] as string[],
    onSelectMerc: vi.fn(),
    onDeploy: vi.fn(),
    onBack: vi.fn(),
  };
  return render(<MercMatching {...defaults} {...overrides} />);
}

describe("MercMatching 컴포넌트 단위 테스트", () => {
  it("case 1: 컴포넌트가 마운트되면 '용병 매칭' 헤더가 보인다", () => {
    renderMatching();
    expect(screen.getByText("용병 매칭")).toBeInTheDocument();
  });

  it("case 2: 선택된 용병이 없으면 용병 배치 안내 문구가 노출된다", () => {
    renderMatching({ selectedMercId: null });
    expect(
      screen.getByText("용병을 슬롯에 배치하면 매칭 분석이 표시된다.")
    ).toBeInTheDocument();
  });

  it("case 3: 용병 행(row)을 클릭하면 onSelectMerc 콜백이 해당 mercId로 호출된다", () => {
    const onSelectMerc = vi.fn();
    renderMatching({ onSelectMerc });
    fireEvent.click(screen.getByText("테스터"));
    expect(onSelectMerc).toHaveBeenCalledWith("mock_merc_no_match");
  });

  it("case 4: busyMercIds에 포함된 용병은 '🛑 작전 중'으로 표시되고 클릭이 무효화된다", () => {
    const onSelectMerc = vi.fn();
    renderMatching({
      busyMercIds: ["mock_merc_no_match"],
      onSelectMerc,
    });
    expect(screen.getByText("🛑 작전 중")).toBeInTheDocument();
    fireEvent.click(screen.getByText("테스터"));
    expect(onSelectMerc).not.toHaveBeenCalled();
  });

  it("case 5: 선택된 용병이 있지만 매칭 데이터가 없는 조합은 '매칭 데이터 없음' 안내가 나온다", () => {
    renderMatching({ selectedMercId: "mock_merc_no_match" });
    expect(
      screen.getByText("이 조합의 매칭 데이터가 아직 없다. (MVP 검증 조합만 지원)")
    ).toBeInTheDocument();
  });

  it("case 6: 지휘력이 부족할 때 경고 문구가 노출된다", () => {
    // mockMerc.commandCost = 3, 현재 지휘력 = 1 → 부족
    renderMatching({
      selectedMercId: "mock_merc_no_match",
      currentCommandPoints: 1,
    });
    // 지휘력 부족 경고는 슬롯에 용병이 있고 코스트 > 현재 OP일 때 렌더링됨
    expect(screen.getByText(/지휘력이 부족합니다/)).toBeInTheDocument();
  });

  it("T-S1-U1/UI: loadout 전달 시 effective stat(장비 보정)이 표시된다", () => {
    const breaker = mercenaries.find((m) => m.mercId === "merc_breaker_01")!;
    const mission = createMockMission({
      missionId: "dyn_ui_mission_01",
      difficultyStars: 2,
      mechanics: { visibility_limit: 80, primary_stat: "wire", secondary_stat: "frame" },
    });

    renderMatching({
      mission,
      mercenaries: [breaker],
      selectedMercId: "merc_breaker_01",
      loadout: breakerLoadout,
      mercAnalysisLevel: 2,
      missionAnalysisLevel: 2,
    });

    expect(screen.getByText(/와이어 54/)).toBeInTheDocument();
    expect(screen.getByText(/\+6/)).toBeInTheDocument();
  });
});

describe("MercMatching B-2 진입 게이트 UI (T-B2-UI)", () => {
  const blockingMission = createMockMission({
    missionId: "mock_mission_no_match",
    missionType: "잠입",
    entryGate: {
      requirements: [{ kind: "stat", statKey: "wire", minValue: 99 }],
      failureMode: "block",
    },
  });

  it("T-B2-UI-1: 진입 조건 미달(blocked)이면 붉은 '진입 조건 미달' 배너가 노출된다", () => {
    renderMatching({
      mission: blockingMission,
      selectedMercId: "mock_merc_no_match",
    });
    expect(screen.getByText(/진입 조건 미달/)).toBeInTheDocument();
  });

  it("T-B2-UI-2: blocked 상태에서는 출격 슬라이더가 물리적으로 비활성화(disabled)된다", () => {
    renderMatching({
      mission: blockingMission,
      selectedMercId: "mock_merc_no_match",
    });
    const slider = screen.getByLabelText("밀어서 출격") as HTMLInputElement;
    expect(slider).toBeDisabled();
  });

  it("T-B2-UI-3: entryGate가 없는 미션에서는 '진입 조건 미달' 배너가 뜨지 않는다", () => {
    const noGateMission = createMockMission({ missionId: "mock_mission_no_match" });
    renderMatching({
      mission: noGateMission,
      selectedMercId: "mock_merc_no_match",
    });
    expect(screen.queryByText(/진입 조건 미달/)).not.toBeInTheDocument();
  });
});

describe("MercMatching B-3 가시성 경고 UI (T-B3-UI)", () => {
  it("T-B3-UI-1: 잠입 미션에서 가시성 한계 초과(exposed)면 치명적 가시성 경고가 노출된다", () => {
    // mockMerc.visibilityLevel = 'low'(40), visibility_limit 20 → overshoot 20 → exposed
    const stealthMission = createMockMission({
      missionId: "mock_mission_no_match",
      missionType: "잠입",
      mechanics: { visibility_limit: 20, primary_stat: "cypher", secondary_stat: "cool" },
    });
    renderMatching({
      mission: stealthMission,
      selectedMercId: "mock_merc_no_match",
    });
    expect(screen.getByText(/치명적 가시성 경고/)).toBeInTheDocument();
  });

  it("T-B3-UI-2: 비은밀 미션(지원)에서는 가시성 경고가 뜨지 않는다", () => {
    const supportMission = createMockMission({
      missionId: "mock_mission_no_match",
      missionType: "지원",
      mechanics: { visibility_limit: 20, primary_stat: "cypher", secondary_stat: "cool" },
    });
    renderMatching({
      mission: supportMission,
      selectedMercId: "mock_merc_no_match",
    });
    expect(screen.queryByText(/치명적 가시성 경고/)).not.toBeInTheDocument();
  });
});

describe("MercMatching B-2 force_risk UI (T-B2-UI-FR)", () => {
  it("T-B2-UI-FR-1: force_risk면 차단 배너가 아닌 '진입 조건 불안정' 경고 배너가 노출된다", () => {
    const forceMission = createMockMission({
      missionId: "mock_mission_no_match",
      missionType: "잠입",
      entryGate: {
        requirements: [{ kind: "stat", statKey: "wire", minValue: 99 }],
        failureMode: "force_risk",
        forcedRiskNodeNameKo: "돌발 순찰조 조우",
      },
    });
    renderMatching({
      mission: forceMission,
      selectedMercId: "mock_merc_no_match",
    });
    expect(screen.getByText(/진입 조건 불안정/)).toBeInTheDocument();
    // force_risk는 차단(blocked)이 아니므로 '진입 조건 미달' 배너는 뜨지 않는다.
    expect(screen.queryByText(/진입 조건 미달/)).not.toBeInTheDocument();
  });

  it("T-B2-UI-FR-2: force_risk에서 출격 슬라이더는 잠기지 않는다 (실 매칭 조합)", () => {
    const breaker = mercenaries.find((m) => m.mercId === "merc_breaker_01")!;
    const frMission = qaMissions.find(
      (m) => m.missionId === "mission_qa_entrygate_forcerisk_01"
    )!;
    renderMatching({
      mission: frMission,
      mercenaries: [breaker],
      selectedMercId: "merc_breaker_01",
      loadout: breakerLoadout,
      currentCommandPoints: 10,
    });
    expect(screen.getByText(/진입 조건 불안정/)).toBeInTheDocument();
    const slider = screen.getByLabelText("밀어서 출격") as HTMLInputElement;
    expect(slider).not.toBeDisabled();
  });
});

// B-4 밸런스 노출: 예상 생존율 변동 패널. 유효 레벨 L=min(용병,미션) 분석 레벨에 따라
// 노출 깊이를 차등한다(L0 비공개 / L1 구역 기본만 / L2 태그 보정+최종까지).
describe("MercMatching B-4 생존율 노출 UI (T-B4-UI)", () => {
  const upperMission = createMockMission({
    missionId: "mock_mission_no_match",
    tier: "upper",
    missionType: "기업",
  });
  // 상층 슬럼 출신 용병: 부정 survival_modifier(-30%) 보유 → Lv2에서 태그 보정 노출 대상
  const slumMerc = createMockMercenary({
    mercId: "merc_b4_slum",
    aliasKo: "슬럼출신",
    systemTags: ["tag_origin_slum_native"],
  });

  function renderB4(merc: number, mission: number) {
    return renderMatching({
      mission: upperMission,
      mercenaries: [slumMerc],
      selectedMercId: "merc_b4_slum",
      mercAnalysisLevel: merc,
      missionAnalysisLevel: mission,
    });
  }

  it("T-B4-UI-0: L0(미분석)이면 수치 없이 '생존율 예측 불가'만 노출된다", () => {
    renderB4(0, 0);
    expect(screen.getByText(/생존율 예측 불가/)).toBeInTheDocument();
    expect(screen.queryByText(/기본 생존율/)).not.toBeInTheDocument();
    expect(screen.queryByText(/최종 예상 생존율/)).not.toBeInTheDocument();
    expect(screen.queryByText(/상층 슬럼 출신 약점/)).not.toBeInTheDocument();
  });

  it("T-B4-UI-1: L1(기본 분석)이면 구역 기본 생존율까지만 공개(태그 보정 숨김)", () => {
    renderB4(1, 1);
    expect(screen.getByText(/기본 생존율 20%/)).toBeInTheDocument();
    // Lv1에서는 용병 태그 보정과 최종 합산치를 공개하지 않는다.
    expect(screen.queryByText(/상층 슬럼 출신 약점/)).not.toBeInTheDocument();
    expect(screen.queryByText(/최종 예상 생존율/)).not.toBeInTheDocument();
  });

  it("T-B4-UI-2: L2(심층 분석)이면 구역 기본 + 태그 보정(-30%) + 최종 생존율까지 투명 공개", () => {
    renderB4(2, 2);
    expect(screen.getByText(/기본 생존율 20%/)).toBeInTheDocument();
    expect(screen.getByText(/상층 슬럼 출신 약점/)).toBeInTheDocument();
    expect(screen.getByText(/-30%/)).toBeInTheDocument();
    expect(screen.getByText(/최종 예상 생존율/)).toBeInTheDocument();
  });

  it("T-B4-UI-3: 미션 분석만 높고 용병 분석이 낮으면(min=1) 태그 보정은 잠긴다(정보 분리)", () => {
    // mercAnalysisLevel 0, missionAnalysisLevel 2 → L=min=0 → 예측 불가
    renderB4(0, 2);
    expect(screen.getByText(/생존율 예측 불가/)).toBeInTheDocument();
    expect(screen.queryByText(/상층 슬럼 출신 약점/)).not.toBeInTheDocument();
  });
});

describe("MercMatching 캐치업 현장 개입 UI (T-DC-UI)", () => {
  const catchMerc = createMockMercenary({ mercId: "catch_merc", aliasKo: "개입러", commandCost: 3 });

  function renderCatchUp(level: number, overrides = {}) {
    return renderMatching({
      mission: createMockMission({ missionId: "catch_mission" }),
      mercenaries: [catchMerc],
      selectedMercId: "catch_merc",
      mercAnalysisLevel: level,
      missionAnalysisLevel: level,
      currentCommandPoints: 10,
      ...overrides,
    });
  }

  it("T-DC-UI-1: 용병이 선택되면 활성화된 캐치업 토글이 노출된다(준비중 더미 아님)", () => {
    renderCatchUp(2);
    expect(screen.getByRole("checkbox", { name: /캐치업/ })).toBeEnabled();
    expect(screen.queryByText(/준비 중/)).not.toBeInTheDocument();
  });

  it("T-DC-UI-2: 토글 ON 시 지휘력 코스트가 ×1.5(올림)로 표시된다", () => {
    renderCatchUp(2);
    fireEvent.click(screen.getByRole("checkbox", { name: /캐치업/ }));
    // 기본 코스트 3 → ceil(3*1.5)=5
    expect(screen.getByText(/×1\.5/)).toBeInTheDocument();
    expect(screen.getByText(/5 OP/)).toBeInTheDocument();
  });

  it("T-DC-UI-3: L>=2에서 토글 ON 시 노드 직접 선택 UI가 노출된다", () => {
    renderCatchUp(2);
    fireEvent.click(screen.getByRole("checkbox", { name: /캐치업/ }));
    expect(screen.getByText(/개입할 노드 선택/)).toBeInTheDocument();
    expect(screen.getByText("작전 구역 진입")).toBeInTheDocument();
  });

  it("T-DC-UI-4: L<2에서 토글 ON 시 노드 지정 불가·무작위 개입 안내가 노출된다(정보 분리)", () => {
    renderCatchUp(1);
    fireEvent.click(screen.getByRole("checkbox", { name: /캐치업/ }));
    expect(screen.getByText(/무작위/)).toBeInTheDocument();
    expect(screen.queryByText(/개입할 노드 선택/)).not.toBeInTheDocument();
  });
});
