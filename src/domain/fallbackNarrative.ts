import type { Mercenary, Mission, ResultReport } from "../data/types";
import { STATUS_KIA } from "../data/constants";

/**
 * AI 내레이터 서버에 연결하지 못했을 때(FALLBACK) 결과 보고서 자리에 노출할
 * 용병 1인칭 작전 일지를 생성한다.
 *
 * 설계 원칙:
 *  - `engine.ts`가 만든 기계식 `summaryLogKo`(예: "작전 실패. 현장에서...")를
 *    그대로 노출하지 않고, 용병 시점의 자연스러운 줄글로 재구성한다.
 *  - 게임 시스템 수치(확률/굴림/스탯/% 등)는 절대 포함하지 않는다.
 *    그런 정보는 별도의 "상세 시스템 로그"에서만 제공한다.
 *  - 순수 함수: 동일 입력에 동일 출력. (무작위성 없음 → 테스트 가능)
 */
export function buildFallbackNarrative(
  report: ResultReport,
  mission: Mission,
  merc: Mercenary
): string {
  if (report.catchUpActive) {
    return buildFixerFallbackNarrative(report, mission, merc);
  }
  const who = merc.aliasKo || merc.displayNameKo || "용병";
  const missionName = mission.displayNameKo || "이번 건";
  const isKia = report.statusChanges.some((c) => c.statusId === STATUS_KIA);

  switch (report.resultType) {
    case "success":
      return (
        `'${missionName}', 깔끔하게 정리했다. 현장에 들어선 순간부터 나갈 때까지 ` +
        `흐름은 내 손안에 있었지. 큰 흔적도 남기지 않았고, 몸도 멀쩡하다. ` +
        `이 정도면 보수 값은 하고도 남았다. — ${who}`
      );

    case "partial_success":
      return (
        `'${missionName}'... 솔직히 중간에 다 틀어졌다고 생각했다. ` +
        `숨겨둔 마지막 패를 꺼내 간신히 빠져나왔지만, 장비 몇 개는 그 자리에 두고 와야 했어. ` +
        `목표는 절반쯤 건졌으니 완전한 손해는 아니다. 그래도 다음엔 이런 식은 사양이다. — ${who}`
      );

    case "failure":
      if (isKia) {
        return (
          `[수신된 마지막 통신 기록] '${missionName}'. 퇴각로가 막혔다. ` +
          `사방이 적이고, 더는 빠져나갈 구멍이 보이지 않는다... ` +
          `이 기록이 누군가에게 닿는다면, 내 몫은 여기까지였다고 전해줘. ` +
          `${who}의 신호는 현장에서 끊겼다.`
        );
      }
      return (
        `'${missionName}'은 완전히 실패했다. 현장에 고립됐고, 모든 게 어긋났지. ` +
        `이를 악물고 겨우 몸만 빠져나왔지만, 대가는 컸다. ` +
        `지워지지 않을 상처와 박살 난 의체를 안고 돌아왔다. 운이 좋았던 거다. — ${who}`
      );

    case "early_withdrawal":
      return (
        `'${missionName}', 도중에 발을 뺐다. 감이 좋지 않았어. ` +
        `무리하게 밀어붙였다간 돌아오지 못할 판이라 판단했고, 나는 살아남는 쪽을 택했다. ` +
        `명분도 보수도 잃었지만, 시체가 되는 것보단 낫지. — ${who}`
      );

    case "incident":
    default:
      return (
        `'${missionName}' 도중 예상 못 한 변수가 터졌다. ` +
        `계획대로 흘러간 게 하나도 없었고, 현장은 순식간에 아수라장이 됐지. ` +
        `일단 살아 돌아온 것만으로도 다행이라 해야 하나. — ${who}`
      );
  }
}

/** 캐치업(FALLBACK) — 관제소 픽서 1인칭 관제 기록 */
function buildFixerFallbackNarrative(
  report: ResultReport,
  mission: Mission,
  merc: Mercenary
): string {
  const mercLabel = merc.aliasKo || merc.displayNameKo || "파견 용병";
  const missionName = mission.displayNameKo || "이번 건";
  const intervened = (report.nodeResolutions ?? []).filter((n) => n.intervened);
  const interventionNote =
    intervened.length > 0
      ? intervened
          .map(
            (n) =>
              ` 「${n.nameKo}」에서 위험 징후를 포착해 루트·전술 데이터 지시를 내렸고,`
          )
          .join("")
      : "";

  switch (report.resultType) {
    case "success":
      return (
        `[관제소 기록] '${missionName}'. 드론 피드로 ${mercLabel}의 행적을 따라갔다.` +
        interventionNote +
        ` 그는 내 지시에 맞춰 각 관문을 넘겼다. 목표 달성, 회수 완료.`
      );
    case "partial_success":
      return (
        `[관제소 기록] '${missionName}'. ${mercLabel} 현장을 지켜보는 중 변수가 터졌다.` +
        interventionNote +
        ` 일부만 확보한 채 퇴각 지시를 내렸다.`
      );
    case "failure":
      return (
        `[관제소 기록] '${missionName}'. ${mercLabel} 신호가 끊기기 직전까지 피드를 붙잡았다.` +
        interventionNote +
        ` 개입에도 핵심 목표를 확보하지 못했다.`
      );
    default:
      return (
        `[관제소 기록] '${missionName}'. ${mercLabel} 현장 관찰 중 예상 외 변수.` +
        interventionNote +
        ` 상황 정리 후 보고서를 마감한다.`
      );
  }
}
