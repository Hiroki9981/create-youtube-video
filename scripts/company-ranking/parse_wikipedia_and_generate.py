import re
import os
import requests
import json
import sys
import html
import time

sys.stdout.reconfigure(encoding='utf-8')

# Ensure directories exist
os.makedirs("public/data/company-ranking/flags", exist_ok=True)
os.makedirs("public/data/company-ranking/logos", exist_ok=True)

html_path = "public/data/company-ranking/wikipedia_page.html"
if not os.path.exists(html_path):
    print("Error: wikipedia_page.html not found. Run test_download.py first.")
    sys.exit(1)

with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

# Country flag mapping to flagcdn code
country_flag_codes = {
    "united states": "us",
    "saudi arabia": "sa",
    "taiwan": "tw",
    "japan": "jp",
    "china": "cn",
    "united kingdom": "gb",
    "uk": "gb",
    "netherlands": "nl",
    "finland": "fi",
    "switzerland": "ch",
    "germany": "de",
    "france": "fr",
    "south korea": "kr",
    "australia": "au",
    "brazil": "br",
    "russia": "ru"
}

# Company domain mapping for Clearbit Logo API / unavatar
company_domains = {
    "microsoft": "microsoft.com",
    "apple": "apple.com",
    "nvidia": "nvidia.com",
    "alphabet (google)": "google.com",
    "alphabet": "google.com",
    "google": "google.com",
    "amazon": "amazon.com",
    "meta (facebook)": "meta.com",
    "meta": "meta.com",
    "facebook": "meta.com",
    "tesla": "tesla.com",
    "berkshire hathaway": "berkshirehathawayhs.com",
    "exxonmobil": "exxonmobil.com",
    "exxon mobil": "exxonmobil.com",
    "general electric": "ge.com",
    "cisco systems": "cisco.com",
    "cisco": "cisco.com",
    "walmart": "walmart.com",
    "wal-mart": "walmart.com",
    "saudi aramco": "aramco.com",
    "tsmc": "tsmc.com",
    "petrochina": "petrochina.com.cn",
    "petrobras": "petrobras.com.br",
    "ntt docomo": "www.docomo.ne.jp",
    "pfizer": "pfizer.com",
    "broadcom": "broadcom.com",
    "eli lilly": "lilly.com",
    "tencent": "tencent.com",
    "alibaba group": "alibaba.com",
    "alibaba": "alibaba.com",
    "jpmorgan chase": "jpmorgan.com",
    "johnson & johnson": "jnj.com",
    "intel corporation": "intel.com",
    "intel": "intel.com",
    "nokia": "nokia.com",
    "vodafone": "vodafone.com",
    "bp": "www.bp.com",
    "shell": "shell.com",
    "royal dutch shell": "shell.com",
    "icbc": "icbc.com.cn",
    "toyota": "toyota.com",
    "at&t": "att.com",
    "american international group": "aig.com",
    "bhp billiton": "bhp.com",
    "chevron corporation": "chevron.com",
    "chevron": "chevron.com",
    "china mobile": "www.chinamobile.com",
    "citigroup": "citi.com",
    "deutsche telekom": "telekom.com",
    "gazprom": "www.gazprom-international.com",
    "hsbc": "hsbc.com",
    "hoffmann-la roche": "roche.com",
    "nestlé": "nestle.com",
    "nippon telegraph & telephone": "www.ntt.co.jp",
    "procter & gamble": "pg.com",
    "sinopec": "www.sinopec.com",
    "wells fargo": "wellsfargo.com",
    "lucent": "www.alcatel-lucent.com",
    "china construction bank": "ccb.com",
    "unitedhealth": "unitedhealthgroup.com"
}

# Major business / world events for subtitles (from 2000 to 2026)
events = {
    2000: "ITバブルが崩壊。時価総額トップのGEやシスコ、MSが急落へ。",
    2001: "ITバブルの崩壊が継続。9.11テロが発生し世界市場が混乱。",
    2002: "市場が低迷。IT関連企業の時価総額はピークから大幅に減少。",
    2003: "イラク戦争勃発。景気回復の兆しが見え、株価は底打ち上昇へ。",
    2004: "GoogleがNASDAQに上場（IPO）。株式時価総額は約230億ドル。",
    2005: "原油価格高騰により、エネルギー最大手エクソンモービルが躍進。",
    2006: "エクソンモービルが時価総額首位へ。資源ブームがピークに。",
    2007: "Appleが初代iPhoneを発売。スマートフォンの歴史が始まる。",
    2008: "リーマン・ブラザーズが破綻。世界金融危機（リーマンショック）が発生。",
    2009: "金融危機のボトムから世界市場が回復へ。Appleが大きく浮上。",
    2010: "iPad発売。Appleの時価総額がMicrosoftを上回る歴史的瞬間。",
    2011: "スティーブ・ジョブズが死去。Appleが一時世界首位になるなど急成長を遂げる。",
    2012: "FacebookがIPO。Appleが時価総額5000億ドルを突破。",
    2013: "スマートフォンとモバイルの急速な普及により、ITメガキャップが急成長。",
    2014: "米国の金融緩和終了。Appleが他の企業を大きく引き離して独走。",
    2015: "クラウド(AWS)の成長でAmazon急騰。Googleが持株会社Alphabetへ。",
    2016: "ディープラーニング（AI）ブーム。NVIDIAが本格的に頭角を現す。",
    2017: "GAFAM（ビッグテック）が台頭。従来の産業（GEや石油企業）が衰退。",
    2018: "Appleが史上初の時価総額1兆ドルを達成。年末はMicrosoftが首位を奪還。",
    2019: "AppleとMicrosoftが急成長し、それぞれ時価総額1兆ドルを突破して激しい首位争い。",
    2020: "新型コロナウイルス世界流行。巣ごもり需要でテック株・テスラが爆騰。",
    2021: "Appleが時価総額3兆ドルへ迫る。テスラが1兆ドルを突破。",
    2022: "インフレと金利引き上げによる世界的な株安。テック企業が大暴落。",
    2023: "ChatGPT登場による生成AIブーム。NVIDIAが1兆ドルを達成。",
    2024: "AIバブル過熱。NVIDIAがAppleやMSを抜き一時世界一に輝く。",
    2025: "生成AIの実用化が本格化。NVIDIA、Apple、MSが三つ巴の3.5兆ドル争い。",
    2026: "AI半導体需要の継続。NVIDIAが世界の時価総額ランキングで独走を強める。"
}

# Helper to clean strings and extract name & value
def clean_html(text):
    # Remove footnotes like <sup>...</sup>
    text = re.sub(r'<sup[^>]*>.*?</sup>', '', text, flags=re.DOTALL)
    text = re.sub(r'<[^>]+>', ' ', text)
    # Unescape HTML entities (like &amp; -> &)
    text = html.unescape(text)
    return re.sub(r'\s+', ' ', text).strip()

def download_image(url, filepath):
    if os.path.exists(filepath):
        return True
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            with open(filepath, 'wb') as f:
                f.write(res.content)
            return True
        else:
            print(f"Failed to download image {url}: Status code {res.status_code}")
    except Exception as e:
        print(f"Failed to download image {url}: {e}")
    return False

# 1. Parse HTML parts split by <h3
parts = re.split(r'<h3[^>]*>', content)
year_data = {}

all_countries_to_download = set()
all_companies_to_download = {}

for i, part in enumerate(parts):
    if i == 0:
        continue
    
    # Extract the year from the heading
    year_str = part.split('</h3>')[0].strip()
    if not re.match(r'^20\d\d$', year_str):
        continue
        
    year = int(year_str)
    
    # Find the table in this part
    table_match = re.search(r'<table[^>]*>(.*?)</table>', part, re.DOTALL)
    if not table_match:
        continue
        
    table_body = table_match.group(1)
    tr_matches = re.findall(r'<tr[^>]*>(.*?)</tr>', table_body, re.DOTALL)
    
    # Check table structure based on column count
    col_count = 0
    for tr in tr_matches:
        td_matches = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.DOTALL)
        if td_matches:
            col_count = len(td_matches)
            break
            
    stats = {}
    company_countries = {}
    
    print(f"Parsing year {year} (columns: {col_count})...")
    
    for tr in tr_matches:
        td_matches = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.DOTALL)
        if not td_matches:
            continue
            
        rank = clean_html(td_matches[0])
        # Only take top 10 rankings to render nicely
        if not rank.isdigit() or int(rank) > 10:
            continue
            
        if col_count == 5:
            # 2000-2005 format: Rank | Name | Country | Industry | Value
            comp_html = td_matches[1]
            country_html = td_matches[2]
            val_html = td_matches[4]
            
            # Clean footnotes from comp_html
            comp_html = re.sub(r'<sup[^>]*>.*?</sup>', '', comp_html, flags=re.DOTALL)
            country_html = re.sub(r'<sup[^>]*>.*?</sup>', '', country_html, flags=re.DOTALL)
            val_html = re.sub(r'<sup[^>]*>.*?</sup>', '', val_html, flags=re.DOTALL)
            
            comp_name = clean_html(comp_html)
            country = clean_html(country_html)
            
            # Clean value and parse to billion USD
            val_clean = re.sub(r'[^0-9.]', '', clean_html(val_html))
            try:
                # Divide million by 1000 to get billion
                val_billion = float(val_clean) / 1000.0 if val_clean else 0.0
            except ValueError:
                val_billion = 0.0
                
        elif col_count == 9 or col_count == 3:
            # 2006-2025 (9 cols) or 2026 (3 cols) quarterly format
            # Use Q4 strictly for 9 cols (index 7 and 8)
            # Use Q1 for 2026/3 cols (index 1 and 2)
            col_idx_flag = 7 if col_count == 9 else 1
            col_idx_comp = 8 if col_count == 9 else 2
            
            flag_html = td_matches[col_idx_flag]
            comp_html = td_matches[col_idx_comp]
            
            # Strip footnotes from comp_html to avoid matching footnote links
            comp_html = re.sub(r'<sup[^>]*>.*?</sup>', '', comp_html, flags=re.DOTALL)
            
            # Extract country from flag icon title
            country_match = re.search(r'title="([^"]+)"', flag_html) or re.search(r'alt="([^"]+)"', flag_html)
            country = country_match.group(1) if country_match else ""
            
            # Extract company name from the first link inside the cell
            comp_link_match = re.search(r'<a[^>]*>(.*?)</a>', comp_html, re.DOTALL)
            if comp_link_match:
                comp_name = clean_html(comp_link_match.group(1))
            else:
                # Split by <br>, <p>, or newline to separate company name from the value
                split_parts = re.split(r'<br[^>]*>|<p[^>]*>|\n', comp_html, flags=re.IGNORECASE)
                comp_name = clean_html(split_parts[0])
            
            # Extract market cap number (which is in millions)
            val_text = clean_html(comp_html)
            # Remove company name and footnotes/arrows from text to get the number
            val_text_no_name = val_text.replace(comp_name, "")
            val_nums = re.findall(r'([0-9,]+(?:\.[0-9]+)?)', val_text_no_name)
            # Find the largest number (which is the market cap)
            val_billion = 0.0
            for num in val_nums:
                num_clean = num.replace(",", "")
                try:
                    val_float = float(num_clean) / 1000.0
                    if val_float > val_billion:
                        val_billion = val_float
                except ValueError:
                    continue
        else:
            continue
            
        # Clean company name aliases and remove any bracket notations
        comp_name = re.sub(r'\[.*?\]', '', comp_name).strip()
        if not comp_name:
            continue
            
        if comp_name.lower().startswith("google"):
            comp_name = "Alphabet (Google)"
        elif comp_name.lower().startswith("alphabet"):
            comp_name = "Alphabet (Google)"
        elif comp_name.lower().startswith("meta"):
            comp_name = "Meta (Facebook)"
        elif comp_name.lower().startswith("facebook"):
            comp_name = "Meta (Facebook)"
        elif comp_name.lower().startswith("cisco"):
            comp_name = "Cisco"
        elif comp_name.lower().startswith("wal-mart"):
            comp_name = "Walmart"
        elif comp_name.lower().startswith("royal dutch shell"):
            comp_name = "Shell"
        elif comp_name.lower().startswith("exxon"):
            comp_name = "ExxonMobil"
        elif comp_name.lower().startswith("alibaba"):
            comp_name = "Alibaba Group"
            
        if comp_name and val_billion > 0:
            stats[comp_name] = round(val_billion, 1)
            company_countries[comp_name] = country.strip()
            
            # Record flags & logos to download
            all_countries_to_download.add(country.strip())
            norm_name = comp_name.split(' (')[0].lower()
            domain = company_domains.get(norm_name, norm_name.replace(" ", "") + ".com")
            all_companies_to_download[comp_name] = {
                "domain": domain,
                "country": country.strip()
            }
            
    if stats:
        # Sort and take top 10
        sorted_stats = dict(sorted(stats.items(), key=lambda x: x[1], reverse=True)[:10])
        year_data[year] = {
            "stats": sorted_stats,
            "countries": {c: company_countries[c] for c in sorted_stats}
        }

# 2. Download Flags
print("\nDownloading country flags...")
flag_filenames = {}
for country in all_countries_to_download:
    code = country_flag_codes.get(country.lower())
    if not code:
        # Check if country name has matching subword
        for cname, ccode in country_flag_codes.items():
            if cname in country.lower() or country.lower() in cname:
                code = ccode
                break
    
    if not code:
        print(f"Warning: No flag code for '{country}'")
        # Use fallback code or 'us'
        code = "us"
        
    flag_url = f"https://flagcdn.com/w80/{code}.png"
    safe_country_name = re.sub(r'[^a-zA-Z0-9]', '_', country).lower()
    filename = f"flag_{safe_country_name}.png"
    filepath = os.path.join("public/data/company-ranking/flags", filename)
    
    success = download_image(flag_url, filepath)
    if success:
        flag_filenames[country] = f"data/company-ranking/flags/{filename}"
    else:
        flag_filenames[country] = "data/company-ranking/flags/flag_united_states.png" # default fallback

# Ensure default flag exists
download_image("https://flagcdn.com/w80/us.png", "public/data/company-ranking/flags/flag_united_states.png")

# 3. Download Company Logos
print("\nDownloading company logos...")
logo_filenames = {}
for comp, info in all_companies_to_download.items():
    domain = info["domain"]
    logo_url = f"https://unavatar.io/{domain}"
    # Replace multiple non-alphanumeric chars with a single underscore
    safe_comp_name = re.sub(r'[^a-zA-Z0-9]+', '_', comp).lower().strip('_')
    filename = f"logo_{safe_comp_name}.png"
    filepath = os.path.join("public/data/company-ranking/logos", filename)
    
    # Try unavatar first
    success = download_image(logo_url, filepath)
    if not success:
        # Fallback to Google Favicon API
        google_favicon_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=128"
        print(f"Retrying with Google Favicon API for {comp} ({domain})...")
        success = download_image(google_favicon_url, filepath)
    if not success:
        # Fallback to DuckDuckGo
        ddg_favicon_url = f"https://icons.duckduckgo.com/ip3/{domain}.ico"
        print(f"Retrying with DuckDuckGo for {comp} ({domain})...")
        success = download_image(ddg_favicon_url, filepath)
        
    if success:
        logo_filenames[comp] = f"data/company-ranking/logos/{filename}"
    else:
        logo_filenames[comp] = "data/company-ranking/logos/logo_fallback.png"
    
    # Sleep to prevent hitting rate limits
    time.sleep(0.5)

# Ensure default fallback logo exists
download_image("https://unavatar.io/google.com", "public/data/company-ranking/logos/logo_fallback.png")

# 4. Construct scenes for JSON config Part 1 (2000-2013)
scenes_part1 = []
min_y1, max_y1 = 2000, 2013
# Pre-intro year 1999 scene
scenes_part1.append({
    "year": min_y1 - 1,
    "events": "世界の大企業ランキング：2000〜2013年（前半部）の歴史。",
    "stats": year_data[min_y1]["stats"],
    "countries": year_data[min_y1]["countries"],
    "durationInFrames": 150
})
for year in sorted([y for y in year_data.keys() if min_y1 <= y <= max_y1]):
    event_text = events.get(year, f"世界の大企業ランキング：{year}年の動向。")
    prefix = f"{year}年："
    if not event_text.startswith(prefix):
        event_text = f"{prefix}{event_text}"
    scenes_part1.append({
        "year": year,
        "events": event_text,
        "stats": year_data[year]["stats"],
        "countries": year_data[year]["countries"],
        "durationInFrames": 105  # 3.5 seconds per year scene
    })
# Outro padding scene
scenes_part1.append({
    "year": max_y1 + 1,
    "events": "世界の大企業ランキング：2000〜2013年の軌跡",
    "stats": year_data[max_y1]["stats"],
    "countries": year_data[max_y1]["countries"],
    "durationInFrames": 90
})

config_part1 = {
    "compositionId": "CompanyVideo",
    "bgm": "data/audio/shining_star.mp3",
    "bgmVolume": 0.2,
    "title": "世界の大企業ランキング推移\n(Part 1)",
    "subtitle": "2000年 - 2013年",
    "scenes": scenes_part1,
    "meta": {
        "flags": flag_filenames,
        "logos": logo_filenames
    }
}

part1_json_path = "public/data/company-ranking/video-config-company-ranking-part1.json"
with open(part1_json_path, "w", encoding="utf-8") as f:
    json.dump(config_part1, f, ensure_ascii=False, indent=2)


# 5. Construct scenes for JSON config Part 2 (2014-2026)
scenes_part2 = []
min_y2, max_y2 = 2014, 2026
# Pre-intro year 2013 scene
scenes_part2.append({
    "year": min_y2 - 1,
    "events": "世界の大企業ランキング：2014〜2026年（後半部）の歴史。",
    "stats": year_data[min_y2]["stats"],
    "countries": year_data[min_y2]["countries"],
    "durationInFrames": 150
})
for year in sorted([y for y in year_data.keys() if min_y2 <= y <= max_y2]):
    event_text = events.get(year, f"世界の大企業ランキング：{year}年の動向。")
    prefix = f"{year}年："
    if not event_text.startswith(prefix):
        event_text = f"{prefix}{event_text}"
    scenes_part2.append({
        "year": year,
        "events": event_text,
        "stats": year_data[year]["stats"],
        "countries": year_data[year]["countries"],
        "durationInFrames": 110  # 3.67 seconds per year scene
    })
# Outro padding scene
scenes_part2.append({
    "year": max_y2 + 1,
    "events": "世界の大企業ランキング：2014〜2026年の軌跡",
    "stats": year_data[max_y2]["stats"],
    "countries": year_data[max_y2]["countries"],
    "durationInFrames": 90
})

config_part2 = {
    "compositionId": "CompanyVideo",
    "bgm": "data/audio/shining_star.mp3",
    "bgmVolume": 0.2,
    "title": "世界の大企業ランキング推移\n(Part 2)",
    "subtitle": "2014年 - 2026年",
    "scenes": scenes_part2,
    "meta": {
        "flags": flag_filenames,
        "logos": logo_filenames
    }
}

part2_json_path = "public/data/company-ranking/video-config-company-ranking-part2.json"
with open(part2_json_path, "w", encoding="utf-8") as f:
    json.dump(config_part2, f, ensure_ascii=False, indent=2)

print("\nSuccessfully parsed Wikipedia data and updated configuration files!")
print(f"Part 1 saved to: {part1_json_path}")
print(f"Part 2 saved to: {part2_json_path}")
