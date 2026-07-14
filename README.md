# Remotion video

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

---

## 動画の作成方法

このプロジェクトでは、JSONファイルに動画の情報を記述するだけで、自動的にMP4動画が生成されます。

### ディレクトリ構成

```
public/
  data/
    動画プロジェクト名/         ← 動画ごとにフォルダを作成
      video-config-*.json    ← 動画の設定ファイル（Git管理対象）
      flags/                 ← 国旗画像（スクリプトで自動ダウンロード）
      logos/                 ← 企業ロゴ画像（スクリプトで自動ダウンロード）
scripts/
  company-ranking/           ← 大企業ランキング用のスクリプト
    parse_wikipedia_and_generate.py  ← Wikipediaからデータを抽出しJSONと画像を生成
    download_wikipedia_page.py       ← WikipediaのHTMLをローカルにキャッシュ
  inbound-tourism/           ← インバウンド観光客推移用のスクリプト
  sushi-bar/                 ← 寿司バー用のスクリプト
  generate-video.ts          ← レンダリング実行エントリ（共通）
  upload_youtube.py          ← YouTubeアップロード用スクリプト（共通）
out/
  動画名.mp4                 ← 生成された動画ファイル（Git管理外）
```

### 世界の大企業ランキング動画の作成手順

#### Step 1: Wikipediaデータと画像アセットの自動構築
以下のコマンドを実行すると、WikipediaのローカルHTMLキャッシュからデータを抽出し、国旗や企業ロゴを自動ダウンロードした上で、前後半2つのJSON構成ファイルを生成します。

```console
# データ解析と画像収集を実行
python scripts/company-ranking/parse_wikipedia_and_generate.py
```
*   前半部構成: `public/data/company-ranking/video-config-company-ranking-part1.json`
*   後半部構成: `public/data/company-ranking/video-config-company-ranking-part2.json`

#### Step 2: 動画のレンダリング（MP4書き出し）
生成された構成JSONファイルを引数に指定してレンダリングコマンドを実行します。

```console
# 前半（2000年〜2013年）パート動画をビルド (約57秒)
npm run generate -- public/data/company-ranking/video-config-company-ranking-part1.json

# 後半（2014年〜2026年）パート動画をビルド (約55秒)
npm run generate -- public/data/company-ranking/video-config-company-ranking-part2.json
```
➔ それぞれ `out/company-ranking-part1.mp4` および `out/company-ranking-part2.mp4` に動画が出力されます。

---

## 汎用動画の作成手順（その他）

### Step 1: `video-config.json` の記述

```json
{
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "bgm": "data/my-video/bgm.wav",
  "bgmVolume": 0.15,
  "scenes": [
    {
      "text": "1枚目のスライドに表示するテキスト",
      "image": "data/my-video/scene1.png",
      "audio": "data/my-video/narration1.wav"
    }
  ]
}
```

### Step 2: レンダリング

```console
npm run generate -- public/data/my-video/video-config.json
```

---

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
