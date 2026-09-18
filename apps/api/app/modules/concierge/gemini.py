"""Gemini conversational intent parser via REST generateContent."""

from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any

import httpx

from app.core.config import settings
from app.modules.concierge.prompt import SYSTEM_PROMPT

logger = logging.getLogger(__name__)


def _extract_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


async def understand_with_gemini(
    message: str,
    context_summary: str,
    history: list[dict[str, str]] | None = None,
) -> dict[str, Any] | None:
    api_key = (settings.GEMINI_API_KEY or "").strip()
    if not api_key:
        return None

    primary = (settings.GEMINI_MODEL or "").strip() or "gemini-flash-lite-latest"
    candidates = [primary]
    for fallback in ("gemini-flash-lite-latest", "gemini-flash-latest", "gemini-3.5-flash-lite"):
        if fallback not in candidates:
            candidates.append(fallback)

    contents: list[dict[str, Any]] = []
    for turn in history or []:
        role = "user" if turn.get("role") == "user" else "model"
        text = (turn.get("text") or "").strip()
        if text:
            contents.append({"role": role, "parts": [{"text": text}]})

    contents.append(
        {
            "role": "user",
            "parts": [
                {
                    "text": (
                        f"Senior context (authorized):\n{context_summary}\n\n"
                        f"Senior message:\n{message}\n\n"
                        "Reply as AgeWell Bot. Return JSON only."
                    )
                }
            ],
        }
    )

    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": contents,
        "generationConfig": {
            "temperature": 0.45,
            "responseMimeType": "application/json",
        },
    }
    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": api_key,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        for model in candidates:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            for attempt in range(3):
                try:
                    response = await client.post(url, headers=headers, json=payload)
                except Exception:
                    logger.exception("Gemini concierge request failed model=%s", model)
                    break

                if response.status_code == 503:
                    await asyncio.sleep(0.6 * (attempt + 1))
                    continue
                if response.status_code >= 400:
                    logger.warning(
                        "Gemini concierge HTTP %s model=%s: %s",
                        response.status_code,
                        model,
                        (response.text or "")[:300],
                    )
                    break

                data = response.json()
                parts = ((data.get("candidates") or [{}])[0].get("content") or {}).get("parts") or []
                text = "".join(part.get("text", "") for part in parts if isinstance(part, dict))
                if not text:
                    break
                try:
                    parsed = _extract_json(text)
                except Exception:
                    logger.warning("Gemini concierge returned non-JSON model=%s", model)
                    break
                if isinstance(parsed, dict) and "intent" in parsed and "reply" in parsed:
                    return parsed
                break

    return None
