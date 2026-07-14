import requests

test_urls = [
    "https://logo.clearbit.com/microsoft.com",
    "https://unavatar.io/microsoft.com",
    "https://icons.duckduckgo.com/ip3/microsoft.com.ico",
    "https://www.google.com/s2/favicons?domain=microsoft.com&sz=128" # Google Favicon API in 128x128!
]

for url in test_urls:
    try:
        r = requests.head(url, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
        print(f"URL: {url} -> Status: {r.status_code}")
    except Exception as e:
        print(f"URL: {url} -> Failed: {e}")
