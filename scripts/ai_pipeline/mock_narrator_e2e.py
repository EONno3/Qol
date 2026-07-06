"""Playwright E2E용 경량 narrate 목 서버 (Gemma 없이 /narrate 파이프라인 검증)."""
import time
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

NARRATIVE_MARKER = (
    "PLAYWRIGHT_E2E: 변전실 냄새가 코를 찔렀다. "
    "전선을 끊고 캐패시터를 뽑아낸 뒤 조용히 빠져나왔다."
)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": True, "upstream": "mock"})


@app.route("/world-state", methods=["POST"])
def world_state():
    return jsonify({"status": "ok"})


@app.route("/narrate", methods=["POST"])
def narrate():
    request.get_json(silent=True)
    time.sleep(1.5)
    return jsonify({"narrative": NARRATIVE_MARKER})


if __name__ == "__main__":
    import logging

    logging.getLogger("werkzeug").setLevel(logging.ERROR)
    print("[Mock Narrator] http://127.0.0.1:5001 (E2E)", flush=True)
    app.run(host="127.0.0.1", port=5001, debug=False, use_reloader=False, threaded=True)
