from faster_whisper import WhisperModel
import os

def main():
    audio_path = "public/audios/rodja_evening.mp3"
    if not os.path.exists(audio_path):
        print(f"File {audio_path} not found.")
        return

    print("Loading Whisper 'small' model on CPU...")
    model = WhisperModel("small", device="cpu", compute_type="int8")

    print("Starting full transcription (15 min audio)...")
    # Auto-detect language to capture both Arabic and translations
    segments, info = model.transcribe(audio_path, beam_size=5)

    print(f"Detected primary language: {info.language} ({info.language_probability:.2f})")
    print("-" * 30)

    output_path = "rodja_morning_transcript.txt"
    with open(output_path, "w", encoding="utf-8") as f:
        for segment in segments:
            line = f"[{segment.start:6.2f}s -> {segment.end:6.2f}s] {segment.text}"
            print(line)
            f.write(line + "\n")

    print("-" * 30)
    print(f"Full transcript saved to {output_path}")

if __name__ == "__main__":
    main()
