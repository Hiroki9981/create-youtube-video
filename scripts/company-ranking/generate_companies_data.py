import json
import os

# Create data directory if not exists
os.makedirs('public/data/company-ranking', exist_ok=True)

# Sector definitions
# Tech/AI: "tech"
# Energy: "energy"
# Finance/Investment: "finance"
# Retail/Consumer: "retail"
# Automotive: "auto"
# Industrials: "industrials"

# Company sector mappings
sectors = {
    "Microsoft": "tech",
    "Apple": "tech",
    "NVIDIA": "tech",
    "Alphabet (Google)": "tech",
    "Amazon": "retail",
    "Meta (Facebook)": "tech",
    "Tesla": "auto",
    "Saudi Aramco": "energy",
    "Berkshire Hathaway": "finance",
    "ExxonMobil": "energy",
    "General Electric": "industrials",
    "Cisco": "tech"
}

# Yearly market cap data (in Billion USD) - historically accurate approximations at year-ends
data_points = {
    2000: {
        "General Electric": 475, "Cisco": 355, "Microsoft": 360, "ExxonMobil": 290, "Walmart": 240, 
        "Berkshire Hathaway": 85, "Apple": 5, "Amazon": 6, "Alphabet (Google)": 0, "Meta (Facebook)": 0,
        "Tesla": 0, "Saudi Aramco": 0
    },
    2001: {
        "General Electric": 398, "Microsoft": 350, "ExxonMobil": 270, "Cisco": 85, "Walmart": 250,
        "Berkshire Hathaway": 95, "Apple": 8, "Amazon": 4, "Alphabet (Google)": 0, "Meta (Facebook)": 0,
        "Tesla": 0, "Saudi Aramco": 0
    },
    2002: {
        "General Electric": 260, "Microsoft": 275, "ExxonMobil": 240, "Cisco": 92, "Walmart": 220,
        "Berkshire Hathaway": 105, "Apple": 5, "Amazon": 8, "Alphabet (Google)": 0, "Meta (Facebook)": 0,
        "Tesla": 0, "Saudi Aramco": 0
    },
    2003: {
        "General Electric": 310, "Microsoft": 295, "ExxonMobil": 280, "Cisco": 165, "Walmart": 230,
        "Berkshire Hathaway": 130, "Apple": 7, "Amazon": 21, "Alphabet (Google)": 0, "Meta (Facebook)": 0,
        "Tesla": 0, "Saudi Aramco": 0
    },
    2004: {
        "General Electric": 380, "ExxonMobil": 330, "Microsoft": 290, "Walmart": 225, "Berkshire Hathaway": 135,
        "Cisco": 125, "Apple": 22, "Amazon": 18, "Alphabet (Google)": 23, "Meta (Facebook)": 0,
        "Tesla": 0, "Saudi Aramco": 0
    },
    2005: {
        "General Electric": 370, "ExxonMobil": 360, "Microsoft": 280, "Walmart": 200, "Berkshire Hathaway": 140,
        "Cisco": 105, "Apple": 62, "Amazon": 20, "Alphabet (Google)": 120, "Meta (Facebook)": 0,
        "Tesla": 0, "Saudi Aramco": 0
    },
    2006: {
        "ExxonMobil": 440, "General Electric": 380, "Microsoft": 290, "Alphabet (Google)": 145, "Berkshire Hathaway": 165,
        "Walmart": 195, "Apple": 72, "Cisco": 160, "Amazon": 16, "Meta (Facebook)": 0,
        "Tesla": 0, "Saudi Aramco": 0
    },
    2007: {
        "ExxonMobil": 510, "General Electric": 375, "Microsoft": 330, "Alphabet (Google)": 215, "Berkshire Hathaway": 218,
        "Cisco": 165, "Walmart": 190, "Apple": 170, "Amazon": 38, "Meta (Facebook)": 0,
        "Tesla": 0, "Saudi Aramco": 0
    },
    2008: {
        "ExxonMobil": 405, "Microsoft": 170, "General Electric": 160, "Walmart": 220, "Berkshire Hathaway": 150,
        "Apple": 75, "Alphabet (Google)": 95, "Cisco": 95, "Amazon": 22, "Meta (Facebook)": 0,
        "Tesla": 0, "Saudi Aramco": 0
    },
    2009: {
        "ExxonMobil": 320, "Microsoft": 270, "Walmart": 200, "Alphabet (Google)": 195, "Berkshire Hathaway": 160,
        "Apple": 190, "General Electric": 160, "Cisco": 135, "Amazon": 60, "Meta (Facebook)": 0,
        "Tesla": 0, "Saudi Aramco": 0
    },
    2010: {
        "ExxonMobil": 365, "Apple": 295, "Microsoft": 240, "Alphabet (Google)": 190, "Walmart": 195,
        "Berkshire Hathaway": 200, "General Electric": 195, "Cisco": 110, "Amazon": 80, "Meta (Facebook)": 0,
        "Tesla": 2, "Saudi Aramco": 0
    },
    2011: {
        "Apple": 378, "ExxonMobil": 400, "Microsoft": 218, "Alphabet (Google)": 210, "Walmart": 205,
        "Berkshire Hathaway": 190, "General Electric": 190, "Cisco": 98, "Amazon": 78, "Meta (Facebook)": 0,
        "Tesla": 3, "Saudi Aramco": 0
    },
    2012: {
        "Apple": 500, "ExxonMobil": 390, "Microsoft": 225, "Alphabet (Google)": 230, "Berkshire Hathaway": 220,
        "Walmart": 230, "General Electric": 220, "Meta (Facebook)": 63, "Amazon": 115, "Cisco": 105,
        "Tesla": 4, "Saudi Aramco": 0
    },
    2013: {
        "Apple": 505, "ExxonMobil": 435, "Alphabet (Google)": 375, "Microsoft": 310, "Berkshire Hathaway": 290,
        "Walmart": 250, "General Electric": 280, "Amazon": 180, "Meta (Facebook)": 140, "Cisco": 118,
        "Tesla": 18, "Saudi Aramco": 0
    },
    2014: {
        "Apple": 640, "ExxonMobil": 390, "Microsoft": 380, "Alphabet (Google)": 360, "Berkshire Hathaway": 370,
        "Walmart": 275, "General Electric": 250, "Amazon": 145, "Meta (Facebook)": 210, "Cisco": 140,
        "Tesla": 28, "Saudi Aramco": 0
    },
    2015: {
        "Apple": 590, "Alphabet (Google)": 530, "Microsoft": 440, "ExxonMobil": 325, "Berkshire Hathaway": 330,
        "Amazon": 320, "Meta (Facebook)": 295, "General Electric": 285, "Walmart": 195, "Cisco": 135,
        "Tesla": 30, "NVIDIA": 18, "Saudi Aramco": 0
    },
    2016: {
        "Apple": 615, "Alphabet (Google)": 545, "Microsoft": 485, "Berkshire Hathaway": 405, "Amazon": 355,
        "ExxonMobil": 370, "Meta (Facebook)": 330, "General Electric": 270, "Walmart": 215, "Cisco": 150,
        "Tesla": 34, "NVIDIA": 58, "Saudi Aramco": 0
    },
    2017: {
        "Apple": 860, "Alphabet (Google)": 730, "Microsoft": 660, "Amazon": 560, "Meta (Facebook)": 515,
        "Berkshire Hathaway": 490, "ExxonMobil": 355, "General Electric": 150, "Walmart": 290, "Cisco": 190,
        "Tesla": 52, "NVIDIA": 118, "Saudi Aramco": 0
    },
    2018: {
        "Microsoft": 780, "Apple": 745, "Amazon": 735, "Alphabet (Google)": 725, "Berkshire Hathaway": 495,
        "Meta (Facebook)": 375, "ExxonMobil": 290, "Walmart": 270, "Cisco": 195, "Tesla": 57,
        "NVIDIA": 81, "Saudi Aramco": 0
    },
    2019: {
        "Saudi Aramco": 1880, "Apple": 1250, "Microsoft": 1200, "Alphabet (Google)": 920, "Amazon": 915,
        "Meta (Facebook)": 585, "Berkshire Hathaway": 550, "Walmart": 335, "ExxonMobil": 295, "Cisco": 200,
        "Tesla": 75, "NVIDIA": 144, "General Electric": 95
    },
    2020: {
        "Apple": 2230, "Saudi Aramco": 1880, "Microsoft": 1680, "Amazon": 1630, "Alphabet (Google)": 1185,
        "Tesla": 670, "Meta (Facebook)": 770, "Berkshire Hathaway": 540, "NVIDIA": 325, "Walmart": 410,
        "ExxonMobil": 175, "Cisco": 185
    },
    2021: {
        "Apple": 2910, "Microsoft": 2520, "Saudi Aramco": 1900, "Alphabet (Google)": 1920, "Amazon": 1690,
        "Tesla": 1060, "Meta (Facebook)": 935, "NVIDIA": 735, "Berkshire Hathaway": 665, "Walmart": 405,
        "ExxonMobil": 260, "Cisco": 265
    },
    2022: {
        "Apple": 2065, "Saudi Aramco": 1880, "Microsoft": 1785, "Alphabet (Google)": 1145, "Amazon": 855,
        "Berkshire Hathaway": 680, "NVIDIA": 360, "Tesla": 390, "Meta (Facebook)": 320, "ExxonMobil": 455,
        "Walmart": 380, "Cisco": 195
    },
    2023: {
        "Apple": 3000, "Microsoft": 2790, "Saudi Aramco": 2130, "Alphabet (Google)": 1760, "Amazon": 1570,
        "NVIDIA": 1220, "Meta (Facebook)": 910, "Tesla": 785, "Berkshire Hathaway": 780, "ExxonMobil": 400,
        "Walmart": 420, "Cisco": 205
    },
    2024: {
        "Apple": 3430, "Microsoft": 3260, "NVIDIA": 3060, "Saudi Aramco": 1810, "Alphabet (Google)": 2150,
        "Amazon": 2010, "Meta (Facebook)": 1450, "Berkshire Hathaway": 995, "Tesla": 710, "Walmart": 650,
        "ExxonMobil": 435, "Cisco": 220
    },
    2025: {
        "NVIDIA": 3520, "Apple": 3480, "Microsoft": 3310, "Alphabet (Google)": 2210, "Amazon": 2120,
        "Saudi Aramco": 1780, "Meta (Facebook)": 1520, "Berkshire Hathaway": 1050, "Tesla": 790, "Walmart": 710,
        "ExxonMobil": 475, "Cisco": 235
    }
}

# Major business / world events for subtitles
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
    2011: "スティーブ・ジョブズ死去。Appleがエクソンを抜いて世界首位へ。",
    2012: "FacebookがIPO。Appleが時価総額5000億ドルを突破。",
    2013: "スマートフォンとモバイルの急速な普及により、ITメガキャップが急成長。",
    2014: "米国の金融緩和終了。Appleが他の企業を大きく引き離して独走。",
    2015: "クラウド(AWS)の成長でAmazon急騰。Googleが持株会社Alphabetへ。",
    2016: "ディープラーニング（AI）ブーム。NVIDIAが本格的に頭角を現す。",
    2017: "GAFAM（ビッグテック）が台頭。従来の産業（GEや石油企業）が衰退。",
    2018: "Appleが史上初めて時価総額1兆ドル（1,000 Billion）を突破。",
    2019: "サウジアラムコが史上最大のIPO。時価総額1.8兆ドルで世界首位に。",
    2020: "新型コロナウイルス世界流行。巣ごもり需要でテック株・テスラが爆騰。",
    2021: "Appleが時価総額3兆ドルへ迫る。テスラが1兆ドルを突破。",
    2022: "インフレと金利引き上げによる世界的な株安。テック企業が大暴落。",
    2023: "ChatGPT登場による生成AIブーム。NVIDIAが1兆ドルを達成。",
    2024: "AIバブル過熱。NVIDIAがAppleやMSを抜き一時世界一に輝く。",
    2025: "生成AIの実用化が本格化。NVIDIA、Apple、MSが三つ巴の3.5兆ドル争い。"
}

# Resolve scenes array
scenes = []
# Base year
scenes.append({
    "year": 1999,
    "events": "世界市場はミレニアム目前。インターネットへの期待が高まる。",
    "stats": {
        "Microsoft": 600, "General Electric": 510, "Cisco": 340, "ExxonMobil": 280, "Walmart": 230,
        "Berkshire Hathaway": 80, "Apple": 6, "Amazon": 10, "Alphabet (Google)": 0, "Meta (Facebook)": 0,
        "Tesla": 0, "Saudi Aramco": 0, "NVIDIA": 1
    },
    "durationInFrames": 180 # 6 seconds
})

for year in sorted(data_points.keys()):
    stats = data_points[year]
    # Ensure NVIDIA is represented
    if "NVIDIA" not in stats:
        # Approximate historic NVIDIA values if not explicitly detailed
        if year < 2015:
            # NVIDIA was small, interpolate roughly
            stats["NVIDIA"] = max(1, int(1 + (year - 2000) * 1.1))
    
    # Ensure Walmart is represented in later years
    if "Walmart" not in stats:
        stats["Walmart"] = 300
        
    scenes.append({
        "year": year,
        "events": events[year],
        "stats": stats,
        "durationInFrames": 180 # 6 seconds per year
    })

# Outro padding scene
scenes.append({
    "year": 2026,
    "events": "世界の大企業時価総額ランキング：25年の軌跡",
    "stats": data_points[2025],
    "durationInFrames": 120 # 4 seconds hold at the end
})

# Construct complete video configuration JSON
config = {
    "compositionId": "CompanyVideo",
    "bgm": "data/audio/shining_star.mp3",
    "bgmVolume": 0.2,
    "scenes": scenes
}

# Write config file
with open('public/data/company-ranking/video-config-companies.json', 'w', encoding='utf-8') as f:
    json.dump(config, f, ensure_ascii=False, indent=2)

print("Successfully generated: public/data/company-ranking/video-config-companies.json")
