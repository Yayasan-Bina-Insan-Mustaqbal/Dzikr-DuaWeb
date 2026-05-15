"""
check_audio.py - Dzikr Audio vs Data Verification Tool
=======================================================
Bismillah.

Reads invocations.json, transcribes each audio file using faster-whisper (Arabic),
then computes a sameness score vs the Arabic text from the data.
Outputs a Markdown report table to log/11. Audio vs Data Verification.md
"""

import json
import os
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
# Paths relative to the project root (run from: Dzikr&Dua/ directory)
PROJECT_ROOT  = Path(__file__).resolve().parents[2]   # scripts/audio_check/../../
AUDIO_BASE    = PROJECT_ROOT / "public" / "audios"
INVOCATIONS   = PROJECT_ROOT / "public" / "invocations.json"
OUTPUT_REPORT = PROJECT_ROOT / "log" / "11. Audio vs Data Verification.md"
WHISPER_MODEL = "small"          # change to "medium" for higher accuracy
MIN_AUDIO_BYTES = 500            # skip stub/empty mp3 files (e.g. 133_*.mp3 = 10 bytes)
CACHE_FILE    = PROJECT_ROOT / "scripts" / "audio_check" / "stt_cache.json"


def strip_arabic_diacritics(text: str) -> str:
    """Remove tashkeel (diacritics) and punctuation for fair comparison."""
    # Remove diacritics (harakat)
    diacritics = re.compile(r'[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]')
    text = diacritics.sub('', text)
    # Remove non-Arabic chars (brackets, numbers, dots, etc.) for comparison
    text = re.sub(r'[^\u0600-\u06FF\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def similarity_score(a: str, b: str) -> float:
    """SequenceMatcher ratio between two strings, 0.0–1.0."""
    a_clean = strip_arabic_diacritics(a)
    b_clean = strip_arabic_diacritics(b)
    if not a_clean or not b_clean:
        return 0.0
    return round(SequenceMatcher(None, a_clean, b_clean).ratio(), 4)


def score_label(score: float) -> str:
    if score >= 0.85:
        return "✅ Match"
    elif score >= 0.60:
        return "⚠️ Partial"
    elif score > 0.0:
        return "❌ Mismatch"
    else:
        return "🔇 No Audio"


def suggest_better_name(original_name: str, arabic_text: str) -> str:
    """If original name has numbers, extract first few words of Arabic text for a better name."""
    # Check for numbers in the original name
    has_number = any(char.isdigit() for char in original_name)
    if not has_number:
        return original_name
    
    clean_arabic = strip_arabic_diacritics(arabic_text)
    words = clean_arabic.split()
    if not words:
        return original_name
        
    # Take first 4 words as a "special name"
    better_name = " ".join(words[:4])
    # If it's too short, maybe add the original context
    if len(words) < 2:
        return original_name
        
    return better_name


def load_invocations():
    """Flatten invocations.json into a list of (audio_file, arabic_text, invocation_name, chapter)."""
    records = []
    with open(INVOCATIONS, "r", encoding="utf-8") as f:
        chapters = json.load(f)

    for chapter in chapters:
        chapter_name = chapter.get("chapter_name", "Unknown")
        for inv in chapter.get("invocations", []):
            audio_rel = inv.get("audio", "")          # e.g. "/audios/001_01.mp3"
            arabic    = inv.get("arabic", "")
            name      = inv.get("name", f"id={inv.get('id','?')}")
            inv_id    = inv.get("id", "?")

            if not audio_rel:
                continue

            audio_file = AUDIO_BASE / Path(audio_rel).name
            records.append({
                "id":           inv_id,
                "name":         name,
                "chapter":      chapter_name,
                "audio_rel":    audio_rel,
                "audio_file":   audio_file,
                "arabic":       arabic,
            })

    return records


def transcribe_audio(model, audio_path: Path) -> str:
    """Transcribe audio and return joined Arabic text."""
    try:
        segments, info = model.transcribe(
            str(audio_path),
            language="ar",       # Force Arabic recognition
            beam_size=5,
            vad_filter=True,     # Skip silence
        )
        text = " ".join(seg.text.strip() for seg in segments)
        return text.strip()
    except Exception as e:
        return f"[ERROR: {e}]"


def get_file_hash(path: Path) -> str:
    """Simple hash of file size and mtime to detect changes."""
    stat = path.stat()
    return f"{stat.st_size}_{stat.st_mtime}"


def main():
    # Load cache
    cache = {}
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                cache = json.load(f)
        except:
            pass

    # Load model (only if needed)
    model = None
    
    def get_model():
        nonlocal model
        if model is None:
            print("Loading faster-whisper model...", flush=True)
            try:
                from faster_whisper import WhisperModel
                model = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")
                print(f"Model '{WHISPER_MODEL}' loaded.", flush=True)
            except ImportError:
                print("ERROR: faster-whisper not installed. Run: pip install faster-whisper")
                sys.exit(1)
        return model

    # Load data
    records = load_invocations()
    total   = len(records)
    print(f"Loaded {total} invocations from invocations.json", flush=True)

    results = []
    cache_updated = False
    
    for i, rec in enumerate(records, 1):
        audio_path = rec["audio_file"]
        audio_name = audio_path.name
        
        # Check file exists & is not a stub
        if not audio_path.exists():
            stt_text = "[FILE NOT FOUND]"
            score    = 0.0
            label    = "🔇 No Audio"
        elif audio_path.stat().st_size < MIN_AUDIO_BYTES:
            stt_text = "[STUB/EMPTY FILE]"
            score    = 0.0
            label    = "🔇 No Audio"
        else:
            # Check cache
            fhash = get_file_hash(audio_path)
            if audio_name in cache and cache[audio_name].get("hash") == fhash:
                stt_text = cache[audio_name]["text"]
                # print(f"[{i:3d}/{total}] {audio_name} — (Cached)", flush=True)
            else:
                print(f"[{i:3d}/{total}] {audio_name} — Transcribing...", flush=True)
                stt_text = transcribe_audio(get_model(), audio_path)
                cache[audio_name] = {"hash": fhash, "text": stt_text}
                cache_updated = True
            
            score    = similarity_score(stt_text, rec["arabic"])
            label    = score_label(score)
            # pct      = f"{score*100:.1f}%"
            # print(f"         Score: {pct} — {label}", flush=True)

        better_name = suggest_better_name(rec["name"], rec["arabic"])
        results.append({**rec, "stt": stt_text, "score": score, "label": label, "better_name": better_name})

    if cache_updated:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)

    # ── Build Markdown report ─────────────────────────────────────────────────
    OUTPUT_REPORT.parent.mkdir(parents=True, exist_ok=True)

    match_count   = sum(1 for r in results if r["score"] >= 0.85)
    partial_count = sum(1 for r in results if 0.60 <= r["score"] < 0.85)
    mismatch_count= sum(1 for r in results if 0.0 < r["score"] < 0.60)
    noaudio_count = sum(1 for r in results if r["score"] == 0.0 and "[" in r["stt"])

    with open(OUTPUT_REPORT, "w", encoding="utf-8") as f:
        f.write("# 11. Audio vs Data Verification Report\n\n")
        f.write("> **Bismillah.** Auto-generated by `scripts/audio_check/check_audio.py`\n")
        f.write(f"> Using Whisper model: `{WHISPER_MODEL}` | Forced language: Arabic\n\n")

        f.write("## Summary\n\n")
        f.write(f"| Metric | Count |\n")
        f.write(f"|--------|-------|\n")
        f.write(f"| Total Invocations | {total} |\n")
        f.write(f"| ✅ Match (≥85%) | {match_count} |\n")
        f.write(f"| ⚠️ Partial (60–85%) | {partial_count} |\n")
        f.write(f"| ❌ Mismatch (<60%) | {mismatch_count} |\n")
        f.write(f"| 🔇 No Audio / Stub | {noaudio_count} |\n\n")

        f.write("## Full Verification Table\n\n")
        f.write("| # | Audio File | Chapter | Invocation Name | Better Invocation Name | Arabic (Data) | STT Result | Score | Status |\n")
        f.write("|---|-----------|---------|-----------------|------------------------|---------------|------------|-------|--------|\n")

        for i, r in enumerate(results, 1):
            arabic_short = r["arabic"][:120].replace("|", "\\|").replace("\n", " ")
            stt_short    = r["stt"][:120].replace("|", "\\|").replace("\n", " ")
            chapter_safe = r["chapter"].replace("|", "\\|")
            name_safe    = r["name"].replace("|", "\\|")
            score_pct    = f"{r['score']*100:.1f}%"

            f.write(
                f"| {i} "
                f"| `{r['audio_rel']}` "
                f"| {chapter_safe} "
                f"| {name_safe} "
                f"| {r['better_name']} "
                f"| {arabic_short} "
                f"| {stt_short} "
                f"| {score_pct} "
                f"| {r['label']} |\n"
            )

    print(f"\nAlhamdulillah! Report saved to: {OUTPUT_REPORT}", flush=True)
    print(f"Summary: ✅ {match_count} | ⚠️ {partial_count} | ❌ {mismatch_count} | 🔇 {noaudio_count}", flush=True)


if __name__ == "__main__":
    main()
