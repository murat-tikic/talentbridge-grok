#!/usr/bin/env python3
"""Lokaler Dev-Server für TalentBridge (Grok) — ersetzt lokal den Cloudflare Worker.

Serviert index.html unter http://localhost:8787 und leitet POST /v1/chat an xAI weiter; der Key wird
serverseitig gesetzt (nie im Browser).

Start (PowerShell):
    $env:XAI_API_KEY="xai-..."
    $env:GROK_MODEL="grok-4.20-0309-non-reasoning"      # optional
    python dev_server.py
Test ohne Key/Kosten:  $env:MOCK="1"; python dev_server.py   (liefert feste Beispielantworten)
"""
import http.server
import json
import os
import urllib.error
import urllib.request

PORT = int(os.environ.get("PORT", "8787"))
KEY = os.environ.get("XAI_API_KEY", "")
MODEL = os.environ.get("GROK_MODEL", "grok-4.20-0309-non-reasoning")
MOCK = os.environ.get("MOCK") == "1"
UPSTREAM = "https://api.x.ai/v1/chat/completions"


class Handler(http.server.SimpleHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def _json(self, status, obj):
        data = json.dumps(obj).encode()
        self.send_response(status)
        self._cors()
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if self.path.rstrip("/") != "/v1/chat":
            self.send_error(404, "Unbekannter API-Pfad")
            return
        eingabe = json.loads(self.rfile.read(int(self.headers.get("content-length", 0))) or b"{}")
        if MOCK:
            self._json(200, mock_antwort(eingabe))
            return
        if not KEY:
            self._json(500, {"error": {"message": "XAI_API_KEY ist nicht gesetzt"}})
            return
        body = json.dumps({"model": MODEL, "messages": eingabe.get("messages", []),
                           "max_tokens": min(int(eingabe.get("max_tokens") or 4000), 8000),
                           "temperature": 0.2, "stream": False}).encode()
        req = urllib.request.Request(UPSTREAM, data=body, method="POST",
                                     headers={"content-type": "application/json", "authorization": f"Bearer {KEY}"})
        try:
            with urllib.request.urlopen(req) as r:
                data, status = r.read(), r.status
        except urllib.error.HTTPError as e:
            data, status = e.read(), e.code
        except urllib.error.URLError as e:
            self._json(502, {"error": {"message": f"Upstream nicht erreichbar: {e.reason}"}})
            return
        self.send_response(status)
        self._cors()
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):
        pass


def mock_antwort(eingabe):
    """Feste, formgleiche Antworten für den Test der Pipeline (kein Key, keine Kosten).
    Der Mock liefert absichtlich dasselbe Grundgerüst für jede Stufe."""
    letzte = (eingabe.get("messages") or [{}])[-1].get("content", "")
    out = {"mock": True, "echo_chars": len(letzte)}
    if "CV text:" in letzte:
        out.update({"name": "Test Person", "title": "Engineer", "summary": "Mock-Zusammenfassung",
                    "contact": {"email": "t@example.com"}, "experience": [], "education": [],
                    "skills": {"technical": ["Python"]}, "languages": [], "cv_text_beginn": letzte[9:120]})
    return {"choices": [{"message": {"role": "assistant", "content": json.dumps(out)}, "finish_reason": "stop"}]}


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print(f"TalentBridge Dev-Server  ->  http://localhost:{PORT}")
    print(f"  Modus: {'MOCK (keine KI)' if MOCK else 'xAI Grok, Modell ' + MODEL}")
    print(f"  XAI_API_KEY: {'gesetzt' if KEY else ('nicht nötig (Mock)' if MOCK else 'FEHLT')}")
    http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
