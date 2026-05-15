import json
import re
import os

# Bismillah.
# Final Indonesian Fix Script (v4) with confirmed mappings.

def clean_text(text):
    if not text: return ""
    # Normalize whitespace
    text = ' '.join(text.split())
    # Fix quotes
    text = text.replace('‘', "'").replace('’', "'").replace('“', '"').replace('”', '"')
    # Remove trailing verse references or page fragments
    text = re.sub(r'\(Ali .Imran, 3: 190-200\).*$', '(Ali Imran 3:190-200)', text)
    return text.strip()

def extract_pdf():
    txt_path = 'src/data/hisnul_muslim.txt'
    with open(txt_path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(r'\f\d+', '', content)
    items = re.split(r'\n(?=\d+-\s+[A-Z])', content)
    extracted = {}
    for item in items:
        m = re.match(r'(\d+)-\s+', item.strip())
        if not m: continue
        item_id = int(m.group(1))
        
        # Robust pattern: stop at next number dot or next chapter header
        trans_pattern = re.compile(r'(\d+)\.\s+[“"‘](.*?)(?=\n\s*\d+\.\s+[“"‘]|\n\s*\d+-\s+[A-Z]|$)', re.DOTALL)
        matches = trans_pattern.findall(item)
        for sub_id, text in matches:
            # Clean up: remove internal headers/titles that might be captured
            # If a line starts with "Doa" or all caps, it's probably a title
            lines = text.split('\n')
            filtered_lines = []
            for line in lines:
                line_s = line.strip()
                if not line_s: continue
                if line_s.startswith('Doa ') or (line_s.isupper() and len(line_s) > 10):
                    break
                filtered_lines.append(line)
            
            clean_t = ' '.join(filtered_lines)
            extracted[f"{item_id}_{sub_id}"] = clean_text(clean_t)
    return extracted

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

def fix():
    pdf_data = extract_pdf()
    rodja_morning, rodja_evening = extract_rodja()
    
    files = ["public/invocations.json", "src/data/invocations.json"]
    for file_path in files:
        with open(file_path, 'r') as f:
            chapters = json.load(f)
        for chap in chapters:
            c_id = chap['id']
            invs = chap['invocations']
            
            if c_id == 27: # Morning
                mapping = {
                    76: 2, 77: [3, 4, 5], 78: 6, 79: 7, 80: 8, 83: 9, 85: 10, 86: 11,
                    87: 12, 88: 13, 89: 14, 91: 15, 93: 16, 95: 17, 96: 18, 92: 19, 97: 20
                }
                for inv in invs:
                    target = mapping.get(inv['id'])
                    if target:
                        if isinstance(target, list):
                            inv['indonesian'] = "\n\n".join([rodja_morning[t] for t in target if t < len(rodja_morning)])
                        else:
                            inv['indonesian'] = rodja_morning[target] if target < len(rodja_morning) else ""
            
            elif c_id == 133: # Evening
                mapping = {
                    412: 2, 413: [3, 4, 5], 414: 6, 415: 7, 416: 8, 419: 9, 421: 10, 422: 11,
                    423: 12, 424: 13, 425: 14, 427: 15, 429: 16, 431: 17, 432: 18, 433: 19
                }
                for inv in invs:
                    target = mapping.get(inv['id'])
                    if target:
                        if isinstance(target, list):
                            inv['indonesian'] = "\n\n".join([rodja_evening[t] for t in target if t < len(rodja_evening)])
                        else:
                            inv['indonesian'] = rodja_evening[target] if target < len(rodja_evening) else ""
            
            else:
                for i, inv in enumerate(invs):
                    key = f"{c_id}_{i+1}"
                    if key in pdf_data:
                        inv['indonesian'] = pdf_data[key]

    for file_path in files:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(chapters, f, ensure_ascii=False, indent=2)
    print("Indonesian translations fixed and synced.")

if __name__ == "__main__":
    fix()
