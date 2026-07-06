import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { createInitialState, createFixerProfileFromOrigin } from "./domain/state";
import { GAME_CONFIG } from "./data/config";

/** 테스트용: 기본 픽서 프로필이 설정된 초기 상태 (캐릭터 생성 화면 건너뜀) */
function createStateWithFixer() {
  const base = createInitialState();
  const { profile, initialCredits, factionReputation } = createFixerProfileFromOrigin(
    "상실자",
    "테스트",
    "테스터"
  );
  return {
    ...base,
    fixerProfile: profile,
    ledger: initialCredits,
    factionReputation: { ...base.factionReputation, ...factionReputation },
    hiredMercs: ["merc_breaker_01", "merc_velvet_knife_01", "merc_chromeshow_01"],
    // ⚠️ C경로 전용 (단위/통합 테스트): 게시판 기본값은 AI 생성 미션(비결정적)이므로,
    // 결정론적 검증을 위해 정적 데모 미션을 명시 주입한다.
    // 본편(A경로) 보드에는 mission_gen_* AI 미션만 노출되며, 아래 정적 ID는 나타나지 않는다.
    availableMissions: ["mission_lower_fuse_capacitor_01", "mission_mid_elneon_backdoor_01"],
  };
}


describe("App 1턴 루프", () => {
  it("성공 케이스: 미션 선택 → 매칭 → 슬라이드 출격 → 바로 정산", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.01);
    render(<App initialState={createStateWithFixer()} />);

    fireEvent.click(screen.getByText("더 퓨즈 제3변전소 고압 캐패시터 적출"));
    fireEvent.click(screen.getByText("서명하여 수주"));

    // 수주 탭으로 수동 이동
    fireEvent.click(screen.getByText(/수주 미션/));

    // 카드를 누르면 바로 매칭으로 진입
    fireEvent.click(screen.getByText("더 퓨즈 제3변전소 고압 캐패시터 적출"));

    fireEvent.click(screen.getByRole("button", { name: /차단기/ }));
    expect(screen.getByText("출격 가능", { selector: "div.verdict" })).toBeInTheDocument();

    const slider = screen.getByRole("slider", { name: "밀어서 출격" });
    fireEvent.change(slider, { target: { value: "100" } });

    // 방치형 시간 대기를 스킵하기 위해 디버그 시간 가속 버튼 클릭
    fireEvent.click(screen.getByText("[Debug: 시간 가속]"));

    const reportBtn = await screen.findByRole(
      "button",
      { name: "보고서 열람" },
      { timeout: 3000 },
    );
    fireEvent.click(reportBtn);

    expect(screen.getByText("성공", { selector: ".result-banner" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "정산 처리 및 결과 반영" }));

    await waitFor(() => {
      expect(screen.getByText("정산 완료")).toBeInTheDocument();
    });

    const panel = screen.getByText("스테이션 상태").closest("aside")!;
    // 상실자 초기 잔고 3,000 cr + 미션 순이익 14,300 cr (16,500 - 2,200) = 17,300 cr
    // 상실자 초기 잔고 + 미션 성공 보상 16,500 cr (성공 시 손실 0 cr)
    const expectedCredits = GAME_CONFIG.originCredits.상실자 + 16500;
    expect(within(panel).getByText(`${expectedCredits.toLocaleString()} cr`)).toBeInTheDocument();
    randomSpy.mockRestore();
  });

  it("실패 케이스: 크롬쇼 x 중층 클럽은 출격 불가로 슬라이드가 잠긴다", () => {
    render(<App initialState={createStateWithFixer()} />);

    fireEvent.click(screen.getByText("클럽 엘 네온 VIP 백도어 탈취"));
    fireEvent.click(screen.getByText("서명하여 수주"));

    // 수주 탭으로 수동 이동
    fireEvent.click(screen.getByText(/수주 미션/));

    // 카드를 누르면 바로 매칭으로 진입
    fireEvent.click(screen.getByText("클럽 엘 네온 VIP 백도어 탈취"));

    fireEvent.click(screen.getByRole("button", { name: /크롬쇼/ }));

    expect(screen.getByText("출격 불가", { selector: "div.verdict" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "밀어서 출격" })).toBeDisabled();
  });

  it("정산 이탈 후 재진입 및 최종 종결 시나리오", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.01);
    render(<App initialState={createStateWithFixer()} />);

    // 1. 첫 번째 미션 수주 및 출격
    fireEvent.click(screen.getByText("더 퓨즈 제3변전소 고압 캐패시터 적출"));
    fireEvent.click(screen.getByText("서명하여 수주"));
    fireEvent.click(screen.getByRole("button", { name: /수주 미션/ }));
    fireEvent.click(screen.getByText("더 퓨즈 제3변전소 고압 캐패시터 적출"));

    // 차단기 용병 할당 및 출격
    fireEvent.click(screen.getByRole("button", { name: /차단기/ }));
    const slider = screen.getByRole("slider", { name: "밀어서 출격" });
    fireEvent.change(slider, { target: { value: "100" } });

    // 2. 다른 미션도 하나 미리 수주 (비교 검증용)
    fireEvent.click(screen.getByText("미션 게시판"));
    fireEvent.click(screen.getByText("클럽 엘 네온 VIP 백도어 탈취"));
    fireEvent.click(screen.getByText("서명하여 수주"));

    // 3. 파견 완료 후 정산 진입하기 위해 파견 관제소로 이동
    fireEvent.click(screen.getByRole("button", { name: /파견 관제소/ }));
    fireEvent.click(screen.getByText("[Debug: 시간 가속]"));
    const reportBtn = await screen.findByRole("button", { name: "보고서 열람" });
    fireEvent.click(reportBtn);

    // 정산 버튼 클릭 -> settled 화면 진입
    fireEvent.click(screen.getByRole("button", { name: "정산 처리 및 결과 반영" }));
    await waitFor(() => {
      expect(screen.getByText("정산 완료")).toBeInTheDocument();
    });

    // 4. "다음으로" 버튼을 누르지 않고 수주 미션 창으로 이탈
    fireEvent.click(screen.getByRole("button", { name: /수주 미션/ }));

    // 5. 두 번째 미션 매칭 창으로 들어가서 차단기 용병 상태 검증
    fireEvent.click(screen.getByText("클럽 엘 네온 VIP 백도어 탈취"));
    // 용병 목록 Roster 내에서만 차단기 행을 확보하여 검증
    const roster = screen.getByText("용병 목록").closest(".matching-bottom")!;
    const busyMercRow = within(roster).getByText("차단기").closest(".merc-row")!;
    expect(within(busyMercRow).getByText(/작전 중/)).toBeInTheDocument();

    // 6. 다시 파견 관제소로 이동
    fireEvent.click(screen.getByRole("button", { name: /파견 관제소/ }));

    // 7. 관제소에서 "복귀 확인" 버튼 노출 여부 검증 및 클릭
    const confirmBtn = await screen.findByRole("button", { name: "복귀 확인" });
    expect(confirmBtn).toBeInTheDocument();
    fireEvent.click(confirmBtn);

    // 8. 다시 정산 완료 화면 진입 확인 후 "다음으로" 클릭
    await waitFor(() => {
      expect(screen.getByText("정산 완료")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "다음으로" }));

    // 9. 이제 최종 종결되었으므로 다시 매칭 화면으로 가서 차단기 용병 상태가 풀렸는지 검증
    fireEvent.click(screen.getByRole("button", { name: /수주 미션/ }));
    fireEvent.click(screen.getByText("클럽 엘 네온 VIP 백도어 탈취"));
    const rosterAfter = screen.getByText("용병 목록").closest(".matching-bottom")!;
    const freeMercRow = within(rosterAfter).getByText("차단기").closest(".merc-row")!;
    // "작전 중" 표시가 없어야 함 (해제됨)
    expect(within(freeMercRow).queryByText(/작전 중/)).toBeNull();

    randomSpy.mockRestore();
  });

  it("aiNarratorEnabled + 시간 가속 후 /narrate 응답이 FALLBACK 템플릿으로 덮이지 않는다", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.01);
    const narrateCalls: unknown[] = [];
    const originalFetch = globalThis.fetch;

    vi.stubGlobal(
      "fetch",
      vi.fn((url: RequestInfo | URL, init?: RequestInit) => {
        const href = typeof url === "string" ? url : url.toString();
        if (href.includes("/narrate")) {
          narrateCalls.push(init?.body);
          return Promise.resolve({
            ok: true,
            json: async () => ({ narrative: "AI가 쓴 작전 일지다." }),
          });
        }
        if (href.includes("/world-state")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: "ok" }),
          });
        }
        return originalFetch(url, init);
      }),
    );

    render(<App initialState={{ ...createStateWithFixer(), aiNarratorEnabled: true }} />);

    fireEvent.click(screen.getByText("더 퓨즈 제3변전소 고압 캐패시터 적출"));
    fireEvent.click(screen.getByText("서명하여 수주"));
    fireEvent.click(screen.getByText(/수주 미션/));
    fireEvent.click(screen.getByText("더 퓨즈 제3변전소 고압 캐패시터 적출"));
    fireEvent.click(screen.getByRole("button", { name: /차단기/ }));

    const slider = screen.getByRole("slider", { name: "밀어서 출격" });
    fireEvent.change(slider, { target: { value: "100" } });
    fireEvent.click(screen.getByText("[Debug: 시간 가속]"));

    const reportBtn = await screen.findByRole("button", { name: "보고서 열람" }, { timeout: 3000 });
    fireEvent.click(reportBtn);

    await waitFor(() => {
      expect(narrateCalls.length).toBeGreaterThan(0);
      expect(screen.getByText("AI가 쓴 작전 일지다.")).toBeInTheDocument();
    });

    expect(screen.queryByText(/깔끔하게 정리했다/)).not.toBeInTheDocument();

    vi.unstubAllGlobals();
    randomSpy.mockRestore();
  });
});

