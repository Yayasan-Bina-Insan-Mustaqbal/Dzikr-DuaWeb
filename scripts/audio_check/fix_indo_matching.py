import json
import re
import os

# Bismillah.
# Match Indonesian translations by Arabic text for maximum accuracy.

def clean_arabic(text):
    if not text: return ""
    # Remove harakat and special chars for better matching
    text = re.sub(r'[\u064B-\u065F\u0670]', '', text)
    # Remove non-arabic chars
    text = re.sub(r'[^\u0600-\u06FF]', '', text)
    return text.strip()

def clean_indo(text):
    if not text: return ""
    text = ' '.join(text.split())
    text = text.replace('‘', "'").replace('’', "'").replace('“', '"').replace('”', '"')
    return text.strip()

def extract_pdf_pairs():
    txt_path = 'src/data/hisnul_muslim.txt'
    with open(txt_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Clean page breaks
    content = re.sub(r'\f\d+', '', content)
    
    # Find all occurrences of Arabic text followed by Indonesian translation
    # In the PDF, Arabic is usually before the translation number.
    # Pattern: Arabic text ... -X ... X. "Indo text"
    
    # Actually, a simpler way: find the translation number "X. "
    # and look at the Arabic text ABOVE it.
    
    pairs = []
    # Split by the "X. " pattern
    segments = re.split(r'(\d+)\.\s+[“"‘]', content)
    
    for i in range(2, len(segments), 2):
        prev_chunk = segments[i-2]
        current_text = segments[i]
        
        # Extract Arabic from prev_chunk (last Arabic block before the translation)
        arabic_matches = re.findall(r'[\u0600-\u06FF\s\(\)\.\,\:\;\!\?\-\=]{10,}', prev_chunk)
        if arabic_matches:
            arabic = arabic_matches[-1].strip()
            
            # Extract Indo from current_text (until next major break)
            indo_match = re.search(r'^(.*?)(?=\n\s*\d+\.\s+[“"‘]|\n\s*\d+-\s+[A-Z]|$)', current_text, re.DOTALL)
            if indo_match:
                indo = indo_match.group(1)
                # Clean Indo
                lines = indo.split('\n')
                filtered = []
                for line in lines:
                    if line.strip().startswith('Doa ') or (line.strip().isupper() and len(line.strip()) > 10):
                        break
                    filtered.append(line)
                
                pairs.append({
                    "arabic_clean": clean_arabic(arabic),
                    "indo": clean_indo(' '.join(filtered))
                })
                
    return pairs

def fix_with_matching():
    pairs = extract_pdf_pairs()
    print(f"Extracted {len(pairs)} Arabic-Indo pairs from PDF.")
    
    files = ["public/invocations.json", "src/data/invocations.json"]
    for file_path in files:
        with open(file_path, 'r') as f:
            chapters = json.load(f)
            
        matches_found = 0
        total_invs = 0
        
        for chap in chapters:
            # Skip Morning/Evening if they are handled by Rodja, or just let matching handle them
            for inv in chap['invocations']:
                total_invs += 1
                inv_arabic_clean = clean_arabic(inv['arabic'])
                
                # Try to find a match in PDF pairs
                best_match = None
                for p in pairs:
                    if p['arabic_clean'] in inv_arabic_clean or inv_arabic_clean in p['arabic_clean']:
                        best_match = p['indo']
                        break
                
                if best_match:
                    inv['indonesian'] = best_match
                    matches_found += 1
                    
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(chapters, f, ensure_ascii=False, indent=2)
            
        print(f"File {file_path}: Found {matches_found}/{total_invs} matches.")

if __name__ == "__main__":
    fix_with_matching()
