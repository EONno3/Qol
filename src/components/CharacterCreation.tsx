import { useState } from "react";
import type { FixerOrigin } from "../data/types";
import {
  createFixerProfileFromOrigin,
  FACTION_IDS,
  type FixerCreationResult,
} from "../domain/state";

interface Props {
  onComplete: (result: FixerCreationResult) => void;
}

// ─── 출신지 메타데이터 ──────────────────────────────────────────────────────

const ORIGIN_META: Record<FixerOrigin, { label: string; tagline: string; bgTag: string }> = {
  하층_언존_태생: {
    label: "하층 언존 태생",
    tagline: "슬럼이 고향이다. 법은 없었지만 생존은 있었다.",
    bgTag: "#슬럼_출신",
  },
  살아남은_폐기체: {
    label: "살아남은 폐기체",
    tagline: "기업 실험 클론. 폐기됐지만 눈을 떴다. 기록이 없다.",
    bgTag: "#신원_말소",
  },
  버려진_사생아: {
    label: "버려진 사생아",
    tagline: "기업 혈통이지만 인정받지 못했다. 어느 쪽에도 속하지 않는다.",
    bgTag: "#혈연_연줄",
  },
  추방자: {
    label: "추방자",
    tagline: "연줄은 있었다. 이제 없다. 그것뿐이다.",
    bgTag: "#추방낙인",
  },
  몰락자: {
    label: "몰락자",
    tagline: "있었던 것들이 사라졌다. 인맥의 잔해만 남아있다.",
    bgTag: "#몰락_귀족",
  },
  상실자: {
    label: "상실자",
    tagline: "무언가를 잃었다. 기억인지 사람인지 알 수 없다.",
    bgTag: "#기억_공백",
  },
  무지한_외부인: {
    label: "무지한 외부인",
    tagline: "돔 밖에서 왔다. 이 도시의 규칙을 모른다.",
    bgTag: "#외부인_낙인",
  },
};

// ─── 추가 선택지 ──────────────────────────────────────────────────────────────

const MEGACORP_OPTIONS = [
  { id: "faction_corp_bairui", label: "바이루이" },
  { id: "faction_corp_masada", label: "마사다" },
  { id: "faction_corp_kikumoto", label: "키쿠모토" },
  { id: "faction_corp_almadinat", label: "알-마디낫" },
];

const ALL_FACTION_OPTIONS = [
  { id: FACTION_IDS.NULLS, label: "더 널스" },
  { id: FACTION_IDS.VALVE, label: "더 밸브" },
  { id: FACTION_IDS.FUSE, label: "더 퓨즈" },
  { id: FACTION_IDS.DAMPER, label: "더 댐퍼" },
  { id: FACTION_IDS.LANADA, label: "La Nada" },
  { id: FACTION_IDS.NO_CLAIM, label: "No Claim" },
  { id: FACTION_IDS.PLUS_ONE, label: "Plus One" },
  { id: FACTION_IDS.RATTLE, label: "Rattle" },
  { id: FACTION_IDS.ONE_MORE, label: "One More" },
  { id: FACTION_IDS.TEN_MEN, label: "Ten Men" },
  { id: FACTION_IDS.BAIRUI, label: "바이루이" },
  { id: FACTION_IDS.MASADA, label: "마사다" },
  { id: FACTION_IDS.KIKUMOTO, label: "키쿠모토" },
  { id: FACTION_IDS.ALMADINAT, label: "알-마디낫" },
];

const MID_UPPER_FACTION_OPTIONS = [
  { id: FACTION_IDS.LANADA, label: "La Nada" },
  { id: FACTION_IDS.NO_CLAIM, label: "No Claim" },
  { id: FACTION_IDS.PLUS_ONE, label: "Plus One" },
  { id: FACTION_IDS.RATTLE, label: "Rattle" },
  { id: FACTION_IDS.ONE_MORE, label: "One More" },
  { id: FACTION_IDS.TEN_MEN, label: "Ten Men" },
  { id: FACTION_IDS.BAIRUI, label: "바이루이" },
  { id: FACTION_IDS.MASADA, label: "마사다" },
  { id: FACTION_IDS.KIKUMOTO, label: "키쿠모토" },
  { id: FACTION_IDS.ALMADINAT, label: "알-마디낫" },
];

// ─── 컴포넌트 ────────────────────────────────────────────────────────────────

export function CharacterCreation({ onComplete }: Props) {
  const [name, setName] = useState("");
  const [codename, setCodename] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState<FixerOrigin | null>(null);
  const [secondaryChoice, setSecondaryChoice] = useState<string>("");

  const needsSecondaryChoice =
    selectedOrigin === "버려진_사생아" ||
    selectedOrigin === "추방자" ||
    selectedOrigin === "몰락자";

  const canStart =
    name.trim() !== "" &&
    codename.trim() !== "" &&
    selectedOrigin !== null &&
    (!needsSecondaryChoice || secondaryChoice !== "");

  function handleOriginSelect(origin: FixerOrigin) {
    setSelectedOrigin(origin);
    setSecondaryChoice("");
  }

  function handleStart() {
    if (!canStart || !selectedOrigin) return;

    const opts: Record<string, string> = {};
    if (selectedOrigin === "버려진_사생아" && secondaryChoice) {
      opts.bloodlineFactionId = secondaryChoice;
    }
    if (selectedOrigin === "추방자" && secondaryChoice) {
      opts.exileFactionId = secondaryChoice;
    }
    if (selectedOrigin === "몰락자" && secondaryChoice) {
      opts.fallenNetworkFactionId = secondaryChoice;
    }

    const result = createFixerProfileFromOrigin(
      selectedOrigin,
      name.trim(),
      codename.trim(),
      opts
    );
    onComplete(result);
  }

  const secondaryOptions =
    selectedOrigin === "버려진_사생아"
      ? MEGACORP_OPTIONS
      : selectedOrigin === "추방자"
        ? ALL_FACTION_OPTIONS
        : selectedOrigin === "몰락자"
          ? MID_UPPER_FACTION_OPTIONS
          : [];

  const secondaryLabel =
    selectedOrigin === "버려진_사생아"
      ? "혈연 메가코프 선택"
      : selectedOrigin === "추방자"
        ? "추방한 팩션 선택"
        : selectedOrigin === "몰락자"
          ? "연줄이 남아있는 팩션 선택"
          : "";

  return (
    <div className="cc-root">
      <div className="cc-inner">

        {/* 헤더 */}
        <div className="cc-header">
          <div className="cc-brand">FIXER PROTOCOL</div>
          <h1 className="cc-title">픽서 등록</h1>
          <p className="cc-sub">당신이 누구인지, 어디서 왔는지 밝혀라.</p>
        </div>

        {/* 이름 / 코드명 */}
        <div className="cc-fields">
          <label className="cc-field">
            <span className="cc-field-label">이름</span>
            <input
              id="fixer-name"
              className="cc-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="본명"
              maxLength={20}
              autoFocus
            />
          </label>
          <label className="cc-field">
            <span className="cc-field-label">코드명</span>
            <input
              id="fixer-codename"
              className="cc-input"
              value={codename}
              onChange={(e) => setCodename(e.target.value)}
              placeholder="거리에서 불리는 이름"
              maxLength={20}
            />
          </label>
        </div>

        {/* 출신지 선택 */}
        <div className="cc-section">
          <div className="cc-section-label">출신지</div>
          <div className="cc-origin-grid">
            {(Object.keys(ORIGIN_META) as FixerOrigin[]).map((origin) => {
              const meta = ORIGIN_META[origin];
              const isSelected = selectedOrigin === origin;
              return (
                <button
                  key={origin}
                  id={`origin-${origin}`}
                  className={`cc-origin-card${isSelected ? " cc-origin-card--on" : ""}`}
                  onClick={() => handleOriginSelect(origin)}
                >
                  <div className="cc-origin-name">{meta.label}</div>
                  <div className="cc-origin-tag">{meta.bgTag}</div>
                  <div className="cc-origin-tagline">{meta.tagline}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 추가 선택 (출신지에 따라 조건부) */}
        {needsSecondaryChoice && secondaryOptions.length > 0 && (
          <div className="cc-section cc-secondary">
            <div className="cc-section-label">{secondaryLabel}</div>
            <div className="cc-chip-group">
              {secondaryOptions.map((opt) => (
                <button
                  key={opt.id}
                  id={`secondary-${opt.id}`}
                  className={`cc-chip${secondaryChoice === opt.id ? " cc-chip--on" : ""}`}
                  onClick={() => setSecondaryChoice(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 시작 버튼 */}
        <div className="cc-footer">
          <button
            id="btn-start-game"
            className="primary"
            disabled={!canStart}
            onClick={handleStart}
          >
            픽서 등록 완료
          </button>
        </div>

      </div>
    </div>
  );
}
