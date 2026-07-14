import re
from parse_wikipedia_and_generate import clean_html

with open("public/data/company-ranking/wikipedia_page.html", "r", encoding="utf-8") as f:
    content = f.read()

parts = re.split(r'<h3[^>]*>', content)
for part in parts:
    heading_match = re.search(r'^(.*?)</h3>', part)
    if heading_match:
        heading = heading_match.group(1).strip()
        if "2019" in heading:
            print(f"=== Heading: {heading} ===")
            table_match = re.search(r'<table[^>]*>(.*?)</table>', part, re.DOTALL)
            if table_match:
                table_body = table_match.group(1)
                tr_matches = re.findall(r'<tr[^>]*>(.*?)</tr>', table_body, re.DOTALL)
                for idx, tr in enumerate(tr_matches):
                    td_matches = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.DOTALL)
                    if td_matches:
                        print(f"Row {idx} Cells:")
                        for c_idx, td in enumerate(td_matches):
                            print(f"  Cell {c_idx}: {clean_html(td)[:100]}")
            break
