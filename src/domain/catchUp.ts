import { GAME_CONFIG } from "../data/config";
import type { Mission } from "../data/types";
import { resolveMissionNodes } from "./missionNodes";
import { createSeededRng } from "./assignNodeChallenges";

/** 캐치업 개입 가능 노드 상한 — ceil(노드수 × ratio), 최소 1 (노드 0이면 0) */
export function maxCatchUpInterventions(nodeCount: number): number {
  if (nodeCount <= 0) return 0;
  return Math.max(1, Math.ceil(nodeCount * GAME_CONFIG.catchUp.interventionRatio));
}

/** 캐치업 UI에 노출/선택 가능한 노드 이름 목록 (파생 노드 포함) */
export function catchUpSelectableNodeNames(mission: Mission): string[] {
  return resolveMissionNodes(mission).map((n) => n.nameKo);
}

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface SelectCatchUpParams {
  mission: Mission;
  /** 유효 분석 레벨 L = min(용병, 미션). L>=2에서만 픽서가 노드를 직접 지정 가능 */
  analysisLevel: number;
  /** 픽서가 UI에서 지정한 노드 이름 (L>=2에서만 유효) */
  picked?: string[];
}

/**
 * 개입할 노드 이름을 확정한다.
 * - L>=2: 픽서 지정(picked) 중 유효 이름만, 상한(cap)까지.
 * - L<2 : 정보 분리 원칙상 픽서가 노드를 못 고르므로 missionId 시드로 결정론적 랜덤 cap개 선택.
 */
export function selectCatchUpNodes({ mission, analysisLevel, picked = [] }: SelectCatchUpParams): string[] {
  const names = catchUpSelectableNodeNames(mission);
  const cap = maxCatchUpInterventions(names.length);
  if (cap === 0) return [];

  if (analysisLevel >= 2) {
    const valid = picked.filter((p) => names.includes(p));
    return valid.slice(0, cap);
  }

  // 미분석: 결정론적 셔플 후 cap개 (Fisher-Yates, missionId 시드)
  const rng = createSeededRng(hashSeed(`catchup_${mission.missionId}`));
  const pool = [...names];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, cap);
}
