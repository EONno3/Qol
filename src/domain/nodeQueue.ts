import type { QueuedNode } from "../data/types";

let instanceCounter = 0;

export function nextNodeInstanceId(prefix = "node"): string {
  instanceCounter += 1;
  return `${prefix}_${instanceCounter}`;
}

/** 테스트 간 결정적 ID */
export function resetNodeInstanceCounter(): void {
  instanceCounter = 0;
}

export class NodeQueue {
  private items: QueuedNode[];

  constructor(initial: QueuedNode[]) {
    this.items = [...initial];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  peek(): QueuedNode | undefined {
    return this.items[0];
  }

  pop(): QueuedNode | undefined {
    return this.items.shift();
  }

  remaining(): QueuedNode[] {
    return [...this.items];
  }

  clear(): void {
    this.items = [];
  }

  /** 현재 처리 위치 바로 다음에 삽입 */
  injectNext(nodes: QueuedNode[]): void {
    this.items.splice(0, 0, ...nodes);
  }

  /** 큐 맨 끝(이탈 직전)에 삽입 — exit 앞 */
  injectBeforeExit(nodes: QueuedNode[]): void {
    const exitIdx = this.items.findIndex((n) => n.role === "exit");
    if (exitIdx === -1) {
      this.items.push(...nodes);
      return;
    }
    this.items.splice(exitIdx, 0, ...nodes);
  }

  injectAt(index: number, nodes: QueuedNode[]): void {
    this.items.splice(index, 0, ...nodes);
  }
}
