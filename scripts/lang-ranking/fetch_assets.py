import os
import urllib.request

# Target directory
target_dir = os.path.join("public", "data", "lang-ranking", "logos")
os.makedirs(target_dir, exist_ok=True)

# Logos to download from Devicon master branch
# Mapping: local filename -> Devicon path suffix (using SVG files)
logos = {
    "python.svg": "python/python-original.svg",
    "java.svg": "java/java-original.svg",
    "c.svg": "c/c-original.svg",
    "cpp.svg": "cplusplus/cplusplus-original.svg",
    "csharp.svg": "csharp/csharp-original.svg",
    "javascript.svg": "javascript/javascript-original.svg",
    "php.svg": "php/php-original.svg",
    "go.svg": "go/go-original.svg",
    "rust.svg": "rust/rust-original.svg",
    "objectivec.svg": "objectivec/objectivec-plain.svg"
}

base_url = "https://raw.githubusercontent.com/devicons/devicon/master/icons/"

print("Starting logo assets download...")
for filename, devicon_path in logos.items():
    url = base_url + devicon_path
    dest_path = os.path.join(target_dir, filename)
    try:
        print(f"Downloading {filename} from {url} ...")
        # Define user-agent header to avoid blocked requests
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response:
            with open(dest_path, "wb") as f:
                f.write(response.read())
        print(f"Successfully saved to {dest_path}")
    except Exception as e:
        print(f"Failed to download {filename}: {e}")

print("Assets download process finished.")
