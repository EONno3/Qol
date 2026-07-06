import type { DeploymentVerdict, Outlook, ResultType, Tier } from "../data/types";

export const tierLabel: Record<Tier, string> = {
  lower: "하층",
  mid: "중층",
  upper: "상층",
};

export const verdictLabel: Record<DeploymentVerdict, string> = {
  clear: "출격 가능",
  warning: "경고",
  locked: "출격 불가",
};

export const resultTypeLabel: Record<ResultType, string> = {
  success: "성공",
  partial_success: "부분 성공",
  failure: "실패",
  early_withdrawal: "조기 철수",
  incident: "사고",
};

export const outlookLabel: Record<Outlook, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
};

export function tierClass(tier: Tier): string {
  return `tier-${tier}`;
}

export function verdictClass(verdict: DeploymentVerdict): string {
  return `verdict-${verdict}`;
}

export function resultClass(result: ResultType): string {
  return `result-${result}`;
}
