import json
import csv
import re
import os

def normalize_arabic(text):
    if not text:
        return ""
    # Remove diacritics
    text = re.sub(r'[\u064B-\u0652]', '', text)
    # Normalize Alif
    text = re.sub(r'[\u0622\u0623\u0625]', '\u0627', text)
    # Remove extra spaces and newlines
    text = " ".join(text.split())
    return text

def main():
    json_path = 'src/data/invocations.json'
    csv_path = 'src/data/kaggle_duas.csv'
    hisn_en_path = 'src/data/hisn_en.json'
    
    # Load primary data
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    # Load English Hisnul Muslim mapping
    with open(hisn_en_path, 'r', encoding='utf-8-sig') as f:
        hisn_en_data = json.load(f)
    
    # Create a lookup for chapters by ID
    hisn_chapters = {item['ID']: item for item in hisn_en_data.get('English', [])}
        
    # Load Kaggle fallback data
    csv_data = []
    if os.path.exists(csv_path):
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                row['norm_arabic'] = normalize_arabic(row['arabic_text'])
                csv_data.append(row)
            
    chapters = data
    
    for chapter in chapters:
        chapter_id = chapter.get('id')
        hisn_chapter = hisn_chapters.get(chapter_id)
        
        if hisn_chapter:
            chapter['chapter_name'] = hisn_chapter['TITLE']
        
        # Remove redundant field
        if 'chapter_name_en' in chapter:
            del chapter['chapter_name_en']
        
        chapter_name = chapter['chapter_name']
        
        for idx, inv in enumerate(chapter.get('invocations', [])):
            # Ensure audio path is correct
            inv['audio'] = f"/audios/{chapter['id']:03d}_{idx + 1:02d}.mp3"
            
            # 1. Try to get English translation from hisn_en.json
            if hisn_chapter and idx < len(hisn_chapter.get('TEXT', [])):
                hisn_inv = hisn_chapter['TEXT'][idx]
                # Check if Arabic matches roughly (optional but good for validation)
                translation = hisn_inv.get('TRANSLATED_TEXT')
                if translation:
                    inv['english'] = translation
            
            # 2. Try to get better Name from Kaggle dataset
            norm_inv = normalize_arabic(inv['arabic'])
            found_kaggle = False
            
            for csv_row in csv_data:
                csv_norm = normalize_arabic(csv_row['arabic_text'])
                if norm_inv == csv_norm:
                    inv['name'] = csv_row['title']
                    if not inv.get('english'):
                        inv['english'] = csv_row['english_meaning']
                    found_kaggle = True
                    break
            
            if not found_kaggle:
                for csv_row in csv_data:
                    csv_norm = normalize_arabic(csv_row['arabic_text'])
                    if csv_norm and (csv_norm in norm_inv or norm_inv in csv_norm):
                        if len(csv_norm) < 20 and len(norm_inv) > 100:
                            continue
                        if len(norm_inv) > 50 and csv_row['title'] in ['Alhamdulillah', 'SubhanAllah', 'Allahu Akbar']:
                            continue
                        inv['name'] = csv_row['title']
                        if not inv.get('english'):
                            inv['english'] = csv_row['english_meaning']
                        found_kaggle = True
                        break
            
            if not found_kaggle:
                # Use chapter name as base if not matched in Kaggle
                if len(chapter.get('invocations', [])) > 1:
                    inv['name'] = f"{chapter_name} ({idx + 1})"
                else:
                    inv['name'] = chapter_name
            
            # Add chapter name reference for easy display
            inv['chapter_name'] = chapter_name
            
            # Cleanup: ensure 'english' is never empty
            if not inv.get('english'):
                inv['english'] = inv.get('albanian', 'Translation missing')
                
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("Successfully enriched and translated data to English.")

if __name__ == "__main__":
    main()
