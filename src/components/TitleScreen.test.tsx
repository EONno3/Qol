import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { TitleScreen } from "./TitleScreen";

describe("TitleScreen 컴포넌트 단위 테스트", () => {
  const mockNewGame = vi.fn();
  const mockLoadGame = vi.fn();
  const mockResetData = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    // 글로벌 fetch 모킹 준비
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("case 1: 첫 진입 시 AI 상태 진단 로딩 텍스트가 표시된다", () => {
    // 무한 대기 응답 모킹
    (globalThis.fetch as any).mockImplementation(() => new Promise(() => {}));

    render(
      <TitleScreen
        hasSave={false}
        onNewGame={mockNewGame}
        onLoadGame={mockLoadGame}
        onResetData={mockResetData}
      />
    );

    expect(screen.getByText("진단 중...")).toBeInTheDocument();
    expect(screen.getByText("네트워크 넷러너 브레인 링크 동기화 시도 중...")).toBeInTheDocument();
  });

  it("case 2: AI 서버 헬스체크 실패 시 OFFLINE이 되고 버튼이 비활성화된다", async () => {
    // 헬스체크 실패 모킹
    (globalThis.fetch as any).mockRejectedValue(new Error("Connection refused"));

    render(
      <TitleScreen
        hasSave={true}
        onNewGame={mockNewGame}
        onLoadGame={mockLoadGame}
        onResetData={mockResetData}
      />
    );

    // 오프라인 상태 렌더링 대기
    await waitFor(() => {
      expect(screen.getByText("OFFLINE 🔴")).toBeInTheDocument();
    });

    expect(screen.getByText(/AI 서버\(포트 5001\)에 연결할 수 없습니다/)).toBeInTheDocument();

    // 새 게임 및 불러오기 버튼 비활성화 상태 확인
    const newGameBtn = screen.getByRole("button", { name: /새 게임 시작/ });
    const loadGameBtn = screen.getByRole("button", { name: /이전 세이브 로드/ });
    expect(newGameBtn).toBeDisabled();
    expect(loadGameBtn).toBeDisabled();
  });

  it("case 3: AI 서버 헬스체크 성공 시 ONLINE이 되고 새 게임이 활성화된다", async () => {
    // 헬스체크 성공 모킹
    (globalThis.fetch as any).mockResolvedValue({
      json: async () => ({ status: "ok" }),
    });

    render(
      <TitleScreen
        hasSave={false}
        onNewGame={mockNewGame}
        onLoadGame={mockLoadGame}
        onResetData={mockResetData}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("ONLINE 🟢")).toBeInTheDocument();
    });

    // 새 게임 활성화, 불러오기는 저장 데이터가 없어 비활성화 검증
    const newGameBtn = screen.getByRole("button", { name: /새 게임 시작/ });
    const loadGameBtn = screen.getByRole("button", { name: /이전 세이브 로드/ });
    expect(newGameBtn).toBeEnabled();
    expect(loadGameBtn).toBeDisabled();

    // 새 게임 클릭 이벤트 전이 확인
    fireEvent.click(newGameBtn);
    expect(mockNewGame).toHaveBeenCalledTimes(1);
  });

  it("case 4: AI 온라인이고 저장 데이터가 존재할 때 불러오기 버튼이 활성화된다", async () => {
    (globalThis.fetch as any).mockResolvedValue({
      json: async () => ({ status: "ok" }),
    });

    render(
      <TitleScreen
        hasSave={true}
        onNewGame={mockNewGame}
        onLoadGame={mockLoadGame}
        onResetData={mockResetData}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("ONLINE 🟢")).toBeInTheDocument();
    });

    const loadGameBtn = screen.getByRole("button", { name: /이전 세이브 로드/ });
    expect(loadGameBtn).toBeEnabled();

    // 불러오기 클릭 이벤트 전이 확인
    fireEvent.click(loadGameBtn);
    expect(mockLoadGame).toHaveBeenCalledTimes(1);
  });

  it("case 5: 저장 데이터 삭제 버튼 클릭 시 확인 창 승인 시 콜백이 작동한다", async () => {
    (globalThis.fetch as any).mockResolvedValue({
      json: async () => ({ status: "ok" }),
    });
    // window.confirm 모킹
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <TitleScreen
        hasSave={true}
        onNewGame={mockNewGame}
        onLoadGame={mockLoadGame}
        onResetData={mockResetData}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("ONLINE 🟢")).toBeInTheDocument();
    });

    const resetBtn = screen.getByRole("button", { name: /데이터 영구 삭제/ });
    expect(resetBtn).toBeInTheDocument();

    fireEvent.click(resetBtn);
    expect(confirmSpy).toHaveBeenCalledWith("정말로 모든 세이브 파일을 완전 초기화하겠습니까?");
    expect(mockResetData).toHaveBeenCalledTimes(1);

    confirmSpy.mockRestore();
  });
});
