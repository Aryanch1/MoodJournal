"""MoodJournal reflect endpoint — Vercel Python serverless function.

POST /api/reflect with JSON {"mood": 1-5, "entry": "...", "date": "YYYY-MM-DD"}
and get back {"reflection": str, "prompt": str} from Gemini
(gemini-3.5-flash-lite via the OpenAI-compatible endpoint).

The Gemini API key lives server-side only, in the GEMINI_API_KEY
environment variable. When no key is configured the function answers 501
and the app falls back to its on-device demo reflector.

Wellness only: the reflection is gentle and supportive, never a
diagnosis, never medical advice, and never labels a condition.
"""

import json
import os
import re
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
MODEL = "gemini-3.5-flash-lite"

SYSTEM_PROMPT = (
    "You are MoodJournal, a gentle daily mood journal. A person logged "
    "their mood today on a scale of 1 (Low) to 5 (Bright) and wrote a "
    "few lines about their day. Reply with JSON ONLY — no markdown "
    "fences, no commentary. The JSON object must have: \"reflection\": "
    "one short, kind, supportive reflection of 1 to 3 sentences that "
    "echoes what the person wrote, in their own words, without judging "
    "them; \"prompt\": one small, gentle question or prompt to carry "
    "into tomorrow. Never diagnose, never name a medical condition, "
    "never give medical advice, and never tell the person what is "
    "wrong with them. Keep the tone warm and calm, like a kind friend "
    "listening. Use only what the person wrote — never invent details "
    "about their day."
)


def _read_json(handler):
    try:
        length = int(handler.headers.get("Content-Length") or 0)
    except ValueError:
        length = 0
    raw = handler.rfile.read(length) if length > 0 else b"{}"
    try:
        return json.loads(raw.decode("utf-8") or "{}")
    except (ValueError, UnicodeDecodeError):
        return None


def _send(handler, status, payload):
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def _extract_json(text):
    """Pull the first JSON object out of model output, tolerating fences."""
    try:
        return json.loads(text)
    except ValueError:
        pass
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except ValueError:
            return None
    return None


def _validate(data):
    if not isinstance(data, dict):
        return None
    reflection = str(data.get("reflection") or "").strip()
    prompt = str(data.get("prompt") or "").strip()
    if not reflection or not prompt:
        return None
    return {"reflection": reflection[:600], "prompt": prompt[:300]}


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        body = _read_json(self)
        if body is None:
            _send(self, 400, {"error": {"message": "Invalid JSON body"}})
            return

        mood = body.get("mood")
        if not isinstance(mood, int) or mood < 1 or mood > 5:
            _send(self, 400, {"error": {"message": "Pick a mood from 1 to 5 first"}})
            return
        entry = str(body.get("entry") or "").strip()[:4000]
        date = str(body.get("date") or "").strip()[:10]

        api_key = os.environ.get("GEMINI" + "_API_KEY", "")
        if not api_key:
            _send(self, 501, {"error": {"message": "Hosted AI is not configured"}})
            return

        user_text = f"Mood today: {mood} out of 5."
        if date:
            user_text = f"Date: {date}\n{user_text}"
        if entry:
            user_text = f"{user_text}\nWhat they wrote:\n{entry}"
        else:
            user_text = f"{user_text}\nThey wrote no words today — only the mood."
        payload = {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_text},
            ],
            "temperature": 0.7,
        }
        request = urllib.request.Request(
            GEMINI_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "x-goog-api-key": api_key,
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                upstream = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            try:
                detail = json.loads(exc.read().decode("utf-8"))
                message = detail.get("error", {}).get("message", "")
            except (ValueError, UnicodeDecodeError):
                message = ""
            _send(
                self,
                exc.code if 400 <= exc.code < 600 else 502,
                {"error": {"message": message or "Upstream request failed"}},
            )
            return
        except (urllib.error.URLError, TimeoutError, OSError):
            _send(self, 502, {"error": {"message": "Upstream request failed"}})
            return

        try:
            content = upstream["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError):
            _send(self, 502, {"error": {"message": "Upstream returned an unexpected response"}})
            return

        data = _extract_json(content)
        reflection = _validate(data) if data is not None else None
        if reflection is None:
            _send(self, 502, {"error": {"message": "Could not write a reflection"}})
            return
        _send(self, 200, reflection)

    def do_GET(self):
        _send(self, 405, {"error": {"message": "Method not allowed"}})

    def log_message(self, *args):  # keep serverless logs clean
        pass
