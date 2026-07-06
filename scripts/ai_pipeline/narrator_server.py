import os
import json
import urllib.request
from flask import Flask, request, jsonify
from flask_cors import CORS
from narrate_prompt import build_narrate_prompt


app = Flask(__name__)
CORS(app)  # React 프론트엔드의 크로스 오리진 요청 허용

RUNTIME_WORLD_STATE_PATH = os.path.join(os.path.dirname(__file__), "runtime_world_state.json")

# 추론은 C++ llama-server(연속 배치, -np 2)가 담당한다. 이 서버는 프롬프트 조립과
# world-state 처리만 맡고, 실제 텍스트 생성은 아래 upstream으로 프록시한다.
# 이렇게 하면 미션 생성(/generate-mission)과 보고서 서사(/narrate)가 동시에 들어와도
# llama-server의 슬롯에서 병렬로 처리된다.
LLAMA_SERVER_URL = os.environ.get("LLAMA_SERVER_URL", "http://127.0.0.1:8080")


def upstream_ready() -> bool:
    """llama-server(추론 엔진)가 모델을 올리고 응답 가능한 상태인지 확인한다."""
    try:
        with urllib.request.urlopen(f"{LLAMA_SERVER_URL}/health", timeout=3) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        return payload.get("status") == "ok"
    except Exception:
        return False


def llama_complete(
    prompt,
    max_tokens,
    temperature=0.7,
    top_p=0.9,
    repeat_penalty=None,
    stop=None,
    timeout=120,
):
    """llama-server의 raw /completion 엔드포인트로 프록시한다.

    /v1/chat/completions는 gemma3 chat 템플릿의 thinking 모드가 켜져 content가 비므로
    사용하지 않는다. 우리는 이미 <start_of_turn> 형식 프롬프트를 직접 조립하므로
    raw completion이 적합하다.
    """
    payload = {
        "prompt": prompt,
        "n_predict": max_tokens,
        "temperature": temperature,
        "top_p": top_p,
        "stop": stop or [],
        "cache_prompt": True,
    }
    if repeat_penalty is not None:
        payload["repeat_penalty"] = repeat_penalty
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        f"{LLAMA_SERVER_URL}/completion",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        result = json.loads(resp.read().decode("utf-8"))
    return (result.get("content") or "").strip()

# 용병 아이디별 페르소나 — narrate_prompt.MERC_PERSONAS 로 이전됨 (하위 호환 주석)
# 미션 생성용 시스템 프롬프트 (폴백 기본값)
# 정상 경로에서는 batch_generate_missions.py가 Layer 1+2(World State)+작성 규칙을 병합한
# systemPrompt를 직접 전송하므로 이 상수는 systemPrompt 미지정 시에만 사용된다.
MISSION_SYSTEM_PROMPT = (
    "당신은 거대 돔 도시 '콜(Qol)'의 용병관리소를 보조하는 정보 분석 모듈입니다.\n"
    "플레이어는 '픽서'로, 직접 현장에 뛰지 않고 들어온 의뢰를 검토해 휘하 용병을 파견하는 운영자입니다. "
    "독자(픽서)를 현장 실행자로 취급하지 마세요.\n"
    "이 세계는 오직 돔 도시 '콜'입니다. '나이트시티·아라사카·배드랜드·노매드' 등 외부 IP 고유명사와 '사이버펑크'라는 단어는 사용하지 마세요.\n"
    "주어진 의뢰 데이터를 바탕으로 픽서가 열람할 의뢰 자료를 분위기 있는 한국어 줄글 스토리텔링으로 작성하세요. "
    "암호문·파편 메모 형식은 금지합니다.\n\n"
    "아래 4개 항목을 모두, 각각 풍부한 줄글로 출력하세요:\n"
    "1. [목표]: 핵심 목표 1문장.\n"
    "2. [개요]: 의뢰 정황·현장 분위기를 4~6문장. 팩션명·위험요소는 직접 단정하지 말고 정황으로 암시.\n"
    "3. [1차분석]: 작전의 성격과 유리한 용병 자질 방향, 위험 신호를 3~5문장.\n"
    "4. [2차분석]: 예상 위협의 전개와 필요한 준비를 3~5문장(정성적 위협 묘사).\n\n"
    "반드시 아래 형식을 지키세요:\n"
    "[목표]: ...\n[개요]: ...\n[1차분석]: ...\n[2차분석]: ..."
)

@app.route('/health', methods=['GET'])
def health():
    # upstream(llama-server)이 모델을 올린 뒤에만 ok로 보고한다.
    # 런처는 이 값으로 추론 준비 완료를 판단한다.
    ready = upstream_ready()
    body = {
        "status": "ok" if ready else "loading",
        "model_loaded": ready,
        "upstream": LLAMA_SERVER_URL,
    }
    # 준비 전에는 503으로 응답해 런처/배치가 curl -f 로 간단히 대기할 수 있게 한다.
    return jsonify(body), (200 if ready else 503)


@app.route('/world-state', methods=['POST'])
def save_world_state():
    """프런트엔드의 현재 게임 상태 요약(world_state)을 파일로 저장한다."""
    data = request.json
    if not isinstance(data, dict):
        return jsonify({"error": "invalid world_state payload"}), 400
    try:
        with open(RUNTIME_WORLD_STATE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return jsonify({"status": "ok", "saved_path": RUNTIME_WORLD_STATE_PATH})
    except Exception as e:
        return jsonify({"error": f"failed to write world_state: {str(e)}"}), 500

@app.route('/generate-mission', methods=['POST'])
def generate_mission():
    data = request.json or {}
    meta_str = data.get("metaStr", "")
    # 배치 스크립트가 Layer 1+2(World State)+퓨샷을 병합한 systemPrompt를 보내면 그것을 우선 사용한다.
    # 미지정 시 서버 내장 기본 프롬프트로 폴백(하위 호환).
    system_prompt = data.get("systemPrompt") or MISSION_SYSTEM_PROMPT
    
    prompt = (
        f"<start_of_turn>user\n"
        f"{system_prompt}\n\n"
        f"입력 정보: {meta_str}\n"
        f"<end_of_turn>\n"
        f"<start_of_turn>model\n"
    )

    try:
        text = llama_complete(
            prompt,
            max_tokens=1536,
            temperature=0.7,
            top_p=0.9,
            stop=["<end_of_turn>", "User:", "의뢰명:"],
        )
        print(f"[AI Narrator Server] Generated mission briefing successfully.")
        return jsonify({"text": text})
    except Exception as e:
        print(f"[AI Narrator Server] Error generating mission: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/narrate', methods=['POST'])
def narrate():
    data = request.json or {}
    prompt = build_narrate_prompt(data)

    try:
        mission_name = data.get("missionName", "알 수 없는 임무")
        text = llama_complete(
            prompt,
            max_tokens=700,
            temperature=0.35,
            top_p=0.9,
            repeat_penalty=1.15,
            stop=["<end_of_turn>", "User:", "의뢰명:"],
        )
        print(f"[AI Narrator Server] Generated 1st-person narrative for '{mission_name}' successfully.")
        return jsonify({"narrative": text})
    except Exception as e:
        print(f"[AI Narrator Server] Error generating text: {e}")
        return jsonify({"error": f"Failed to generate: {str(e)}"}), 500

if __name__ == '__main__':
    # 이 서버는 모델을 직접 로드하지 않는다(프록시 모드). 추론은 llama-server가 담당.

    # [크래시 방지] Windows에서 표준출력이 일반 콘솔이 아닐 때(파이프/리다이렉트),
    # Flask 기본 배너와 werkzeug INFO 로그가 colorama를 거쳐 콘솔 핸들에 직접 쓰다가
    # "OSError: Windows error 6 (잘못된 핸들)"로 서버가 즉사하는 문제가 있다.
    # 배너를 끄고 werkzeug 로그 레벨을 올려 색상 출력 경로 자체를 차단한다.
    import logging
    logging.getLogger('werkzeug').setLevel(logging.ERROR)
    try:
        import flask.cli
        flask.cli.show_server_banner = lambda *args, **kwargs: None
    except Exception:
        pass

    print(f"[AI Narrator Server] Proxy mode -> upstream {LLAMA_SERVER_URL}", flush=True)
    print("[AI Narrator Server] Listening on http://0.0.0.0:5001 (ready)", flush=True)
    # threaded=True: /narrate 와 /generate-mission 이 동시에 들어와도 각 스레드가
    # upstream(llama-server) HTTP 응답을 기다리는 동안 블로킹되지 않는다.
    # 실제 병렬 추론은 llama-server의 -np 슬롯이 처리한다.
    app.run(host='0.0.0.0', port=5001, debug=False, use_reloader=False, threaded=True)
