import json
import re
import difflib

# Bismillah.
# Cross-Reference Sync: Match invocations to hisn_id.json via hisn_en.json (English parity).

def clean_eng(text):
    if not text: return ""
    text = re.sub(r'[\(\)\[\]\"\'\‘\’\“\”]', '', text)
    text = ' '.join(text.split())
    return text.lower()

def match_and_sync():
    with open('src/data/hisn_en.json', 'r') as f:
        hisn_raw = json.load(f)
    with open('src/data/hisn_id.json', 'r') as f:
        hisn_id_map = json.load(f)
    
    hisn_eng_flat = {}
    for chap in hisn_raw['English']:
        for text_obj in chap['TEXT']:
            g_id = str(text_obj['ID'])
            # Try TRANSLATED_TEXT first, fallback to LANGUAGE_ARABIC_TRANSLATED_TEXT
            eng = text_obj.get('TRANSLATED_TEXT') or text_obj.get('LANGUAGE_ARABIC_TRANSLATED_TEXT', '')
            hisn_eng_flat[g_id] = clean_eng(eng)

    files = ["public/invocations.json", "src/data/invocations.json"]
    for file_path in files:
        with open(file_path, 'r') as f:
            chapters = json.load(f)
            
        matched_count = 0
        total_count = 0
        
        for chap in chapters:
            for inv in chap['invocations']:
                total_count += 1
                inv_eng = clean_eng(inv['english'])
                if not inv_eng: continue
                
                best_score = 0
                best_id = None
                
                if str(inv['id']) in hisn_eng_flat:
                    score = difflib.SequenceMatcher(None, inv_eng, hisn_eng_flat[str(inv['id'])]).ratio()
                    if score > 0.8:
                        best_score = score
                        best_id = str(inv['id'])
                
                if best_score < 0.95:
                    for g_id, eng_text in hisn_eng_flat.items():
                        if abs(len(eng_text) - len(inv_eng)) > 300: continue
                        score = difflib.SequenceMatcher(None, inv_eng, eng_text).ratio()
                        if score > best_score:
                            best_score = score
                            best_id = g_id
                            if score > 0.98: break
                
                if best_score > 0.6:
                    if best_id in hisn_id_map:
                        text = hisn_id_map[best_id]
                        text = text.replace('‘', "'").replace('’', "'").replace('“', '"').replace('”', '"')
                        text = re.sub(r'\s+\d+\s*$', '', text)
                        inv['indonesian'] = text.strip()
                        matched_count += 1
                        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(chapters, f, ensure_ascii=False, indent=2)
        print(f"File {file_path}: Cross-matched {matched_count}/{total_count} using English parity.")

if __name__ == "__main__":
    match_and_sync()
