import os

import sys

import unittest



sys.path.append(os.path.dirname(os.path.abspath(__file__)))



from narrate_prompt import build_narrate_prompt, build_narrate_system_prompt, PERSONA_STYLE_REFERENCES





SAMPLE_TRIGGERED_TAGS = [

    {

        "tagId": "tag_gear_insulated_work_habit",

        "sourceType": "gear",

        "sourceId": "gear_feet_insulated_boots_01",

        "sourceDisplayNameKo": "러버세인트 절연 부츠",

        "ruleId": "node_insulated_vs_electric",

        "reading": "positive",

        "contributionKo": "러버세인트 절연 부츠가 전기 위협 관문 통과에 기여했다",

    }

]





def base_payload():

    return {

        "missionName": "퓨즈 캐패시터 점검",

        "mercName": "차단기",

        "mercId": "merc_breaker_01",

        "resultType": "success",

        "summaryLogKo": "작전 목표를 성공적으로 달성하고 무사히 복귀했습니다.",

        "nodeLogs": ["[1노드] 전기 관문 - 통과"],

    }





class TestNarratePromptTriggeredTags(unittest.TestCase):

    def test_t_s4_4_triggered_tags_section_in_prompt(self):

        """T-S4-4: triggeredTags가 있으면 프롬프트에 발동 팩트 섹션이 주입된다."""

        data = {**base_payload(), "triggeredTags": SAMPLE_TRIGGERED_TAGS}

        prompt = build_narrate_prompt(data)



        self.assertIn("발동 태그 팩트", prompt)

        self.assertIn("전기 위협", prompt)

        self.assertIn("발동:", prompt)

        # 장비 정식 명칭은 본문 지시상 쓰지 않지만 contributionKo는 팩트로 전달 가능

        self.assertIn("절연", prompt)



    def test_t_s4_5_empty_triggered_tags_omits_section(self):

        """T-S4-5: triggeredTags가 비어 있으면 발동 팩트 섹션을 생략한다."""

        data = {**base_payload(), "triggeredTags": []}

        prompt = build_narrate_prompt(data)



        self.assertNotIn("발동 태그 팩트", prompt)





SAMPLE_NODE_RESOLUTIONS = [

    {

        "nodeInstanceId": "node_entry_0",

        "nameKo": "하층 진입로",

        "role": "entry",

        "roleLabelKo": "진입",

        "outcome": "pass",

        "passChance": 78,

        "tagPassChanceDelta": 0,

        "challengeTags": ["tag_context_lower_damp"],

        "triggeredTags": [],

    },

    {

        "nodeInstanceId": "node_obstacle_1",

        "nameKo": "변전실 통제선",

        "role": "obstacle",

        "roleLabelKo": "관문",

        "outcome": "pass",

        "passChance": 64,

        "tagPassChanceDelta": 6,

        "challengeTags": ["tag_threat_electric"],

        "triggeredTags": SAMPLE_TRIGGERED_TAGS,

    },

    {

        "nodeInstanceId": "node_exit_2",

        "nameKo": "폐수 배수로",

        "role": "exit",

        "roleLabelKo": "이탈",

        "outcome": "pass",

        "passChance": 72,

        "tagPassChanceDelta": 18,

        "challengeTags": ["tag_context_lower_wastewater"],

        "triggeredTags": [

            {

                "tagId": "tag_gear_gas_mask",

                "sourceType": "gear",

                "sourceId": "gear_gas_mask_01",

                "ruleId": "pool_wastewater_gas_mask",

                "reading": "positive",

            }

        ],

    },

]





class TestNarratePromptNodeResolutions(unittest.TestCase):

    def test_t_s5_1_node_resolutions_section_in_prompt(self):

        """T-S5-1: nodeResolutions가 있으면 프롬프트에 관문별 팩트 섹션이 주입된다."""

        data = {**base_payload(), "nodeResolutions": SAMPLE_NODE_RESOLUTIONS, "triggeredTags": []}

        prompt = build_narrate_prompt(data)



        self.assertIn("관문별 팩트", prompt)

        self.assertIn("하층 진입로", prompt)

        self.assertIn("변전실 통제선", prompt)



    def test_t_s5_2_node_outcome_and_role_in_prompt(self):

        """T-S5-2: 노드별 역할·결과(outcome)가 프롬프트에 포함된다."""

        data = {**base_payload(), "nodeResolutions": SAMPLE_NODE_RESOLUTIONS, "triggeredTags": []}

        prompt = build_narrate_prompt(data)



        self.assertIn("진입", prompt)

        self.assertIn("관문", prompt)

        self.assertIn("pass", prompt)



    def test_t_s5_3_per_node_triggered_facts(self):

        """T-S5-3: 노드별 triggered 팩트가 해당 관문 블록에만 포함된다."""

        data = {**base_payload(), "nodeResolutions": SAMPLE_NODE_RESOLUTIONS, "triggeredTags": []}

        prompt = build_narrate_prompt(data)



        obstacle_idx = prompt.index("[2] 변전실 통제선")

        entry_idx = prompt.index("[1] 하층 진입로")

        entry_end = prompt.index("[2] 변전실 통제선")

        entry_block = prompt[entry_idx:entry_end]

        obstacle_block = prompt[obstacle_idx:]



        self.assertLess(entry_idx, obstacle_idx)

        self.assertIn("발동:", obstacle_block)

        self.assertIn("전기 위협", obstacle_block)

        self.assertNotIn("발동:", entry_block)



    def test_t_s5_4_empty_node_resolutions_omits_section(self):

        """T-S5-4: nodeResolutions가 비어 있으면 관문별 팩트 섹션을 생략한다."""

        data = {**base_payload(), "nodeResolutions": [], "triggeredTags": []}

        prompt = build_narrate_prompt(data)



        self.assertNotIn("관문별 팩트 (시간 순서대로", prompt)





INTERVENED_NODE_RESOLUTIONS = [
    {
        "nodeInstanceId": "node_obstacle_1",
        "nameKo": "중간 관문 1",
        "role": "obstacle",
        "roleLabelKo": "관문",
        "outcome": "critical",
        "passChance": 40,
        "tagPassChanceDelta": 0,
        "challengeTags": [],
        "triggeredTags": [],
        "intervened": True,
    },
    {
        "nodeInstanceId": "node_objective_2",
        "nameKo": "핵심 목표 수행",
        "role": "objective",
        "roleLabelKo": "목표",
        "outcome": "pass",
        "passChance": 55,
        "tagPassChanceDelta": 0,
        "challengeTags": [],
        "triggeredTags": [],
        "intervened": False,
    },
]


class TestNarratePromptFixerFieldLog(unittest.TestCase):
    """T-DC-NARR-FIXER: 캐치업(픽서 1인칭) 서사 모드 프롬프트."""

    def _fixer_payload(self):
        return {
            **base_payload(),
            "narrativeMode": "fixer_field_log",
            "nodeResolutions": INTERVENED_NODE_RESOLUTIONS,
            "triggeredTags": [],
        }

    def test_t_dc_narr_fixer_1_fixer_system_prompt_not_merc(self):
        """fixer_field_log 모드는 용병 페르소나·레퍼런스 대신 픽서(관제소) 1인칭 지시를 사용한다."""
        prompt = build_narrate_prompt(self._fixer_payload())

        self.assertIn("관제소", prompt)
        self.assertIn("픽서", prompt)
        self.assertIn("1인칭", prompt)
        self.assertNotIn("당신은 돔 도시 '콜(Qol)'의 용병", prompt)
        breaker_ref = PERSONA_STYLE_REFERENCES["merc_breaker_01"]
        self.assertNotIn(breaker_ref, prompt)

    def test_t_dc_narr_fixer_2_observer_intervention_facts(self):
        """개입 구간은 [개입 지시] 팩트로, 관찰→감지→지시 골격 가이드가 있다."""
        prompt = build_narrate_prompt(self._fixer_payload())

        self.assertIn("[개입 지시 구간]", prompt)
        self.assertIn("관찰", prompt)
        self.assertIn("감지", prompt)
        self.assertIn("지시", prompt)
        self.assertNotIn("[개입 수행]", prompt)
        self.assertIn("누가", prompt)  # 금지어로 명시
        self.assertIn("버튼", prompt)  # 환각 통제

    def test_t_dc_narr_fixer_3_ban_dry_status_only(self):
        """건조한 상태 나열만으로 끝내지 말라는 지시가 있다."""
        prompt = build_narrate_prompt(self._fixer_payload())

        self.assertIn("통과 확인", prompt)  # 금지 예시로 명시

    def test_t_dc_narr_fixer_4_merc_mode_unchanged_without_narrative_mode(self):
        """기본(merc_diary) 모드는 용병 1인칭 프롬프트를 유지한다."""
        data = {**base_payload(), "nodeResolutions": SAMPLE_NODE_RESOLUTIONS, "triggeredTags": []}
        prompt = build_narrate_prompt(data)

        self.assertIn("당신은 돔 도시 '콜(Qol)'의 용병", prompt)
        self.assertNotIn("narrativeMode", prompt)


class TestNarratePromptCatchUpIntervention(unittest.TestCase):
    """레거시: merc_diary 경로 — 개입 팩트는 fixer_field_log로 이전됨."""

    def test_t_dc_narr_prompt_3_no_fact_when_no_intervention(self):
        """개입이 없으면 merc 모드에서 개입 팩트가 주입되지 않는다."""
        data = {**base_payload(), "nodeResolutions": SAMPLE_NODE_RESOLUTIONS, "triggeredTags": []}
        prompt = build_narrate_prompt(data)

        self.assertNotIn("[개입 지시 구간]", prompt)
        self.assertNotIn("관제소(픽서) 현장 개입", prompt)


class TestNarratePromptLightweight(unittest.TestCase):

    """경량화·팩트 중심 프롬프트 검증."""



    def test_single_reference_only(self):

        """해당 용병의 레퍼런스만 1개 포함되고, 다른 용병 레퍼런스는 포함되지 않는다."""

        data = {**base_payload(), "triggeredTags": []}

        prompt = build_narrate_prompt(data)



        breaker_ref = PERSONA_STYLE_REFERENCES["merc_breaker_01"]

        self.assertIn(breaker_ref, prompt)



        for merc_id, ref in PERSONA_STYLE_REFERENCES.items():

            if merc_id != "merc_breaker_01":

                self.assertNotIn(ref, prompt, f"{merc_id} 레퍼런스가 잘못 포함됨")



    def test_skeleton_structure(self):

        """내부 스켈레톤([도입]/[핵심]/[마무리])이 프롬프트에 포함된다."""

        data = {**base_payload(), "triggeredTags": []}

        prompt = build_narrate_prompt(data)



        self.assertIn("[도입]", prompt)

        self.assertIn("[핵심]", prompt)

        self.assertIn("[마무리]", prompt)

        self.assertIn("라벨은 붙이지 말고", prompt)

        self.assertIn("구체적 행동", prompt)



    def test_t_lw_5_fact_driven_no_sensory_overfit(self):

        """T-LW-5: 오감 강제·빈 구간 우회 없음, 팩트·행동 중심 규칙."""

        system_prompt = build_narrate_system_prompt(

            "차단기", "merc_breaker_01",

            include_triggered_guidance=True,

            include_node_resolution_guidance=True,

        )

        self.assertIn("극도로 제한", system_prompt)

        self.assertIn("1인칭", system_prompt)

        self.assertNotIn("층층이 쌓아라", system_prompt)

        self.assertNotIn("복합문", system_prompt)

        self.assertNotIn("감각(냄새", system_prompt)

        self.assertNotIn("2~3문장", system_prompt)

        self.assertNotIn("3~5문장", system_prompt)



        data = {**base_payload(), "nodeResolutions": SAMPLE_NODE_RESOLUTIONS, "triggeredTags": []}

        prompt = build_narrate_prompt(data)

        self.assertNotIn("태그 개입: 없음", prompt)

        self.assertNotIn("현장 감각 단서", prompt)

        self.assertNotIn("감각 힌트", prompt)

        self.assertIn("환경/위협", prompt)



        exit_idx = prompt.index("[3] 폐수 배수로")

        exit_block = prompt[exit_idx:]

        self.assertIn("폐수", exit_block)

        self.assertIn("방독", exit_block)



    def test_rule_count_limit(self):

        """시스템 프롬프트 내 규칙 번호가 4개 이하이다."""

        system_prompt = build_narrate_system_prompt(

            "차단기", "merc_breaker_01",

            include_triggered_guidance=True,

            include_node_resolution_guidance=True,

        )

        import re

        rule_numbers = re.findall(r"^(\d+)\.", system_prompt, re.MULTILINE)

        self.assertLessEqual(len(rule_numbers), 4, f"규칙이 4개 초과: {rule_numbers}")



    def test_persona_preserved(self):

        """MERC_PERSONAS 페르소나가 시스템 프롬프트에 주입된다."""

        system_prompt = build_narrate_system_prompt(

            "차단기", "merc_breaker_01",

            include_triggered_guidance=False,

            include_node_resolution_guidance=False,

        )

        self.assertIn("전직 하층 전력 하청업체", system_prompt)

        self.assertIn("1인칭 작전 일지", system_prompt)



    def test_no_other_merc_reference_for_velvet(self):

        """벨벳 나이프 프롬프트에 다른 용병 레퍼런스가 혼입되지 않는다."""

        data = {

            **base_payload(),

            "mercName": "벨벳 나이프",

            "mercId": "merc_velvet_knife_01",

            "triggeredTags": [],

        }

        prompt = build_narrate_prompt(data)



        velvet_ref = PERSONA_STYLE_REFERENCES["merc_velvet_knife_01"]

        self.assertIn(velvet_ref, prompt)



        for merc_id, ref in PERSONA_STYLE_REFERENCES.items():

            if merc_id != "merc_velvet_knife_01":

                self.assertNotIn(ref, prompt, f"{merc_id} 레퍼런스가 벨벳 나이프 프롬프트에 혼입됨")





if __name__ == "__main__":

    unittest.main()


