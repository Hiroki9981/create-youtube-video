import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

html_path = r"public/data/company-ranking/wikipedia_page.html"

with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's find all year sections by splitting on <h3
parts = re.split(r'<h3[^>]*>', content)

for i, part in enumerate(parts):
    if i == 0:
        continue
    
    # Extract the year from the heading
    year_str = part.split('</h3>')[0].strip()
    if not re.match(r'^20\d\d$', year_str):
        continue
        
    # Find the table in this part
    table_match = re.search(r'<table[^>]*>(.*?)</table>', part, re.DOTALL)
    if not table_match:
        print(f"Year {year_str}: No table found")
        continue
        
    table_body = table_match.group(1)
    
    # Find headers (th) to see columns
    th_matches = re.findall(r'<th[^>]*>(.*?)</th>', table_body, re.DOTALL)
    headers = [re.sub(r'<[^>]+>', ' ', th).strip() for th in th_matches]
    headers = [re.sub(r'\s+', ' ', h) for h in headers]
    
    # Find first data row (tr containing td)
    tr_matches = re.findall(r'<tr[^>]*>(.*?)</tr>', table_body, re.DOTALL)
    first_data_row_cells = []
    for tr in tr_matches:
        td_matches = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.DOTALL)
        if td_matches:
            first_data_row_cells = [re.sub(r'<[^>]+>', ' ', td).strip() for td in td_matches]
            first_data_row_cells = [re.sub(r'\s+', ' ', c) for c in first_data_row_cells]
            break
            
    print(f"Year {year_str}: Headers = {headers} | First Row Cells = {len(first_data_row_cells)} columns: {first_data_row_cells[:5]}")
