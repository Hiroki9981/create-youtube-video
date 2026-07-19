import os
import urllib.request

# Country name to flagcdn 2-letter ISO code mapping
COUNTRIES_FLAGS = {
    "韓国": "kr",
    "中国": "cn",
    "台湾": "tw",
    "香港": "hk",
    "米国": "us",
    "アメリカ": "us",
    "タイ": "th",
    "英国": "gb",
    "イギリス": "gb",
    "フランス": "fr",
    "ドイツ": "de",
    "ロシア": "ru",
    "オーストラリア": "au",
    "豪州": "au",
    "シンガポール": "sg",
    "フィリピン": "ph",
    "ベトナム": "vn",
    "マレーシア": "my",
    "インドネシア": "id",
}

def download_flags():
    dest_dir = "public/data/inbound-tourism/flags"
    os.makedirs(dest_dir, exist_ok=True)
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    for country, code in COUNTRIES_FLAGS.items():
        url = f"https://flagcdn.com/w160/{code}.png"
        filepath = os.path.join(dest_dir, f"{code}.png")
        if not os.path.exists(filepath):
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req) as response, open(filepath, 'wb') as out_file:
                    out_file.write(response.read())
                print(f"Downloaded flag for {country} ({code}): {filepath}")
            except Exception as e:
                print(f"Failed to download flag for {country} ({code}): {e}")
        else:
            print(f"Flag already exists: {filepath}")

if __name__ == "__main__":
    download_flags()
