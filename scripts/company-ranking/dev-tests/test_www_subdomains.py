import requests

test_domains = [
    "www.berkshirehathaway.com",
    "www.chinamobileltd.com",
    "www.chinamobile.com",
    "www.gazprom.com",
    "www.sinopecgroup.com",
    "www.sinopec.com",
    "www.bp.com",
    "www.docomo.ne.jp",
    "www.ntt.co.jp",
    "www.alcatel-lucent.com",
    "www.nokia.com"
]

for d in test_domains:
    url = f"https://www.google.com/s2/favicons?domain={d}&sz=128"
    try:
        r = requests.get(url, timeout=5)
        print(f"Domain: {d} -> Status: {r.status_code} -> Content Length: {len(r.content)}")
    except Exception as e:
        print(f"Domain: {d} -> Failed: {e}")
