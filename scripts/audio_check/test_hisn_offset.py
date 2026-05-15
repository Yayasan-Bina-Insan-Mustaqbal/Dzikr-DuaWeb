import json
import re

# Bismillah.
# Find the best offset for hisn_id.json mapping.

def clean_arabic(text):
    if not text: return ""
    text = re.sub(r'[\u064B-\u065F\u0670]', '', text)
    text = re.sub(r'[^\u0600-\u06FF]', '', text)
    return text

def test_offsets():
    with open('src/data/invocations.json', 'r') as f:
        invs = json.load(f)
    with open('src/data/hisn_id.json', 'r') as f:
        hisn = json.load(f)
        
    all_invs = []
    for chap in invs:
        for inv in chap['invocations']:
            all_invs.append(inv)
            
    # Try offsets from -20 to 20
    results = []
    for offset in range(-10, 10):
        matches = 0
        for inv in all_invs:
            target_id = str(inv['id'] + offset)
            if target_id in hisn:
                # We can't really verify by Arabic because hisn_id.json only has Indo.
                # But we can check if the Indo text length is reasonable.
                # Actually, let's just check a few known ones.
                pass
                
    # Manual verification of some IDs:
    # ID 10 (Toilet): hisn["10"] is correct. (Offset 0)
    # ID 19 (Mosque): hisn["19"] is correct. (Offset 0)
    # ID 76 (Ayat Kursi): hisn["75"] is Ayat Kursi?
    print("hisn['75']:", hisn.get('75', 'MISSING')[:100])
    # ID 77 (3 Quls): hisn["76"] is 3 Quls?
    print("hisn['76']:", hisn.get('76', 'MISSING')[:100])
    
if __name__ == "__main__":
    test_offsets()
