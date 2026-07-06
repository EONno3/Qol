import type { GearDef, ImplantDef, StatKey } from "../data/types";

/** 파견 시뮬레이션에 필요한 장비·임플란트 소유 맥락 */
export interface DispatchLoadoutContext {
  gearOwner: Record<string, string>;
  implantOwner: Record<string, string>;
  gearDefs: GearDef[];
  implantDefs: ImplantDef[];
}

function bonusFromRecord(
  bonuses: Partial<Record<StatKey, number>> | undefined,
  statKey: StatKey
): number {
  return bonuses?.[statKey] ?? 0;
}

/** 용병이 소유한 장비·임플란트의 statBonuses 합계 (노드 판정용) */
export function sumMercLoadoutStatBonus(
  mercId: string,
  statKey: StatKey,
  loadout: DispatchLoadoutContext
): number {
  let sum = 0;

  for (const [gearId, owner] of Object.entries(loadout.gearOwner)) {
    if (owner !== mercId) continue;
    const def = loadout.gearDefs.find((g) => g.gearId === gearId);
    sum += bonusFromRecord(def?.statBonuses, statKey);
  }

  for (const [implantId, owner] of Object.entries(loadout.implantOwner)) {
    if (owner !== mercId) continue;
    const def = loadout.implantDefs.find((i) => i.implantId === implantId);
    sum += bonusFromRecord(def?.statBonuses, statKey);
  }

  return sum;
}

export function getEffectiveStatForNode(
  mercId: string,
  baseStat: number,
  statKey: StatKey,
  loadout?: DispatchLoadoutContext
): number {
  if (!loadout) return baseStat;
  return baseStat + sumMercLoadoutStatBonus(mercId, statKey, loadout);
}
