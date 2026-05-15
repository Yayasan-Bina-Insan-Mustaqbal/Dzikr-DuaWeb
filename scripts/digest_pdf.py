import json
import re
import os

def extract_indo_translations(txt_path):
    with open(txt_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    translations = {}
    current_item_id = None
    
    # Regex to match numbered items like "1- BACAAN KETIKA BANGUN DARI TIDUR"
    item_pattern = re.compile(r'^(\d+)-\s+(.*)')
    
    # We'll try to find the Indonesian text which usually starts with a number and a dot, 
    # e.g., "1. “Segala puji bagi Allah..."
    translation_pattern = re.compile(r'^(\d+)\.\s+[“"](.*)[”"]')

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Look for item headers to set the context (the chapter/sub-chapter number)
        item_match = item_pattern.match(line)
        if item_match:
            current_item_id = int(item_match.group(1))
            
        # Look for the translation line (the specific invocation number within that item)
        trans_match = translation_pattern.match(line)
        if trans_match:
            idx = int(trans_match.group(1))
            text = trans_match.group(2)
            
            # Sometimes translations span multiple lines
            j = i + 1
            while j < len(lines):
                next_line = lines[j].strip()
                if not next_line:
                    j += 1
                    continue
                # Stop if we hit a new item, a new translation, or a reference number like "11" or "HR. ..."
                if item_pattern.match(next_line) or translation_pattern.match(next_line) or re.match(r'^HR\.', next_line) or (next_line.isdigit() and len(next_line) < 4):
                    break
                # Also stop if it looks like Arabic (though text extraction is messy)
                if any(ord(c) > 0x0600 and ord(c) < 0x06FF for c in next_line):
                    break
                    
                text += " " + next_line
                j += 1
            
            if current_item_id is not None:
                key = f"{current_item_id}_{idx}"
                translations[key] = text.strip()
            
        i += 1
    
    return translations

def main():
    workspace_root = '/home/abuhafi/Project/Dzikr&Dua/Dzikr&DuaWeb/Dzikr&Dua'
    txt_path = os.path.join(workspace_root, 'src/data/hisnul_muslim.txt')
    output_path = os.path.join(workspace_root, 'src/data/hisn_id_extracted.json')
    
    if not os.path.exists(txt_path):
        print(f"Error: {txt_path} not found.")
        return

    indo_data = extract_indo_translations(txt_path)
    
    # Save as a lookup table
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(indo_data, f, ensure_ascii=False, indent=2)
    
    print(f"Successfully extracted {len(indo_data)} Indonesian translations from PDF text.")

if __name__ == "__main__":
    main()
