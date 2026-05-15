import json
import re
import os

# Bismillah.
# Robustly extract Indonesian translations from hisnul_muslim.txt.

def extract():
    workspace_root = '/home/abuhafi/Project/Dzikr&Dua/Dzikr&DuaWeb/Dzikr&Dua'
    txt_path = os.path.join(workspace_root, 'src/data/hisnul_muslim.txt')
    
    if not os.path.exists(txt_path):
        print(f"Error: {txt_path} not found.")
        return {}

    with open(txt_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split into items (e.g., "1- BACAAN KETIKA BANGUN DARI TIDUR")
    # Using a lookahead to keep the delimiters
    items = re.split(r'\n(?=\d+-\s+[A-Z])', content)
    
    extracted_data = {}
    
    for item_content in items:
        # Extract item ID
        item_match = re.match(r'(\d+)-\s+', item_content.strip())
        if not item_match:
            continue
            
        item_id = int(item_match.group(1))
        
        # Within each item, find numbered translations like "1. “..."
        # We need to handle page breaks (e.g., page numbers like "18")
        # and multiline text.
        
        # First, clean the item content of page breaks and obvious junk
        # Remove form feed (\f) and page numbers at the top/bottom
        clean_content = re.sub(r'\f\d+\n', '', item_content)
        # Remove lines that are just numbers (likely page numbers or reference IDs)
        # but be careful not to remove verse numbers within text.
        # Actually, let's keep it simple and just remove lines that are ONLY digits.
        lines = clean_content.split('\n')
        filtered_lines = []
        for line in lines:
            if line.strip().isdigit() and len(line.strip()) < 4:
                continue
            filtered_lines.append(line)
        
        clean_content = '\n'.join(filtered_lines)
        
        # Pattern for a numbered translation block
        # It starts with "X. “" and ends when another "Y. “" starts or a new section starts.
        # Note: the PDF uses both standard and curly quotes.
        trans_pattern = re.compile(r'(\d+)\.\s+[“"‘](.*?)(?=\n\d+\.\s+[“"‘]|\n\d+-\s+[A-Z]|$)', re.DOTALL)
        
        matches = trans_pattern.findall(clean_content)
        for sub_id, text in matches:
            # Clean up the text
            text = text.strip()
            # Remove trailing numbers/references
            text = re.sub(r'[\d\s]+$', '', text)
            # Remove line breaks and normalize spaces
            text = ' '.join(text.split())
            # Strip trailing quotes if present (some might be captured inside the DOTALL group)
            text = text.rstrip('”"’')
            
            key = f"{item_id}_{sub_id}"
            extracted_data[key] = text.strip()

    return extracted_data

if __name__ == "__main__":
    data = extract()
    print(f"Extracted {len(data)} Indonesian translations.")
    
    # Save for preview
    with open("scripts/audio_check/indo_extracted.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
