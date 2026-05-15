import json
import re
import os

def extract_pdf_translations(txt_path):
    """Extract Indonesian translations using absolute invocation numbers."""
    if not os.path.exists(txt_path):
        return {}

    with open(txt_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    translations = {}
    
    # Pattern for absolute translation numbers like "210. “Dengan nama Allah.”"
    translation_pattern = re.compile(r'^(\d+)\.\s+(.*)')

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip the Table of Contents (roughly first 600 lines)
        if i < 600:
            i += 1
            continue

        trans_match = translation_pattern.match(line)
        if trans_match:
            abs_id = int(trans_match.group(1))
            text = trans_match.group(2)
            
            # Basic cleanup of starting quotes
            text = re.sub(r'^[“"‘]', '', text)
            
            # Handle multi-line translations
            j = i + 1
            while j < len(lines):
                next_line = lines[j].strip()
                if not next_line:
                    j += 1
                    continue
                
                # Stop if we hit a new absolute number or a new chapter header
                if translation_pattern.match(next_line) or re.match(r'^\d+-\s+', next_line):
                    break
                # Stop if it looks like a footnote reference or reference source
                if re.match(r'^HR\.', next_line) or (next_line.isdigit() and len(next_line) < 4):
                    break
                # Stop if it looks like Arabic
                if any(ord(c) > 0x0600 and ord(c) < 0x06FF for c in next_line):
                    break
                    
                text += " " + next_line
                j += 1
            
            # Final cleanup of trailing quotes and references
            text = re.sub(r'[”"’]\s*\d*$', '', text).strip()
            # Remove trailing footnote numbers if present (e.g., "Text 123")
            text = re.sub(r'\s+\d+$', '', text)
            
            translations[abs_id] = text
            
        i += 1
    return translations

def extract_rodja_translations(scratchpad_path):
    """Extract Morning and Evening translations from the Radio Rodja scratchpad."""
    if not os.path.exists(scratchpad_path):
        return [], []

    with open(scratchpad_path, 'r', encoding='utf-8') as f:
        content = f.read()

    morning_match = re.search(r'MORNING_DZIKR_START(.*?)MORNING_DZIKR_END', content, re.DOTALL)
    evening_match = re.search(r'EVENING_DZIKR_START(.*?)EVENING_DZIKR_END', content, re.DOTALL)
    
    def parse_section(text):
        items = []
        # Pattern for Arabic followed by quoted translation
        pattern = re.compile(r'([\u0600-\u06FF\s]+)\s*[\n\r]\s*[“"](.*?)[”"]', re.DOTALL)
        for arabic, indo in pattern.findall(text):
            items.append({
                "arabic": " ".join(arabic.split()),
                "indonesian": " ".join(indo.split())
            })
        return items

    morning_list = parse_section(morning_match.group(1)) if morning_match else []
    evening_list = parse_section(evening_match.group(1)) if evening_match else []
        
    return morning_list, evening_list

def main():
    workspace_root = '/home/abuhafi/Project/Dzikr&Dua/Dzikr&DuaWeb/Dzikr&Dua'
    pdf_txt = os.path.join(workspace_root, 'src/data/hisnul_muslim.txt')
    scratchpad = '/home/abuhafi/.gemini/antigravity/brain/a1822af6-f29d-448e-a82b-897e2d195677/browser/scratchpad_ugd59zxv.md'
    invocations_json = os.path.join(workspace_root, 'src/data/invocations.json')
    output_hisn_id = os.path.join(workspace_root, 'src/data/hisn_id.json')

    print("Step 1: Extracting from PDF...")
    pdf_translations = extract_pdf_translations(pdf_txt)
    print(f"Found {len(pdf_translations)} absolute translations in PDF.")

    print("Step 2: Extracting from Radio Rodja...")
    rodja_morning, rodja_evening = extract_rodja_translations(scratchpad)
    print(f"Found {len(rodja_morning)} morning and {len(rodja_evening)} evening items on Rodja.")

    print("Step 3: Updating invocations.json...")
    if os.path.exists(invocations_json):
        with open(invocations_json, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for chapter in data:
            chapter_id = int(chapter.get('id', 0))
            
            for idx, inv in enumerate(chapter.get('invocations', [])):
                abs_id = inv.get('id')
                # 1. Map from PDF absolute translations
                if abs_id and abs_id in pdf_translations:
                    inv['indonesian'] = pdf_translations[abs_id]
                
                # 2. Override with Rodja for specific chapters
                if chapter_id == 27 and idx < len(rodja_morning):
                    inv['indonesian'] = rodja_morning[idx]['indonesian']
                elif chapter_id == 133 and idx < len(rodja_evening):
                    inv['indonesian'] = rodja_evening[idx]['indonesian']
                
        with open(invocations_json, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("Updated invocations.json with Indonesian translations.")

    # Save the lookup table separately
    with open(output_hisn_id, 'w', encoding='utf-8') as f:
        # Convert keys to strings for JSON
        json_data = {str(k): v for k, v in pdf_translations.items()}
        json.dump(json_data, f, ensure_ascii=False, indent=2)

    print("Alhamdulillah, processing complete.")

if __name__ == "__main__":
    main()
