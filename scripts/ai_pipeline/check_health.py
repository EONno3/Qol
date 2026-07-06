import json
import sys
import urllib.request


def main() -> int:
    # localhost는 Windows에서 IPv6(::1) 먼저 시도 후 IPv4 폴백까지 ~2.4s 지연됨.
    # 127.0.0.1로 고정해 timeout 안에 안정적으로 응답받는다.
    url = "http://127.0.0.1:5001/health"
    try:
        with urllib.request.urlopen(url, timeout=3) as response:
            payload = json.loads(response.read().decode("utf-8"))
        if payload.get("status") == "ok":
            return 0
        return 1
    except Exception:
        return 1


if __name__ == "__main__":
    sys.exit(main())
