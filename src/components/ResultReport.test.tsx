import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResultReport } from "./ResultReport";
import type { ResultReport as Report, Mission, Mercenary } from "../data/types";

const mockMission: Mission = {
  missionId: "test_mission",
  displayNameKo: "테스트 미션",
  tier: "lower",
  missionType: "지원",
  difficultyStars: 2,
  nodeCount: 3,
  rewardCredits: 10000,
  earlyWithdrawalPenalty: 3000,
  phase0BriefingKo: "테스트 브리핑",
  phase1SummaryKo: "테스트 분석",
  phase2SummaryKo: "테스트 조건",
  successSummaryKo: "성공 로그",
  failureSummaryKo: "실패 로그",
};

const mockMerc: Mercenary = {
  mercId: "test_merc",
  displayNameKo: "홍길동",
  aliasKo: "의적",
  originKo: "하층",
  contractTermsKo: "계약 조건",
  systemTags: [],
  stats: { frame: 50, cool: 50, wire: 50, cypher: 50, pulse: 50 },
  maxHp: 100,
  visibilityLevel: "low",
  commandCost: 3,
  phase0ProfileKo: "프로필",
  phase1SummaryKo: "분석",
  phase2SummaryKo: "태그",
};

const baseReport: Report = {
  reportId: "test_report",
  missionId: "test_mission",
  mercId: "test_merc",
  resultType: "success",
  rewardCredits: 10000,
  extraRewardCredits: 0,
  lostCredits: 0,
  summaryLogKo: "기본 정산 완료 로그",
  fulfilledConditionsKo: "조건 충족",
  missingConditionsKo: "없음",
  statusChanges: [],
  gearUpdates: [],
  implantUpdates: [],
  reputationChanges: [],
  followupHooks: [],
};

describe("ResultReport AI 브리핑 렌더링", () => {
  it("case 1: aiNarrativeKo 값이 존재할 때 AI 브리핑 문장을 렌더링한다", () => {
    const report: Report = {
      ...baseReport,
      aiNarrativeKo: "AI가 생성한 차가운 픽서 어조의 정산 브리핑이다.",
    };

    render(
      <ResultReport
        report={report}
        mission={mockMission}
        merc={mockMerc}
        onSettle={vi.fn()}
      />
    );

    // AI 내러티브가 화면에 나타나는가?
    expect(screen.getByText("AI가 생성한 차가운 픽서 어조의 정산 브리핑이다.")).toBeInTheDocument();
    // 기본 summaryLogKo는 나타나지 않아야 함
    expect(screen.queryByText("기본 정산 완료 로그")).not.toBeInTheDocument();
  });

  it("case 2: aiNarrativeKo가 'GENERATING'일 때 로딩 안내 문구를 노출한다", () => {
    const report: Report = {
      ...baseReport,
      aiNarrativeKo: "GENERATING",
    };

    render(
      <ResultReport
        report={report}
        mission={mockMission}
        merc={mockMerc}
        onSettle={vi.fn()}
      />
    );

    // 로딩 문구가 나타나는가?
    expect(screen.getByText("작전 현장 데이터 스트림 판독 중...")).toBeInTheDocument();
    // 기본 summaryLogKo는 나타나지 않아야 함
    expect(screen.queryByText("기본 정산 완료 로그")).not.toBeInTheDocument();
  });

  it("case 3: aiNarrativeKo가 'FALLBACK'이거나 없을 때 기계식 summaryLogKo 대신 1인칭 일지를 노출한다", () => {
    const { rerender } = render(
      <ResultReport
        report={baseReport}
        mission={mockMission}
        merc={mockMerc}
        onSettle={vi.fn()}
      />
    );

    // aiNarrativeKo가 undefined일 때: 기계식 정산 로그가 일지 자리에 그대로 노출되면 안 된다
    expect(screen.queryByText("기본 정산 완료 로그")).not.toBeInTheDocument();
    // 1인칭 일지 고유 문구(용병 서명 포함)가 노출되어야 한다
    expect(screen.getByText(/깔끔하게 정리했다[\s\S]*— 의적/)).toBeInTheDocument();

    // aiNarrativeKo가 'FALLBACK'일 때도 동일하게 1인칭 일지로 대체된다
    const fallbackReport: Report = {
      ...baseReport,
      aiNarrativeKo: "FALLBACK",
    };

    rerender(
      <ResultReport
        report={fallbackReport}
        mission={mockMission}
        merc={mockMerc}
        onSettle={vi.fn()}
      />
    );

    expect(screen.queryByText("기본 정산 완료 로그")).not.toBeInTheDocument();
    expect(screen.getByText(/깔끔하게 정리했다[\s\S]*— 의적/)).toBeInTheDocument();
  });

  it("case 4: 첫 로딩 시에는 기계식 상세 nodeLogKo 리스트가 숨겨져 있어야 한다", () => {
    const report: Report = {
      ...baseReport,
      nodeLogKo: ["노드 1단계 성공 팩트", "노드 2단계 실패 팩트"],
    };

    render(
      <ResultReport
        report={report}
        mission={mockMission}
        merc={mockMerc}
        onSettle={vi.fn()}
      />
    );

    // 노드 팩트 로그 텍스트가 화면에 노출되지 않아야 함
    expect(screen.queryByText("노드 1단계 성공 팩트")).not.toBeInTheDocument();
  });

  it("case 5: 상세 로그 판독 버튼 클릭 시 접혀 있던 nodeLogKo 리스트가 노출되어야 한다", () => {
    const report: Report = {
      ...baseReport,
      nodeLogKo: ["노드 1단계 성공 팩트", "노드 2단계 실패 팩트"],
    };

    render(
      <ResultReport
        report={report}
        mission={mockMission}
        merc={mockMerc}
        onSettle={vi.fn()}
      />
    );

    const toggleBtn = screen.getByRole("button", { name: /상세 시스템 로그 판독/ });
    expect(toggleBtn).toBeInTheDocument();

    // 버튼 클릭 -> 펼쳐짐
    fireEvent.click(toggleBtn);
    expect(screen.getByText("노드 1단계 성공 팩트")).toBeInTheDocument();
    expect(screen.getByText("노드 2단계 실패 팩트")).toBeInTheDocument();

    // 버튼 다시 클릭 -> 닫힘
    fireEvent.click(screen.getByRole("button", { name: /상세 시스템 로그 닫기/ }));
    expect(screen.queryByText("노드 1단계 성공 팩트")).not.toBeInTheDocument();
  });
});

describe("ResultReport 캐치업 UI (T-DC-UI-NARR)", () => {
  it("T-DC-UI-NARR-1: catchUpActive=true이면 관제소 로그 라벨을 표시한다", () => {
    const report: Report = {
      ...baseReport,
      catchUpActive: true,
      aiNarrativeKo: "관제소에서 드론 피드로 모니터링한 기록이다.",
    };

    render(
      <ResultReport report={report} mission={mockMission} merc={mockMerc} onSettle={vi.fn()} />
    );

    expect(screen.getByText("현장 개입 기록 (관제소 로그)")).toBeInTheDocument();
    expect(screen.queryByText("현장 보고 (용병 일지)")).not.toBeInTheDocument();
    expect(screen.getByText(/캐치업 · 관제소 기록/)).toBeInTheDocument();
  });

  it("T-DC-UI-NARR-2: catchUpActive 미설정이면 용병 일지 라벨을 유지한다", () => {
    render(
      <ResultReport report={baseReport} mission={mockMission} merc={mockMerc} onSettle={vi.fn()} />
    );

    expect(screen.getByText("현장 보고 (용병 일지)")).toBeInTheDocument();
    expect(screen.queryByText("현장 개입 기록 (관제소 로그)")).not.toBeInTheDocument();
  });
});
