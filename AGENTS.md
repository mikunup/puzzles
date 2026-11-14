# AGENTS.md

AIエージェント向けのルールです。Codexはこのファイルを直接読み、Claude Codeは `CLAUDE.md` から取り込みます。ルールの追加・変更はこのファイルだけに書きます。

## 変更時はADRを残す

このリポジトリに変更を加えるときは、変更と同じ作業の中で `adr/` 配下にADR（アーキテクチャ決定レコード）を作成します。

- **Markdownだけを書く**：1つの決定につき `adr/adr-NNNN-［決定の要約］.md` を1つ作成します。HTML（`adr/html/adr-NNNN-*.html`）は `node adr/build_index.mjs` が生成するので、書きません（ADR-0005・ADR-0006）。
- **生成されたHTMLは読まない・直さない**：`adr/html/` 配下のHTMLは生成物です。内容の確認や修正はMarkdownで行い、HTMLを読んだり直接編集したりしません。
- **雛形から作る**：直下の `adr.md` を複製し、［ ］内を書き換えます。`adr.html` は雛形の見た目の見本で、生成するHTMLのスタイルの元になります。ADRには雛形にある書き方（見出し・段落・リスト・表・引用）だけを使います。章立て（背景・課題／判断基準／検討した選択肢／決定／結果・影響／実施と見直し／関連ADR・参考資料／変更履歴）は削らず、該当がない章は「なし」と書きます。
- **番号**：`NNNN` は `adr/` 内の既存ADRの最大番号に1を足した4桁の連番です。`node adr/build_index.mjs` を実行すると次の番号が表示されます。タイトル・本文・フッターの `ADR-0001` も同じ番号に書き換えます。要約部分は英小文字とハイフンで短く付けます（例：`adr-0002-add-data-transition.md`）。
- **HTMLと一覧を生成する**：ADRのMarkdownを追加・変更したら `node adr/build_index.mjs` を実行し、各ADRのHTMLと `adr/README.md`・`adr/html/index.html` の一覧を更新します。一覧のマーカー（`adr:index:start`〜`adr:index:end`）の間は手で編集しません。作業の最後に `node adr/build_index.mjs --check` で、HTMLと一覧が最新であることを確認します。
- **既存ADRは書き換えない**：承認済みの決定を変える場合は新しいADRを作り、古いADRのステータスを「置換」にして、変更履歴と関連ADRで相互にリンクします。
- **ステータス**：利用者の合意前は「提案中」で作成します。利用者が変更を承認したら「承認」に更新し、変更履歴に記録します。
- **HTMLのスタイル**：生成するHTMLは、`adr.html` の `<head>`（共通CSSを含む）をそのまま使います。`base.css` や `adr.html` の見た目を変えたら、`node adr/build_index.mjs` で全ADRのHTMLを作り直します。

## スクリプトはNode.jsで書く

リポジトリで使うスクリプトはNode.js（標準モジュールのみ、拡張子 `.mjs`）で書き、Pythonは使いません（ADR-0003）。外部パッケージが必要になる場合は、先に利用者へ確認します。

- **共通CSSの反映**：`bases/base.css` を変更したら `node bases/sync_styles.mjs` を実行します。確認だけなら `--check`、保存時の自動反映は `--watch` です。
- **共通CSSの範囲は直接編集しない**：各HTMLの `<!-- bases:styles:start -->`〜`<!-- bases:styles:end -->` の中は同期で上書きされます。ページ固有のCSSは範囲外の `<style>` に書き、共通の変更は `bases/base.css` に書きます。HTMLを変更した作業の最後に `node bases/sync_styles.mjs --check` を実行し、「すべてのHTMLに反映済みです。」になることを確認します（ADR-0004）。
- **ADRのHTMLと一覧の生成**：`node adr/build_index.mjs`（確認だけなら `--check`）。
