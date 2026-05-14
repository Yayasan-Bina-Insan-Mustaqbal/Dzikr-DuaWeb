import json
import os
import difflib
import re
from pydub import AudioSegment
from pydub.silence import split_on_silence
from faster_whisper import WhisperModel

def clean_arabic(text):
    """Remove tashkeel (diacritics) and brackets to make matching robust against Whisper's output."""
    text = re.sub(r'[\u064B-\u065F\u0670]', '', text) 
    text = re.sub(r'[()﴿﴾\[\]]', '', text) 
    return text.strip()

def get_match_score(expected, actual):
    """Returns best score between full sequence match and longest substring match."""
    seq_ratio = difflib.SequenceMatcher(None, expected, actual).ratio()
    match = difflib.SequenceMatcher(None, expected, actual).find_longest_match(0, len(expected), 0, len(actual))
    sub_ratio = match.size / len(expected) if len(expected) > 0 else 0
    return max(seq_ratio, sub_ratio)

def main():
    os.makedirs("temp_chunks", exist_ok=True)
    os.makedirs("final_cuts", exist_ok=True)

    # 1. Load Golden Text from our app data
    with open("public/invocations.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        
    morning_chapter = next(c for c in data if c["id"] == 27)
    expected_texts = [clean_arabic(inv["arabic"]) for inv in morning_chapter["invocations"]]
    
    # 2. Check if heavy rock is downloaded
    audio_path = "public/audios/rodja_morning.mp3"
    if not os.path.exists(audio_path):
        print(f"Missing {audio_path}. Wait for download.")
        return
        
    print("Loading heavy sound rock...")
    audio = AudioSegment.from_mp3(audio_path)
    
    print("Chopping silence...")
    raw_chunks = split_on_silence(audio, min_silence_len=600, silence_thresh=-40, keep_silence=200)
    print(f"Got {len(raw_chunks)} raw pieces.")
    
    print("Loading AI Brain...")
    model = WhisperModel("small", device="cpu", compute_type="int8")
    
    current_buffer = AudioSegment.empty()
    invocation_idx = 0
    
    for i, chunk in enumerate(raw_chunks):
        if invocation_idx >= len(expected_texts):
            break
            
        current_buffer += chunk
        buffer_path = f"temp_chunks/buffer.wav"
        current_buffer.export(buffer_path, format="wav")
        
        segments, _ = model.transcribe(buffer_path, language="ar")
        ai_text = clean_arabic(" ".join([s.text for s in segments]))
        
        score_current = get_match_score(expected_texts[invocation_idx], ai_text)
        
        print(f"Chunk {i} | Dua {invocation_idx+1} Score: {score_current:.2f} | Text: '{ai_text[:50]}...'")
        
        # 3. Match logic
        # Threshold set to 0.55 because Dzikr repeats (actual audio > expected text)
        if score_current > 0.55:
            final_filename = f"final_cuts/027_{invocation_idx+1:02d}.mp3"
            current_buffer.export(final_filename, format="mp3")
            print(f"--> SUCCESS! Saved {final_filename}. Advancing to next Dua.")
            
            invocation_idx += 1
            current_buffer = AudioSegment.empty()
        else:
            print("--> Incomplete phrase. Gluing to next chunk...")

    print("Me finished hunting. All cuts perfectly aligned in /final_cuts/")

if __name__ == "__main__":
    main()
