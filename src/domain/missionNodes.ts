import type { MissionNode, NodeRole, StatKey } from "../data/types";
import type { Mission } from "../data/types";

function defaultNodeName(role: NodeRole, i: number): string {
  switch (role) {
    case "entry":
      return "작전 구역 진입";
    case "exit":
      return "현장 이탈";
    case "objective":
      return "핵심 목표 수행";
    default:
      return `중간 관문 ${i}`;
  }
}

/** mission.nodes가 없으면 nodeCount·역할 규칙으로 기본 관문을 파생한다. */
export function resolveMissionNodes(mission: Mission): MissionNode[] {
  if (mission.nodes && mission.nodes.length > 0) return mission.nodes;
  const primary = (mission.mechanics?.primary_stat ?? "frame") as StatKey;
  const n = Math.max(3, mission.nodeCount || 3);
  const nodes: MissionNode[] = [];
  for (let i = 0; i < n; i++) {
    let role: NodeRole;
    if (i === 0) role = "entry";
    else if (i === n - 1) role = "exit";
    else if (i === n - 2) role = "objective";
    else role = "obstacle";
    nodes.push({ nameKo: defaultNodeName(role, i), role, statCheck: primary });
  }
  if (!nodes.some((nd) => nd.role === "objective")) {
    const mid = Math.floor(n / 2);
    nodes[mid] = { ...nodes[mid], role: "objective" };
  }
  return nodes;
}
