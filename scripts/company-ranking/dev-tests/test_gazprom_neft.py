import requests

domains = [
    "gazprom-neft.com",
    "www.gazprom-neft.com"
]

for d in domains:
    url = f"https://www.google.com/s2/favicons?domain={d}&sz=128"
    try:
        r = requests.get(url, timeout=5)
        print(f"Domain: {d} -> Status: {r.status_code} -> Content Length: {len(r.content)}")
    except Exception as e:
        print(f"Domain: {d} -> Failed: {e}")
