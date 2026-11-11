# outline（Electron 版）

リポジトリ直下の [outline.html](../outline.html) を、Electron のデスクトップアプリとして起動するためのフォルダです。
`main.js` から `../outline.html` を読み込み、編集内容を `datas/outline.json` に都度保存します。

## 起動方法

```sh
cd electron
npm install
npm start
```

## ファイル構成

| ファイル | 内容 |
| --- | --- |
| `package.json` | Electron の依存関係と `npm start` スクリプト |
| `main.js` | ウィンドウ作成・メニュー・リンクの扱い・JSON ファイルの読み書き |
| `preload.js` | outline.html から JSON ファイルを読み書きするための橋渡し |
| `datas/outline.json` | アウトラインの保存データ（初回の編集時に自動作成。Git 管理外） |

## アプリの動作

- **データの保存**：編集するたびに `electron/datas/outline.json` へ自動保存します。形式は「全タブをJSON保存」と同じなので、ブラウザ版の「読み込み」でそのまま開けます。
  - 一時ファイルに書いてから置き換えるため、保存中にアプリが終了してもファイルは壊れません。
  - 起動時は `datas/outline.json` を読み込みます。ファイルがないときは、アプリ内の localStorage（バックアップとして並行して保存）から読み込みます。
  - ブラウザ版の outline.html は、これまでどおりブラウザ内（localStorage）にだけ保存します。
- **ファイル書き出し**：「全タブをJSON保存」「Markdown保存」を押すと、保存ダイアログが開きます。
- **リンク**：README.html などリポジトリ内の HTML はアプリ内で開き、外部リンクは既定のブラウザで開きます。

## ショートカット

outline.html では Ctrl+R を「やり直す」に使うため、Electron 標準メニューのリロード（Ctrl/Cmd+R）は外しています。

| 操作 | キー |
| --- | --- |
| アウトラインへ戻る | Cmd/Ctrl + Shift + H |
| 再読み込み | F5 |
| 開発者ツール | Alt + Cmd + I（macOS）／ Ctrl + Shift + I（Windows・Linux） |
| ウィンドウの全画面 | Ctrl + Cmd + F（macOS）／ F11（Windows・Linux） |

## トラブルシューティング

### `Electron failed to install correctly` と表示される

Node v26 などの新しいバージョンでは、`npm install` 時に Electron 本体の zip 展開がエラーなしで途中終了することがあります。
`electron` フォルダで次を実行し、キャッシュ済みの zip を手動で展開してください（macOS / Apple Silicon の例）。

```sh
cd node_modules/electron && rm -rf dist && mkdir dist && \
ditto -x -k ~/Library/Caches/electron/*/electron-v33*darwin-arm64.zip dist && \
printf 'Electron.app/Contents/MacOS/Electron' > path.txt
```

Node 22 LTS を使うと、この問題は起きにくくなります。

### `Cannot read properties of undefined (reading 'whenReady')` と表示される

環境変数 `ELECTRON_RUN_AS_NODE` が設定されていると、Electron が Node として動き、アプリが起動しません。
VS Code 関連のツールから起動したときに設定されていることがあります。外して起動してください。

```sh
env -u ELECTRON_RUN_AS_NODE npm start
```
