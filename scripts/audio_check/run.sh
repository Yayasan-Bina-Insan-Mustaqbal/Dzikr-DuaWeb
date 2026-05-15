#!/usr/bin/env bash
# Bismillah.
# Run the Dzikr audio vs data verification check.
# Usage: bash scripts/audio_check/run.sh
# Output: log/11. Audio vs Data Verification.md

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$SCRIPT_DIR/.venv"

# Bootstrap venv if missing
if [ ! -d "$VENV" ]; then
  echo "Creating virtual environment..."
  uv venv "$VENV"
  source "$VENV/bin/activate"
  uv pip install faster-whisper
else
  source "$VENV/bin/activate"
fi

echo "Starting audio check..."
python "$SCRIPT_DIR/check_audio.py"
