import requests

test_urls = [
    "https://icons.duckduckgo.com/ip3/www.gazprom.ru.ico",
    "https://icons.duckduckgo.com/ip3/www.gazprom.com.ico",
    "https://icons.duckduckgo.com/ip3/www.gazprom-neft.ru.ico",
    "https://icons.duckduckgo.com/ip3/www.gazprom-neft.com.ico",
    "https://icons.duckduckgo.com/ip3/www.bp.com.ico"
]

for url in test_urls:
    try:
        r = requests.get(url, timeout=5)
        print(f"URL: {url} -> Status: {r.status_code} -> Content Length: {len(r.content)}")
    except Exception as e:
        print(f"URL: {url} -> Failed: {e}")
