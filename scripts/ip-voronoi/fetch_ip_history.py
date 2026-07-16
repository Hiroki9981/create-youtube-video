import os
import json
import time
import requests
import ipaddress

# Companies to ASNs mapping
COMPANIES = {
    "NTT": {
        "asns": ["AS4713", "AS2914"],
        "color": "#004094",
        "country": "JP",
        "displayName": "NTT Group"
    },
    "SoftBank": {
        "asns": ["AS4772", "AS9607", "AS17676"],
        "color": "#ffcc00",
        "country": "JP",
        "displayName": "SoftBank"
    },
    "KDDI": {
        "asns": ["AS2516"],
        "color": "#ff6600",
        "country": "JP",
        "displayName": "KDDI"
    },
    "AWS": {
        "asns": ["AS16509"],
        "color": "#ff9900",
        "country": "US",
        "displayName": "AWS"
    },
    "Google": {
        "asns": ["AS15169"],
        "color": "#4285f4",
        "country": "US",
        "displayName": "Google"
    },
    "Microsoft": {
        "asns": ["AS8075"],
        "color": "#00a4ef",
        "country": "US",
        "displayName": "Microsoft"
    },
    "Alibaba": {
        "asns": ["AS37963", "AS45102"],
        "color": "#ff6a00",
        "country": "CN",
        "displayName": "Alibaba"
    },
    "Tencent": {
        "asns": ["AS45090"],
        "color": "#0052d9",
        "country": "CN",
        "displayName": "Tencent"
    },
    "Lumen": {
        "asns": ["AS3356", "AS209"],
        "color": "#10b981",
        "country": "US",
        "displayName": "Lumen"
    },
    "ChinaUnicom": {
        "asns": ["AS4837", "AS9929"],
        "color": "#ef4444",
        "country": "CN",
        "displayName": "China Unicom"
    }
}

YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]

def get_announced_prefixes(asn, date_str):
    url = f"https://stat.ripe.net/data/announced-prefixes/data.json?resource={asn}&starttime={date_str}T00:00:00&endtime={date_str}T23:59:59"
    for attempt in range(5):
        try:
            res = requests.get(url, timeout=20)
            if res.status_code == 200:
                data = res.json()
                prefixes_data = data.get("data", {}).get("prefixes", [])
                prefixes = []
                for p in prefixes_data:
                    prefix = p.get("prefix", "")
                    if prefix and ":" not in prefix:  # Skip IPv6
                        prefixes.append(prefix)
                return prefixes
            else:
                print(f"  [{attempt+1}/5] Failed to fetch {asn} for {date_str}: Status {res.status_code}")
        except Exception as e:
            print(f"  [{attempt+1}/5] Error fetching {asn} for {date_str}: {e}")
        time.sleep(2.0)
    raise RuntimeError(f"Failed to fetch announced prefixes for {asn} on {date_str} after 5 attempts")

def main():
    os.makedirs("public/data/ip-voronoi", exist_ok=True)
    cache_file = "public/data/ip-voronoi/fetch-cache.json"
    
    if os.path.exists(cache_file):
        with open(cache_file, "r", encoding="utf-8") as f:
            cache = json.load(f)
    else:
        cache = {}
        
    results = []
    
    for year in YEARS:
        date_str = f"{year}-07-01"
        print(f"\n--- Fetching Data for {year} (Date: {date_str}) ---")
        
        year_stats = {}
        for name, info in COMPANIES.items():
            cache_key = f"{name}_{year}"
            total_ips = 0
            
            if cache_key in cache:
                total_ips = cache[cache_key]
                print(f"  {name}: {total_ips:,} IPs (Cached)")
            else:
                networks = []
                for asn in info["asns"]:
                    print(f"  Querying {name} ({asn}) for {year}...")
                    prefixes = get_announced_prefixes(asn, date_str)
                    for p in prefixes:
                        try:
                            networks.append(ipaddress.IPv4Network(p))
                        except Exception:
                            pass
                    time.sleep(1.0) # Avoid rate limits
                
                # Collapse networks to eliminate overlaps
                collapsed = list(ipaddress.collapse_addresses(networks))
                total_ips = sum(net.num_addresses for net in collapsed)
                cache[cache_key] = total_ips
                print(f"  {name}: {total_ips:,} IPs (Fetched)")
                
                # Save cache progressively
                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump(cache, f, indent=2, ensure_ascii=False)
                print(f"  {name}: {total_ips:,} IPs (Fetched)")
            
            year_stats[name] = total_ips
            
        results.append({
            "year": year,
            "date": date_str,
            "stats": year_stats
        })
        
    # Write final data
    output_data = {
        "companies": COMPANIES,
        "history": results
    }
    
    output_file = "public/data/ip-voronoi/ip-history-data.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
        
    print(f"\nAll data fetched successfully! Saved to {output_file}")

    # Download logos and flags
    logos_dir = "public/data/ip-voronoi/logos"
    flags_dir = "public/data/ip-voronoi/flags"
    os.makedirs(logos_dir, exist_ok=True)
    os.makedirs(flags_dir, exist_ok=True)
    
    domains = {
        "NTT": "ntt.com",
        "SoftBank": "softbank.jp",
        "KDDI": "kddi.com",
        "AWS": "amazon.com",
        "Google": "google.com",
        "Microsoft": "microsoft.com",
        "Alibaba": "alibaba.com",
        "Tencent": "tencent.com",
        "Lumen": "lumen.com",
        "ChinaUnicom": "10010.com"
    }
    
    def download_file(url, filepath):
        if os.path.exists(filepath):
            return True
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            res = requests.get(url, headers=headers, timeout=10)
            if res.status_code == 200:
                with open(filepath, "wb") as f:
                    f.write(res.content)
                return True
            else:
                print(f"Failed download {url}: Status {res.status_code}")
        except Exception as e:
            print(f"Failed to download {url}: {e}")
        return False

    for name, info in COMPANIES.items():
        # Download flag
        flag_code = info["country"].lower()
        flag_url = f"https://flagcdn.com/w160/{flag_code}.png"
        flag_path = f"{flags_dir}/{flag_code}.png"
        print(f"Downloading flag for {name} ({info['country']})...")
        download_file(flag_url, flag_path)
        
        # Download logo using Google Favicon API
        domain = domains.get(name)
        logo_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=128"
        logo_path = f"{logos_dir}/{name.lower()}.png"
        print(f"Downloading logo for {name}...")
        download_file(logo_url, logo_path)
        
    print("Logos and flags download complete!")

if __name__ == "__main__":
    main()
