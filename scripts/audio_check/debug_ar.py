import json
import re

# Bismillah.
# Debug Arabic matching for ID 20.

def clean_arabic(text):
    if not text: return ""
    # Remove everything except Arabic letters (0621-064A)
    text = re.sub(r'[^\u0621-\u064A]', '', text)
    return text

def test():
    with open('src/data/hisn_en.json', 'r') as f:
        hisn = json.load(f)
    with open('src/data/invocations.json', 'r') as f:
        invs = json.load(f)
        
    # Get ID 19 from hisn
    h19 = next(t for chap in hisn['English'] for t in chap['TEXT'] if t['ID'] == 19)
    # Get ID 20 from invs
    i20 = next(inv for chap in invs for inv in chap['invocations'] if inv['id'] == 20)
    
    c_h19 = clean_arabic(h19['ARABIC_TEXT'])
    c_i20 = clean_arabic(i20['arabic'])
    
    print(f"H19 Clean: {c_h19[:50]}...")
    print(f"I20 Clean: {c_i20[:50]}...")
    print(f"Equal? {c_h19 == c_i20}")
    
    if c_h19 != c_i20:
        # Find difference
        for i in range(min(len(c_h19), len(c_i20))):
            if c_h19[i] != c_i20[i]:
                print(f"Diff at index {i}: {c_h19[i]} vs {c_i20[i]}")
                break

if __name__ == "__main__":
    test()
