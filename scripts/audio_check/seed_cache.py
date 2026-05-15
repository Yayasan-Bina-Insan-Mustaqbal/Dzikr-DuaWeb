import re
import json
import os
from pathlib import Path

# Bismillah.
# Seed stt_cache.json from the existing 11. Audio vs Data Verification.md report.

PROJECT_ROOT = Path(__file__).resolve().parents[2]
REPORT_FILE = PROJECT_ROOT / "log" / "11. Audio vs Data Verification.md"
CACHE_FILE = PROJECT_ROOT / "scripts" / "audio_check" / "stt_cache.json"
AUDIO_BASE = PROJECT_ROOT / "public" / "audios"

def get_file_hash(path: Path) -> str:
    stat = path.stat()
    return f"{stat.st_size}_{stat.st_mtime}"

def main():
    if not REPORT_FILE.exists():
        print("Report file not found.")
        return

    with open(REPORT_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # Regex to find rows in the table
    # | 1 | `/audios/001_01.mp3` | Upon Waking Up | Upon Waking Up (1) | ... | STT | ... |
    # Note: We need to be careful with escaping and length
    pattern = r"\| \d+ \| `\/audios\/(?P<audio>[^`]+)` \| [^|]+ \| [^|]+ \| [^|]+ \| (?P<stt>[^|]+) \| [^|]+ \| [^|]+ \|"
    
    cache = {}
    matches = re.finditer(pattern, content)
    
    count = 0
    for m in matches:
        audio_name = m.group("audio")
        stt_text = m.group("stt").strip()
        
        # Cleanup STT text (it might have been truncated or escaped)
        if stt_text.startswith("[") and stt_text.endswith("]"):
             continue # Skip errors/stubs
             
        audio_path = AUDIO_BASE / audio_name
        if audio_path.exists():
            fhash = get_file_hash(audio_path)
            cache[audio_name] = {"hash": fhash, "text": stt_text}
            count += 1

    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)

    print(f"Alhamdulillah! Seeded cache with {count} entries.")

if __name__ == "__main__":
    main()
