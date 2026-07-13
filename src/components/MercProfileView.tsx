import type { Mercenary } from "../data/types";

export interface MercProfileViewProps {
  merc: Mercenary;
  mercAnalysisLevel: number;
  isMarketMerc?: boolean;
  onBack: () => void;
}

/** Red stub — Green에서 이력서 탭·Phase 게이트·관계 탭 placeholder를 구현한다. */
export function MercProfileView(_props: MercProfileViewProps) {
  return null;
}
