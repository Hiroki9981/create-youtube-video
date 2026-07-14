import re

with open("public/data/company-ranking/wikipedia_page.html", "r", encoding="utf-8") as f:
    content = f.read()

parts = re.split(r'<h3[^>]*>', content)
for part in parts:
    heading_match = re.search(r'^(.*?)</h3>', part)
    if heading_match:
        heading = heading_match.group(1).strip()
        if "2005" in heading or "2006" in heading:
            print(f"=== Heading: {heading} ===")
            tables = re.findall(r'<table[^>]*>(.*?)</table>', part, re.DOTALL)
            print(f"Found {len(tables)} tables")
            for idx, table in enumerate(tables):
                th_matches = re.findall(r'<th[^>]*>(.*?)</th>', table, re.DOTALL)
                clean_th = [re.sub(r'<[^>]+>', ' ', th).strip() for th in th_matches]
                print(f"  Table {idx+1} headers: {clean_th[:10]}")
