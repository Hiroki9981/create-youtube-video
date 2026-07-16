import json
import requests
import ipaddress

asn = "AS16509"
date_str = "2024-07-01"
url = f"https://stat.ripe.net/data/announced-prefixes/data.json?resource={asn}&starttime={date_str}T00:00:00&endtime={date_str}T23:59:59"

print("Querying RIPEstat for AS16509 in 2024...")
res = requests.get(url, timeout=15)
if res.status_code == 200:
    data = res.json()
    prefixes_data = data.get("data", {}).get("prefixes", [])
    networks = []
    for p in prefixes_data:
        prefix = p.get("prefix", "")
        if prefix and ":" not in prefix:
            try:
                networks.append(ipaddress.IPv4Network(prefix))
            except Exception:
                pass
    collapsed = list(ipaddress.collapse_addresses(networks))
    print(f"Number of collapsed networks: {len(collapsed)}")
    
    collapsed.sort(key=lambda net: net.num_addresses, reverse=True)
    
    print("\nLargest collapsed networks announced by AS16509 in 2024:")
    for net in collapsed[:15]:
        print(f"  {net} ({net.num_addresses:,} IPs)")
        
    total_ips = sum(net.num_addresses for net in collapsed)
    print(f"\nTotal unique IPs in 2024: {total_ips:,}")
else:
    print(f"Failed: {res.status_code}")
