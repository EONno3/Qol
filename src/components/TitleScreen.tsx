import { useEffect, useState } from "react";

interface Props {
  hasSave: boolean;
  onNewGame: () => void;
  onLoadGame: () => void;
  onResetData: () => void;
}

export function TitleScreen({ hasSave, onNewGame, onLoadGame, onResetData }: Props) {
  const [aiStatus, setAiStatus] = useState<"checking" | "online" | "offline">("checking");

  const checkHealth = async () => {
    setAiStatus("checking");
    try {
      // 3초 타임아웃 적용하여 빠른 연결 진단
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const res = await fetch("http://localhost:5001/health", {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (data.status === "ok") {
        setAiStatus("online");
      } else {
        setAiStatus("offline");
      }
    } catch (e) {
      setAiStatus("offline");
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="title-screen" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "radial-gradient(circle, #0e1e24 0%, #03080a 100%)",
      color: "var(--text)",
      fontFamily: "'Courier New', Courier, monospace",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* 백그라운드 홀로그램 느낌 장식 */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)",
        backgroundSize: "100% 4px",
        zIndex: 1,
        pointerEvents: "none"
      }} />

      <div style={{
        zIndex: 2,
        textAlign: "center",
        maxWidth: "600px",
        padding: "40px",
        background: "rgba(3, 15, 20, 0.8)",
        border: "2px solid var(--cyan)",
        boxShadow: "0 0 20px rgba(0, 242, 254, 0.2), inset 0 0 15px rgba(0, 242, 254, 0.1)",
        borderRadius: "8px"
      }}>
        {/* 네온 타이틀 로고 */}
        <h1 style={{
          fontSize: "3rem",
          fontWeight: 900,
          margin: "0 0 8px 0",
          color: "var(--cyan)",
          textShadow: "0 0 10px rgba(0, 242, 254, 0.6), 0 0 20px rgba(0, 242, 254, 0.3)",
          letterSpacing: "4px"
        }}>
          NEON PROTOCOL
        </h1>
        <p style={{
          fontSize: "1rem",
          color: "var(--muted)",
          margin: "0 0 40px 0",
          letterSpacing: "2px",
          textTransform: "uppercase"
        }}>
          AI-Driven Fixer Management Simulation
        </p>

        {/* AI 서버 연결 상태 진단기 */}
        <div style={{
          padding: "20px",
          marginBottom: "40px",
          border: `1px solid ${aiStatus === "online" ? "var(--green)" : aiStatus === "offline" ? "var(--danger)" : "var(--cyan)"}`,
          background: "rgba(4, 32, 36, 0.4)",
          borderRadius: "4px",
          textAlign: "left"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: "bold", color: "var(--muted)" }}>[SYSTEM BRAIN DIAGNOSIS]</span>
            {aiStatus === "checking" && (
              <span style={{ color: "var(--cyan)" }}>진단 중...</span>
            )}
            {aiStatus === "online" && (
              <span style={{ color: "var(--green)", fontWeight: "bold", textShadow: "0 0 5px rgba(57, 255, 20, 0.5)" }}>ONLINE 🟢</span>
            )}
            {aiStatus === "offline" && (
              <span style={{ color: "var(--danger)", fontWeight: "bold", textShadow: "0 0 5px rgba(255, 60, 60, 0.5)" }}>OFFLINE 🔴</span>
            )}
          </div>
          
          <div style={{ marginTop: "12px", fontSize: "0.85rem", lineHeight: "1.4" }}>
            {aiStatus === "checking" && "네트워크 넷러너 브레인 링크 동기화 시도 중..."}
            {aiStatus === "online" && "로컬 AI 서버(Gemma-4 GGUF)에 성공적으로 연동되었습니다. 모든 AI 스토리텔링 및 브리핑 기능이 정상 동작합니다."}
            {aiStatus === "offline" && (
              <span style={{ color: "var(--danger)" }}>
                AI 서버(포트 5001)에 연결할 수 없습니다. 런처(run_mvp.bat)를 통해 AI 서버가 정상 구동되고 모델 탑재가 완료되었는지 확인하십시오.
              </span>
            )}
          </div>

          {aiStatus === "offline" && (
            <button 
              className="ghost" 
              onClick={checkHealth}
              style={{
                marginTop: "12px",
                width: "100%",
                padding: "8px",
                fontSize: "0.8rem",
                color: "var(--cyan)",
                border: "1px solid var(--cyan)",
                background: "transparent",
                cursor: "pointer"
              }}
            >
              재검사 (RE-DIAGNOSE)
            </button>
          )}
        </div>

        {/* 메뉴 버튼 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            className="primary"
            onClick={onNewGame}
            disabled={aiStatus !== "online"}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              letterSpacing: "2px",
              cursor: aiStatus === "online" ? "pointer" : "not-allowed",
              opacity: aiStatus === "online" ? 1 : 0.4
            }}
          >
            새 게임 시작 (NEW GAME)
          </button>

          <button
            className="secondary"
            onClick={onLoadGame}
            disabled={aiStatus !== "online" || !hasSave}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              letterSpacing: "2px",
              cursor: (aiStatus === "online" && hasSave) ? "pointer" : "not-allowed",
              opacity: (aiStatus === "online" && hasSave) ? 1 : 0.4
            }}
          >
            이전 세이브 로드 (LOAD GAME)
          </button>

          {hasSave && (
            <button
              onClick={() => {
                if (window.confirm("정말로 모든 세이브 파일을 완전 초기화하겠습니까?")) {
                  onResetData();
                }
              }}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "0.85rem",
                letterSpacing: "1px",
                color: "var(--danger)",
                background: "transparent",
                border: "1px solid var(--danger)",
                cursor: "pointer",
                marginTop: "20px"
              }}
            >
              데이터 영구 삭제 (CLEAN SAVE)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
