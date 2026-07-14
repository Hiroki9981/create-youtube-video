import requests
import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

url = "https://en.wikipedia.org/wiki/List_of_public_corporations_by_market_capitalization"
print("Downloading Wikipedia page...")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
r = requests.get(url, headers=headers)
print(f"Status: {r.status_code}, Length: {len(r.text)}")

# Save the full page HTML locally
os.makedirs("public/data/company-ranking", exist_ok=True)
with open("public/data/company-ranking/wikipedia_page.html", "w", encoding="utf-8") as f:
    f.write(r.text)

# Let's find the section for 2026
# Split by <h3>
parts = re.split(r'<h3[^>]*>', r.text)
print(f"Found {len(parts)} parts split by h3")

# Let's inspect the part containing 2026
for i, part in enumerate(parts):
    if "2026" in part[:200]:
        print(f"\n--- Part {i} (first 1000 chars of 2026 section) ---")
        print(part[:1000])
        # Find first table in this part
        table_match = re.search(r'<table[^>]*>.*?</table>', part, re.DOTALL)
        if table_match:
            print("\n--- First Table in 2026 section (first 1500 chars) ---")
            print(table_match.group(0)[:1500])
        break
