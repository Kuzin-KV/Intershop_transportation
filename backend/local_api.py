import os
import json
import importlib.util
from pathlib import Path
from typing import Any

from flask import Flask, request, Response


ROOT = Path(__file__).resolve().parent


def load_handler(module_path: Path):
    spec = importlib.util.spec_from_file_location(module_path.stem, module_path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    spec.loader.exec_module(module)
    return module.handler


auth_handler = load_handler(ROOT / "auth" / "index.py")
orders_handler = load_handler(ROOT / "orders" / "index.py")
admin_handler = load_handler(ROOT / "admin" / "index.py")

app = Flask(__name__)


def build_event() -> dict[str, Any]:
    return {
        "httpMethod": request.method,
        "queryStringParameters": dict(request.args),
        "body": request.get_data(as_text=True) if request.data else None,
    }


def invoke(handler):
    event = build_event()
    result = handler(event, None)
    body = result.get("body", "")
    if isinstance(body, (dict, list)):
        body = json.dumps(body, ensure_ascii=False)
    response = Response(body, status=result.get("statusCode", 200))
    for k, v in (result.get("headers") or {}).items():
        response.headers[k] = v
    return response


@app.route("/api/auth", methods=["GET", "POST", "OPTIONS"])
def auth_route():
    return invoke(auth_handler)


@app.route("/api/orders", methods=["GET", "POST", "DELETE", "OPTIONS"])
def orders_route():
    return invoke(orders_handler)


@app.route("/api/admin", methods=["GET", "POST", "OPTIONS"])
def admin_route():
    return invoke(admin_handler)


if __name__ == "__main__":
    os.environ.setdefault(
        "DATABASE_URL", "postgresql://logistics_user:logistics_pass@localhost:5432/logistics_local"
    )
    app.run(host="127.0.0.1", port=8000, debug=False)
