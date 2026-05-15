import json
import re

# Bismillah.
# Master Sync Script: Combines hisn_id.json, Rodja, and PDF extraction.

def clean_text(text):
    if not text: return ""
    text = ' '.join(text.split())
    text = text.replace('‘', "'").replace('’', "'").replace('“', '"').replace('”', '"')
    # Remove trailing numbers like " 23"
    text = re.sub(r'\s+\d+\s*$', '', text)
    return text.strip()

def extract_pdf_ali_imran():
    txt_path = 'src/data/hisnul_muslim.txt'
    with open(txt_path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(r'\f\d+', '', content)
    # Match Ali Imran block
    m = re.search(r'4\.\s+[“"‘](.*?)\(Ali .Imran, 3: 190-200\)', content, re.DOTALL)
    if m:
        return clean_text(m.group(1)) + " (Ali Imran 3:190-200)"
    return None

def extract_rodja():
    scratchpad_path = '/home/abuhafi/.gemini/antigravity/brain/a1822af6-f29d-448e-a82b-897e2d195677/browser/scratchpad_ugd59zxv.md'
    with open(scratchpad_path, 'r', encoding='utf-8') as f:
        content = f.read()
    def parse_section(start_tag, end_tag):
        match = re.search(f'{start_tag}(.*?){end_tag}', content, re.DOTALL)
        if not match: return []
        pattern = re.compile(r'[“"]([^”"]+)[”"]', re.DOTALL)
        results = []
        for m in pattern.findall(match.group(1)):
            m = clean_text(m)
            if len(m) > 30 and "Radio Rodja" not in m and "karya Ustadz" not in m:
                results.append(m)
        return results
    morning = parse_section('MORNING_DZIKR_START', 'MORNING_DZIKR_END')
    evening = parse_section('EVENING_DZIKR_START', 'EVENING_DZIKR_END')
    return morning, evening

def master_sync():
    # 1. Load sources
    with open('src/data/hisn_id.json', 'r') as f:
        hisn_id = json.load(f)
    rodja_m, rodja_e = extract_rodja()
    ali_imran = extract_pdf_ali_imran()
    
    files = ["public/invocations.json", "src/data/invocations.json"]
    for file_path in files:
        with open(file_path, 'r') as f:
            chapters = json.load(f)
            
        for chap in chapters:
            c_id = chap['id']
            for inv in chap['invocations']:
                inv_id = inv['id']
                
                # Default: Use hisn_id.json
                if str(inv_id) in hisn_id:
                    inv['indonesian'] = clean_text(hisn_id[str(inv_id)])
                
                # Overrides:
                # Ali Imran
                if inv_id == 4 and ali_imran:
                    inv['indonesian'] = ali_imran
                
                # Morning Adhkar
                if c_id == 27:
                    mapping = {
                        76: 2, 77: [3, 4, 5], 78: 6, 79: 7, 80: 8, 83: 9, 85: 10, 86: 11,
                        87: 12, 88: 13, 89: 14, 91: 15, 93: 16, 95: 17, 96: 18, 92: 19, 97: 20
                    }
                    target = mapping.get(inv_id)
                    if target:
                        if isinstance(target, list):
                            inv['indonesian'] = "\n\n".join([rodja_m[t] for t in target if t < len(rodja_m)])
                        else:
                            inv['indonesian'] = rodja_m[target] if target < len(rodja_m) else inv.get('indonesian', '')

                # Evening Adhkar
                if c_id == 133:
                    mapping = {
                        412: 2, 413: [3, 4, 5], 414: 6, 415: 7, 416: 8, 419: 9, 421: 10, 422: 11,
                        423: 12, 424: 13, 425: 14, 427: 15, 429: 16, 431: 17, 432: 18, 433: 19
                    }
                    target = mapping.get(inv_id)
                    if target:
                        if isinstance(target, list):
                            inv['indonesian'] = "\n\n".join([rodja_e[t] for t in target if t < len(rodja_e)])
                        else:
                            inv['indonesian'] = rodja_e[target] if target < len(rodja_e) else inv.get('indonesian', '')

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(chapters, f, ensure_ascii=False, indent=2)
            
    print("Master Sync complete.")

if __name__ == "__main__":
    master_sync()
