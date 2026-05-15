
import json
import re
import os

def clean_text(text):
    if not text:
        return ""
    # Remove footnote numbers like [1], [15], etc.
    text = re.sub(r'\[\d+\]', '', text)
    # Remove reference tags like [Al-Baqarah/2: 255]
    text = re.sub(r'\[[^\]]+\]', '', text)
    # Remove trailing numbers
    text = re.sub(r'\s*\d+\s*$', '', text)
    # Normalize whitespace
    text = ' '.join(text.split())
    # Fix quotes
    text = text.replace('‘', "'").replace('’', "'").replace('“', '"').replace('”', '"')
    # Fix common OCR/translation errors
    text = text.replace('صلي الله عليه وسلم', 'ﷺ')
    return text.strip()

def extract_pdf_translations(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    parts = re.split(r'Daftar Pustaka', content, flags=re.IGNORECASE)
    main_content = parts[0]
    
    # PDF uses various quotes: standard ", curly “, and single curly ‘
    pattern = re.compile(r'(\d+)\.\s+[“"‘](.*?)[”"’]', re.DOTALL)
    matches = pattern.findall(main_content)
    
    translations = {}
    for num, text in matches:
        translations[num] = clean_text(text)
    
    return translations

def extract_rodja_from_scratchpad(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    morning_match = re.search(r'MORNING_DZIKR_START(.*?)MORNING_DZIKR_END', content, re.DOTALL)
    evening_match = re.search(r'EVENING_DZIKR_START(.*?)EVENING_DZIKR_END', content, re.DOTALL)
    
    def parse_section(text):
        # Match text between double curly quotes
        pattern = re.compile(r'“([^”]+)”', re.DOTALL)
        matches = pattern.findall(text)
        
        filtered = []
        for m in matches:
            m = clean_text(m)
            if len(m) > 20 and "Dzikir Pagi Petang dan Sesudah Shalat Fardhu" not in m:
                filtered.append(m)
        return filtered

    morning = parse_section(morning_match.group(1)) if morning_match else []
    evening = parse_section(evening_match.group(1)) if evening_match else []
    
    return morning, evening

def enrich():
    base_dir = '/home/abuhafi/Project/Dzikr&Dua/Dzikr&DuaWeb/Dzikr&Dua'
    inv_path = f'{base_dir}/src/data/invocations.json'
    pdf_text_path = f'{base_dir}/src/data/hisnul_muslim.txt'
    scratchpad_path = '/home/abuhafi/.gemini/antigravity/brain/a1822af6-f29d-448e-a82b-897e2d195677/browser/scratchpad_ugd59zxv.md'
    
    with open(inv_path, 'r') as f:
        data = json.load(f)
    
    pdf_trans = extract_pdf_translations(pdf_text_path)
    rodja_morning, rodja_evening = extract_rodja_from_scratchpad(scratchpad_path)
    
    print(f"Extracted {len(pdf_trans)} translations from PDF")

    for chapter in data:
        c_id = chapter['id']
        invs = chapter['invocations']
        
        for inv in invs:
            inv_id = inv['id']
            
            # Morning Adhkar (Chapter 27)
            if c_id == 27:
                mapping = {
                    76: 1, 77: [2, 3, 4], 78: 5, 79: 6, 80: 7, 83: 8, 85: 9, 86: 10,
                    87: 11, 88: 12, 89: 13, 91: 14, 93: 15, 95: 16, 96: 17, 92: 18, 97: 19
                }
                if inv_id in mapping:
                    target = mapping[inv_id]
                    if isinstance(target, list):
                        parts = [rodja_morning[t] for t in target if t < len(rodja_morning)]
                        inv['indonesian'] = "\n\n".join(parts)
                    elif target < len(rodja_morning):
                        inv['indonesian'] = rodja_morning[target]
                else:
                    book_id = str(inv_id - 1) if inv_id < 77 else str(inv_id - 2)
                    if book_id in pdf_trans:
                        inv['indonesian'] = pdf_trans[book_id]
            
            # Evening Adhkar (Chapter 133)
            elif c_id == 133:
                mapping = {
                    412: 1, 413: [2, 3, 4], 414: 5, 415: 6, 416: 7, 419: 8, 421: 9, 422: 10,
                    423: 11, 424: 12, 425: 13, 427: 14, 429: 15, 431: 16, 432: 17, 433: 18
                }
                if inv_id in mapping:
                    target = mapping[inv_id]
                    if isinstance(target, list):
                        parts = [rodja_evening[t] for t in target if t < len(rodja_evening)]
                        inv['indonesian'] = "\n\n".join(parts)
                    elif target < len(rodja_evening):
                        inv['indonesian'] = rodja_evening[target]
                else:
                    book_id = str(inv_id - 337) if inv_id < 413 else str(inv_id - 338)
                    if book_id in pdf_trans:
                        inv['indonesian'] = pdf_trans[book_id]
            
            else:
                # Generic match
                book_id = str(inv_id)
                if book_id in pdf_trans:
                    inv['indonesian'] = pdf_trans[book_id]

    with open(inv_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Successfully enriched {inv_path}")

if __name__ == "__main__":
    enrich()
