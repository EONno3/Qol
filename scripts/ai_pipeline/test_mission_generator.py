import unittest
import sys
import os
import statistics

# scripts/ai_pipeline 경로를 sys.path에 추가하여 batch_generate_missions 임포트 가능케 함
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import batch_generate_missions as mg
except ImportError:
    mg = None


class TestLocation(unittest.TestCase):
    def setUp(self):
        if mg is None:
            self.skipTest("batch_generate_missions.py cannot be imported.")

    def test_location_consistency(self):
        """지역→구역→상세구역→스팟이 LOCATION_POOLS와 일관되게 조립된다."""
        for _ in range(300):
            loc = mg.generate_location()
            layer = loc["layer"]
            self.assertIn(layer, mg.LOCATION_POOLS)
            pool = mg.LOCATION_POOLS[layer]
            self.assertIn(loc["zone"], pool["zones"])
            self.assertIn(loc["structure"], pool["structures"][loc["zone"]])
            self.assertIn(loc["spot"], pool["spots"][loc["structure"]])


class TestConditionalSelection(unittest.TestCase):
    def setUp(self):
        if mg is None:
            self.skipTest("batch_generate_missions.py cannot be imported.")

    def test_target_obeys_descending_rule(self):
        """의뢰 목표는 의뢰 장소로 '내려올 수 있는' 세력이어야 한다(상승 금지)."""
        for _ in range(500):
            m = mg.generate_mission_base()
            tgt = m["targetFaction"]
            layer = m["location"]["layer"]
            group = mg.faction_group(tgt)
            self.assertIsNotNone(group)
            self.assertLessEqual(
                mg.GROUP_MIN_DEPTH[group], mg.LAYER_DEPTH[layer],
                f"상승 불가 위반: layer={layer}, target={tgt}, group={group}",
            )

    def test_mission_type_targets_include_target(self):
        """선택된 미션 타입의 대상 풀에 실제 대상 팩션이 포함되어야 한다."""
        for _ in range(500):
            m = mg.generate_mission_base()
            chain = mg.MISSION_CHAINS[m["missionType"]]
            self.assertIn(m["targetFaction"], chain["targets"])

    def test_difficulty_gating(self):
        """타입의 최소 난이도 게이팅이 지켜져야 한다(별1 비밀미션 같은 부조리 차단)."""
        for _ in range(500):
            m = mg.generate_mission_base()
            min_diff = mg.TYPE_MIN_DIFFICULTY.get(m["missionType"], 1)
            self.assertGreaterEqual(m["difficulty"], min_diff)

    def test_upper_layer_targets_are_corp_only(self):
        """상층 의뢰의 목표는 메가코프 하한선 이상만 허용된다."""
        for _ in range(500):
            m = mg.generate_mission_base()
            if m["location"]["layer"] == "상층":
                self.assertIn(m["targetFaction"], mg.FACTION_CORP)

    def test_client_separated_from_target(self):
        """의뢰자가 있으면 대상과 달라야 하고, 팩션 풀에 존재해야 한다."""
        for _ in range(500):
            m = mg.generate_mission_base()
            if m["clientFaction"] is not None:
                self.assertIn(m["clientFaction"], mg.FACTIONS_POOL)
                self.assertNotEqual(m["clientFaction"], m["targetFaction"])
    
    def test_all_types_remain_possible_per_layer(self):
        """계층별 타입을 2종으로 제한하지 않는다. (모든 타입 가중치가 열린다)"""
        all_types = set(mg.MISSION_CHAINS.keys())
        for layer in ("하층", "중층", "상층"):
            self.assertEqual(set(mg.LAYER_TYPE_BASE_WEIGHTS[layer].keys()), all_types)
            for t in all_types:
                self.assertGreater(mg.LAYER_TYPE_BASE_WEIGHTS[layer][t], 0)

    def test_difficulty_in_range(self):
        for _ in range(300):
            m = mg.generate_mission_base()
            self.assertIn(m["difficulty"], [1, 2, 3, 4, 5])


class TestExtendedModel(unittest.TestCase):
    def setUp(self):
        if mg is None:
            self.skipTest("batch_generate_missions.py cannot be imported.")

    def test_node_count_matches_difficulty(self):
        for _ in range(100):
            m = mg.generate_mission_base()
            self.assertEqual(len(m["nodes"]), m["difficulty"] + 2)
            for idx, node in enumerate(m["nodes"]):
                self.assertEqual(node["step"], idx + 1)
                self.assertIn("name", node)
                self.assertIn("stat_check", node)
                self.assertIn("role", node)

    def test_economy_and_mechanics(self):
        for _ in range(100):
            m = mg.generate_mission_base()
            self.assertIn("reward_credits", m["economy"])
            self.assertGreater(m["economy"]["reward_credits"], 0)
            self.assertLessEqual(m["mechanics"]["visibility_limit"], 100)
            self.assertGreaterEqual(m["mechanics"]["visibility_limit"], 20)
    
    def test_difficulty_group_ordering(self):
        """난이도는 구조물이 아니라 대상 팩션 그룹 경향을 따른다."""
        corp = [mg.generate_difficulty("마사다", "전투") for _ in range(700)]
        mid = [mg.generate_difficulty("Ten Men", "전투") for _ in range(700)]
        low = [mg.generate_difficulty("더 밸브", "전투") for _ in range(700)]
        self.assertGreater(statistics.mean(corp), statistics.mean(mid))
        self.assertGreater(statistics.mean(mid), statistics.mean(low))


class TestRequirementInference(unittest.TestCase):
    def setUp(self):
        if mg is None:
            self.skipTest("batch_generate_missions.py cannot be imported.")

    def test_vent_structure(self):
        m = {
            "missionType": "지원", "missionDetail": "수리", "targetFaction": "더 댐퍼",
            "missionGoal": {"type": "시스템 복구"},
            "location": {"layer": "하층", "zone": "언더리드", "structure": "벤트", "spot": "중앙 공조실"},
            "danger": "더 댐퍼 고풍량 인공 돌풍 및 협소 공간",
        }
        reqs = mg.infer_requirements(m)
        self.assertIn("방풍 고글 및 판초", reqs["mandatory"])
        self.assertIn("#타박상", reqs["potential_statuses"])
        self.assertIn("#열피로", reqs["potential_statuses"])

    def test_pipe_structure(self):
        m = {
            "missionType": "지원", "missionDetail": "수리", "targetFaction": "더 밸브",
            "missionGoal": {"type": "시스템 복구"},
            "location": {"layer": "하층", "zone": "언더리드", "structure": "파이프", "spot": "3번 폐수 밸브 교차점"},
            "danger": "더 밸브 화학 폐수 및 맹독 물질 누출",
        }
        reqs = mg.infer_requirements(m)
        self.assertIn("방독 보호구 (밀폐형)", reqs["mandatory"])
        self.assertIn("#독성노출", reqs["potential_statuses"])

    def test_line_structure(self):
        m = {
            "missionType": "지원", "missionDetail": "수리", "targetFaction": "더 퓨즈",
            "missionGoal": {"type": "시스템 복구"},
            "location": {"layer": "하층", "zone": "언더리드", "structure": "라인", "spot": "변압기 정비실"},
            "danger": "더 퓨즈 고압 전선 상시 누전 및 감전",
        }
        reqs = mg.infer_requirements(m)
        self.assertIn("두꺼운 절연 안전화", reqs["mandatory"])
        self.assertIn("#신경통", reqs["potential_statuses"])


if __name__ == "__main__":
    unittest.main()
