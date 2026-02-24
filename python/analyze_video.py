#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "requests>=2.31.0",
# ]
# ///
"""
Video Performance Analyzer — Gemini AI pipeline.
Replaces the n8n workflow for POC.

Usage:
  uv run python/analyze_video.py \
    --request-id <uuid> \
    --video-url <url> \
    --platform tiktok|instagram|youtube \
    --target-age "18-24" \
    --target-gender "all" \
    --target-tags "fitness,dance" \
    --callback-url http://localhost:3000/api/webhook/results

Env vars:
  GEMINI_API_KEY   — required
  WEBHOOK_SECRET   — optional Bearer token sent on callback
"""

import argparse
import json
import os
import re
import sys
import time
import tempfile

import requests

GEMINI_BASE = "https://generativelanguage.googleapis.com"
KPIS = [
    "Impressions", "Reach", "CPM", "CTR", "CPC",
    "Completion Rate", "Conversions", "CPA", "ROAS", "View Duration",
]


def gemini_key() -> str:
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key:
        raise RuntimeError("GEMINI_API_KEY env var is not set")
    return key


# ---------------------------------------------------------------------------
# Step 1: Download video
# ---------------------------------------------------------------------------

def download_video(video_url: str) -> tuple[str, str]:
    """Download video to a temp file. Returns (file_path, mime_type)."""
    print(f"[1/5] Downloading video from {video_url[:80]}...")
    resp = requests.get(
        video_url,
        stream=True,
        timeout=120,
        headers={"User-Agent": "Mozilla/5.0 (compatible; VideoAnalyzer/1.0)"},
        allow_redirects=True,
    )
    resp.raise_for_status()

    content_type = resp.headers.get("Content-Type", "application/octet-stream")
    mime_type = content_type.split(";")[0].strip()

    if "html" in mime_type:
        raise RuntimeError(
            f"The URL returned an HTML page (Content-Type: {mime_type}), not a video file.\n"
            "Social media page URLs (TikTok, Instagram, YouTube) don't serve raw video.\n"
            "Please upload the video file directly instead of pasting a page URL."
        )

    if not mime_type.startswith("video/"):
        mime_type = "video/mp4"

    ext = {
        "video/mp4": ".mp4",
        "video/quicktime": ".mov",
        "video/webm": ".webm",
        "video/x-msvideo": ".avi",
        "video/mpeg": ".mpeg",
    }.get(mime_type, ".mp4")

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    try:
        for chunk in resp.iter_content(chunk_size=65536):
            tmp.write(chunk)
        tmp.flush()
        return tmp.name, mime_type
    finally:
        tmp.close()


# ---------------------------------------------------------------------------
# Step 2: Upload to Gemini Files API
# ---------------------------------------------------------------------------

def upload_to_gemini(file_path: str, mime_type: str) -> tuple[str, str, str]:
    """
    Upload video via Files API simple upload.
    Returns (file_name, file_uri, file_mime).
    """
    print("[2/5] Uploading to Gemini Files API...")
    url = f"{GEMINI_BASE}/upload/v1beta/files?uploadType=media&key={gemini_key()}"

    with open(file_path, "rb") as f:
        resp = requests.post(
            url,
            headers={
                "Content-Type": mime_type,
                "X-Goog-Upload-Protocol": "raw",
            },
            data=f,
            timeout=180,
        )

    if not resp.ok:
        raise RuntimeError(f"Gemini upload failed ({resp.status_code}): {resp.text}")

    data = resp.json()
    file_info = data.get("file", {})
    file_name = file_info.get("name", "")
    file_uri = file_info.get("uri", "")
    file_mime = file_info.get("mimeType", mime_type)

    if not file_uri:
        raise RuntimeError(f"No file URI in Gemini upload response: {data}")

    print(f"    → Uploaded as {file_name}")
    return file_name, file_uri, file_mime


# ---------------------------------------------------------------------------
# Step 3: Poll until ACTIVE
# ---------------------------------------------------------------------------

def wait_for_active(file_name: str, timeout: int = 180) -> None:
    """Poll file status until state == ACTIVE."""
    print("[3/5] Waiting for Gemini to process video...", end="", flush=True)
    url = f"{GEMINI_BASE}/v1beta/{file_name}?key={gemini_key()}"
    elapsed = 0
    interval = 5

    while elapsed < timeout:
        resp = requests.get(url, timeout=30)
        if not resp.ok:
            raise RuntimeError(f"File status check failed ({resp.status_code}): {resp.text}")

        state = resp.json().get("state", "UNKNOWN")
        if state == "ACTIVE":
            print(" ready.")
            return
        if state == "FAILED":
            raise RuntimeError(f"Gemini file processing failed: {resp.json()}")

        print(".", end="", flush=True)
        time.sleep(interval)
        elapsed += interval

    raise RuntimeError(f"File not ACTIVE after {timeout}s (last state: {state})")


# ---------------------------------------------------------------------------
# Step 4 & 5: Gemini generateContent
# ---------------------------------------------------------------------------

def gemini_generate(prompt: str, file_uri: str = None, file_mime: str = None) -> str:
    """Call Gemini 2.5 Flash generateContent. Returns text response."""
    url = (
        f"{GEMINI_BASE}/v1beta/models/gemini-2.5-flash:generateContent"
        f"?key={gemini_key()}"
    )

    parts: list[dict] = [{"text": prompt}]
    if file_uri:
        parts.append({"fileData": {"mimeType": file_mime, "fileUri": file_uri}})

    body = {
        "contents": [{"parts": parts}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 8192, "responseMimeType": "application/json"},
    }

    resp = requests.post(url, json=body, timeout=120)
    if not resp.ok:
        raise RuntimeError(f"Gemini generateContent failed ({resp.status_code}): {resp.text}")

    data = resp.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as e:
        raise RuntimeError(f"Unexpected Gemini response shape: {data}") from e


def parse_json(text: str) -> dict:
    """Extract the first JSON object from a text blob."""
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        return json.loads(match.group(0))
    return json.loads(text)


# ---------------------------------------------------------------------------
# Step 6: Callback
# ---------------------------------------------------------------------------

def post_callback(callback_url: str, request_id: str, results: list, characteristics: dict | None = None) -> None:
    """POST results back to the Next.js webhook endpoint."""
    print("[5/5] Posting results to callback...")
    webhook_secret = os.environ.get("WEBHOOK_SECRET", "")
    headers = {"Content-Type": "application/json"}
    if webhook_secret:
        headers["Authorization"] = f"Bearer {webhook_secret}"

    payload: dict = {"requestId": request_id, "results": results}
    if characteristics:
        payload["characteristics"] = characteristics

    resp = requests.post(
        callback_url,
        json=payload,
        headers=headers,
        timeout=30,
    )
    if not resp.ok:
        raise RuntimeError(f"Callback failed ({resp.status_code}): {resp.text}")

    print(f"    → OK ({resp.status_code})")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze video with Gemini AI")
    parser.add_argument("--request-id", required=True)
    parser.add_argument("--video-url", required=True)
    parser.add_argument("--platform", required=True)
    parser.add_argument("--target-age", required=True)
    parser.add_argument("--target-gender", required=True)
    parser.add_argument("--target-tags", default="")
    parser.add_argument("--callback-url", required=True)
    args = parser.parse_args()

    target_tags = [t.strip() for t in args.target_tags.split(",") if t.strip()]
    kpis_str = ", ".join(KPIS)

    file_path: str | None = None
    try:
        # 1. Download
        file_path, mime_type = download_video(args.video_url)

        # 2. Upload
        file_name, file_uri, file_mime = upload_to_gemini(file_path, mime_type)

        # 3. Wait
        wait_for_active(file_name)

        # 4. Extract tags
        print("[4/5] Analyzing video content...")
        extract_prompt = f"""You are a social media video analysis expert.

Target platform: {args.platform}
Target audience age: {args.target_age}
Target audience gender: {args.target_gender}
Target interests: {", ".join(target_tags) or "none"}
KPIs to evaluate: {kpis_str}

Watch this video carefully and evaluate ALL of the following:

CONTENT (up to 10 tags max, no more):
- Up to 10 tags covering topics, themes, visual style, audio, mood

SCORES (0-100 each):
- quality_score: overall production quality
- hook_strength: how engaging are the first 3 seconds
- audience_relevance: relevance to the target demographic

VIDEO CHARACTERISTICS (score each 0-100 unless noted):
- objective: one of "educate", "sell", "entertain", "inspire", "inform"
- storytelling: narrative strength and emotional connection
- audio_quality: clarity of speech/music, no distracting noise
- visual_quality: resolution, brightness, colour grading
- editing_pacing: rhythm of cuts, transitions, avoids lag
- audience_awareness: tone and style match the target demographic
- hook_score: first-seconds attention grab (same as hook_strength)
- cta_present: true or false — is there a clear call to action
- lighting: proper lighting, well-lit scene
- stability: steady footage, no unwanted shake
- format_fit: how well aspect ratio and length suit the platform (0-100)

Your response must be a raw JSON object. Do not use markdown, do not wrap in code fences, do not add any text before or after the JSON. Start your response with {{ and end with }}.
{{
  "tags": ["tag1", "tag2"],
  "quality_score": 75,
  "hook_strength": 80,
  "audience_relevance": 70,
  "content_summary": "brief one-sentence description",
  "characteristics": {{
    "objective": "educate",
    "storytelling": 70,
    "audio_quality": 85,
    "visual_quality": 80,
    "editing_pacing": 75,
    "audience_awareness": 80,
    "cta_present": false,
    "lighting": 85,
    "stability": 90,
    "format_fit": 80
  }}
}}"""

        extract_text = gemini_generate(extract_prompt, file_uri=file_uri, file_mime=file_mime)
        print(f"[DEBUG extract_text]\n{extract_text}\n[/DEBUG]")
        analysis = parse_json(extract_text)

        # 5. Score KPIs
        tags_str = ", ".join(analysis.get("tags", [])) or "N/A"
        score_prompt = f"""You are a social media performance prediction expert for {args.platform}.

Video analysis:
- Summary: {analysis.get("content_summary", "N/A")}
- Tags: {tags_str}
- Production quality: {analysis.get("quality_score", 50)}/100
- Hook strength: {analysis.get("hook_strength", 50)}/100
- Audience relevance: {analysis.get("audience_relevance", 50)}/100

Target audience:
- Platform: {args.platform}
- Age: {args.target_age}
- Gender: {args.target_gender}
- Interests: {", ".join(target_tags) or "none"}

For each KPI, predict realistic performance for a new creator account posting this video:
- predicted_value: realistic value with units (e.g. "8.5K", "3.2%", "$0.45")
- For "View Duration" specifically: return an integer in milliseconds only, no units (e.g. "45000")
- score: 0-100 (50=average, 80+=strong, 100=viral)
- explanation: one sentence

KPIs: {kpis_str}

Your response must be a raw JSON object. Do not use markdown, do not wrap in code fences, do not add any text before or after the JSON. Start your response with {{ and end with }}.
{{
  "results": [
    {{"kpi_name": "Impressions", "predicted_value": "12.5K", "score": 68, "explanation": "Good hook drives solid impressions."}}
  ]
}}"""

        score_text = gemini_generate(score_prompt)
        print(f"[DEBUG score_text]\n{score_text}\n[/DEBUG]")
        scoring = parse_json(score_text)

        # 6. Callback
        post_callback(args.callback_url, args.request_id, scoring.get("results", []), analysis)
        print("Done!")

    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

    finally:
        if file_path:
            try:
                os.unlink(file_path)
            except OSError:
                pass


if __name__ == "__main__":
    main()
