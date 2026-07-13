# YouTube Shorts 自動投稿機能 セットアップ＆実行手順ガイド

作成した動画（`out/inbound-tourism.mp4`）および生成したサムネイルをYouTubeに自動でアップロードするための設定手順です。

---

## 🛠️ 事前準備（Google CloudでのAPIキー設定）

YouTube APIを利用するには、Googleアカウントで開発者コンソールにログインし、OAuth2認証情報ファイルを取得する必要があります。

### ステップ 1: プロジェクトの作成とAPIの有効化
1. **[Google Cloud Console](https://console.cloud.google.com/)** にログインします。
2. 左上のプロジェクト選択メニューから **「新しいプロジェクト」** を作成します。（例: `youtube-shorts-uploader`）
3. プロジェクトが作成されたら、上部の検索窓に **「YouTube Data API v3」** と入力し、検索結果から選択して **「有効にする」** をクリックします。

### ステップ 2: OAuth 同意画面の設定
YouTubeに安全に動画をアップロードするため、アプリの同意画面（OAuth Consent Screen）を設定します。
1. 左側のナビゲーションメニューから **「APIs & Services」** > **「OAuth consent screen」** (OAuth同意画面) を開きます。
2. **User Type** で **「External」**（外部）を選択して「作成」をクリックします。
3. **「App name」**（例: `YouTube Uploader`）と **「User support email」**（自身のメールアドレス）を入力します。
4. 最下部の **「Developer contact information」** にも自身のメールアドレスを入力し、**「SAVE AND CONTINUE」** をクリックします。
5. **Scopes** (スコープ) 画面は何も追加せず、そのまま **「SAVE AND CONTINUE」** をクリックします。
6. **Test users** (テストユーザー) 画面で **「ADD USERS」** をクリックし、**ご自身のYouTubeチャンネルと紐づいているGoogleアカウント（Gmail）** を登録します。（※重要: 登録しないと認証エラーになります）。登録後、「SAVE AND CONTINUE」をクリックします。

### ステップ 3: 認証情報の作成とダウンロード
1. 左メニューから **「Credentials」** (認証情報) を開きます。
2. 上部の **「+ CREATE CREDENTIALS」** ボタンを押し、**「OAuth client ID」** を選択します。
3. **Application type** に **「Desktop app」** (デスクトップアプリ) を選択し、適当な名前（例: `Desktop Client`）を入力して「Create」をクリックします。
4. 作成されたらポップアップ内のダウンロードボタン（または認証情報一覧の右端にある下矢印ボタン）を押して、**JSONファイルをダウンロード** します。
5. ダウンロードしたJSONファイルを **`client_secret.json`** にリネーム（名前変更）し、このプロジェクトの**ルートディレクトリ（`create-youtube-video/` の直下）**に保存します。

---

## 🚀 アップロードスクリプトの実行方法

準備が整ったら、以下の手順でアップロードを実行します。

### コマンドの実行

ターミナルで以下のコマンドを実行します。（デフォルト値が設定されているため、基本的にはオプションなしで自動的に今回の動画とサムネイルが選択されます）

```powershell
# 最初は安全のため非公開(private)でアップロードされます
python scripts/upload_youtube.py
```

### 初回実行時のブラウザ認証
1. コマンドを実行すると、ターミナルに「`Opening browser for authentication...`」と表示され、ブラウザが自動的に開きます。
2. **テストユーザーに登録したGoogleアカウント** を選択してログインします。
3. 「このアプリはGoogleで確認されていません」という警告画面が出た場合は、左下の **「詳細」(Advanced)** をクリックし、**「（安全ではないページ）に移動」(Go to YouTube Uploader (unsafe))** をクリックして進めてください。
4. アプリへの権限許可画面が表示されるので、**「許可」(Continue/Allow)** をクリックします。
5. ブラウザに「`The authentication flow has completed.`」と表示されれば認証完了です。ブラウザを閉じてターミナルに戻ると、自動的に動画のアップロードが始まります。

※一度認証を行うと、ルートの `.credentials/` フォルダに認証キャッシュが保存されるため、2回目以降はブラウザ認証なしで高速にアップロードが実行されます。

---

## 💡 YouTube投稿用 メタデータ・SEO設定

スクリプト内には、視聴されやすいように最適化した以下のSEOメタデータが標準で組み込まれています。タイトルや説明文を変更したい場合は、コマンドのオプション引数で自由に指定できます。

```powershell
python scripts/upload_youtube.py `
  --title "【激変】日本に来る外国人が多すぎる！訪日観光客の10年推移が凄まじい #Shorts #統計" `
  --description "日本政府観光局（JNTO）の統計データ（2016年〜2025年）をもとに、訪日外国人観光客の累計推移を可視化しました。\n\n#shorts #観光 #インバウンド #旅行 #統計 #データ可視化" `
  --privacy "public"
```

* **タイトル**: 短い時間で興味を惹きつけるよう「激変」「多すぎる」といったパワーワードと、Shorts認識のための `#Shorts`、アルゴリズム用のキーワードを前半に集約。
* **説明文**: JNTOデータの出典元、動画の要約、関連する主要ハッシュタグ（`#観光 #インバウンド #旅行 #統計 #データ可視化`）を網羅。
* **サムネイル**: [thumbnail.png](file:///c:/Users/Motomitsu%20Hiroki/create-youtube-video/public/data/inbound-tourism/thumbnail.png)（AI生成した高画質な「激変！訪日外国人の10年」のロゴ入りサムネイル）が自動的にセットされます。
