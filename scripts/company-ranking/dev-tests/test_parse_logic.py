import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

html_path = r"public/data/company-ranking/wikipedia_page.html"

with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's find all year sections by splitting on <h3
parts = re.split(r'<h3[^>]*>', content)
print(f"Found {len(parts)} parts split by h3")

for i, part in enumerate(parts):
    if i == 0:
        continue
    
    # Extract the year from the heading
    year_str = part.split('</h3>')[0].strip()
    if not re.match(r'^20\d\d$', year_str):
        continue
        
    print(f"\n================ YEAR: {year_str} ================")
    
    # Find the table in this part
    table_match = re.search(r'<table[^>]*>(.*?)</table>', part, re.DOTALL)
    if not table_match:
        print("No table found")
        continue
        
    table_body = table_match.group(1)
    
    # Let's find all rows with td
    tr_matches = re.findall(r'<tr[^>]*>(.*?)</tr>', table_body, re.DOTALL)
    print(f"Found {len(tr_matches)} rows in table")
    
    # Let's inspect the cells of the first 3 rows
    count = 0
    for tr in tr_matches:
        # Find cells
        td_matches = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.DOTALL)
        if not td_matches:
            continue
        count += 1
        if count > 4:
            break
            
        print(f"  Row {count} has {len(td_matches)} cells:")
        for idx, td in enumerate(td_matches):
            # Clean td cell HTML tags
            clean_td = re.sub(r'<[^>]+>', ' ', td).strip()
            # Replace multiple spaces with a single space
            clean_td = re.sub(r'\s+', ' ', clean_td)
            
            # Print cell details (also raw HTML if it contains images/links)
            print(f"    Cell {idx+1}: {repr(clean_td)}")
            if "flag" in td.lower() or "href" in td.lower():
                # Print raw cell for inspection
                raw_snippet = td.strip().replace('\n', ' ')
                print(f"      [RAW]: {raw_snippet[:150]}")
