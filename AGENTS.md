# AGENTS.md

AIエージェント向けのルールです。Codexはこのファイルを直接読み、Claude Codeは `CLAUDE.md` から取り込みます。ルールの追加・変更はこのファイルだけに書きます。

## 変更時はADRを残す

このリポジトリに変更を加えるときは、変更と同じ作業の中で `adr/` 配下にADR（アーキテクチャ決定レコード）を作成します。

- **MarkdownとHTMLの両方を作る**：1つの決定につき `adr/adr-NNNN-［決定の要約］.md` と `adr/adr-NNNN-［決定の要約］.html` を1組作成します。2つのファイルの内容は揃えます。
- **雛形から作る**：Markdownは直下の `adr.md`、HTMLは直下の `adr.html` を複製し、［ ］内を書き換えます。章立て（背景・課題／判断基準／検討した選択肢／決定／結果・影響／実施と見直し／関連ADR・参考資料／変更履歴）は削らず、該当がない章は「なし」と書きます。
- **番号**：`NNNN` は `adr/` 内の既存ADRの最大番号に1を足した4桁の連番です。`node adr/build_index.mjs` を実行すると次の番号が表示されます。タイトル・本文・フッターの `ADR-0001` も同じ番号に書き換えます。要約部分は英小文字とハイフンで短く付けます（例：`adr-0002-add-data-transition.md`）。
- **一覧を更新する**：ADRを追加したとき、ステータスやタイトルを変えたときは `node adr/build_index.mjs` を実行し、`adr/README.md` と `adr/index.html` の一覧を更新します。一覧のマーカー（`adr:index:start`〜`adr:index:end`）の間は手で編集しません。作業の最後に `node adr/build_index.mjs --check` で一覧が最新であることを確認します。
- **既存ADRは書き換えない**：承認済みの決定を変える場合は新しいADRを作り、古いADRのステータスを「置換」にして、変更履歴と関連ADRで相互にリンクします。
- **ステータス**：利用者の合意前は「提案中」で作成します。利用者が変更を承認したら「承認」に更新し、変更履歴に記録します。
- **HTMLのスタイル**：`adr.html` の埋め込みCSS（`<!-- bases:styles:start -->`〜`<!-- bases:styles:end -->` を含む）はそのまま残します。`bases/sync_styles.mjs` は直下と `bases/` のHTMLだけを対象にしており、`adr/` 配下は同期されません。

## スクリプトはNode.jsで書く

リポジトリで使うスクリプトはNode.js（標準モジュールのみ、拡張子 `.mjs`）で書き、Pythonは使いません（ADR-0003）。外部パッケージが必要になる場合は、先に利用者へ確認します。

- **共通CSSの反映**：`bases/base.css` を変更したら `node bases/sync_styles.mjs` を実行します。確認だけなら `--check`、保存時の自動反映は `--watch` です。
- **ADR一覧の更新**：`node adr/build_index.mjs`（確認だけなら `--check`）。
