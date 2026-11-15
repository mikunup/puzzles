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
| `preload.js` | outline.html から JSON ファイルを読み書きし、「今日のタスク」を実行するための橋渡し |
| `.claude/commands/today.md` | Claude Code の `/today` コマンド（今日のタスクの提案） |
| `scripts/outline_tree.mjs` | `datas/outline.json` の未完了タスクを階層とidつきで出力する（`/today` が使う。読むだけ） |
| `datas/outline.json` | アウトラインの保存データ（初回の編集時に自動作成。Git 管理外） |

## アプリの動作

- **データの保存**：編集するたびに `electron/datas/outline.json` へ自動保存します。形式は「全タブをJSON保存」と同じなので、ブラウザ版の「読み込み」でそのまま開けます。
  - 一時ファイルに書いてから置き換えるため、保存中にアプリが終了してもファイルは壊れません。
  - 起動時は `datas/outline.json` を読み込みます。ファイルがないときは、アプリ内の localStorage（バックアップとして並行して保存）から読み込みます。
  - ブラウザ版の outline.html は、これまでどおりブラウザ内（localStorage）にだけ保存します。
- **ファイル書き出し**：「全タブをJSON保存」「Markdown保存」を押すと、保存ダイアログが開きます。
- **リンク**：README.html などリポジトリ内の HTML はアプリ内で開き、外部リンクは既定のブラウザで開きます。

## 今日のタスク（Electron 版のみ）

画面上部のカレンダーアイコンからダイアログを開き、「実行」を押すと、Claude Code に未完了タスクから今日の作業を提案させます。提案した項目には **✦**（AIフォーカス）が付き、上位の階層が自動で展開されます。

- **必要なもの**：[Claude Code](https://docs.claude.com/claude-code) の `claude` コマンドとログイン済みの環境。Finder などから起動して `claude` が見つからないときは、環境変数 `CLAUDE_BIN` にパスを指定して起動します（例：`CLAUDE_BIN="$(which claude)" npm start`）。
- **引数**：「件数 タブ名」の順に入力します（例：`3 タスク整理`）。省略時は5件・アーカイブタブ以外の全タブです。「現在のタブ」で表示中のタブ名を入れられます。
- **実行の仕組み**：`electron/` を作業フォルダにして `claude -p "/today <引数>" --allowedTools "Bash(node scripts/outline_tree.mjs:*),Read"` を実行します。
  - `/today` は `electron/.claude/commands/today.md` に定義しています。Claude Code はプロジェクトのコマンドを作業フォルダの `.claude/commands/` から読むため、リポジトリ直下ではなく `electron/` の下に置いています。リポジトリ直下で `claude` を起動したときには `/today` は使えません。
  - 許可するツールは、未完了タスクのツリーを出力する `node scripts/outline_tree.mjs` と `Read` だけです。`datas/outline.json` は読むだけで、変更しません。
  - 引数は制御文字を除いて100文字までにし、シェルを通さず（`shell: false`）に起動します。
  - 180秒を超えると中止します。実行中は「中止」で止められ、アプリを終了したときも止めます。同時に実行できるのは1つだけです。
- **結果**：提案はMarkdownで表示します。末尾の ```focus-ids``` ブロックにある項目のidに ✦ を付け直します（前回の ✦ は外します）。直前の結果はアプリ内の localStorage（`puzzles.outline.today.v1`）に残り、次に開いたときにも表示されます。「コピー」でMarkdownをコピーできます。
- **✦ を外す**：行の ✦ をクリックすると、その項目のマークだけ外れます（u で元に戻せます）。
- ブラウザ版の outline.html には `claude` を実行する仕組みがないため、カレンダーアイコンは表示しません。

## アーカイブと今日のふりかえり（ブラウザ版・Electron 版）

- **アーカイブ（Shift+a）**：選択した完了項目を「アーカイブ」タブ（初回に自動作成）の日付見出し（例：`2026-11-12（木）`）の下へ、元の親の階層ごと移します。
  - 子がある項目は子孫がすべて ✓、子がない項目は自分が ✓ のときに移せます。未完了の子がある項目は移さず、メッセージを表示します。
  - 子を移して親が空になったら、親も上へ順に移します。以前に子だけ移して空で残った親も、アーカイブタブに同じ階層があれば移せます。
  - アーカイブタブの親は、日付見出しからの項目名の並びが同じものを1つにまとめます。同じ日に同じ名前の階層から移した項目は、別のタブから移したものでも同じ親の下に入ります。
  - アーカイブタブの項目はアーカイブできません。元に戻す（u）で取り消せますが、時間がたってから元の場所へ戻す機能はありません。
- **今日のふりかえり**：旗アイコンから開きます。アーカイブタブ以外の全タブを対象に、次を表示します。
  - **やりきったこと**：アーカイブできる項目の一覧と ✓ の数。子がすべて ✓ の案件は親ごと1件にまとめます。
  - **✓ 済みで、未完了の子が残る項目**：表示するだけで、アーカイブしません。
  - **✦ AI提案の残り**：✦ が付いていて未完了の項目。
  - 「✓ N 件をアーカイブして一日を終える」で、やりきったことの項目をまとめてアーカイブします。

## 保存データの項目

「今日のタスク」とアーカイブのため、保存データ（`datas/outline.json`・localStorage・JSON書き出し）に次の項目を追加しました。どちらも `true` のときだけ保存するため、以前のデータはそのまま読み込めます。

| 対象 | 項目 | 内容 |
| --- | --- | --- |
| 項目 | `aiFocus: true` | ✦（AIが今日のタスクとして提案した項目） |
| タブ | `archive: true` | アーカイブタブ |

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
