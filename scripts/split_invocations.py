import json

def split_invocations_json():
    path = 'src/data/invocations.json'
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    morning_chapter = next((c for c in data if c['id'] == 27), None)
    if not morning_chapter:
        print("Chapter 27 not found in invocations.json")
        return
    
    # 1. Create Evening Chapter structure
    if any(c['id'] == 133 for c in data):
        print("Chapter 133 already exists")
    else:
        evening_chapter = json.loads(json.dumps(morning_chapter))
        evening_chapter['id'] = 133
        evening_chapter['chapter_name'] = "Evening Adhkar"
        data.append(evening_chapter)
    
    morning_chapter['chapter_name'] = "Morning Adhkar"
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("Split Chapter 27 into 27 and 133 in invocations.json")

if __name__ == "__main__":
    split_invocations_json()
