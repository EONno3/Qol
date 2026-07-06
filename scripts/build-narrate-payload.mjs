import { writeFileSync } from "fs";
import { mercenaries, gearDefs, implantDefs, missions } from "../src/data/seed.ts";
import { simulateMission } from "../src/domain/engine.ts";
import { buildNarratePayload } from "../src/domain/narratePayload.ts";

// ⚠️ C경로 전용 (CLI 페이로드 직통 검증): 의도적으로 정적 픽스처(퓨즈+차단기)를 사용한다.
// 본편(A경로) 보드에는 이 미션이 노출되지 않는다.
const mission = missions.find((m) => m.missionId === "mission_lower_fuse_capacitor_01");
const merc = mercenaries.find((m) => m.mercId === "merc_breaker_01");
if (!mission || !merc) throw new Error("fixture not found");
const loadout = {
  gearOwner: { gear_feet_insulated_boots_01: "merc_breaker_01" },
  implantOwner: { implant_wrist_torque_joint_01: "merc_breaker_01" },
  gearDefs,
  implantDefs,
};

const { report } = simulateMission(mission, merc, () => 0.35, loadout);
const payload = buildNarratePayload(report, mission, merc, { gearDefs, implantDefs });

writeFileSync("scripts/e2e-narrate-payload.json", JSON.stringify(payload, null, 2));
console.log("resultType:", report.resultType);
console.log("triggeredTags:", (report.triggeredTags ?? []).length);
console.log("payload written");
