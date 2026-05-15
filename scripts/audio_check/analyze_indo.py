import json
import os

# Bismillah.
# Analyze Indonesian translations for potential issues (short length, truncation).

inv_path = "src/data/invocations.json"

with open(inv_path, "r") as f:
    data = json.load(f)

issues = []

for chapter in data:
    for inv in chapter.get("invocations", []):
        indo = inv.get("indonesian", "")
        eng = inv.get("english", "")
        
        if not indo:
            continue
            
        # If Indonesian is much shorter than English, it might be truncated.
        # This is a heuristic.
        if len(eng) > 100 and len(indo) < len(eng) * 0.4:
            issues.append({
                "chapter_id": chapter["id"],
                "chapter_name": chapter["chapter_name"],
                "inv_id": inv["id"],
                "eng_len": len(eng),
                "indo_len": len(indo),
                "indo_preview": indo[:100] + "...",
                "eng_preview": eng[:100] + "..."
            })

print(f"Found {len(issues)} potential issues.")
for issue in issues[:20]:
    print(f"Chap {issue['chapter_id']} ({issue['chapter_name']}), ID {issue['inv_id']}:")
    print(f"  Eng ({issue['eng_len']}): {issue['eng_preview']}")
    print(f"  Indo ({issue['indo_len']}): {issue['indo_preview']}")
    print("-" * 40)
