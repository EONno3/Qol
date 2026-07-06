import sys
import os
import json
import random
# llama_cpp 임포트 제거 (로컬 AI 서버 단일 1모델 구동 연동)
import urllib.request
import urllib.parse

# Windows 터미널에서 한글 깨짐 방지
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# 1. 지리 정보 풀 정의 (돔 도시 '콜'의 계층 구조 — 하층/중층/상층)
#    - 하층(Tier 3): 격리벽 바깥 UNzone(더 널스) + 격리벽 안쪽 언더리드 3대 인프라(파이프/라인/벤트)
#    - 중층(Tier 2): 4대 메가코프 영지. 각 구역 안에 중층 독립 팩션 시설이 분포
#    - 상층(Tier 1): 가문 저택지구 / 사교·의회 구역 / 비공개 향락 구역
#    ※ 돔 외부(콜 밖의 외부 도시·국가)나 정부기관(Tier 0)은 일반 미션 무대에서 제외(스토리 연계용으로 보류)
LOCATION_POOLS = {
    "하층": {
        "zones": ["UNzone", "언더리드"],
        "structures": {
            "UNzone": ["쓰레기 지대", "무허가 판자촌", "암시장 골목"],
            "언더리드": ["파이프", "라인", "벤트"]
        },
        "spots": {
            "쓰레기 지대": ["상층 폐기물 낙하 지점", "재활용 분류장", "폐자재 야적장"],
            "무허가 판자촌": ["판자촌 뒷골목", "무너진 컨테이너 거주지", "배급 줄 광장"],
            "암시장 골목": ["장기 밀매 뒷방", "불법 파츠 노점", "밀주 양조장"],
            "파이프": ["3번 폐수 밸브 교차점", "지하 수로 8번 분기 밸브", "폐수 정화조 내부"],
            "라인": ["제3변전소 고압 구역", "송전탑 피복 교체 구간", "변압기 정비실"],
            "벤트": ["A동 배기조 제어팬 환풍구", "C구역 고온 배기 통로", "중앙 공조실"]
        }
    },
    "중층": {
        "zones": ["바이루이 구역", "마사다 구역", "키쿠모토 구역", "알-마디낫 구역"],
        "structures": {
            "바이루이 구역": ["메디컬 콤플렉스", "화롄 배급 센터", "개조 시술 골목"],
            "마사다 구역": ["오겐 군수 공방", "쿠파트 금융가", "전투 스포츠 경기장"],
            "키쿠모토 구역": ["신키로 네온 클럽가", "전뇌 감시 구역", "통신 사각지대"],
            "알-마디낫 구역": ["물류 터미널", "검문 구역", "화물 승강기 환승로"]
        },
        "spots": {
            "메디컬 콤플렉스": ["VIP 입원동 백도어", "장기 배양실 통로"],
            "화롄 배급 센터": ["합성식량 가공 라인", "배급 물류 창고"],
            "개조 시술 골목": ["불법 시술 부스", "중고 파츠 바자르"],
            "오겐 군수 공방": ["시제 크롬 조립 라인", "무기 시험장"],
            "쿠파트 금융가": ["채권 거래소 뒷방", "담보물 보관소"],
            "전투 스포츠 경기장": ["지하 무장 결투장", "선수 대기 라커룸"],
            "신키로 네온 클럽가": ["VIP 브레인댄스 라운지", "광고판 뒤 감각 캡슐"],
            "전뇌 감시 구역": ["전뇌망 검문 게이트", "신경계 중계소"],
            "통신 사각지대": ["폐쇄 아파트 서버실", "공공도서관 지하 회선실"],
            "물류 터미널": ["수직 화물 승강기 도크", "통행료 검문소"],
            "검문 구역": ["격리벽 보안 게이트", "무장 스캔 라인"],
            "화물 승강기 환승로": ["고가도로 하부 우회로", "폐쇄 유지보수 터널"]
        }
    },
    "상층": {
        "zones": ["가문 저택지구", "사교·의회 구역", "비공개 향락 구역"],
        "structures": {
            "가문 저택지구": ["CEO 가문 저택", "공중 정원", "프라이빗 갤러리"],
            "사교·의회 구역": ["연회장", "상층 승강기 게이트", "의회 라운지"],
            "비공개 향락 구역": ["비공개 클리닉", "벨벳블랙 살롱"]
        },
        "spots": {
            "CEO 가문 저택": ["가주 집무실", "지하 금고"],
            "공중 정원": ["테라스 정원", "온실 전망대"],
            "프라이빗 갤러리": ["비공개 전시실", "경매 살롱"],
            "연회장": ["가면 무도회장", "VIP 만찬홀"],
            "상층 승강기 게이트": ["전용 엘리베이터 로비", "생체 인증 검문대"],
            "의회 라운지": ["의원 전용 라운지", "비공개 협상실"],
            "비공개 클리닉": ["수명 연장 시술실", "금지 임상 병동"],
            "벨벳블랙 살롱": ["비밀 파티홀", "익명 컨시어지 부스"]
        }
    }
}

# 2. 미션 체인 사전 정의 (독자 세계관 '콜'의 팩션 반영)
#    targets는 미션 타입에 맞는 메인 팩션(메가코프/중층 독립 팩션/하층 인프라 팩션)만 사용한다.
MISSION_CHAINS = {
    "잠입": {
        "details": ["탈취", "정찰", "도청"],
        "goals": {
            "탈취": ["기밀", "프로토타입"],
            "정찰": ["경로 파악", "경비 태세 조사"],
            "도청": ["통화 기록", "기밀 회의 녹취"]
        },
        "targets": ["바이루이", "키쿠모토", "마사다", "알-마디낫", "Rattle"]
    },
    "전투": {
        "details": ["결투", "소탕", "습격"],
        "goals": {
            "결투": ["결투 승리"],
            "소탕": ["위협 소거"],
            "습격": ["호송대 무력화", "창고 약탈"]
        },
        "targets": ["더 퓨즈", "더 밸브", "더 댐퍼", "더 널스", "No Claim"]
    },
    "지원": {
        "details": ["수리", "배달", "의료"],
        "goals": {
            "수리": ["시스템 복구", "장비 재정비"],
            "배달": ["특수 물품 전달", "긴급 패키지 운송"],
            "의료": ["부상병 치료", "임플란트 안정화"]
        },
        "targets": ["더 밸브", "더 댐퍼", "더 퓨즈", "더 널스", "One More"]
    },
    "교섭": {
        "details": ["협상", "중재"],
        "goals": {
            "협상": ["계약 체결 보조", "배상금 절충"],
            "중재": ["분쟁 조정", "평판 거래"]
        },
        "targets": ["마사다", "바이루이", "키쿠모토", "알-마디낫", "Ten Men", "Plus One"]
    },
    "추적": {
        "details": ["회수", "감시"],
        "goals": {
            "회수": ["기밀 서류 확보", "도난 자산 회수"],
            "감시": ["경쟁사 임원 추적", "연구원 동태 감시"]
        },
        "targets": ["마사다", "바이루이", "키쿠모토", "알-마디낫", "No Claim", "Rattle"]
    },
    "비밀": {
        "details": ["수색", "조사", "포섭"],
        "goals": {
            "수색": ["실종자 수색", "탈주자 위치 파악"],
            "조사": ["의문의 변사체 조사", "비밀 실험 진상 파악"],
            "포섭": ["내부 첩자 포섭", "기술자 망명 유도"]
        },
        "targets": ["바이루이", "키쿠모토", "No Claim", "Plus One", "Rattle", "La Nada"]
    }
}

# 메인 팩션 풀 (의뢰자/대상으로 등장, 평판 시스템 대상)
#  - 메가코프 4 / 중층 독립 팩션 6 / 하층 인프라·무법 팩션 4
FACTION_CORP = ["바이루이", "마사다", "키쿠모토", "알-마디낫"]          # 중층 지배·상층 연계
FACTION_MID = ["La Nada", "No Claim", "Plus One", "Rattle", "One More", "Ten Men"]  # 중층 독립
FACTION_LOW = ["더 널스", "더 밸브", "더 퓨즈", "더 댐퍼"]              # 하층 인프라·무법

FACTIONS_POOL = FACTION_CORP + FACTION_MID + FACTION_LOW

def faction_tier_label(f):
    if f in FACTION_CORP:
        return "메가코프(상위 권력)"
    if f in FACTION_MID:
        return "중층 독립 세력"
    if f in FACTION_LOW:
        return "하층 인프라·무법 세력"
    return "비공식 세력"

# 미션 타입별 최소 난이도(게이팅) — '바닥'만 정한다. 실제 난이도는 대상 팩션 그룹이 정한다.
# (스펙 §4: 모든 타입은 전 계층에서 등장 가능. 여기서는 너무 낮은 난이도만 막는 하한선 역할)
TYPE_MIN_DIFFICULTY = {"지원": 1, "전투": 1, "잠입": 1, "추적": 2, "교섭": 2, "비밀": 2}

# ---------------------------------------------------------------------
# 팩션 계층(본거지)과 '하강 규칙'
#   세계관: 중·상층 세력은 아래로 내려갈 수 있으나, 하층 세력은 위로 못 올라간다.
#   → 의뢰 '목표(대상)'는 작전 장소 계층으로 '내려올 수 있는' 세력 중에서만 뽑힌다.
#   (상층 작전의 목표 하한선 = 메가코프. 더 널스가 상층 목표가 되는 일은 원천 차단)
# ---------------------------------------------------------------------
LAYER_DEPTH = {"상층": 1, "중층": 2, "하층": 3}  # 숫자가 클수록 '아래(깊은 곳)'
# 그룹별 본거지 깊이(이 깊이보다 위로는 못 감). 메가코프는 상층(1)까지 닿음.
GROUP_MIN_DEPTH = {"메가코프": 1, "중층": 2, "하층": 3}


def faction_group(f):
    if f in FACTION_CORP:
        return "메가코프"
    if f in FACTION_MID:
        return "중층"
    if f in FACTION_LOW:
        return "하층"
    return None


def factions_reaching(layer):
    """작전 장소(layer)까지 '내려올 수 있는' 팩션 목록(=목표 후보)."""
    d = LAYER_DEPTH.get(layer, 2)
    return [f for f in FACTIONS_POOL if GROUP_MIN_DEPTH.get(faction_group(f), 9) <= d]


# 의뢰인(client) 익명 확률 — 스펙 §5 (상층일수록 정치적 기밀로 익명 선호)
CLIENT_ANON_PROB = {"하층": 0.10, "중층": 0.30, "상층": 0.50}

# 팩션별 의뢰 성향(주로 어떤 타입을 의뢰하는가) — 스펙 §3.2/§3.3 기반.
#   (스펙의 '기업' 성향 → 교섭, '공작' 성향 → 추적으로 매핑)
FACTION_CLIENT_TYPES = {
    "바이루이": {"지원", "교섭", "비밀"},
    "마사다": {"전투", "교섭", "추적"},
    "키쿠모토": {"잠입", "비밀", "추적"},
    "알-마디낫": {"잠입", "전투", "교섭"},
    "La Nada": {"잠입", "교섭", "비밀"},
    "No Claim": {"지원", "전투", "추적"},
    "Plus One": {"비밀", "교섭", "전투"},
    "Rattle": {"비밀", "지원", "추적"},
    "One More": {"지원", "교섭"},
    "Ten Men": {"교섭", "비밀"},
    "더 널스": {"전투", "지원"},
    "더 밸브": {"전투", "지원"},
    "더 퓨즈": {"전투", "지원"},
    "더 댐퍼": {"전투", "추적"},
}


def pick_client_faction(layer, mission_type, target_faction):
    """의뢰인 선정. 의뢰인은 작전 구역과 '달라도 된다'(어느 계층 세력이든 의뢰 가능).
    - 스펙 §5 확률로 익명(무소속) 의뢰가 발생한다.
    - 익명이 아니면 의뢰 성향(FACTION_CLIENT_TYPES)에 맞는 세력을 가중치로 고른다.
    - 대상(target)과 동일 세력은 제외한다.
    """
    if random.random() < CLIENT_ANON_PROB.get(layer, 0.3):
        return None
    weights = {}
    for f in FACTIONS_POOL:
        if f == target_faction:
            continue
        w = 5
        if mission_type in FACTION_CLIENT_TYPES.get(f, set()):
            w += 10  # 의뢰 성향이 맞으면 더 자주 의뢰한다
        weights[f] = w
    return _weighted_pick(weights) or random.choice([f for f in FACTIONS_POOL if f != target_faction])

# 군소 모임/동호회 풀 — 메인 팩션이 아닌, 세계관에 생동감을 주기 위한 비공식 모임.
#  상세 설정 없이 직관적인 이름만 둔다(예: 권총 사격 동호회 = '피스톨 마니아 클럽').
#  ※ 지금은 '자리'만 만들어 둔 상태. 자유롭게 항목을 추가할 수 있다.
#  ※ 실제 미션 타깃으로 등장시키려면 MINOR_GROUP_SPAWN_CHANCE를 0보다 크게 올린다.
#  ※ 군소 모임은 상세 세력 관계가 없으므로 평판(reputation) 변동 대상에서 제외된다.
MINOR_GROUPS = {
    "하층": [
        # 예: "고철 수집가 조합", "지하 투견장 단골들",
    ],
    "중층": [
        "피스톨 마니아 클럽",  # 예시: 권총 사격 동호회
        # 예: "심야 레이서 모임", "레트로 아케이드 동호회",
    ],
    "상층": [
        # 예: "골동품 경매 살롱", "가상 오페라 후원회",
    ],
}
MINOR_GROUP_SPAWN_CHANCE = 0.0  # 0이면 군소 모임은 타깃으로 등장하지 않음(자리만 확보)

DANGERS_POOL = [
    "F.R.S 무장 순찰대", "키쿠모토 전뇌망 감시 스캔", "사설 경호대 매복",
    "자동 방어 포탑", "노후 인프라 합선", "불안정한 구조물 붕괴"
]
LAYER_DANGERS_POOL = {
    "하층": [
        "무법 세력 기습",
        "격리벽 외곽 붕괴 잔해 낙하",
        "불법 매립지 독성 유출",
        "암시장 매복 인원",
    ],
    "중층": [
        "K-Sec 검문 강화",
        "실시간 동선 추적 스캔",
        "사설 경호대 매복",
        "노후 인프라 합선",
    ],
    "상층": [
        "생체 인증 검문 강화",
        "고감도 감시망 추적",
        "자동 방어 포탑",
        "정예 경호 인력 급파",
    ],
}

NODE_POOLS = {
    "잠입": {
        "entry": [
            {"name": "보안망 스캔 및 우회", "stat_check": "Cypher"},
            {"name": "직원 위장 및 게이트 통과", "stat_check": "Cool"},
            {"name": "사각지대 진입로 개척", "stat_check": "Pulse"}
        ],
        "action": [
            {"name": "내부 경비대 순찰망 회피", "stat_check": "Cypher"},
            {"name": "목표물 잠금장치 해제", "stat_check": "Wire"},
            {"name": "기밀 데이터 무선 다운로드", "stat_check": "Wire"},
            {"name": "핵심 구역 단기 정전 유발", "stat_check": "Cypher"},
            {"name": "보안 카메라 피드 루프 조작", "stat_check": "Cypher"}
        ],
        "exit": [
            {"name": "침입 흔적 은폐 및 탈출", "stat_check": "Cool"},
            {"name": "비상 환풍구 사출 및 이탈", "stat_check": "Frame"},
            {"name": "추적 신호 교란 및 도주", "stat_check": "Wire"}
        ]
    },
    "전투": {
        "entry": [
            {"name": "전면 돌파 및 적 진영 파괴", "stat_check": "Frame"},
            {"name": "유리한 사격 거점 선점", "stat_check": "Pulse"}
        ],
        "action": [
            {"name": "적 주력 화력망 무력화", "stat_check": "Frame"},
            {"name": "중장갑 목표물 타격", "stat_check": "Frame"},
            {"name": "엄폐물 간 기동 및 교전", "stat_check": "Pulse"},
            {"name": "적 지휘 거점 제압", "stat_check": "Frame"},
            {"name": "측면 우회 기습", "stat_check": "Pulse"}
        ],
        "exit": [
            {"name": "현장 이탈을 위한 화력망 제압", "stat_check": "Frame"},
            {"name": "추격대 절연 및 전술적 후퇴", "stat_check": "Cool"}
        ]
    },
    "지원": {
        "entry": [
            {"name": "목표 위치 진입 및 상황 파악", "stat_check": "Pulse"},
            {"name": "작업 장비 전개 및 통신 연결", "stat_check": "Wire"}
        ],
        "action": [
            {"name": "손상된 시스템 코어 긴급 수리", "stat_check": "Wire"},
            {"name": "필수 물자 하역 및 할당", "stat_check": "Frame"},
            {"name": "부상자 현장 응급 처치", "stat_check": "Wire"},
            {"name": "임시 우회 회로 구성", "stat_check": "Wire"},
            {"name": "위험 구역 안전 확보", "stat_check": "Pulse"}
        ],
        "exit": [
            {"name": "작업 흔적 최소화 및 장비 회수", "stat_check": "Cool"},
            {"name": "안전 확보 후 주변 이탈", "stat_check": "Pulse"}
        ]
    },
    "교섭": {
        "entry": [
            {"name": "의전 규격 확인 및 게이트 패스", "stat_check": "Cool"},
            {"name": "협상 테이블 사전 정지 작업", "stat_check": "Cypher"}
        ],
        "action": [
            {"name": "기업 실무진과의 직접 협상", "stat_check": "Cool"},
            {"name": "분쟁 당사자 간 중재", "stat_check": "Cool"},
            {"name": "계약 조건 절충 및 합의 유도", "stat_check": "Cool"},
            {"name": "협상 레버리지 확보", "stat_check": "Cool"},
            {"name": "내부자 접선 및 단서 교환", "stat_check": "Cypher"}
        ],
        "exit": [
            {"name": "계약서 서명 후 공식 퇴장", "stat_check": "Cool"},
            {"name": "합의문 전달 및 안전 철수", "stat_check": "Cypher"}
        ]
    },
    "추적": {
        "entry": [
            {"name": "대상 동선 사전 파악", "stat_check": "Cypher"},
            {"name": "잠복 관측 지점 확보", "stat_check": "Pulse"}
        ],
        "action": [
            {"name": "도난 자산 위치 추적", "stat_check": "Cypher"},
            {"name": "대상 미행 및 동태 감시", "stat_check": "Pulse"},
            {"name": "은닉 회수물 확보", "stat_check": "Wire"},
            {"name": "경쟁 정보원 역추적", "stat_check": "Cypher"},
            {"name": "도청·관측 장비 설치", "stat_check": "Cypher"}
        ],
        "exit": [
            {"name": "회수물 안전 반출", "stat_check": "Cool"},
            {"name": "추적 흔적 은폐 및 이탈", "stat_check": "Pulse"}
        ]
    },
    "비밀": {
        "entry": [
            {"name": "비공식 루트를 통한 진입", "stat_check": "Cypher"},
            {"name": "익명 제보 현장 수색", "stat_check": "Pulse"}
        ],
        "action": [
            {"name": "숨겨진 실험 구역 조사", "stat_check": "Pulse"},
            {"name": "타겟의 심리적 약점 압박", "stat_check": "Cool"},
            {"name": "미확인 돌연변이 흔적 분석", "stat_check": "Cypher"},
            {"name": "은밀한 도청 장치 설치", "stat_check": "Cypher"},
            {"name": "내부 협조자 포섭", "stat_check": "Cool"}
        ],
        "exit": [
            {"name": "기록 말소 후 암행 이탈", "stat_check": "Cypher"},
            {"name": "현장 은닉 및 감시망 이탈", "stat_check": "Pulse"}
        ]
    }
}

def generate_nodes(m_type, difficulty):
    """노드를 조립하고 역할(role)을 부여한다.

    역할은 판정 엔진이 결과의 '의미'를 다르게 다루는 핵심 데이터다.
      - entry(진입) / obstacle(중간 관문) / objective(핵심 목표) / exit(이탈)
    이탈 직전의 마지막 행동 노드를 '핵심 목표(objective)'로 지정한다.
    """
    pool = NODE_POOLS.get(m_type, NODE_POOLS["전투"])
    # 난이도 1성: 3개, 2성: 4개, 3성: 5개, 4성: 6개, 5성: 7개
    num_nodes = difficulty + 2
    num_actions = max(1, num_nodes - 2)

    selected_entry = random.choice(pool["entry"])
    selected_actions = random.sample(pool["action"], min(num_actions, len(pool["action"])))
    # 풀이 모자라 노드 수가 부족하면 난이도 정수가 깨지므로, 부족분은 풀에서 보충한다.
    while len(selected_actions) < num_actions:
        selected_actions.append(random.choice(pool["action"]))
    selected_exit = random.choice(pool["exit"])

    raw = [("entry", selected_entry)]
    raw += [("obstacle", a) for a in selected_actions]
    raw += [("exit", selected_exit)]

    # 마지막 중간 관문(이탈 직전)을 핵심 목표 노드로 승격한다.
    obstacle_idxs = [i for i, (role, _) in enumerate(raw) if role == "obstacle"]
    if obstacle_idxs:
        last = obstacle_idxs[-1]
        raw[last] = ("objective", raw[last][1])

    nodes = []
    for idx, (role, node) in enumerate(raw):
        nodes.append({
            "step": idx + 1,
            "name": node["name"],
            "stat_check": node["stat_check"],
            "role": role,
        })
    return nodes

# =====================================================================
# 스펙 정합 생성 시스템
#   의뢰 장소 ↔ 의뢰 목표는 '하강만 허용'(상승 금지) 규칙으로 정합 유지.
#   의뢰인과 의뢰 목표는 별개이며, 의뢰인은 타 계층/무소속도 가능.
# =====================================================================

# 스펙 §2.1 스테이션 위치(Tier) 기본 가중치
STATION_LAYER_MULTIPLIERS = {
    "하층": {"하층": 1.5, "중층": 0.7, "상층": 0.2},
    "중층": {"하층": 0.8, "중층": 1.4, "상층": 0.6},
    "상층": {"하층": 0.3, "중층": 0.8, "상층": 1.8},
}

# 스펙 §4 미션 타입 × 구역 기본 매핑
# (별 빈도를 수치화. 모든 타입은 모든 계층에서 등장 가능, 단 빈도 차이만 둔다.)
LAYER_TYPE_BASE_WEIGHTS = {
    "하층": {"전투": 40, "잠입": 35, "지원": 40, "교섭": 10, "추적": 20, "비밀": 20},
    "중층": {"전투": 35, "잠입": 40, "지원": 20, "교섭": 40, "추적": 30, "비밀": 35},
    "상층": {"전투": 10, "잠입": 35, "지원": 10, "교섭": 40, "추적": 35, "비밀": 40},
}

# 장소 연고(가중 보너스) — 후보 제한이 아니라 '가중 우대' 용도
ZONE_HOSTS = {
    "UNzone": ["더 널스"],
    "언더리드": ["더 밸브", "더 퓨즈", "더 댐퍼"],
    "바이루이 구역": ["바이루이", "One More", "La Nada"],
    "마사다 구역": ["마사다", "Ten Men"],
    "키쿠모토 구역": ["키쿠모토", "Rattle", "La Nada"],
    "알-마디낫 구역": ["알-마디낫", "No Claim", "Ten Men"],
    "가문 저택지구": ["바이루이", "마사다", "키쿠모토", "알-마디낫", "Plus One", "Ten Men"],
    "사교·의회 구역": ["Ten Men", "Plus One", "알-마디낫"],
    "비공개 향락 구역": ["La Nada", "Plus One", "키쿠모토"],
}
STRUCTURE_HOSTS = {
    "파이프": ["더 밸브"],
    "라인": ["더 퓨즈"],
    "벤트": ["더 댐퍼"],
}

# 대상 팩션 그룹별 난이도 분포(구조물별 차등 금지)
GROUP_DIFFICULTY_WEIGHTS = {
    "하층": {1: 60, 2: 25, 3: 10, 4: 4, 5: 1},
    "중층": {1: 30, 2: 35, 3: 20, 4: 10, 5: 5},
    "메가코프": {1: 10, 2: 20, 3: 35, 4: 25, 5: 10},
}


def _weighted_pick(weight_map):
    """{옵션: 가중치} 에서 가중치에 비례해 하나를 뽑는다. 비어 있으면 None."""
    items = [(k, v) for k, v in weight_map.items() if v and v > 0]
    if not items:
        return None
    keys = [k for k, _ in items]
    weights = [v for _, v in items]
    return random.choices(keys, weights=weights, k=1)[0]


def _normalize_layer_name(v):
    if not v:
        return None
    s = str(v).strip().lower()
    mapping = {
        "하층": "하층", "lower": "하층", "tier3": "하층", "tier_3": "하층",
        "중층": "중층", "middle": "중층", "mid": "중층", "tier2": "중층", "tier_2": "중층",
        "상층": "상층", "upper": "상층", "high": "상층", "tier1": "상층", "tier_1": "상층",
    }
    return mapping.get(s)


def _extract_station_layer(world_state):
    if not world_state:
        return None
    station = world_state.get("station_state", {}) if isinstance(world_state, dict) else {}
    if isinstance(station, dict):
        for key in ("location_tier", "tier", "layer"):
            val = _normalize_layer_name(station.get(key))
            if val:
                return val
    fixer = world_state.get("fixer_summary", {}) if isinstance(world_state, dict) else {}
    if isinstance(fixer, dict):
        return _normalize_layer_name(fixer.get("station_tier") or fixer.get("tier"))
    return None


def _mission_pool_layer_multipliers(world_state):
    if not world_state:
        return {"하층": 1.0, "중층": 1.0, "상층": 1.0}
    mpw = world_state.get("mission_pool_weights")
    if not isinstance(mpw, dict):
        return {"하층": 1.0, "중층": 1.0, "상층": 1.0}
    result = {"하층": 1.0, "중층": 1.0, "상층": 1.0}
    for key, value in mpw.items():
        layer = _normalize_layer_name(key)
        if layer and isinstance(value, (int, float)) and value > 0:
            result[layer] = float(value)
    return result


def generate_location(world_state=None):
    """스테이션 위치(§2.1) + world_state 미션풀 보정으로 의뢰 장소를 선택."""
    station_layer = _extract_station_layer(world_state) or "중층"
    station_mult = STATION_LAYER_MULTIPLIERS.get(station_layer, STATION_LAYER_MULTIPLIERS["중층"])
    world_mult = _mission_pool_layer_multipliers(world_state)
    layer_weights = {k: station_mult.get(k, 1.0) * world_mult.get(k, 1.0) for k in ("하층", "중층", "상층")}
    layer = _weighted_pick(layer_weights) or "중층"
    layer_pool = LOCATION_POOLS[layer]

    zone = random.choice(layer_pool["zones"])
    structures = layer_pool["structures"].get(zone, [None])
    structure = random.choice(structures)
    spot_pool = layer_pool["spots"].get(structure, ["미확인 지점"])
    spot = random.choice(spot_pool)

    return {"layer": layer, "zone": zone, "structure": structure, "spot": spot}


def zone_affinity_factions(zone, structure):
    return STRUCTURE_HOSTS.get(structure) or ZONE_HOSTS.get(zone) or []


def target_candidates_for(layer, mission_type):
    reachable = set(factions_reaching(layer))
    typed = set(MISSION_CHAINS.get(mission_type, {}).get("targets", []))
    candidates = [f for f in FACTIONS_POOL if f in reachable and f in typed]
    return candidates


def pick_target_faction(layer, zone, structure, mission_type):
    """의뢰 목표(대상) 선정.
    규칙: 의뢰 장소 layer로 '내려올 수 있는' 세력 중, 타입 적합 대상을 가중 선택.
    """
    candidates = target_candidates_for(layer, mission_type)
    if not candidates:
        candidates = list(MISSION_CHAINS.get(mission_type, {}).get("targets", []))
    anchors = zone_affinity_factions(zone, structure)
    weights = {}
    for f in candidates:
        w = 10
        if f in anchors:
            w += 25
        if faction_group(f) == "메가코프" and layer == "상층":
            w += 8
        weights[f] = w
    return _weighted_pick(weights) or random.choice(candidates)


def pick_mission_type(layer):
    base = dict(LAYER_TYPE_BASE_WEIGHTS.get(layer, LAYER_TYPE_BASE_WEIGHTS["중층"]))
    valid = {t: w for t, w in base.items() if target_candidates_for(layer, t)}
    return _weighted_pick(valid or base) or "전투"


def _progression_shift(world_state):
    if not world_state:
        return 0
    shift = 0
    fixer = world_state.get("fixer_summary", {})
    fame = fixer.get("fame") if isinstance(fixer, dict) else None
    if isinstance(fame, (int, float)) and fame >= 50:
        shift += 1
    station = world_state.get("station_state", {})
    grade = station.get("grade") if isinstance(station, dict) else None
    if isinstance(grade, (int, float)) and grade >= 3:
        shift += 1
    elif isinstance(grade, str):
        gs = grade.lower()
        if gs in ("s", "a", "high", "elite"):
            shift += 1
    return min(2, shift)


def generate_difficulty(target_faction, mission_type, world_state=None):
    group = faction_group(target_faction) or "중층"
    weights = GROUP_DIFFICULTY_WEIGHTS.get(group, GROUP_DIFFICULTY_WEIGHTS["중층"])
    raw = _weighted_pick(weights) or 2
    difficulty = min(5, raw + _progression_shift(world_state))
    return max(TYPE_MIN_DIFFICULTY.get(mission_type, 1), difficulty)


def generate_mission_base(world_state=None):
    """선정 순서:
    의뢰 장소 → 의뢰 타입 → 의뢰 목표(장소와 하강 정합) → 난이도(목표 그룹) → 의뢰인
    """
    location = generate_location(world_state)
    layer_name = location["layer"]
    zone = location["zone"]
    structure = location["structure"]

    mission_type = pick_mission_type(layer_name)
    target_faction = pick_target_faction(layer_name, zone, structure, mission_type)
    target_is_minor = False
    difficulty = generate_difficulty(target_faction, mission_type, world_state)

    chain = MISSION_CHAINS[mission_type]
    detail = random.choice(chain["details"])
    goal_type = random.choice(chain["goals"][detail])
    client_faction = pick_client_faction(layer_name, mission_type, target_faction)
    
    # 지형/구역에 따른 1차 위험요소 매핑 (기획 고증)
    danger = None
    structure = location["structure"]
    
    if structure in ["파이프 (Pipe)", "파이프"]:
        danger = "더 밸브 화학 폐수 및 맹독 물질 누출"
    elif structure in ["벤트 (Vent)", "벤트"]:
        danger = "더 댐퍼 고풍량 인공 돌풍 및 협소 공간"
    elif structure in ["라인 (Line)", "라인"]:
        danger = "더 퓨즈 고압 전선 상시 누전 및 감전"
    else:
        layer_dangers = LAYER_DANGERS_POOL.get(layer_name, DANGERS_POOL)
        # 일반 지형일 경우의 위험요소 설정
        if difficulty <= 2:
            danger = random.choice(layer_dangers[:2])
        elif difficulty == 3:
            danger = random.choice(layer_dangers)
        else: # 난이도 4~5
            if len(layer_dangers) >= 2:
                danger = random.sample(layer_dangers, 2)
            else:
                danger = random.sample(DANGERS_POOL, 2)
            
    # 만약 난이도가 높은데 단일 위험으로 걸렸다면, 복합 위험이 되도록 DANGERS_POOL에서 하나 더 추가
    if difficulty >= 4 and not isinstance(danger, list):
        base_danger = danger
        layer_dangers = LAYER_DANGERS_POOL.get(layer_name, DANGERS_POOL)
        extra_pool = [d for d in layer_dangers if d != base_danger] or [d for d in DANGERS_POOL if d != base_danger]
        extra_danger = random.choice(extra_pool)
        danger = [base_danger, extra_danger]
        
    # 경제 로직 (에스컬레이팅 보상 체계)
    if difficulty == 1:
        base_credits = random.randint(3, 6) * 1000      # 3,000 ~ 6,000
    elif difficulty == 2:
        base_credits = random.randint(12, 18) * 1000    # 12,000 ~ 18,000
    elif difficulty == 3:
        base_credits = random.randint(25, 35) * 1000    # 25,000 ~ 35,000
    elif difficulty == 4:
        base_credits = random.randint(50, 70) * 1000    # 50,000 ~ 70,000
    else: # 난이도 5
        base_credits = random.randint(100, 150) * 1000  # 100,000 ~ 150,000
        
    rep_amount = {1: 5, 2: 10, 3: 20, 4: 40, 5: 80}.get(difficulty, 10)
    reputation_changes = []
    if client_faction:
        reputation_changes.append({"faction": client_faction, "amount": rep_amount})
    # 군소 모임은 세력 관계가 없으므로 평판 변동 대상에서 제외한다.
    if target_faction and not target_is_minor:
        reputation_changes.append({"faction": target_faction, "amount": -rep_amount})
        
    # 역학(Mechanics) 로직
    base_vis = 100
    if mission_type == "잠입":
        base_vis -= 40
    if difficulty == 3:
        base_vis -= 20
    elif difficulty >= 4:
        base_vis -= 40
        
    primary_stat = "Cypher" if mission_type == "잠입" else "Frame" if mission_type == "전투" else "Wire" if mission_type == "지원" else "Cool" if mission_type == "교섭" else ("Cypher" if mission_type == "추적" else "Pulse")
    secondary_stat = "Cool" if mission_type == "잠입" else "Pulse" if mission_type == "전투" else "Cypher" if mission_type == "지원" else "Cypher" if mission_type == "교섭" else ("Pulse" if mission_type == "추적" else "Cool")

    return {
        "difficulty": difficulty,
        "missionType": mission_type,
        "missionDetail": detail,
        "clientFaction": client_faction,
        "targetFaction": target_faction,
        "missionGoal": {
            "type": goal_type,
            "detail": "" # 나중에 AI가 채움
        },
        "location": location,
        "danger": danger,
        "economy": {
            "reward_credits": base_credits,
            "reputation_changes": reputation_changes
        },
        "mechanics": {
            "visibility_limit": max(20, base_vis),
            "primary_stat": primary_stat,
            "secondary_stat": secondary_stat
        },
        "nodes": generate_nodes(mission_type, difficulty),
        "visibility_phase": {
            "phase_0": ["missionType", "mechanics.primary_stat"],
            "phase_1": ["requirements.mandatory", "danger"],
            "phase_2": ["requirements.recommended", "nodes", "economy"]
        }
    }

def infer_requirements(mission_base):
    """속성에 따른 필수/권장 조건 및 발생 가능 후유증 논리적 유도"""
    mandatory = []
    recommended = []
    potential_statuses = []
    
    goal_type = mission_base["missionGoal"]["type"]
    detail = mission_base["missionDetail"]
    target = mission_base["targetFaction"]
    structure = mission_base["location"]["structure"]
    layer = mission_base["location"]["layer"]
    mtype = mission_base["missionType"]
    
    # 1. 목표에 의한 고유 장비 매핑 (기획 명칭 이식)
    if goal_type == "기밀":
        mandatory.append("K-Sec 정보전 툴킷")  # 사이버덱
    elif goal_type == "프로토타입":
        mandatory.append("Q-Transit 물류/지원 모듈") # 자산 봉인
        
    # 2. 구역/공간(Structure)에 따른 전용 복식/장비 및 상태 후유증 유도
    if structure in ["파이프 (Pipe)", "파이프"]:
        mandatory.append("방독 보호구 (밀폐형)")
        potential_statuses.extend(["#독성노출", "#잔류오염"])
    elif structure in ["벤트 (Vent)", "벤트"]:
        mandatory.append("방풍 고글 및 판초")
        recommended.extend(["F.R.S. 소형 은닉 무기", "협소 공간 적응"])
        potential_statuses.extend(["#타박상", "#열피로"])
    elif structure in ["라인 (Line)", "라인"]:
        mandatory.append("두꺼운 절연 안전화")
        potential_statuses.extend(["#신경통", "#의체경련"])
        
    # 3. 상황적 테마(결투 + 피스톨 마니아 클럽 등) 유도
    if detail == "결투" and target == "피스톨 마니아 클럽":
        mandatory.append("피스톨류 무기 소지")
        
    # 4. 미션 타입별 기본 권장 조건
    if mtype == "잠입":
        recommended.append("F.R.S. 은닉형 장비")  # 낮은 가시성
    elif mtype == "전투":
        recommended.append("오겐 군용 크롬 (강화 골격)") # 고내구도 아머
    elif mtype == "교섭":
        recommended.extend(["위장 신분 패스", "대면 기록 차단 패치"])
    elif mtype == "추적":
        recommended.extend(["저광학 추적 스캐너", "저소음 이동 장비"])
        if detail == "회수":
            mandatory.append("은닉 운반 케이스")
    elif mtype == "비밀":
        recommended.extend(["일회용 암호 통신기", "흔적 말소 키트"])
        
    # 5. 계층(Layer)에 따른 검문 및 의전 조건
    if layer == "상층":
        recommended.append("상층 의전용 슈트")
    elif layer == "하층":
        recommended.append("하층 현장 방진 마스크")
        
    return {
        "mandatory": list(set(mandatory)),
        "recommended": list(set(recommended)),
        "potential_statuses": list(set(potential_statuses))
    }

def run_model_inference(model, system_prompt, input_str, max_tokens=200):
    """5001번 포트의 AI 로컬 서버로 미션 생성 API 요청"""
    if model == "mock":
        # Mock mode
        print("\n--- [MOCK MODE PROMPT TRACE] ---")
        print(f"System Prompt:\n{system_prompt}")
        print(f"Input Str:\n{input_str}")
        print("--------------------------------\n")
        return "[목표]: MOCK AI 생성 목표\n[브리핑]: [MOCK AI 생성 텍스트: 작전 브리핑...]"

    url = "http://127.0.0.1:5001/generate-mission"
    headers = {"Content-Type": "application/json"}
    
    # Layer 1 + Layer 2(World State) + 퓨샷을 병합한 systemPrompt를 함께 전송한다.
    # 이렇게 해야 World State(픽서 명성·팩션 동향·구역 알림)가 실제 모델까지 도달한다.
    # metaStr(Layer 3: 생성 대상 미션 변수)는 사용자 입력 정보로 분리 전달.
    data = json.dumps({
        "systemPrompt": system_prompt,
        "metaStr": input_str
    }).encode("utf-8")
    
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data.get("text", "[목표]: 생성 실패\n[브리핑]: 생성 실패")
    except Exception as e:
        print(f"[AI Mission Generator] Error connecting to Narrator Server: {e}")
        print("[AI Mission Generator] Critical: Narrator Server is OFFLINE. Cannot generate missions.")
        sys.exit(1)

import argparse

# 화자 페르소나(톤) — 향후 '개인 비서' 성격 교체를 위한 확장 포인트.
# 항목을 하나 추가하면 그 톤으로 글이 생성된다. 품질 규칙(주술 호응/고유명사 반복 억제/
# 시점 통일)은 페르소나와 무관하게 build_formatting_rules에서 항상 적용된다.
NARRATOR_PERSONAS = {
    "analyst": {
        "label": "용병관리소 분석 모듈",
        "voice": "감정을 싣지 않는 건조하고 공식적인 단말기 보고체. 사실과 정황만 객관적으로 전달한다.",
        "endings": "단정형 종결('~이다', '~한다', '~했다')로 일관되게 쓴다. 추측성 종결('~로 보인다', '~것이다', '~듯하다')은 쓰지 않는다.",
    },
    # 향후 확장 예: "hardboiled"(냉소적 베테랑), "secretary_warm"(살가운 개인 비서) 등
}
DEFAULT_PERSONA = "analyst"


def get_persona(persona_id=DEFAULT_PERSONA):
    return NARRATOR_PERSONAS.get(persona_id, NARRATOR_PERSONAS[DEFAULT_PERSONA])


def build_layer_1_prompt(persona_id=DEFAULT_PERSONA):
    persona = get_persona(persona_id)
    return (
        "당신은 거대 돔 도시 '콜(Qol)'의 용병관리소를 보조하는 정보 분석 모듈입니다.\n"
        "[역할 설정 — 매우 중요]\n"
        "- 플레이어는 '픽서'입니다. 픽서는 직접 현장에 뛰는 사람이 아니라, 들어온 의뢰를 검토하고 휘하의 용병 중 적합한 자를 골라 현장에 '파견'하는 운영자입니다.\n"
        "- 따라서 당신의 글은 픽서에게 '이런 의뢰가 들어왔다'고 보고하고, 픽서가 '누구를 보낼지' 판단하도록 돕는 자료여야 합니다.\n"
        "- 절대 독자(픽서)를 현장에 직접 뛰는 사람으로 취급하지 마세요. ('네가 들어가서 빼와라' 식의 2인칭 실행 명령 금지)\n\n"
        "[Layer 1: 세계관 지식 — 돔 도시 '콜']\n"
        "- 배경: '콜'은 중동 사막에 세워진 거대한 돔형 치외법권 생산도시다. 가로 20km·세로 4km 규모이며, 철저한 계급이 고도(高度)에 따라 나뉜다.\n"
        "- 계층: 하층(돔 밑바닥, 뚜껑에 덮여 하늘이 없는 슬럼·인프라 지대) / 중층(4대 메가코프가 다스리는 계획도시) / 상층(맑은 하늘 아래 특권층의 저택·의회 지대).\n"
        "- 메가코프 4대: 바이루이(의료/식량 독점), 마사다(군수/금융 카르텔), 키쿠모토(전뇌망OS/정보 통제), 알-마디낫(공간/물류/치안 독점).\n"
        "- 하층은 두 구역으로 나뉜다. (1) '언더리드'(격리벽 안쪽 인프라 지대), (2) 'UNzone'(격리벽 바깥, 더 널스가 장악한 무법 빈민지대).\n"
        "- ★중요★ 언더리드의 인프라 설비(파이프=물, 라인=전력, 벤트=공기)는 본래 '중·상층'에 자원을 공급하기 위한 것이다. 하층 자체를 위한 공급이 아니다. 하층 인프라 팩션(더 밸브/더 퓨즈/더 댐퍼)은 이 설비를 관리·기생하며, 흘러나오는 여분을 쓰거나 빼돌려 연명한다. 따라서 '하층의 전력/식수를 공급한다'는 식으로 쓰면 안 된다. (옳은 예: '중상층으로 가는 전력 라인을 관리하며 그 일부를 빼돌리는 더 퓨즈')\n"
        "- 하층 인프라 팩션: 더 밸브(파이프 영역, 배수·식수 라인 관리·전용), 더 퓨즈(라인 영역, 전력 라인 관리·전용), 더 댐퍼(벤트 영역, 공기·기온 라인 관리·전용). UNzone의 더 널스는 격리벽 밖 무법 세력으로 이들과 구분된다.\n"
        "- 중층 독립 팩션: La Nada(유흥·감각 시장), No Claim(불법 물류·운송), Plus One(상층 경호·암살), Rattle(비공식 해커 정보망), One More(임플란트 개조), Ten Men(시민 중재·평판).\n"
        f"- 문체: {persona['voice']} 자연스러운 한국어 줄글로 쓰되, 암호문이나 파편적 메모 형식은 금지입니다.\n"
        "- 정보 은닉 원칙: 숨겨야 할 것은 '정량 수치·정답 태그·구체적 위험요소의 단정'입니다. [개요]에서는 구체적 위험요소('고압 전선 누전' 등)를 단정하지 말고 정황으로 암시하되, 추리물처럼 빙빙 돌리지 마세요. 1차·2차 분석으로 갈수록 더 구체적으로 드러내도 됩니다.\n"
        "- 팩션 이름은 숨길 대상이 아닙니다. 입력으로 '공개된' 의뢰자·대상 팩션이 주어지면 그 이름을 그대로 쓰세요. 다만 의뢰자가 '익명'으로 주어지면 정체를 드러내지 마세요.\n\n"
        "[금지 사항 — 반드시 준수]\n"
        "- '나이트시티', '아라사카', '배드랜드', '노매드', '브이(V)', '잭' 등 기존 사이버펑크 게임/영화 IP의 고유명사를 절대 사용하지 마세요.\n"
        "- '사이버펑크'라는 단어 자체도 본문에 쓰지 마세요. 이 세계는 오직 돔 도시 '콜'입니다.\n"
        "- 위에 제시된 계층·구역·팩션 외의 새로운 고유명사(도시명·지역명·기업명·갱단명)를 임의로 지어내지 마세요. 입력으로 주어진 지명과 팩션만 사용하세요.\n"
    )

def build_layer_2_prompt(world_state):
    if not world_state:
        return ""
    
    prompt = "\n[Layer 2: 현재 World State 스냅샷]\n"
    
    fixer = world_state.get("fixer_summary", {})
    if fixer:
        prompt += f"- 픽서: {fixer.get('codename')} (출신: {fixer.get('origin')}, 명성: {fixer.get('fame')}, 악명: {fixer.get('infamy')})\n"
        prompt += f"- 스테이션: {fixer.get('station')}\n"
    
    factions = world_state.get("notable_faction_states", [])
    if factions:
        prompt += "- 팩션 동향:\n"
        for f in factions:
            prompt += f"  * {f['faction']}: {f['status']} (픽서 호감도: {f['fixer_rep']})\n"
            
    alerts = world_state.get("area_alerts", [])
    if alerts:
        prompt += "- 구역 알림:\n"
        for a in alerts:
            prompt += f"  * {a}\n"
            
    return prompt + "\n"

# 미션 타입별 성격 설명 (AI가 타입에 맞는 결의 글을 쓰도록 주입)
MISSION_TYPE_DESC = {
    "잠입": "들키지 않고 침투해 목표물을 빼내거나 정보를 확보하는 작전. 은밀함과 흔적 최소화가 관건.",
    "전투": "무력으로 대상을 제압·소탕·습격하는 정면 작전. 화력과 생존력이 관건.",
    "지원": "수리·배달·의료처럼 현장을 돕거나 물자를 나르는 비전투 작전. 신속함과 안정성이 관건.",
    "교섭": "협상·중재·거래처럼 사람과 이해관계를 다뤄 목적을 달성하는 작전. 침착함과 판단력이 관건.",
    "추적": "회수·감시·미행으로 대상의 동선과 은닉 자산을 좁혀 확보하는 작전. 분석력과 추적 지속력이 관건.",
    "비밀": "외부에 드러나면 안 되는 비공개 의뢰. 추적·조사·포섭을 은밀히 수행하며, 의뢰의 존재 자체가 기밀이다.",
}

def build_layer_3_prompt(m_base):
    type_desc = MISSION_TYPE_DESC.get(m_base['missionType'], "")
    client = m_base.get('clientFaction')
    layer = m_base['location']['layer']
    zone = m_base['location']['zone']
    structure = m_base['location']['structure']
    anchors = zone_affinity_factions(zone, structure)
    anchor_str = ", ".join(anchors) if anchors else "특정 없음"
    danger = m_base['danger']
    danger_str = ", ".join(danger) if isinstance(danger, list) else (danger or "특이사항 없음")

    if client:
        client_line = f"의뢰자: {client} ({faction_tier_label(client)})\n"
        client_note = (
            "- 의뢰자가 '왜' 이 의뢰를 냈는지(동기)와 의뢰자–대상의 이해관계를 본문에 분명히 드러내세요. 인과가 비면 안 됩니다.\n"
        )
        # 의뢰자 소속과 작전 구역의 계층 격차가 크면 개연성을 요구한다.
        is_corp = client in FACTION_CORP
        is_low = client in FACTION_LOW
        if (is_corp and layer == "하층") or (is_low and layer == "상층"):
            client_note += (
                f"- 의뢰자({client})의 위상과 작전 구역('{layer}')의 계층 차이가 큽니다. "
                "상위 세력이 굳이 이런 구역의 일에 손대는(또는 그 반대의) 그럴듯한 이유를 한두 문장으로 자연스럽게 설명하세요.\n"
            )
    else:
        client_line = "의뢰자: 익명(정체 비공개 — 이름을 지어내지 말 것)\n"
        client_note = (
            "- 의뢰자는 정체를 숨겼습니다. 이름을 지어내지 말고, 다만 '무엇을 원하는지'(의뢰의 목적·동기)는 분명히 드러내세요.\n"
        )

    return (
        "[Layer 3: 생성 대상 미션 변수]\n"
        f"미션 타입: {m_base['missionType']} — {type_desc}\n"
        f"세부 행동: {m_base['missionDetail']} / 목표: {m_base['missionGoal']['type']}\n"
        f"{client_line}"
        f"대상(상대): {m_base['targetFaction']}\n"
        f"현장 연고 세력: {anchor_str}\n"
        f"작전 구역: {layer} {m_base['location']['zone']} — {m_base['location']['structure']} ({m_base['location']['spot']})\n"
        f"현장 위험요소: {danger_str}\n\n"
        "[이 미션에 반영할 점]\n"
        f"{client_note}"
        "- 위 미션 타입의 성격에 맞는 전개로 쓰세요. (예: 비밀 의뢰는 은밀하고 비공개적인 결을, 전투는 정면충돌의 긴장을)\n"
        "- 공개된 의뢰자·대상 팩션은 위에 적힌 '이름 그대로' 쓰세요. '생명 유지를 독점하는 거대 기업'처럼 장황하게 풀어쓰지 마세요.\n\n"
        "- 장소의 소유/관할은 '작전 구역' 기준입니다. 대상 팩션이 곧 장소 소유주라고 단정하지 마세요. (예: 바이루이 구역에서 키쿠모토 대상 작전은 가능하지만, 장소 자체를 키쿠모토 소유로 바꾸어 쓰면 안 됨)\n\n"
    )

def build_formatting_rules(persona_id=DEFAULT_PERSONA):
    persona = get_persona(persona_id)
    return (
        "[작성 규칙 — 픽서가 열람할 의뢰 자료]\n"
        "아래 4개 항목을 순서대로 작성하세요. 이 글의 1순위 목적은 '정보 전달'이며, 픽서가 읽고 '어떤 용병을 보낼지' 판단할 수 있어야 합니다.\n\n"
        "[문체 원칙 — 반드시 지킬 것]\n"
        f"- 화자는 '{persona['label']}'입니다. 톤: {persona['voice']}\n"
        f"- 종결어미: {persona['endings']} 한 편의 글 안에서 화자나 어조가 도중에 바뀌면 안 됩니다. (앞은 객관 보고, 뒤는 제3자 추측처럼 시점이 섞이는 것을 금지)\n"
        "- 주어와 서술어가 반드시 호응해야 합니다. 한 문장 안에서 행위 주체가 바뀌면 문장을 끊으세요. 영어 직역 같은 비문을 만들지 마세요. (나쁜 예: '더 댐퍼가 핵심 설비에 이상이 생겼고' → 교정: '더 댐퍼 측이 관리하는 핵심 설비에 이상이 생겼고')\n"
        "- 같은 팩션 고유명사를 한 문단에서 반복 도배하지 마세요. 첫 등장에만 이름을 쓰고, 이후로는 '측'·'이들'·대명사·맥락상 생략으로 호흡을 조절하세요. (나쁜 예: 다섯 문장에 '더 밸브'를 네 번 반복) 다만 이름을 '생명 유지를 독점하는 거대 기업'처럼 설명형으로 풀어쓰지는 마세요.\n"
        "- 팩션 명칭을 비유/설명문으로 치환하지 마세요. 입력에 '바이루이'가 있으면 그대로 '바이루이'를 쓰고, '생명 유지를 독점하는 거대 기업' 같은 환언을 금지합니다.\n"
        "- 불필요한 수동태('~되어 있다', '~로 보고된다')의 남발을 피하세요.\n"
        "- 분위기·현실감을 살리는 묘사 문장은 환영합니다. 단, 적재적소에 가감해서 쓰고, 어색하거나 정보가 비는 문장을 억지로 끼워넣지 마세요. (나쁜 예: '발신자의 긴장감은 미세한 떨림까지 감지될 정도다' — 어색하고 정보가 없음)\n"
        "- 중요한 단서(목표, 동기, 필요 역량 등)는 분위기 문장 뒤에 흘리듯 숨기지 말고 분명하게 전달하세요.\n"
        "- 탐정 소설이나 추리물 같은 문체로 흐르지 마세요. 어디까지나 용병관리소의 의뢰 브리핑입니다.\n"
        "- 단어 나열, 한 줄 요약, 불릿 목록은 금지합니다.\n\n"
        "[항목별 내용]\n"
        "1. [목표]: 이 의뢰의 핵심 목표를 1문장으로.\n"
        "2. [개요] (4~6문장): 누가(의뢰자) '왜' 이 의뢰를 냈는지(동기)와 의뢰자–대상의 이해관계를 분명히 담고, 현장 정황과 분위기를 묘사하세요. 공개된 팩션 이름은 그대로 쓰되, 구체적 위험요소는 정황으로 '암시'만 하세요. 또한 픽서가 분석을 더 돌리지 않고도 '대략 어떤 자질·대비가 필요한 작전인지' 가늠할 최소한의 단서를 자연스럽게 흘려, 비슷한 채비라도 갖춰 보낼 수 있게 하세요.\n"
        "3. [1차분석] (3~5문장): 이 작전이 본질적으로 어떤 성격인지, 어떤 자질·체급의 용병이 유리한지, 그리고 어떤 장비·정비를 갖춰 보내야 하는지(준비 방향)를 풀어 쓰세요. 정확한 수치나 태그명은 아직 쓰지 마세요.\n"
        "4. [2차분석] (3~5문장): 현장의 위협이 실제로 어떻게 전개되는지, 그 위험요소가 작전 중 어떤 사고로 이어지는지를 구체적으로 묘사하세요. 정량 요구 수치는 시스템이 따로 붙이므로, 당신은 정성적 위협 묘사에 집중하세요.\n\n"
        "[톤·분량·구성 참고 예시 — 절대 그대로 베끼지 말 것. 문장력과 4항목 구성의 기준점으로만 참고]\n"
        "〈예시 A — 잠입〉\n"
        "[목표]: 키쿠모토 신키로 클럽가 VIP 라운지의 백도어 코어를 손상 없이 빼낸다.\n"
        "[개요]: 의뢰자는 키쿠모토와 광고 수익을 두고 다투는 중층 흥행업자다. 경쟁사 라운지에 꽂힌 백도어 코어만 손에 넣으면 분쟁의 판도를 뒤집을 수 있다며, 대신 자기 이름은 끝까지 빠지길 원했다. 라운지는 밤마다 만취한 손님과 네온으로 북적이지만, 입구의 안면 식별 스캐너만큼은 한 번도 뚫린 적이 없다. 들켜서 셔터가 내려가는 순간 협상은 없다는 말만 남기고 의뢰자는 통신을 끊었다.\n"
        "[1차분석]: 정면 돌파보다 신분을 위장해 조용히 드나드는 쪽이 맞는 작전이다. 스캐너와 경비의 시선을 흘려보낼 침착함, 흔적을 남기지 않는 은밀 기동에 능한 용병이 어울린다. 화력형보다는 검색대를 통과할 수 있도록 가시성 낮은 장비와 은닉형 슬롯을 미리 챙겨 보내는 편이 안전하다.\n"
        "[2차분석]: 가장 큰 고비는 입구의 안면 식별 스캐너와 라운지를 도는 경비의 순찰이다. 위장이 풀리거나 과시형 장비가 스캔에 걸리면 즉시 경보가 울리고, 셔터가 닫힌 폐쇄 공간에서 무장 경비와 정면으로 부딪치게 된다. 그 지경까지 가면 코어 회수는커녕 빠져나오는 것조차 장담하기 어렵다.\n\n"
        "〈예시 B — 전투〉\n"
        "[목표]: 제3변전소를 점거한 무장 집단을 몰아내고 구역을 되찾는다.\n"
        "[개요]: 의뢰는 하층 전력 배분을 쥔 팩션에서 들어왔다. 자기네 변전소 하나가 무장 집단에 통째로 넘어가 일대 전력이 끊겼고, 협상은 이미 결렬됐다며 노골적으로 치워달라고 했다. 점거 세력의 규모는 들쭉날쭉하게 전해지지만, 변전소 주변에서 총성이 끊이지 않는다는 제보만은 한결같다. 보수는 두둑하나, 곱게 끝날 일이 아니라는 건 의뢰자도 숨기지 않았다.\n"
        "[1차분석]: 은밀함보다 정면에서 화력을 받아내고 밀어붙일 수 있는 작전이다. 한꺼번에 쏟아지는 적을 버틸 완력과 생존력을 갖춘 용병이 적합하다. 고압 설비가 깔린 곳인 만큼, 절연 보호가 되는 장비를 갖춰 보내야 중간에 무너지지 않는다.\n"
        "[2차분석]: 변전소 안은 노출된 고압 전선이 사방에 깔려 있어, 교전 중 잘못 밀리면 적의 총탄보다 감전이 먼저 용병을 쓰러뜨린다. 점거 세력이 설비를 방패 삼아 농성하면 진입로가 좁아지고, 절연 대비 없이 들어간 용병은 작전 중반부터 화상과 마비로 전투력을 잃기 쉽다.\n\n"
        "반드시 아래 형식으로 4개 항목을 모두 출력하세요:\n"
        "[목표]: ...\n[개요]: ...\n[1차분석]: ...\n[2차분석]: ..."
    )

def parse_ai_sections(text):
    """[목표]/[개요]/[1차분석]/[2차분석] 4개 줄글 섹션을 분리한다.

    모델이 일부 항목을 누락하거나 옛 [브리핑] 형식을 쓰는 경우에도
    최대한 복구하도록 폴백을 둔다.
    """
    import re

    markers = [
        ("goal", "목표"),
        ("phase0", "개요"),
        ("phase1", "1차분석"),
        ("phase2", "2차분석"),
    ]

    # 구버전 [브리핑] 라벨을 [개요]로 흡수
    text = text.replace("[브리핑]:", "[개요]:")

    # 각 라벨의 시작 위치를 찾는다
    positions = {}
    for key, label in markers:
        m = re.search(r"\[" + re.escape(label) + r"\]\s*:", text)
        if m:
            positions[key] = (m.start(), m.end())

    result = {"goal": "", "phase0": "", "phase1": "", "phase2": ""}
    if not positions:
        # 라벨이 전혀 없으면 전체를 개요로 취급
        result["phase0"] = text.strip()
        return result

    ordered = sorted(positions.items(), key=lambda kv: kv[1][0])
    for i, (key, (_, content_start)) in enumerate(ordered):
        content_end = ordered[i + 1][1][0] if i + 1 < len(ordered) else len(text)
        result[key] = text[content_start:content_end].strip()

    return result


def main():
    parser = argparse.ArgumentParser(description="Batch Generate Missions")
    parser.add_argument("model_path", help="Path to the GGUF model or 'mock'")
    parser.add_argument("--state", help="Path to the world_state.json file", default=None)
    args = parser.parse_args()

    model_path = args.model_path
    
    world_state = None
    if args.state and os.path.exists(args.state):
        try:
            with open(args.state, 'r', encoding='utf-8') as f:
                world_state = json.load(f)
            print(f"Loaded world state from: {args.state}")
        except Exception as e:
            print(f"Failed to load world state: {e}")
    else:
        print("No world state provided or file not found. Generating without Layer 2 context.")
    
    if model_path.lower() == "mock":
        print("Running in MOCK mode. Bypassing ML model loading.")
        model = "mock"
    else:
        # 모델을 직접 로딩하는 대신, AI 로컬 서버가 켜져 있는지 체크
        print("Verifying Narrator Server connection (http://127.0.0.1:5001/health)...")
        try:
            with urllib.request.urlopen("http://127.0.0.1:5001/health", timeout=5) as response:
                status = json.loads(response.read().decode("utf-8"))
                if status.get("status") == "ok":
                    print("Narrator Server is ONLINE. Ready for AI generation.\n")
                    model = "online"
                else:
                    raise Exception("Server returned unhealthy status")
        except Exception as e:
            print(f"[ERROR] Connection to AI server (port 5001) failed: {e}")
            print("Please ensure narrator_server.py is running and fully loaded before generating missions.")
            sys.exit(1)

    # 대량 생성 세팅 (다양성 확보를 위해 6개 생성)
    num_missions_to_generate = 6
    
    generated_missions = []

    for i in range(num_missions_to_generate):
        # 1. 뼈대 생성 (독립 변수화된 로직 적용)
        m_base = generate_mission_base(world_state)
        
        diff = m_base["difficulty"]
        layer_name = m_base["location"]["layer"]
        print(f"\n[{i+1}/{num_missions_to_generate}] Generating structure for {layer_name} (Difficulty: {diff} Stars) Mission...")
        
        # 2. AI 단일 호출: 프롬프트 병합(Prompt Merging)
        merged_prompt = build_layer_1_prompt() + build_layer_2_prompt(world_state) + build_formatting_rules()
        meta_str = build_layer_3_prompt(m_base)
        
        ai_result = run_model_inference(model, merged_prompt, meta_str, max_tokens=900)
        print(f"AI Raw Output:\n{ai_result}")
        
        # 출력물 파싱 로직: [목표]/[개요]/[1차분석]/[2차분석] 4개 줄글 필드 분리
        parsed = parse_ai_sections(ai_result)
        m_base["missionGoal"]["detail"] = parsed["goal"]
        m_base["briefing"] = parsed["phase0"]     # Phase 0 의뢰 개요
        m_base["phase1Brief"] = parsed["phase1"]  # Phase 1 분석소 1차 해석
        m_base["phase2Brief"] = parsed["phase2"]  # Phase 2 분석소 심화 분석
        
        # 3. 필수/권장 조건 및 후유증 유도
        reqs = infer_requirements(m_base)
        m_base["requirements"] = reqs
        
        # 최종 데이터 구조 저장
        generated_missions.append(m_base)
        print("-" * 50)

    # JSON 파일로 저장
    output_file = "generated_missions.mock.json" if model == "mock" else "generated_missions.json"
    output_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "src",
        "data",
        output_file,
    )
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(generated_missions, f, ensure_ascii=False, indent=2)
        
    print(f"\nSuccessfully generated {num_missions_to_generate} missions and saved to {output_path}")

if __name__ == "__main__":
    main()

