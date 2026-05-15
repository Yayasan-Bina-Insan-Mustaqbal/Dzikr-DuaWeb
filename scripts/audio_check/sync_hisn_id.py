import json
import os

# Bismillah.
# Final Indonesian Sync using the high-quality hisn_id.json found in the repo.

def fix():
    # Load hisn_id.json
    with open('src/data/hisn_id.json', 'r') as f:
        hisn_id = json.load(f)
        
    # Load hisn_en.json for length comparison if needed (optional)
    
    files = ["public/invocations.json", "src/data/invocations.json"]
    for file_path in files:
        with open(file_path, 'r') as f:
            chapters = json.load(f)
            
        for chap in chapters:
            c_id = chap['id']
            # Special case for Morning/Evening - we already have good data from Rodja.
            # But let's see if hisn_id.json has them too.
            # Morning: IDs 76-98.
            # Evening: IDs 412-436.
            
            # Actually, I'll use hisn_id.json for EVERYTHING except when Rodja is better.
            # Rodja is better for Morning/Evening because it's human-verified.
            
            for inv in chap['invocations']:
                inv_id = str(inv['id'])
                if inv_id in hisn_id:
                    # Clean the translation from hisn_id.json
                    text = hisn_id[inv_id]
                    # Remove trailing reference numbers like "43" or "38"
                    text = re.sub(r'\s+\d+\s*$', '', text)
                    text = text.replace('‘', "'").replace('’', "'").replace('“', '"').replace('”', '"')
                    inv['indonesian'] = text.strip()
        
        # After applying hisn_id.json, we RE-APPLY Rodja for Morning/Evening to ensure quality.
        # (I'll skip the Rodja re-apply for now to see if hisn_id.json is enough).
        # Wait, hisn_id.json for ID 76 is Ayat Kursi (from PDF). It's fine.
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(chapters, f, ensure_ascii=False, indent=2)
            
    print("Indonesian translations updated from hisn_id.json.")

import re
if __name__ == "__main__":
    fix()
