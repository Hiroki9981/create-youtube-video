import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

for part in [1, 2]:
    json_path = f"public/data/company-ranking/video-config-company-ranking-part{part}.json"
    with open(json_path, "r", encoding="utf-8") as f:
        config = json.load(f)
        
    print(f"\n================ PART {part} ================")
    companies = set()
    for scene in config["scenes"]:
        for comp in scene["stats"].keys():
            companies.add(comp)
            
    print(f"Unique companies: {len(companies)}")
    for comp in sorted(list(companies)):
        logo = config["meta"]["logos"].get(comp)
        is_fallback = "fallback" in logo if logo else True
        marker = "⚠️ FALLBACK" if is_fallback else "✅ OK"
        print(f"  {comp}: {logo} -> {marker}")
