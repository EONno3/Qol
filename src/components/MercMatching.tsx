import { useState } from "react";
import type { CatchUpConfig, Mercenary, Mission, MissionConditionTarget, StatKey } from "../data/types";
import type { DispatchLoadoutContext } from "../domain/gearStatBonus";
import { getEffectiveStatForNode } from "../domain/gearStatBonus";
import { canDeploy, visibleMatchInfo } from "../domain/matching";
import { getMatch } from "../data/lookups";
import { calculateGearDestructionProb } from "../domain/engine";
import { evaluateEntryGate } from "../domain/entryGate";
import { evaluateVisibilityExposure } from "../domain/visibilityPenalty";
import { getSurvivalBreakdown } from "../domain/survival";
import {
  catchUpSelectableNodeNames,
  maxCatchUpInterventions,
  selectCatchUpNodes,
} from "../domain/catchUp";
import { GAME_CONFIG } from "../data/config";
import { visibilityName } from "../data/lookups";
import { DroneCatchUpView } from "./DroneCatchUpView";
import { MercResumeFolder } from "./MercResumeFolder";
import { outlookLabel, verdictClass, verdictLabel } from "./labels";
import { SlideToDeploy } from "./SlideToDeploy";

interface Props {
  mission: Mission;
  mercenaries: Mercenary[];
  predictAnalysisLevel: number;
  selectedMercId: string | null;
  currentCommandPoints: number;
  busyMercIds: string[];
  loadout?: DispatchLoadoutContext;
  onSelectMerc: (mercId: string) => void;
  onDeploy: (mercId: string, catchUp?: CatchUpConfig) => void;
  onBack: () => void;
}

const signalLabel: Record<string, string> = {
  advantage: "🟢 유리",
  disadvantage: "🔴 불리",
  conditional: "🟡 조건부",
  unknown: "⚪ 미확인",
};

const STAT_LABEL: Record<StatKey, string> = {
  frame: "프레임",
  cool: "쿨",
  wire: "와이어",
  cypher: "사이퍼",
  pulse: "펄스",
};

function formatEffectiveStat(
  mercId: string,
  statKey: StatKey,
  base: number,
  loadout?: DispatchLoadoutContext
): string {
  const effective = getEffectiveStatForNode(mercId, base, statKey, loadout);
  if (!loadout || effective === base) return `${STAT_LABEL[statKey]} ${base}`;
  return `${STAT_LABEL[statKey]} ${effective} (${base}+${effective - base})`;
}

/** 미충족 진입 조건을 한국어 사유 문자열로 변환한다. */
function formatUnmetRequirement(req: MissionConditionTarget): string {
  switch (req.kind) {
    case "stat":
      return `${STAT_LABEL[req.statKey]} ${req.minValue} 이상 필요`;
    case "tag":
      return `필수 자질 태그 미보유 (${req.tagId})`;
    case "gear":
      return `필수 장비 미장착 (${req.gearId})`;
    case "implant":
      return `필수 의체 미장착 (${req.implantId})`;
    case "visibility":
      return `가시성 ${req.maxLevel} 이하 필요`;
    default:
      return "필수 조건 미달";
  }
}

export function MercMatching({
  mission,
  mercenaries,
  predictAnalysisLevel,
  selectedMercId,
  currentCommandPoints,
  busyMercIds,
  loadout,
  onSelectMerc,
  onDeploy,
  onBack,
}: Props) {
  const analysisLevel = predictAnalysisLevel;
  const slotMerc = selectedMercId
    ? mercenaries.find((m) => m.mercId === selectedMercId) ?? null
    : null;

  const [catchUpOn, setCatchUpOn] = useState(false);
  const [pickedNodes, setPickedNodes] = useState<string[]>([]);
  const canPickNodes = analysisLevel >= 2;
  const selectableNodeNames = catchUpSelectableNodeNames(mission);
  const interventionCap = maxCatchUpInterventions(selectableNodeNames.length);
  const catchUpModeActive = catchUpOn && !!slotMerc;
  const catchUpNodeNames = catchUpModeActive
    ? selectCatchUpNodes({ mission, analysisLevel, picked: pickedNodes })
    : [];
  const catchUpConfig: CatchUpConfig | undefined =
    catchUpModeActive && catchUpNodeNames.length > 0
      ? { interventionNodeNamesKo: catchUpNodeNames }
      : undefined;
  const baseCommandCost = slotMerc?.commandCost ?? 0;
  const effectiveCommandCost = catchUpModeActive
    ? Math.ceil(baseCommandCost * GAME_CONFIG.catchUp.costMultiplier)
    : baseCommandCost;
  const insufficientCommandPoints = slotMerc
    ? currentCommandPoints < effectiveCommandCost
    : false;
  const catchUpNeedsNodes = catchUpModeActive && catchUpNodeNames.length === 0;

  function toggleNodePick(name: string) {
    setPickedNodes((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= interventionCap) return prev;
      return [...prev, name];
    });
  }
  const match = selectedMercId ? getMatch(mission.missionId, selectedMercId, loadout) : undefined;
  const info = match ? visibleMatchInfo(match, analysisLevel) : null;
  const deployable = match ? canDeploy(match) : false;

  const gearDestructionProb =
    slotMerc && analysisLevel >= 2
      ? calculateGearDestructionProb(mission, slotMerc, loadout)
      : null;

  const entryGateEval = slotMerc
    ? evaluateEntryGate(mission.entryGate, slotMerc, loadout)
    : null;
  const entryBlocked = entryGateEval?.outcome === "blocked";
  const entryForcedRisk = entryGateEval?.outcome === "forced_risk";

  const visibilityExposure = slotMerc
    ? evaluateVisibilityExposure(mission, slotMerc, loadout)
    : null;

  const survival = slotMerc ? getSurvivalBreakdown(mission.tier, slotMerc) : null;

  return (
    <section className="matching">
      <div className="section-head">
        <h2>용병 매칭</h2>
        <button className="ghost" onClick={onBack}>
          돌아가기
        </button>
      </div>
      <p className="muted">
        대상 미션: {mission.displayNameKo} · 노출 적용 Lv.{analysisLevel}
      </p>

      <div className="matching-top">
        <div className="merc-slot">
          <div className="slot-label">용병 슬롯</div>
          {slotMerc ? (
            <div className="slot-filled">
              <div className="slot-alias">{slotMerc.aliasKo}</div>
              <div className="muted">{slotMerc.displayNameKo}</div>
              <div className="slot-stats">
                {formatEffectiveStat(slotMerc.mercId, "frame", slotMerc.stats.frame, loadout)} ·{" "}
                {formatEffectiveStat(slotMerc.mercId, "cool", slotMerc.stats.cool, loadout)} ·{" "}
                {formatEffectiveStat(slotMerc.mercId, "wire", slotMerc.stats.wire, loadout)} ·{" "}
                {formatEffectiveStat(slotMerc.mercId, "cypher", slotMerc.stats.cypher, loadout)} ·{" "}
                {formatEffectiveStat(slotMerc.mercId, "pulse", slotMerc.stats.pulse, loadout)}
              </div>
              <div className="muted">
                가시성 {visibilityName(slotMerc.visibilityLevel)} · 지휘 코스트:{" "}
                <span style={{ color: "var(--cyan)" }}>{slotMerc.commandCost} OP</span>
              </div>
            </div>
          ) : (
            <div className="slot-empty">아래 목록에서 용병을 배치하라</div>
          )}
        </div>

        <div className="match-analysis">
          {!match ? (
            <p className="muted">
              {selectedMercId
                ? "이 조합의 매칭 데이터가 아직 없다. (MVP 검증 조합만 지원)"
                : "용병을 슬롯에 배치하면 매칭 분석이 표시된다."}
            </p>
          ) : (
            <>
              <div className={`verdict ${verdictClass(match.deploymentVerdict)}`}>
                {verdictLabel[match.deploymentVerdict]}
              </div>

              {analysisLevel <= 0 && (
                <p className="muted">분석 적용 Lv.0: 신호 데이터가 잠겨 있다.</p>
              )}

              {info && info.signals.length > 0 && (
                <ul className="signals">
                  {info.signals.map((s, idx) => (
                    <li key={idx} className={`signal signal-${s.signalType}`}>
                      <span className="signal-tag">{signalLabel[s.signalType]}</span>
                      {s.textKo}
                    </li>
                  ))}
                </ul>
              )}

              {info && info.successOutlook && (
                <div className="outlook">
                  <span>성공 전망: {outlookLabel[info.successOutlook]}</span>
                  <span>손실 전망: {outlookLabel[info.lossOutlook!]}</span>
                </div>
              )}

              {gearDestructionProb !== null && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "8px",
                    border: "1px solid var(--danger)",
                    background: "rgba(255, 60, 60, 0.1)",
                    color: "var(--danger)",
                  }}
                >
                  ⚠️ 예상 장비/의체 파괴 확률: <strong>{gearDestructionProb.toFixed(1)}%</strong>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {entryBlocked && entryGateEval && (
        <div
          role="alert"
          style={{
            marginTop: "12px",
            padding: "12px 14px",
            border: "2px solid var(--danger)",
            background: "rgba(255, 40, 40, 0.14)",
            color: "var(--danger)",
            fontWeight: 700,
          }}
        >
          🚫 진입 조건 미달 —{" "}
          {entryGateEval.unmetRequirements.map((r) => formatUnmetRequirement(r)).join(", ")}
          <div style={{ fontWeight: 400, fontSize: "0.85em", marginTop: "4px" }}>
            필수 조건을 충족하기 전까지 출격할 수 없습니다.
          </div>
        </div>
      )}

      {entryForcedRisk && entryGateEval && (
        <div
          role="alert"
          style={{
            marginTop: "12px",
            padding: "12px 14px",
            border: "2px solid var(--warning, #e0a800)",
            background: "rgba(224, 168, 0, 0.14)",
            color: "var(--warning, #e0a800)",
            fontWeight: 700,
          }}
        >
          ⚠️ 진입 조건 불안정: 강제 위험 노드 발생 예정 —{" "}
          {entryGateEval.unmetRequirements.map((r) => formatUnmetRequirement(r)).join(", ")}
          <div style={{ fontWeight: 400, fontSize: "0.85em", marginTop: "4px" }}>
            출격은 가능하나, 진입 시 「{mission.entryGate?.forcedRiskNodeNameKo ?? "돌발 위험"}」
            위험 노드가 강제 삽입됩니다.
          </div>
        </div>
      )}

      {visibilityExposure?.exposed && (
        <div
          role="alert"
          style={{
            marginTop: "12px",
            padding: "12px 14px",
            border: "2px solid var(--danger)",
            background: "rgba(255, 90, 0, 0.16)",
            color: "var(--danger)",
            fontWeight: 700,
          }}
        >
          ⚠️ 치명적 가시성 경고: 강제 적발 예상
          <div style={{ fontWeight: 400, fontSize: "0.85em", marginTop: "4px" }}>
            가시성 {visibilityExposure.mercVisibility} / 한계{" "}
            {visibilityExposure.visibilityLimit} (초과 {visibilityExposure.overshoot}) — 진입 시{" "}
            「{visibilityExposure.riskNodeNameKo}」 위험 노드가 강제 삽입됩니다.
          </div>
        </div>
      )}

      {slotMerc && survival && (
        <div
          className="survival-forecast"
          style={{
            marginTop: "12px",
            padding: "12px 14px",
            border: "1px solid var(--cyan)",
            background: "rgba(0, 200, 220, 0.06)",
          }}
        >
          <div style={{ fontWeight: 700, color: "var(--cyan)", marginBottom: "6px" }}>
            예상 생존율 변동 (사생결단 판정 시)
          </div>

          {analysisLevel <= 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              ⚠️ 현장 정보 부족: 생존율 예측 불가
            </p>
          ) : (
            <>
              <div>
                구역 환경 ({survival.tierLabelKo}): 기본 생존율 {survival.baseProbability}%
              </div>

              {analysisLevel >= 2 && (
                <>
                  <div>스탯 보정: +{survival.statBonus}%</div>
                  {survival.tagContributions.map((c, idx) => (
                    <div
                      key={idx}
                      style={{ color: c.value < 0 ? "var(--danger)" : "var(--cyan)" }}
                    >
                      {c.labelKo}: {c.value > 0 ? "+" : ""}
                      {c.value}%
                    </div>
                  ))}
                  <div style={{ fontWeight: 700, marginTop: "4px" }}>
                    ▶ 최종 예상 생존율: {survival.finalProbability}%
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {slotMerc && <MercResumeFolder merc={slotMerc} />}

      <div className="matching-bottom">
        <div className="merc-roster-label">용병 목록</div>
        <div className="merc-roster">
          {mercenaries.map((merc) => {
            const isBusy = busyMercIds.includes(merc.mercId);
            return (
              <button
                key={merc.mercId}
                className={`merc-row ${selectedMercId === merc.mercId ? "selected" : ""} ${isBusy ? "busy dimmed" : ""}`}
                onClick={() => !isBusy && onSelectMerc(merc.mercId)}
                disabled={isBusy}
              >
                <span className="merc-alias">{merc.aliasKo}</span>
                <span className="muted">{merc.displayNameKo}</span>
                <span className="merc-vis">
                  {isBusy
                    ? "🛑 작전 중"
                    : `가시성 ${visibilityName(merc.visibilityLevel)} | 코스트 ${merc.commandCost}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="deploy-actions"
        style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexDirection: "column" }}
      >
        {slotMerc && insufficientCommandPoints && (
          <p style={{ color: "var(--danger)", textAlign: "center", marginBottom: "0.5rem" }}>
            지휘력이 부족합니다 (현재 {currentCommandPoints} OP / 필요 {effectiveCommandCost} OP).
          </p>
        )}

        <DroneCatchUpView
          visible={!!slotMerc}
          catchUpOn={catchUpOn}
          onCatchUpChange={setCatchUpOn}
          baseCommandCost={baseCommandCost}
          effectiveCommandCost={effectiveCommandCost}
          canPickNodes={canPickNodes}
          selectableNodeNames={selectableNodeNames}
          pickedNodes={pickedNodes}
          onToggleNodePick={toggleNodePick}
          interventionCap={interventionCap}
          catchUpNeedsNodes={catchUpNeedsNodes}
        />

        <SlideToDeploy
          disabled={
            entryBlocked ||
            !match ||
            !deployable ||
            insufficientCommandPoints ||
            catchUpNeedsNodes
          }
          label={catchUpConfig ? "밀어서 출격 (현장 개입) ▶" : "밀어서 출격 (관제소 위임) ▶"}
          onDeploy={() => selectedMercId && onDeploy(selectedMercId, catchUpConfig)}
        />
      </div>
    </section>
  );
}
