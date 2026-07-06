import { describe, expect, it } from "vitest";
import { NodeQueue } from "./nodeQueue";
import { createTestNeutralNode } from "../test/nodeJudgmentFixtures";

describe("NodeQueue (T-S0-4)", () => {
  it("injectNext는 다음 처리 노드를 큐 앞에 삽입한다", () => {
    const entry = createTestNeutralNode({ nodeInstanceId: "entry", role: "entry" });
    const exit = createTestNeutralNode({ nodeInstanceId: "exit", role: "exit" });
    const injected = createTestNeutralNode({ nodeInstanceId: "injected", role: "obstacle" });
    const queue = new NodeQueue([entry, exit]);

    queue.pop();
    queue.injectNext([injected]);

    expect(queue.pop()?.nodeInstanceId).toBe("injected");
    expect(queue.pop()?.nodeInstanceId).toBe("exit");
  });

  it("injectBeforeExit는 exit 앞에 삽입한다", () => {
    const entry = createTestNeutralNode({ nodeInstanceId: "entry", role: "entry" });
    const exit = createTestNeutralNode({ nodeInstanceId: "exit", role: "exit" });
    const injected = createTestNeutralNode({ nodeInstanceId: "emergency", role: "obstacle", nodeKind: "emergency" });
    const queue = new NodeQueue([entry, exit]);

    queue.injectBeforeExit([injected]);

    expect(queue.remaining().map((n) => n.nodeInstanceId)).toEqual(["entry", "emergency", "exit"]);
  });
});
