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

### フォルダ構成

```
public/
  data/
    動画名/                  ← 動画ごとにフォルダを作成
      video-config.json      ← 動画の設定ファイル（Git管理対象）
      scene1.png             ← 背景画像（Git管理外）
      audio1.wav             ← ナレーション音声（Git管理外）
      bgm.wav                ← BGM音声（Git管理外）
out/
  動画名.mp4                 ← 生成された動画（Git管理外）
```

### Step 1: 動画フォルダを作成する

`public/data/` の下に動画名のフォルダを作成し、アセットを配置します。

```
public/data/my-video/
  video-config.json
  scene1.png
  scene2.png
  narration.wav
  bgm.wav
```

### Step 2: video-config.json を記述する

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
    },
    {
      "text": "2枚目のスライドに表示するテキスト",
      "image": "data/my-video/scene2.png",
      "audio": "data/my-video/narration2.wav"
    }
  ]
}
```

#### JSONのフィールド説明

| フィールド | 説明 | デフォルト |
|---|---|---|
| `width` | 動画の幅（px） | `1920` |
| `height` | 動画の高さ（px） | `1080` |
| `fps` | フレームレート | `30` |
| `bgm` | BGMファイルのパス | なし |
| `bgmVolume` | BGMの音量（0.0〜1.0） | `0.15` |
| `scenes` | シーンの配列 | — |
| `scenes[].text` | 字幕テキスト | — |
| `scenes[].image` | 背景画像のパス | なし |
| `scenes[].audio` | ナレーション音声のパス | なし |
| `scenes[].durationInFrames` | シーンの長さ（フレーム数）| 音声の長さから自動計算 |

> **パスの書き方**: `public/` を起点として `data/動画名/ファイル名` の形式で記述します。

### Step 3: 動画を生成する

```console
npm run generate -- public/data/my-video/video-config.json
```

`out/my-video.mp4` に動画が生成されます。フォルダ名がそのまま出力ファイル名になります。

### 複数の動画を量産する

```console
npm run generate -- public/data/video-a/video-config.json
npm run generate -- public/data/video-b/video-config.json
npm run generate -- public/data/video-c/video-config.json
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
