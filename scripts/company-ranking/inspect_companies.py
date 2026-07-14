import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("public/data/company-ranking/video-config-companies.json", "r", encoding="utf-8") as f:
    config = json.load(f)

companies = set()
for scene in config["scenes"]:
    for comp in scene["stats"].keys():
        companies.add(comp)

print(f"Total unique companies: {len(companies)}")
print(sorted(list(companies)))

print("\nLogo paths in config:")
for comp in sorted(list(companies)):
    print(f"  {comp}: {config['meta']['logos'].get(comp)}")
