import os
import json

# Output folders
output_dir = os.path.join("public", "data", "lang-ranking")
os.makedirs(output_dir, exist_ok=True)

# Key Anchor Points for Interpolation
anchors = {
    2001: {
        "Python": 1.5,
        "Java": 26.0,
        "C": 20.0,
        "C++": 12.0,
        "PHP": 1.0,
        "C#": 0.0,
        "JavaScript": 2.0,
        "Objective-C": 0.0,
        "Go": 0.0,
        "Rust": 0.0
    },
    2006: {
        "Python": 4.0,
        "Java": 21.0,
        "C": 17.5,
        "C++": 10.0,
        "PHP": 8.0,
        "C#": 3.5,
        "JavaScript": 3.0,
        "Objective-C": 0.0,
        "Go": 0.0,
        "Rust": 0.0
    },
    2011: {
        "Python": 6.0,
        "Java": 18.0,
        "C": 16.5,
        "C++": 8.5,
        "PHP": 9.0,
        "C#": 6.0,
        "JavaScript": 2.5,
        "Objective-C": 6.0,
        "Go": 0.0,
        "Rust": 0.0
    },
    2016: {
        "Python": 5.0,
        "Java": 16.0,
        "C": 14.5,
        "C++": 6.5,
        "PHP": 3.0,
        "C#": 4.5,
        "JavaScript": 2.5,
        "Objective-C": 2.0,
        "Go": 1.5,
        "Rust": 0.0
    },
    2021: {
        "Python": 12.0,
        "Java": 11.0,
        "C": 12.5,
        "C++": 7.5,
        "PHP": 2.0,
        "C#": 5.0,
        "JavaScript": 2.5,
        "Objective-C": 0.5,
        "Go": 1.2,
        "Rust": 0.5
    },
    2026: {
        "Python": 15.5,
        "Java": 8.5,
        "C": 10.0,
        "C++": 10.0,
        "PHP": 1.8,
        "C#": 6.8,
        "JavaScript": 3.2,
        "Objective-C": 0.0,
        "Go": 1.8,
        "Rust": 1.5
    }
}

# Events for each year
events = {
    2001: "JavaとCの二強時代。PHPやJavaScriptがWebの普及と共に徐々にシェアを拡大する。",
    2002: "C#の登場。MicrosoftがJavaに対抗して開発したオブジェクト指向言語が始動。",
    2003: "Javaが企業システムで絶対的覇権を握る。C言語は組み込み開発で安定した人気。",
    2004: "PHP5のリリース。オブジェクト指向機能が大幅強化され、Web開発のデファクトへ。",
    2005: "Ruby on Railsの流行によりWeb開発にパラダイムシフト。LL言語全体が注目される。",
    2006: "JavaScriptがAjaxの登場により「再評価」。リッチなWebアプリ時代へ。",
    2007: "Javaのオープンソース化完了。コミュニティ主導の開発がさらに加速。",
    2008: "iPhone 3Gの発売とApp Store開始。Objective-Cがモバイルアプリ市場で躍進開始。",
    2009: "Node.jsの誕生。JavaScriptがサーバーサイドへ進出し、JSの適用範囲が激変。",
    2010: "Objective-CがTIOBE Indexトップ10圏内に突入。スマートフォン開発が爆発的成長。",
    2011: "Objective-CがTIOBE『Language of the Year』を獲得。JavaやCの牙城に迫る。",
    2012: "JavaとCのシェア首位争い。スマートフォン市場の拡大でObjective-Cがシェアピークへ。",
    2013: "データサイエンスや機械学習の台頭により、シンプルで書きやすいPythonの人気が再加速。",
    2014: "AppleがSwiftを発表。Objective-Cからの緩やかな移行が始まる。",
    2015: "ECMAScript 6 (ES6) の策定。モダンなJavaScript開発手法が標準化される。",
    2016: "Go言語が『Language of the Year』に。クラウド・コンテナ時代のインフラ言語へ躍進。",
    2017: "AI・ディープラーニング・データ分析ブーム。Pythonが理化学分野から産業界へ浸透。",
    2018: "PythonがJavaとCに次ぐ第3位に浮上。教育やAI開発での採用が決定打に。",
    2019: "Javaの商用サポート有料化に伴う移行。OpenJDKの普及が進む。",
    2020: "コロナ禍におけるオンライン需要の急増。WebサービスやAIインフラ投資が加速。",
    2021: "Pythonが初の首位を獲得。約20年間続いたJavaとCの二強体制が崩壊。",
    2022: "PythonがAI・データ分析分野で事実上の標準言語に。さらにシェアを引き離す。",
    2023: "ChatGPTを代表とする生成AI・LLM開発ブーム。Pythonのライブラリ群がデファクトに。",
    2024: "メモリ安全性を重視するセキュリティ意識の高まり。Rustが注目を集める。",
    2025: "生成AIを活用したローコード・開発効率化の進展。Python首位継続。",
    2026: "RustがTIOBE Index初のトップ10入りを果たす。Pythonは不動の王座を確立。"
}

# Interpolate year by year
history = []
anchor_years = sorted(anchors.keys())

for idx in range(len(anchor_years) - 1):
    y_start = anchor_years[idx]
    y_end = anchor_years[idx + 1]
    
    stats_start = anchors[y_start]
    stats_end = anchors[y_end]
    
    # Calculate years in between
    for y in range(y_start, y_end):
        progress = (y - y_start) / (y_end - y_start)
        y_stats = {}
        for lang in stats_start.keys():
            val = stats_start[lang] + (stats_end[lang] - stats_start[lang]) * progress
            y_stats[lang] = round(val, 2)
            
        history.append({
            "year": y,
            "date": f"{y}-07-01",
            "stats": y_stats
        })

# Add the final year (2026)
history.append({
    "year": 2026,
    "date": "2026-07-01",
    "stats": anchors[2026]
})

# Complete dataset JSON
languages_meta = {
    "Python": {"color": "#3776AB", "displayName": "Python"},
    "Java": {"color": "#ED8B00", "displayName": "Java"},
    "C": {"color": "#00599C", "displayName": "C"},
    "C++": {"color": "#659AD2", "displayName": "C++"},
    "C#": {"color": "#804180", "displayName": "C#"},
    "JavaScript": {"color": "#F7DF1E", "displayName": "JavaScript"},
    "PHP": {"color": "#777BB4", "displayName": "PHP"},
    "Go": {"color": "#00ADD8", "displayName": "Go"},
    "Rust": {"color": "#CE412B", "displayName": "Rust"},
    "Objective-C": {"color": "#FFAC45", "displayName": "Objective-C"}
}

dataset = {
    "languages": languages_meta,
    "history": history
}

# Save history JSON
history_path = os.path.join(output_dir, "lang-history-data.json")
with open(history_path, "w", encoding="utf-8") as f:
    json.dump(dataset, f, ensure_ascii=False, indent=2)
print(f"Generated: {history_path}")

# Construct Remotion video configuration JSON
# Total 60 seconds = 1800 frames at 30 fps
# Frame 0: Thumbnail
# Intro 2001 scene: 150 frames
# Intermediate 24 scenes (2002 to 2025): each 60 frames (24 * 60 = 1440 frames)
# Outro 2026 scene: 120 frames (includes last 90 frames OutroOverlay)
# Total frames: 1 + 150 + 1440 + 120 = 1800 frames (exactly 60s)
scenes_config = []

# Intro scene (2001)
scenes_config.append({
    "year": 2001,
    "events": events[2001],
    "durationInFrames": 150
})

# Intermediate scenes (2002 to 2025)
for y in range(2002, 2026):
    scenes_config.append({
        "year": y,
        "events": events[y],
        "durationInFrames": 60
    })

# Final scene (2026)
scenes_config.append({
    "year": 2026,
    "events": events[2026],
    "durationInFrames": 120
})

video_config = {
    "compositionId": "LangVoronoi",
    "width": 1080,
    "height": 1920,
    "fps": 30,
    "bgm": "data/audio/8-bit_Aggressive1.mp3",
    "bgmVolume": 0.15,
    "title": "プログラミング言語の覇権争い",
    "subtitle": "主要言語の人気シェア推移 (2001 - 2026)",
    "scenes": scenes_config
}

# Save video config JSON
config_path = os.path.join(output_dir, "video-config-lang-ranking.json")
with open(config_path, "w", encoding="utf-8") as f:
    json.dump(video_config, f, ensure_ascii=False, indent=2)
print(f"Generated: {config_path}")
