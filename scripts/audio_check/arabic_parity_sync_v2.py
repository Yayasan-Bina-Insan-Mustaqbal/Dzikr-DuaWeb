import json
import re

# Bismillah.
# Arabic Parity Sync v2: Robust "Letters Only" Arabic matching.

def clean_arabic(text):
    if not text: return ""
    # Keep only Arabic letters (including alif with hamza, etc)
    # Range 0621-064A covers basic letters.
    # We should also keep 0671 (wasla), etc. but letters only is safest for matching.
    text = re.sub(r'[^\u0621-\u064A]', '', text)
    return text

def match_and_sync():
    with open('src/data/hisn_en.json', 'r') as f:
        hisn_raw = json.load(f)
    with open('src/data/hisn_id.json', 'r') as f:
        hisn_id_map = json.load(f)
    
    # Map cleaned Arabic -> hisn global ID
    arabic_to_id = {}
    for chap in hisn_raw['English']:
        for text_obj in chap['TEXT']:
            clean_ar = clean_arabic(text_obj.get('ARABIC_TEXT', ''))
            if clean_ar:
                arabic_to_id[clean_ar] = str(text_obj['ID'])

    files = ["public/invocations.json", "src/data/invocations.json"]
    for file_path in files:
        with open(file_path, 'r') as f:
            chapters = json.load(f)
            
        matched = 0
        total = 0
        for chap in chapters:
            for inv in chap['invocations']:
                total += 1
                clean_inv_ar = clean_arabic(inv['arabic'])
                if not clean_inv_ar: continue
                
                # Try exact match
                if clean_inv_ar in arabic_to_id:
                    g_id = arabic_to_id[clean_inv_ar]
                    if g_id in hisn_id_map:
                        text = hisn_id_map[g_id]
                        text = text.replace('‘', "'").replace('’', "'").replace('“', '"').replace('”', '"')
                        text = re.sub(r'\s+\d+\s*$', '', text)
                        inv['indonesian'] = text.strip()
                        matched += 1
                else:
                    # Try substring match for long ones
                    found = False
                    for ar_key, g_id in arabic_to_id.items():
                        if len(clean_inv_ar) > 50 and (clean_inv_ar in ar_key or ar_key in clean_inv_ar):
                            if g_id in hisn_id_map:
                                text = hisn_id_map[g_id]
                                text = text.replace('‘', "'").replace('’', "'").replace('“', '"').replace('”', '"')
                                text = re.sub(r'\s+\d+\s*$', '', text)
                                inv['indonesian'] = text.strip()
                                matched += 1
                                found = True
                                break
                    
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(chapters, f, ensure_ascii=False, indent=2)
        print(f"File {file_path}: Matched {matched}/{total} using Arabic parity (Letters Only).")

if __name__ == "__main__":
    match_and_sync()
