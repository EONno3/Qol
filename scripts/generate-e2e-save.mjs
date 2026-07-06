import { writeFileSync } from "fs";
import { createInitialState, createFixerProfileFromOrigin, createDefaultStation } from "../src/domain/state.ts";

const base = createInitialState();
const { profile, initialCredits, factionReputation } = createFixerProfileFromOrigin(
  "상실자",
  "E2E",
  "테스터"
);
const state = {
  ...base,
  fixerProfile: profile,
  ledger: initialCredits,
  factionReputation: { ...base.factionReputation, ...factionReputation },
  stationState: createDefaultStation(profile.fixerId),
  // B경로 (E2E): base(createInitialState)가 generated_missions.json의 AI 미션 ID를 이미 포함.
  // 정적 미션 하드코딩 금지 — run_mvp.bat 재생성 시 ID가 바뀔 수 있다.
  acceptedMissions: [],
  aiNarratorEnabled: true,
};

writeFileSync("scripts/e2e-save.json", JSON.stringify(state));
console.log("scripts/e2e-save.json written");
