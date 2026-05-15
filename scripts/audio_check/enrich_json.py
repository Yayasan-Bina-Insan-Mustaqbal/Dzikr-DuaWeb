import json
import re
import os

# Bismillah.
# Enrich both JSON files with high-quality English names.

files_to_update = ["public/invocations.json", "src/data/invocations.json"]

# High-quality manual overrides
manual_overrides = {
    "/audios/001_01.mp3": "Praise for Life",
    "/audios/001_02.mp3": "Declaration of Oneness",
    "/audios/001_03.mp3": "Praise for Health",
    "/audios/001_04.mp3": "Creation of Heavens & Earth",
    "/audios/023_01.mp3": "Salutations on the Prophet",
    "/audios/023_02.mp3": "Salutations on Prophet & Family",
    "/audios/024_01.mp3": "Protection from 4 Trials",
    "/audios/024_02.mp3": "Protection from Dajjal & Sins",
    "/audios/024_03.mp3": "Forgiveness for Self-Wrong",
    "/audios/024_04.mp3": "Forgiveness for All Sins",
    "/audios/024_05.mp3": "Seeking Help in Dhikr",
    "/audios/024_06.mp3": "Protection from Cowardice",
    "/audios/024_07.mp3": "Dua for Paradise",
    "/audios/025_01.mp3": "Seeking Forgiveness (Istighfar)",
    "/audios/025_02.mp3": "Oneness & Sovereignty",
    "/audios/025_03.mp3": "Glorification (Subhanallah)",
    "/audios/025_04.mp3": "Tasbih, Tahmid, Takbir",
    "/audios/025_05.mp3": "Recitation of 3 Quls",
    "/audios/025_06.mp3": "Ayatul Kursi",
    "/audios/027_01.mp3": "Morning: Protection from Shaitan",
    "/audios/027_02.mp3": "Morning: 3 Quls (3x)",
    "/audios/027_03.mp3": "Morning: Sovereignty belongs to Allah",
    "/audios/027_04.mp3": "Morning: By Your leave we rise",
    "/audios/027_05.mp3": "Morning: Sayyidul Istighfar",
    "/audios/027_06.mp3": "Morning: Testimony (4x)",
    "/audios/027_07.mp3": "Morning: Acknowledgement of Blessings",
    "/audios/027_08.mp3": "Morning: Wellbeing (3x)",
    "/audios/027_09.mp3": "Morning: Sufficient is Allah (7x)",
    "/audios/027_10.mp3": "Morning: Worldly & Hereafter Safety",
    "/audios/027_11.mp3": "Morning: Protection from Self & Shaitan",
    "/audios/027_12.mp3": "Morning: Protection with His Name (3x)",
    "/audios/027_13.mp3": "Morning: Pleasure with Allah (3x)",
    "/audios/027_14.mp3": "Morning: O Ever Living (Ya Hayyu)",
    "/audios/027_15.mp3": "Morning: Upon the Morning",
    "/audios/027_16.mp3": "Morning: Upon the Fitrah",
    "/audios/027_17.mp3": "Morning: Subhanallahi wa Bihamdihi (100x)",
    "/audios/027_18.mp3": "Morning: Oneness (10x or 1x)",
    "/audios/027_19.mp3": "Morning: Oneness (100x)",
    "/audios/027_20.mp3": "Morning: Glorification (3x)",
    "/audios/027_21.mp3": "Morning: Knowledge & Provisions",
    "/audios/027_22.mp3": "Morning: Istighfar (100x)",
    "/audios/027_23.mp3": "Morning: Salutations (10x)",
}

for i in range(1, 26):
    morning_audio = f"/audios/027_{i:02d}.mp3"
    evening_audio = f"/audios/133_{i:02d}.mp3"
    if morning_audio in manual_overrides:
        manual_overrides[evening_audio] = manual_overrides[morning_audio].replace("Morning:", "Evening:")

def clean_text(text):
    text = re.sub(r'[\(\)\[\]"\']', '', text)
    text = re.sub(r' \d+ ', ' ', text)
    text = re.sub(r'^All praise is for Allah who ', 'Praise for ', text, flags=re.I)
    text = re.sub(r'^O Allah ', '', text, flags=re.I)
    text = re.sub(r'^None has the right to be worshipped except Allah ', 'Oneness of Allah ', text, flags=re.I)
    return text.strip()

for target_file in files_to_update:
    if not os.path.exists(target_file):
        print(f"File not found: {target_file}")
        continue
        
    with open(target_file, "r") as f:
        chapters = json.load(f)

    for chap in chapters:
        for inv in chap.get("invocations", []):
            old_name = inv.get("name", "")
            audio = inv.get("audio", "")
            eng = inv.get("english", "")
            
            if audio in manual_overrides:
                inv["name"] = manual_overrides[audio]
            elif any(c.isdigit() for c in old_name) or "(" in old_name or not old_name:
                cleaned = clean_text(eng)
                words = cleaned.split()
                better = " ".join(words[:5])
                if len(words) > 5: better += "..."
                inv["name"] = better
            # Keep original_name just in case for internal tracking
            inv["internal_id"] = old_name

    with open(target_file, "w", encoding="utf-8") as f:
        json.dump(chapters, f, indent=2, ensure_ascii=False)
    
    print(f"Updated {target_file}")
