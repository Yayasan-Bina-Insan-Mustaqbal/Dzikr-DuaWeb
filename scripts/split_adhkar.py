import json
import os

def split_adhkar():
    hisn_path = 'src/data/hisn_en.json'
    with open(hisn_path, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    english_list = data.get('English', [])
    
    # Find chapter 27
    morning_combined = next((item for item in english_list if item['ID'] == 27), None)
    if not morning_combined:
        print("Chapter 27 not found")
        return

    # 1. Create Morning Chapter
    morning_chapter = json.loads(json.dumps(morning_combined))
    morning_chapter['TITLE'] = "Morning Adhkar"
    
    # 2. Create Evening Chapter
    evening_chapter = json.loads(json.dumps(morning_combined))
    evening_chapter['ID'] = 133
    evening_chapter['TITLE'] = "Evening Adhkar"

    def fix_morning(text_obj):
        # Already mostly morning in hisn_en.json
        return text_obj

    def fix_evening(text_obj):
        arabic = text_obj.get('ARABIC_TEXT', '')
        english = text_obj.get('TRANSLATED_TEXT', '')
        
        # Pattern 1: Asbahna -> Amsayna (with common diacritics)
        # We replace the core words while preserving surrounding diacritics if possible, 
        # but the safest is to handle the most common forms.
        replacements = [
            ('أَصْبَحْنَا', 'أَمْسَيْنَا'),
            ('أَصْبَحَ', 'أَمْسَى'),
            ('أَصْبَحْتُ', 'أَمْسَيْتُ'),
            ('أَصْبَحْتَ', 'أَمْسَيْتَ'),
            ('أَصْبَحَ', 'أَمْسَى'),
            ('النُّشُور', 'المَصِير'),
            ('morning', 'evening'),
            ('Morning', 'Evening')
        ]
        
        for old, new in replacements:
            arabic = arabic.replace(old, new)
            english = english.replace(old, new)

        text_obj['ARABIC_TEXT'] = arabic
        text_obj['TRANSLATED_TEXT'] = english
        return text_obj

    # Process Morning
    # (Actually the source hisn_en.json ID 27 is already geared towards morning)
    
    # Process Evening
    evening_chapter['TEXT'] = [fix_evening(json.loads(json.dumps(t))) for t in evening_chapter['TEXT']]
    
    # Specific removals:
    # 19: subhanallah wa bihamdihi... (morning only? No, both, but 3 times in morning)
    # 20: allahumma inni as-aluka ilman nafia (morning only)
    morning_chapter['TEXT'] = [t for idx, t in enumerate(morning_chapter['TEXT']) if idx != 22] # Remove evening-only
    evening_chapter['TEXT'] = [t for idx, t in enumerate(evening_chapter['TEXT']) if idx != 20] # Remove morning-only

    # Replace 27 and add 133
    new_english = []
    for item in english_list:
        if item['ID'] == 27:
            new_english.append(morning_chapter)
        else:
            new_english.append(item)
    
    new_english.append(evening_chapter)
    data['English'] = new_english
    
    with open(hisn_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("Split Morning & Evening Adhkar successfully in hisn_en.json")

if __name__ == "__main__":
    split_adhkar()
