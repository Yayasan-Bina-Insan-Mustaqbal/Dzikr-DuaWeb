import json
import re
import difflib

# Bismillah.
# Robust Indonesian translation sync using fuzzy Arabic text matching.

def clean_arabic(text):
    if not text: return ""
    # Remove all harakat (diacritics)
    text = re.sub(r'[\u064B-\u065F\u0670]', '', text)
    # Remove punctuation and whitespace
    text = re.sub(r'[^\u0600-\u06FF]', '', text)
    return text

def extract_pdf_data():
    txt_path = 'src/data/hisnul_muslim.txt'
    with open(txt_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pre-clean: remove page markers
    content = re.sub(r'\f\d+', '', content)
    
    # Strategy: Find all blocks that look like Arabic, and the translation number following them.
    # Pattern: (Arabic Block) ... (Number). "(Indo Text)"
    
    # First, let's find all numbered translations: "X. "
    translations = []
    # Using re.finditer to get positions
    for m in re.finditer(r'(\d+)\.\s+[“"‘]', content):
        num = m.group(1)
        start_pos = m.end()
        # Find end of this translation (next number or chapter header)
        next_m = re.search(r'\n\s*\d+\.\s+[“"‘]|\n\s*\d+-\s+[A-Z]', content[start_pos:])
        end_pos = start_pos + (next_m.start() if next_m else len(content) - start_pos)
        
        indo_text = content[start_pos:end_pos]
        # Clean Indo text
        lines = []
        for line in indo_text.split('\n'):
            line = line.strip()
            if not line or line.startswith('Doa ') or (line.isupper() and len(line) > 10): break
            lines.append(line)
        indo_clean = ' '.join(lines)
        
        # Now find the Arabic text immediately PRECEDING this number
        # Look back up to 2000 chars
        lookback = content[max(0, m.start()-2000):m.start()]
        arabic_blocks = re.findall(r'[\u0600-\u06FF\s\(\)\.\,\:\;\!\?\-\=]{20,}', lookback)
        if arabic_blocks:
            arabic = arabic_blocks[-1].strip()
            translations.append({
                "id": int(num),
                "arabic_clean": clean_arabic(arabic),
                "indo": indo_clean.strip()
            })
            
    return translations

def fix():
    pdf_data = extract_pdf_data()
    print(f"Extracted {len(pdf_data)} translations from PDF.")
    
    files = ["public/invocations.json", "src/data/invocations.json"]
    for file_path in files:
        with open(file_path, 'r') as f:
            chapters = json.load(f)
            
        matches = 0
        total = 0
        for chap in chapters:
            for inv in chap['invocations']:
                total += 1
                inv_arabic = clean_arabic(inv['arabic'])
                if not inv_arabic: continue
                
                # Find best match in pdf_data
                best_score = 0
                best_indo = None
                
                # First try exact ID match if Arabic is similar
                id_match = next((t for t in pdf_data if t['id'] == inv['id']), None)
                if id_match:
                    score = difflib.SequenceMatcher(None, inv_arabic, id_match['arabic_clean']).ratio()
                    if score > 0.7:
                        best_indo = id_match['indo']
                        best_score = score
                
                # If no good ID match, search all
                if best_score < 0.9:
                    for t in pdf_data:
                        # Optimization: only check similar length or some overlap
                        if abs(len(t['arabic_clean']) - len(inv_arabic)) > 500: continue
                        
                        score = difflib.SequenceMatcher(None, inv_arabic, t['arabic_clean']).ratio()
                        if score > best_score:
                            best_score = score
                            best_indo = t['indo']
                            if score > 0.98: break # Good enough
                
                if best_score > 0.6:
                    # Clean the Indo text from curly quotes etc
                    best_indo = best_indo.replace('‘', "'").replace('’', "'").replace('“', '"').replace('”', '"')
                    # Remove trailing numbers
                    best_indo = re.sub(r'\s+\d+$', '', best_indo)
                    inv['indonesian'] = best_indo
                    matches += 1
                else:
                    # Keep existing if no match found (maybe it was manually fixed)
                    pass
                    
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(chapters, f, ensure_ascii=False, indent=2)
        print(f"File {file_path}: Matched {matches}/{total} invocations.")

if __name__ == "__main__":
    fix()
