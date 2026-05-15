import json
import re
import difflib

# Bismillah.
# Cross-Reference Sync v4: Word overlap priority for maximum accuracy.

def clean_eng(text):
    if not text: return ""
    text = re.sub(r'[^a-zA-Z\s]', '', text) # Letters only
    text = ' '.join(text.split())
    return text.lower()

def get_word_set(text):
    return set(clean_eng(text).split())

def match_and_sync():
    with open('src/data/hisn_en.json', 'r') as f:
        hisn_raw = json.load(f)
    with open('src/data/hisn_id.json', 'r') as f:
        hisn_id_map = json.load(f)
    
    hisn_eng_flat = {}
    hisn_word_sets = {}
    for chap in hisn_raw['English']:
        for text_obj in chap['TEXT']:
            g_id = str(text_obj['ID'])
            eng = text_obj.get('TRANSLATED_TEXT') or text_obj.get('LANGUAGE_ARABIC_TRANSLATED_TEXT', '')
            hisn_eng_flat[g_id] = clean_eng(eng)
            hisn_word_sets[g_id] = get_word_set(eng)

    files = ["public/invocations.json", "src/data/invocations.json"]
    for file_path in files:
        with open(file_path, 'r') as f:
            chapters = json.load(f)
            
        matched_count = 0
        total_count = 0
        
        for chap in chapters:
            for inv in chap['invocations']:
                total_count += 1
                inv_words = get_word_set(inv['english'])
                if not inv_words: continue
                
                best_overlap = 0
                best_id = None
                
                for g_id, w_set in hisn_word_sets.items():
                    if not w_set: continue
                    # Jaccard-like similarity
                    intersection = len(inv_words & w_set)
                    union = len(inv_words | w_set)
                    score = intersection / union
                    if score > best_overlap:
                        best_overlap = score
                        best_id = g_id
                
                if best_overlap > 0.4: # Very safe for unique English translations
                    if best_id in hisn_id_map:
                        text = hisn_id_map[best_id]
                        text = text.replace('‘', "'").replace('’', "'").replace('“', '"').replace('”', '"')
                        text = re.sub(r'\s+\d+\s*$', '', text)
                        inv['indonesian'] = text.strip()
                        matched_count += 1
                        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(chapters, f, ensure_ascii=False, indent=2)
        print(f"File {file_path}: Cross-matched {matched_count}/{total_count} using word overlap (Jaccard).")

if __name__ == "__main__":
    match_and_sync()
