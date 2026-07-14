import { useEffect, useMemo, useState } from "react";
import { getMercenary, getMission } from "./data/lookups";
import { mercenaries as allMercs, allMissions, gearDefs, implantDefs } from "./data/seed";
import type { ResultReport as Report } from "./data/types";
import { acceptMission, checkCompletedDispatches, startDispatch } from "./domain/mission";
import { completeCatchUpDispatch, startCatchUpDispatch } from "./domain/catchUpDispatch";
import {
  advanceCatchUpNode,
  finalizeCatchUpRun,
  peekCatchUpNode,
  type CatchUpNodeAction,
} from "./domain/catchUpRun";
import { applySettlement, resolveReport } from "./domain/settlement";
import { createInitialState, type GameState } from "./domain/state";
import { weightMissions } from "./domain/world";
import { clearGame, loadGame, saveGame } from "./domain/storage";
import { advanceTurnWithMeta } from "./domain/turn";
import { formatExpiredMissionNotice } from "./domain/missionDecay";
import {
  assignMissionAnalysisSlot,
  createEmptyAnalysisSlots,
  getAnalysisBaseLevels,
  getEffectiveAnalysisLevels,
  migrateAnalysisSlots,
} from "./domain/analysisSlot";
import { GAME_CONFIG } from "./data/config";
import { buildNarratorWorldState } from "./domain/worldStateExport";
import { buildNarratePayload } from "./domain/narratePayload";
import {
  findPendingNarrateDispatch,
  resetFallbackReportsForNarrateRetry,
} from "./domain/narrateQueue";
import { isReportNarrativeReady } from "./domain/reportNarrativeStatus";
import { AcceptedMissions } from "./components/AcceptedMissions";
import { CharacterCreation } from "./components/CharacterCreation";
import { DeskView } from "./components/DeskView";
import { MercMatching } from "./components/MercMatching";
import type { DeployMode } from "./components/DroneCatchUpView";
import { CatchUpRunView } from "./components/CatchUpRunView";
import { MissionBoard } from "./components/MissionBoard";
import { MissionDetail } from "./components/MissionDetail";
import { ResultReport } from "./components/ResultReport";
import { Sidebar } from "./components/Sidebar";
import { StatePanel } from "./components/StatePanel";
import { StationView } from "./components/StationView";
import { MercProfileView } from "./components/MercProfileView";
import { upgradeStation, hireMercenary, fireMercenary, replaceDestroyedGear, upgradeFacilityTier } from "./domain/station";
import { createDefaultStation, migrateLegacyStationState } from "./domain/state";
import { TitleScreen } from "./components/TitleScreen";


type Screen =
  | "title"
  | "board"
  | "detail"
  | "accepted"
  | "matching"
  | "desk" // AssignRun 대체
  | "catchup" // D-C-2 인런 캐치업
  | "station"
  | "mercProfile"
  | "report"
  | "settled";

export function App({ initialState, bypassTitle = false }: { initialState?: GameState; bypassTitle?: boolean } = {}) {
  const [state, setState] = useState<GameState>(() => {
    let loadedState = initialState ?? loadGame() ?? createInitialState();
    // 호환성 패치: 픽서는 있는데 스테이션 정보가 누락된 구버전 세이브인 경우 기본값 할당
    if (loadedState.fixerProfile && !loadedState.stationState) {
      loadedState = {
        ...loadedState,
        stationState: createDefaultStation(loadedState.fixerProfile.fixerId)
      };
    }
    // 호환성 패치 2: hiredMercs가 없는 구버전 세이브인 경우 기본 용병 할당
    if (!loadedState.hiredMercs) {
      loadedState = {
        ...loadedState,
        hiredMercs: ["merc_breaker_01", "merc_velvet_knife_01"]
      };
    }
    // 호환성 패치 3: 생성 중("GENERATING") 상태로 고착된 AI 리포트 복구
    if (loadedState.generatedReports) {
      const fixedReports = { ...loadedState.generatedReports };
      let changed = false;
      for (const [key, report] of Object.entries(fixedReports)) {
        if (report.aiNarrativeKo === "GENERATING") {
          fixedReports[key] = { ...report, aiNarrativeKo: undefined };
          changed = true;
        }
      }
      if (changed) {
        loadedState = {
          ...loadedState,
          generatedReports: fixedReports
        };
      }
    }
    // 호환성 패치 4: aiNarratorEnabled가 없는 구버전 세이브 복구
    if (loadedState.aiNarratorEnabled === undefined) {
      loadedState = {
        ...loadedState,
        aiNarratorEnabled: GAME_CONFIG.ai.aiNarratorEnabled
      };
    }
    // 호환성 패치 5: analysisSlots가 없는 구버전 세이브 복구
    if (!loadedState.analysisSlots) {
      loadedState = {
        ...loadedState,
        analysisSlots: createEmptyAnalysisSlots(),
      };
    } else {
      loadedState = {
        ...loadedState,
        analysisSlots: migrateAnalysisSlots(loadedState.analysisSlots),
      };
    }
    // 호환성 패치 6: stationState 구세이브 마이그레이션 (facility + predictAnalysisLv)
    if (loadedState.stationState) {
      loadedState = {
        ...loadedState,
        stationState: migrateLegacyStationState(loadedState.stationState),
      };
    }
    // 호환성 패치 7: missionDecayTimers 누락 구세이브 보강
    if (!loadedState.missionDecayTimers) {
      loadedState = {
        ...loadedState,
        missionDecayTimers: {},
      };
    }
    if (loadedState.activeCatchUpRun === undefined) {
      loadedState = { ...loadedState, activeCatchUpRun: null };
    }
    return loadedState;
  });

  const testGlobal = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  const isTestEnv =
    !!testGlobal.process &&
    (testGlobal.process.env?.NODE_ENV === "test" || typeof vi !== "undefined");
  const shouldBypass = bypassTitle || isTestEnv;
  const [screen, setScreen] = useState<Screen>(() => shouldBypass ? "board" : "title");

  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [selectedMercId, setSelectedMercId] = useState<string | null>(null);
  const [profileMercId, setProfileMercId] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [turnNotice, setTurnNotice] = useState<string | null>(null);
  const [reportReadyToast, setReportReadyToast] = useState<string | null>(null);

  function notifyReportReady(missionId: string, catchUpActive?: boolean) {
    const mission = getMission(missionId);
    const name = mission?.displayNameKo ?? "작전";
    setReportReadyToast(
      catchUpActive
        ? `관제 로그 동기화 완료 — 「${name}」 관제소에서 열람 가능`
        : `보고서 컴파일 완료 — 「${name}」 관제소에서 열람 가능`,
    );
  }

  const hasSave = useMemo(() => {
    try {
      const data = localStorage.getItem("mvp_game_save");
      if (!data) return false;
      const parsed = JSON.parse(data);
      return !!parsed.fixerProfile;
    } catch {
      return false;
    }
  }, [state.fixerProfile]);

  function handleNewGame() {
    clearGame();
    setState(createInitialState());
    setScreen("board");
  }

  function handleLoadGame() {
    setScreen("board");
  }

  function handleResetData() {
    clearGame();
    setState(createInitialState());
    setScreen("title");
  }

  // 1초마다 파견 완료 체크
  useEffect(() => {
    const timer = setInterval(() => {
      setState((s) => checkCompletedDispatches(s, Date.now()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 백그라운드 AI 브리핑 미리 생성 처리
  useEffect(() => {
    const applyOfflineFallback = () => {
      const targetDispatch = findPendingNarrateDispatch(state);
      if (!targetDispatch) return;
      setState((s) => {
        const r = s.generatedReports[targetDispatch.dispatchId];
        if (!r || r.aiNarrativeKo !== undefined) return s;
        return {
          ...s,
          generatedReports: {
            ...s.generatedReports,
            [targetDispatch.dispatchId]: {
              ...r,
              aiNarrativeKo: "FALLBACK",
            },
          },
        };
      });
      notifyReportReady(
        targetDispatch.missionId,
        state.generatedReports[targetDispatch.dispatchId]?.catchUpActive,
      );
    };

    if (state.aiNarratorEnabled === false || typeof fetch === "undefined") {
      applyOfflineFallback();
      return;
    }

    const targetDispatch = findPendingNarrateDispatch(state);
    if (!targetDispatch) return;

    const dispatchId = targetDispatch.dispatchId;
    const report = state.generatedReports[dispatchId];
    const mission = getMission(targetDispatch.missionId);
    const merc = getMercenary(targetDispatch.mercId);

    if (!report || !mission || !merc) return;

    // 1. 중복 요청 방지를 위해 즉시 "GENERATING"으로 마킹
    setState((s) => {
      const r = s.generatedReports[dispatchId];
      if (!r || r.aiNarrativeKo !== undefined) return s; // 동시성 방어
      return {
        ...s,
        generatedReports: {
          ...s.generatedReports,
          [dispatchId]: {
            ...r,
            aiNarrativeKo: "GENERATING",
          },
        },
      };
    });

    // 2. 비동기 백그라운드 fetch 호출
    // 배치 생성 중 lock 대기 + 추론 시간 합산해 최대 90초 허용
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    fetch("http://localhost:5001/narrate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify(
        buildNarratePayload(report, mission, merc, { gearDefs, implantDefs })
      ),
    })
      .then((res) => {
        if (!res.ok) throw new Error("API Server response error");
        return res.json();
      })
      .then((data) => {
        if (data.narrative) {
          setState((s) => {
            const r = s.generatedReports[dispatchId];
            if (!r) return s;
            return {
              ...s,
              generatedReports: {
                ...s.generatedReports,
                [dispatchId]: {
                  ...r,
                  aiNarrativeKo: data.narrative,
                },
              },
            };
          });
          notifyReportReady(targetDispatch.missionId, report.catchUpActive);
        } else {
          throw new Error("Empty narrative");
        }
      })
      .catch((err) => {
        console.warn("[AI Narrator API Error, using fallback]:", err);
        setState((s) => {
          const r = s.generatedReports[dispatchId];
          if (!r) return s;
          return {
            ...s,
            generatedReports: {
              ...s.generatedReports,
              [dispatchId]: {
                ...r,
                aiNarrativeKo: "FALLBACK",
              },
            },
          };
        });
        notifyReportReady(targetDispatch.missionId, report.catchUpActive);
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    // GENERATING 마킹·파견 완료로 effect가 재실행돼도 in-flight fetch는 끊지 않는다.
    // (cleanup abort가 즉시 FALLBACK을 유발하던 G-1b 블로커 수정)
    return () => {
      clearTimeout(timeoutId);
    };
  }, [state.activeDispatches, state.completedDispatches, state.generatedReports, state.aiNarratorEnabled]);

  // 보고서 준비 토스트 자동 해제
  useEffect(() => {
    if (!reportReadyToast) return;
    const t = setTimeout(() => setReportReadyToast(null), 8000);
    return () => clearTimeout(t);
  }, [reportReadyToast]);

  // 상태 변경 시 자동 저장
  useEffect(() => {
    saveGame(state);
  }, [state]);

  // AI 생성기가 참조할 runtime world_state를 서버에 동기화
  useEffect(() => {
    if (typeof fetch === "undefined" || !state.fixerProfile || !state.stationState) return;
    const worldState = buildNarratorWorldState(state);
    fetch("http://localhost:5001/world-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(worldState),
    }).catch((err) => {
      // 게임 플레이를 막지 않기 위해 동기화 실패는 경고만 남긴다.
      console.warn("[WorldState Sync] failed:", err);
    });
  }, [state.turnCount, state.fixerProfile, state.stationState, state.playerBehavioralStats, state.factionReputation]);


  const availableMissions = useMemo(
    () => weightMissions(
      allMissions.filter((m) => state.availableMissions.includes(m.missionId)),
      state
    ),
    [state.availableMissions, state.fixerProfile, state.stationState],
  );

  const missionDecayContext = useMemo(
    () => ({
      missionDecayTimers: state.missionDecayTimers,
      analysisMissionSlotId: state.analysisSlots.mission.targetId,
    }),
    [state.missionDecayTimers, state.analysisSlots.mission.targetId],
  );

  const acceptedMissionList = useMemo(
    () =>
      state.acceptedMissions
        .map((id) => allMissions.find((m) => m.missionId === id)!)
        .filter(Boolean),
    [state.acceptedMissions],
  );

  const selectedMission = selectedMissionId ? getMission(selectedMissionId) : undefined;
  const selectedMerc = selectedMercId ? getMercenary(selectedMercId) : undefined;

  function handleSelectMission(missionId: string) {
    setSelectedMissionId(missionId);
    setScreen("detail");
  }

  function handleAccept(missionId: string) {
    setState((s) => acceptMission(s, missionId));
    setScreen("board");
  }

  function handleOpenMatching(missionId: string) {
    setSelectedMissionId(missionId);
    setSelectedMercId(null);
    setScreen("matching");
  }

  function handleDeploy(mercId: string, mode: DeployMode) {
    if (!selectedMissionId) return;

    const loadout = {
      gearOwner: state.gearOwner,
      implantOwner: state.implantOwner,
      gearDefs,
      implantDefs,
    };

    if (mode === "catchUp") {
      const predictLevel = getEffectiveAnalysisLevels(
        state,
        mercId,
        selectedMissionId,
      ).predict;
      let nextState = startCatchUpDispatch(state, selectedMissionId, mercId, predictLevel);
      const run = nextState.activeCatchUpRun;
      setSelectedMercId(mercId);

      if (run?.status === "finished") {
        const mission = getMission(run.missionId);
        const merc = getMercenary(run.mercId);
        if (mission && merc) {
          const { report } = finalizeCatchUpRun(run, mission, merc, loadout);
          nextState = completeCatchUpDispatch(nextState, report);
          setState(nextState);
          setSelectedMissionId(run.missionId);
          setReport(null);
          setScreen("desk");
          return;
        }
      }

      setState(nextState);
      setScreen("catchup");
      return;
    }

    setState((s) => startDispatch(s, selectedMissionId, mercId));
    setScreen("desk");
  }

  function handleCatchUpNodeAction(action: CatchUpNodeAction) {
    const run = state.activeCatchUpRun;
    if (!run) return;
    const mission = getMission(run.missionId);
    const merc = getMercenary(run.mercId);
    if (!mission || !merc) return;

    const loadout = {
      gearOwner: state.gearOwner,
      implantOwner: state.implantOwner,
      gearDefs,
      implantDefs,
    };

    const nextRun = advanceCatchUpNode(run, mission, merc, action, loadout);

    if (nextRun.status === "finished") {
      const { report } = finalizeCatchUpRun(nextRun, mission, merc, loadout);
      setState((s) => completeCatchUpDispatch({ ...s, activeCatchUpRun: nextRun }, report));
      setSelectedMissionId(run.missionId);
      setSelectedMercId(run.mercId);
      setReport(null);
      setScreen("desk");
    } else {
      setState((s) => ({ ...s, activeCatchUpRun: nextRun }));
    }
  }

  function handleTimeSkip() {
    setState(s => {
      // 모든 activeDispatches의 endTime을 과거로 만듦
      const updatedDispatches = s.activeDispatches.map(d => ({ ...d, endTime: 0 }));
      return checkCompletedDispatches({ ...s, activeDispatches: updatedDispatches }, Date.now());
    });
  }

  function handleSettle(mercShareRate: number) {
    if (report && selectedMerc) {
      setState((s) =>
        applySettlement(s, report, {
          mercShareRate,
          mercExpectedShareRate: selectedMerc.expectedShareRate ?? 0.35,
        }),
      );
    }
    setScreen("settled");
  }

  function handleFinishReport() {
    setState((s) => {
      const targetDispatch = s.completedDispatches.find(
        (d) => d.missionId === selectedMissionId && d.mercId === selectedMercId
      );
      if (!targetDispatch) return s;
      return {
        ...s,
        completedDispatches: s.completedDispatches.filter(
          (d) => d.dispatchId !== targetDispatch.dispatchId
        ),
      };
    });
    setSelectedMissionId(null);
    setSelectedMercId(null);
    setReport(null);
    setScreen(state.acceptedMissions.length > 0 ? "accepted" : "board");
  }

  function handleAdvanceTurn() {
    const result = advanceTurnWithMeta(state);
    setState(result.state);
    setTurnNotice(formatExpiredMissionNotice(result.expiredMissionIds));
    setSelectedMissionId(null);
    setSelectedMercId(null);
    setReport(null);
    setScreen("board");
  }

  function handleUpgradeStation() {
    setState((s) => upgradeStation(s));
  }

  function handleResetGame() {
    if (window.confirm("정말로 모든 세이브 데이터를 삭제하고 처음부터 다시 시작하시겠습니까?")) {
      clearGame();
      setState(createInitialState());
      setScreen("title");
    }
  }

  const sidebarActive =
    screen === "board" || screen === "detail"
      ? "board"
      : screen === "accepted" || screen === "matching"
        ? "accepted"
        : screen === "station" || screen === "mercProfile"
          ? "station"
          : screen === "desk"
            ? "desk"
            : "other";

  // 시작 화면 렌더링
  if (screen === "title") {
    return (
      <TitleScreen
        hasSave={hasSave}
        onNewGame={handleNewGame}
        onLoadGame={handleLoadGame}
        onResetData={handleResetData}
      />
    );
  }

  // 픽서 프로필이 없으면 캐릭터 생성 화면
  if (state.fixerProfile === null) {
    return (
      <CharacterCreation
        onComplete={(result) => {
          setState((s) => ({
            ...s,
            fixerProfile: result.profile,
            ledger: result.initialCredits,
            factionReputation: {
              ...s.factionReputation,
              ...result.factionReputation,
            },
            stationState: createDefaultStation(result.profile.fixerId, result.stationCategory),
          }));
          setScreen("station"); // 역 추가: 캐릭터 생성 후 스테이션 화면으로 먼저 이동
        }}
      />
    );
  }

  const analysisBaseLevels = getAnalysisBaseLevels(state);

  function resolveEquippedNames(mercId: string) {
    const gearNames = Object.entries(state.gearOwner)
      .filter(([, ownerId]) => ownerId === mercId)
      .map(([gearId]) => gearDefs.find((g) => g.gearId === gearId)?.displayNameKo ?? gearId);
    const implantNames = Object.entries(state.implantOwner)
      .filter(([, ownerId]) => ownerId === mercId)
      .map(([implantId]) => implantDefs.find((i) => i.implantId === implantId)?.displayNameKo ?? implantId);
    return { gearNames, implantNames };
  }

  return (
    <div className="layout">
        <Sidebar
          active={sidebarActive}
          acceptedCount={state.acceptedMissions.length}
          activeCount={state.activeDispatches.length}
          completedCount={state.completedDispatches.length}
          stationPredictBase={analysisBaseLevels.predict}
          stationMissionBase={analysisBaseLevels.mission}
          missionSlotTargetId={state.analysisSlots.mission.targetId}
          missionSlotProgress={state.analysisSlots.mission.progress}
          onGoBoard={() => setScreen("board")}
          onGoAccepted={() => setScreen("accepted")}
          onGoDesk={() => setScreen("desk")}
          onGoStation={() => setScreen("station")}
          onResetGame={handleResetGame}
        />

      <main className="main">
        {reportReadyToast && (
          <div
            className="report-ready-toast"
            data-testid="report-ready-toast"
            role="status"
            style={{
              marginBottom: "1rem",
              padding: "0.75rem 1rem",
              border: "1px solid var(--cyan)",
              background: "var(--panel-2)",
              color: "var(--cyan)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <span>{reportReadyToast}</span>
            <span style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" className="primary" onClick={() => setScreen("desk")}>
                관제소로
              </button>
              <button type="button" className="ghost" onClick={() => setReportReadyToast(null)}>
                닫기
              </button>
            </span>
          </div>
        )}
        {turnNotice && (
          <div
            className="turn-notice"
            role="status"
            style={{
              marginBottom: "1rem",
              padding: "0.75rem 1rem",
              border: "1px solid var(--amber)",
              background: "var(--panel-2)",
              color: "var(--amber)",
            }}
          >
            {turnNotice}
            <button
              type="button"
              className="secondary"
              style={{ marginLeft: "1rem" }}
              onClick={() => setTurnNotice(null)}
            >
              닫기
            </button>
          </div>
        )}
        {screen === "board" && (
          <MissionBoard
            missions={availableMissions}
            decayContext={missionDecayContext}
            onSelect={handleSelectMission}
          />
        )}

        {screen === "station" && (
          <StationView
            state={state}
            onUpgrade={handleUpgradeStation}
            onUpgradeFacility={() => setState((s) => upgradeFacilityTier(s))}
            onHire={(mercId) => setState((s) => hireMercenary(s, mercId))}
            onFire={(mercId) => setState((s) => fireMercenary(s, mercId))}
            onReplaceGear={(mercId) => setState((s) => replaceDestroyedGear(s, mercId))}
            onAssignMissionSlot={(missionId) =>
              setState((s) => assignMissionAnalysisSlot(s, missionId))
            }
            onOpenMercProfile={(mercId) => {
              setProfileMercId(mercId);
              setScreen("mercProfile");
            }}
          />
        )}

        {screen === "mercProfile" && profileMercId && (() => {
          const profileMerc = allMercs.find((m) => m.mercId === profileMercId);
          if (!profileMerc) return null;
          const { gearNames, implantNames } = resolveEquippedNames(profileMercId);
          return (
            <MercProfileView
              merc={profileMerc}
              equippedGearNames={gearNames}
              equippedImplantNames={implantNames}
              onBack={() => {
                setProfileMercId(null);
                setScreen("station");
              }}
            />
          );
        })()}

        {screen === "detail" && selectedMission && (
          <MissionDetail
            mission={selectedMission}
            analysisLevel={
              getEffectiveAnalysisLevels(state, null, selectedMission.missionId).mission
            }
            onAccept={handleAccept}
            onBack={() => setScreen("board")}
          />
        )}

        {screen === "accepted" && (
          <AcceptedMissions missions={acceptedMissionList} onSelect={handleOpenMatching} />
        )}

        {screen === "matching" && selectedMission && (
          <MercMatching
            mission={selectedMission}
            mercenaries={allMercs.filter((m) => state.hiredMercs?.includes(m.mercId))}
            predictAnalysisLevel={
              getEffectiveAnalysisLevels(state, selectedMercId, selectedMission.missionId).predict
            }
            selectedMercId={selectedMercId}
            currentCommandPoints={state.currentCommandPoints}
            busyMercIds={[
              ...state.activeDispatches,
              ...state.completedDispatches,
              ...(state.activeCatchUpRun ? [{ mercId: state.activeCatchUpRun.mercId }] : []),
            ].map((d) => d.mercId)}
            loadout={{
              gearOwner: state.gearOwner,
              implantOwner: state.implantOwner,
              gearDefs,
              implantDefs,
            }}
            onSelectMerc={setSelectedMercId}
            onDeploy={handleDeploy}
            onBack={() => setScreen("accepted")}
          />
        )}

        {screen === "catchup" && state.activeCatchUpRun && (
          <CatchUpRunView
            run={state.activeCatchUpRun}
            currentNode={peekCatchUpNode(state.activeCatchUpRun)}
            onAction={handleCatchUpNodeAction}
          />
        )}

        {screen === "desk" && (
          <DeskView
            activeDispatches={state.activeDispatches}
            completedDispatches={state.completedDispatches}
            settledReports={state.settledReports}
            generatedReports={state.generatedReports}
            onViewReport={(dispatchId, missionId, mercId) => {
              const r = resolveReport(state, dispatchId);
              if (!isReportNarrativeReady(r)) return;
              setReport(r ?? null);
              setSelectedMissionId(missionId);
              setSelectedMercId(mercId);
              setReportReadyToast(null);
              if (r && state.settledReports.includes(r.reportId)) {
                setScreen("settled");
              } else {
                setScreen("report");
              }
            }}
          />
        )}

        {screen === "report" && selectedMission && selectedMerc && report && (
          <ResultReport
            report={report}
            mission={selectedMission}
            merc={selectedMerc}
            onSettle={handleSettle}
          />
        )}

        {screen === "report" && !report && (
          <section>
            <h2>결과 보고서</h2>
            <p className="muted">이 조합의 결과 데이터가 없다. (MVP 검증 조합만 지원)</p>
            <button className="primary" onClick={() => setScreen("accepted")}>
              수주 목록으로
            </button>
          </section>
        )}

        {screen === "settled" && (
          <section>
            <h2>정산 완료</h2>
            <p className="muted">결과가 스테이션 상태에 반영되었다. 우측 패널을 확인한다.</p>
            <button className="primary" onClick={handleFinishReport}>
              다음으로
            </button>
          </section>
        )}
      </main>

      <StatePanel 
        state={state} 
        onTimeSkip={handleTimeSkip} 
        onNextTurn={handleAdvanceTurn} 
        canAdvanceTurn={
          state.activeDispatches.length === 0 &&
          state.completedDispatches.length === 0 &&
          !state.activeCatchUpRun
        }
        onToggleAiNarrator={(enabled) =>
          setState((s) =>
            enabled
              ? {
                  ...s,
                  aiNarratorEnabled: true,
                  generatedReports: resetFallbackReportsForNarrateRetry(s),
                }
              : { ...s, aiNarratorEnabled: false }
          )
        }
      />
    </div>
  );
}
