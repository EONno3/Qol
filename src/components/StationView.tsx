import { useState } from "react";
import type { GameState } from "../domain/state";
import { getUpgradeCost, getUpgradedStation, getHiringCost, getReplacementCost, getFacilityUpgradeCost } from "../domain/station";
import { mercenaries as allMercs } from "../data/seed";
import { getMercenary, getMission } from "../data/lookups";
import {
  effectiveMercAnalysisLevel,
  effectiveMissionAnalysisLevel,
  getStationMercAnalysisBase,
  getStationMissionAnalysisBase,
} from "../domain/analysisSlot";
import { FACILITY_DEFINITIONS } from "../data/stationFacilities";
import { STATUS_GEAR_DESTROYED, STATUS_GEAR_DESTROYED_JOKER, TIER_LABEL_KO } from "../data/constants";

interface Props {
  state: GameState;
  onUpgrade: () => void;
  onUpgradeFacility: () => void;
  onHire: (mercId: string) => void;
  onFire: (mercId: string) => void;
  onReplaceGear: (mercId: string) => void;
  onAssignMercSlot: (mercId: string | null) => void;
  onAssignMissionSlot: (missionId: string | null) => void;
}

export function StationView({
  state,
  onUpgrade,
  onUpgradeFacility,
  onHire,
  onFire,
  onReplaceGear,
  onAssignMercSlot,
  onAssignMissionSlot,
}: Props) {
  const [activeTab, setActiveTab] = useState<"infra" | "analysis" | "market" | "black_market">("infra");
  const station = state.stationState;

  if (!station) {
    return (
      <section className="station-view">
        <div className="section-head">
          <h2>스테이션 관리</h2>
        </div>
        <p className="muted">아직 스테이션 정보가 없습니다. (캐릭터 생성 시 할당됨)</p>
      </section>
    );
  }

  const currentLevel = station.level;
  const upgradeCost = getUpgradeCost(currentLevel);
  const upgradedPreview = getUpgradedStation(state);
  const canUpgrade = state.ledger >= upgradeCost;
  const facilityTier = station.facilityTier ?? 1;
  const facilityDef = FACILITY_DEFINITIONS[station.facilityId];
  const facilityUpgradeCost = getFacilityUpgradeCost(facilityTier);
  const canUpgradeFacility = facilityTier < 2 && state.ledger >= facilityUpgradeCost;
  const mercAnalysisBase = getStationMercAnalysisBase(state);
  const missionAnalysisBase = getStationMissionAnalysisBase(state);

  // 용병 목록 필터링
  const hiredIds = state.hiredMercs || [];
  const hiredMercs = hiredIds.map(id => getMercenary(id)).filter(Boolean) as typeof allMercs;
  const availableMarketMercs = allMercs.filter(m => !hiredIds.includes(m.mercId));
  const missionSlotCandidates = [...new Set([...state.availableMissions, ...state.acceptedMissions])];
  const mercSlot = state.analysisSlots.merc;
  const missionSlot = state.analysisSlots.mission;

  return (
    <section className="station-view">
      <div className="section-head">
        <h2>스테이션 관리</h2>
      </div>

      <div className="tabs" style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--panel-2)", paddingBottom: "0.5rem" }}>
        <button 
          className={`tab-btn ${activeTab === "infra" ? "active" : ""}`}
          onClick={() => setActiveTab("infra")}
          style={{ background: "none", border: "none", color: activeTab === "infra" ? "var(--cyan)" : "var(--muted)", fontWeight: activeTab === "infra" ? "bold" : "normal", cursor: "pointer", fontSize: "1.1rem" }}
        >
          인프라 관리
        </button>
        <button 
          className={`tab-btn ${activeTab === "analysis" ? "active" : ""}`}
          onClick={() => setActiveTab("analysis")}
          style={{ background: "none", border: "none", color: activeTab === "analysis" ? "var(--cyan)" : "var(--muted)", fontWeight: activeTab === "analysis" ? "bold" : "normal", cursor: "pointer", fontSize: "1.1rem" }}
        >
          분석 기관
        </button>
        <button 
          className={`tab-btn ${activeTab === "market" ? "active" : ""}`}
          onClick={() => setActiveTab("market")}
          style={{ background: "none", border: "none", color: activeTab === "market" ? "var(--cyan)" : "var(--muted)", fontWeight: activeTab === "market" ? "bold" : "normal", cursor: "pointer", fontSize: "1.1rem" }}
        >
          용병 고용소
        </button>
        <button 
          className={`tab-btn ${activeTab === "black_market" ? "active" : ""}`}
          onClick={() => setActiveTab("black_market")}
          style={{ background: "none", border: "none", color: activeTab === "black_market" ? "var(--cyan)" : "var(--muted)", fontWeight: activeTab === "black_market" ? "bold" : "normal", cursor: "pointer", fontSize: "1.1rem" }}
        >
          암시장(무기 재수급)
        </button>
      </div>

      {activeTab === "infra" && (
        <div className="tab-content">
          <div className="station-card" style={{ background: "var(--panel-2)", padding: "1.5rem", border: "1px solid var(--panel-3)" }}>
            <h3 style={{ color: "var(--cyan)", marginTop: 0 }}>
              {station.facilityName}{" "}
              <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                시설 T{facilityTier} · 인프라 Lv.{currentLevel}
              </span>
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
              <div>
                <div className="muted">카테고리</div>
                <div>{station.category}</div>
              </div>
              <div>
                <div className="muted">시설 효과</div>
                <div style={{ fontSize: "0.95rem" }}>{facilityDef.effectSummaryKo}</div>
              </div>
              <div>
                <div className="muted">구역 위치</div>
                <div>{TIER_LABEL_KO[station.locationTier] || station.locationTier} ({station.locationArea})</div>
              </div>
              <div>
                <div className="muted">턴 당 유지비</div>
                <div style={{ color: "var(--danger)" }}>-{station.operatingCostPerTurn} cr</div>
              </div>
              <div>
                <div className="muted">최대 지휘력 (OP)</div>
                <div style={{ color: "var(--cyan)" }}>{state.maxCommandPoints} OP</div>
              </div>
              <div>
                <div className="muted">분석 베이스 (용병 / 미션)</div>
                <div>Lv.{mercAnalysisBase} / Lv.{missionAnalysisBase}</div>
              </div>
            </div>
            {station.category !== "업무" && (
              <p className="muted" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
                영구 분석 베이스 상승은 「업무」 카테고리 시설 Tier 업그레이드로만 가능합니다. 임시 분석은 분석 기관 슬롯을 이용하세요.
              </p>
            )}
          </div>

          <div className="station-upgrade-card" style={{ background: "var(--bg)", padding: "1.5rem", border: "1px dashed var(--muted)", marginTop: "2rem" }}>
            <h3>시설 Tier 업그레이드 (T{facilityTier} → T{Math.min(2, facilityTier + 1)})</h3>
            <p className="muted" style={{ marginTop: "0.5rem" }}>
              {facilityTier >= 2
                ? "최대 Tier에 도달했습니다."
                : `${facilityDef.nameKo} 시설을 강화하여 카테고리 고유 효과가 상승합니다.`}
            </p>
            {facilityTier < 2 && (
              <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "1.1rem" }}>
                  비용:{" "}
                  <strong style={{ color: canUpgradeFacility ? "var(--cyan)" : "var(--danger)" }}>
                    {facilityUpgradeCost.toLocaleString()} cr
                  </strong>
                </div>
                <button
                  className="primary"
                  onClick={onUpgradeFacility}
                  disabled={!canUpgradeFacility}
                  aria-label="시설 Tier 업그레이드"
                >
                  시설 강화
                </button>
              </div>
            )}
          </div>

          <div className="station-upgrade-card" style={{ background: "var(--bg)", padding: "1.5rem", border: "1px dashed var(--muted)", marginTop: "2rem" }}>
            <h3>인프라 레벨 업그레이드 (Lv.{currentLevel} → Lv.{currentLevel + 1})</h3>
            <p className="muted" style={{ fontSize: "0.9rem" }}>지휘력(OP) 상한·턴 유지비만 상승합니다. 분석 베이스는 시설 투자로 별도 관리됩니다.</p>
            
            {upgradedPreview && (
              <ul style={{ paddingLeft: "1.5rem", margin: "1rem 0", lineHeight: "1.6" }}>
                <li>최대 지휘력: {state.maxCommandPoints} OP ➜ <strong style={{ color: "var(--cyan)" }}>{state.maxCommandPoints + 2} OP</strong></li>
                <li>턴 당 유지비: {station.operatingCostPerTurn} cr ➜ <strong style={{ color: "var(--danger)" }}>{upgradedPreview.operatingCostPerTurn} cr</strong></li>
              </ul>
            )}

            <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "1.1rem" }}>
                비용: <strong style={{ color: canUpgrade ? "var(--cyan)" : "var(--danger)" }}>{upgradeCost.toLocaleString()} cr</strong>
              </div>
              <button 
                className="primary" 
                onClick={onUpgrade} 
                disabled={!canUpgrade}
                title={canUpgrade ? "스테이션을 업그레이드합니다." : "크레딧이 부족합니다."}
              >
                업그레이드 진행
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "analysis" && (
        <div className="tab-content">
          <p className="muted" style={{ marginBottom: "1rem" }}>
            용병·미션 분석 기관에 각 1개씩 배치하면 턴이 지날 때마다 해당 대상의 분석 깊이가 임시로 +1됩니다 (최대 Lv.2).
            슬롯에서 빼면 보너스는 즉시 사라집니다.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div className="station-card" style={{ background: "var(--panel-2)", padding: "1.25rem", border: "1px solid var(--panel-3)" }}>
              <h3 style={{ marginTop: 0, color: "var(--cyan)" }}>용병 분석 슬롯</h3>
              <p className="muted" style={{ fontSize: "0.9rem" }}>
                기관 베이스 Lv.{station.analysisMercLv}
                {mercSlot.targetId && (
                  <> · 슬롯 보너스 +{mercSlot.bonusLevel} → effective Lv.
                  {effectiveMercAnalysisLevel(state, mercSlot.targetId)}</>
                )}
              </p>
              <label htmlFor="merc-analysis-slot" className="muted" style={{ display: "block", marginTop: "0.75rem" }}>
                배치 용병
              </label>
              <select
                id="merc-analysis-slot"
                aria-label="용병 분석 슬롯"
                value={mercSlot.targetId ?? ""}
                onChange={(e) => onAssignMercSlot(e.target.value || null)}
                style={{ width: "100%", marginTop: "0.25rem" }}
              >
                <option value="">(비움)</option>
                {hiredMercs.map((m) => (
                  <option key={m.mercId} value={m.mercId}>
                    {m.aliasKo}
                  </option>
                ))}
              </select>
            </div>

            <div className="station-card" style={{ background: "var(--panel-2)", padding: "1.25rem", border: "1px solid var(--panel-3)" }}>
              <h3 style={{ marginTop: 0, color: "var(--cyan)" }}>미션 분석 슬롯</h3>
              <p className="muted" style={{ fontSize: "0.9rem" }}>
                기관 베이스 Lv.{station.analysisMissionLv}
                {missionSlot.targetId && (
                  <> · 슬롯 보너스 +{missionSlot.bonusLevel} → effective Lv.
                  {effectiveMissionAnalysisLevel(state, missionSlot.targetId)}</>
                )}
              </p>
              <label htmlFor="mission-analysis-slot" className="muted" style={{ display: "block", marginTop: "0.75rem" }}>
                배치 미션
              </label>
              <select
                id="mission-analysis-slot"
                aria-label="미션 분석 슬롯"
                value={missionSlot.targetId ?? ""}
                onChange={(e) => onAssignMissionSlot(e.target.value || null)}
                style={{ width: "100%", marginTop: "0.25rem" }}
              >
                <option value="">(비움)</option>
                {missionSlotCandidates.map((id) => {
                  const m = getMission(id);
                  return (
                    <option key={id} value={id}>
                      {m?.displayNameKo ?? id}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === "market" && (
        <div className="tab-content">
          <p className="muted" style={{ marginBottom: "1.5rem" }}>
            시장에 나와있는 프리랜서 용병들을 고용하거나, 현재 소속된 용병을 해고할 수 있습니다.
          </p>

          <h3 style={{ borderBottom: "1px solid var(--panel-2)", paddingBottom: "0.5rem" }}>소속 용병 명단</h3>
          {hiredMercs.length === 0 ? (
            <div className="muted" style={{ padding: "1rem" }}>고용된 용병이 없습니다.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "2rem" }}>
              {hiredMercs.map(m => (
                <div key={m.mercId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel)", padding: "1rem", border: "1px solid var(--green)" }}>
                  <div>
                    <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{m.aliasKo}</span>
                    <span className="muted" style={{ marginLeft: "0.5rem" }}>({m.displayNameKo})</span>
                    <div style={{ fontSize: "0.9rem", color: "var(--cyan)", marginTop: "4px" }}>지휘력 코스트: {m.commandCost} OP</div>
                  </div>
                  <button className="danger" onClick={() => onFire(m.mercId)}>
                    해고
                  </button>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ borderBottom: "1px solid var(--panel-2)", paddingBottom: "0.5rem" }}>용병 시장 (고용 가능)</h3>
          {availableMarketMercs.length === 0 ? (
            <div className="muted" style={{ padding: "1rem" }}>고용 가능한 용병이 없습니다.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {availableMarketMercs.map(m => {
                const cost = getHiringCost(m.mercId);
                const canHire = state.ledger >= cost;
                return (
                  <div key={m.mercId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel)", padding: "1rem", border: "1px solid var(--panel-3)" }}>
                    <div>
                      <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{m.aliasKo}</span>
                      <span className="muted" style={{ marginLeft: "0.5rem" }}>({m.displayNameKo})</span>
                      <div style={{ fontSize: "0.9rem", color: "var(--muted)", marginTop: "4px" }}>출신: {m.originKo} | 지휘력 코스트: {m.commandCost} OP</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{ color: canHire ? "var(--cyan)" : "var(--danger)" }}>{cost.toLocaleString()} cr</span>
                      <button 
                        className="primary" 
                        onClick={() => onHire(m.mercId)}
                        disabled={!canHire}
                        title={canHire ? "고용 계약을 체결합니다." : "자금이 부족합니다."}
                      >
                        고용
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "black_market" && (
        <div className="tab-content">
          <p className="muted" style={{ marginBottom: "1.5rem" }}>
            치명적인 교전으로 완전히 소실된 무기나 의체를 암시장에서 대체 부품으로 재수급합니다. <br/>
            (인벤토리가 구축되지 않은 임시 대체 시스템으로, 막대한 15,000 CR을 지불하면 용병의 파손 상태를 지워줍니다)
          </p>

          <h3 style={{ borderBottom: "1px solid var(--panel-2)", paddingBottom: "0.5rem", color: "var(--danger)" }}>파손 상태의 용병 목록</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {(() => {
              const replacementCost = getReplacementCost(state);
              const canReplace = state.ledger >= replacementCost;
              return hiredMercs.filter(m => {
                const s = state.mercStatuses[m.mercId] || [];
                return s.includes(STATUS_GEAR_DESTROYED) || s.includes(STATUS_GEAR_DESTROYED_JOKER);
              }).map(m => (
                <div key={m.mercId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg)", padding: "1rem", border: "1px solid var(--danger)" }}>
                  <div>
                    <span style={{ fontWeight: "bold", fontSize: "1.1rem", color: "var(--danger)" }}>{m.aliasKo}</span>
                    <span className="muted" style={{ marginLeft: "0.5rem" }}>({m.displayNameKo})</span>
                    <div style={{ fontSize: "0.9rem", color: "var(--danger)", marginTop: "4px" }}>⚠️ 장비/의체 완전 파손됨 (출격 시 패널티)</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ color: canReplace ? "var(--cyan)" : "var(--danger)" }}>{replacementCost.toLocaleString()} cr</span>
                    <button 
                      className="primary" 
                      onClick={() => onReplaceGear(m.mercId)}
                      disabled={!canReplace}
                      title={canReplace ? `${replacementCost.toLocaleString()} CR을 지불하고 장비를 재수급합니다.` : "자금이 부족합니다."}
                      style={{ background: canReplace ? "var(--cyan)" : "var(--panel-2)", color: canReplace ? "#000" : "var(--muted)" }}
                    >
                      재수급 및 장착
                    </button>
                  </div>
                </div>
              ));
            })()}
            
            {hiredMercs.filter(m => {
              const s = state.mercStatuses[m.mercId] || [];
              return s.includes(STATUS_GEAR_DESTROYED) || s.includes(STATUS_GEAR_DESTROYED_JOKER);
            }).length === 0 && (
              <div className="muted" style={{ padding: "1rem" }}>장비가 파괴된 용병이 없습니다.</div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
