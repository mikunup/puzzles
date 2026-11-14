# ADR一覧

このリポジトリで行ったアーキテクチャ上の決定（ADR）の一覧です。ADRはMarkdown（`.md`）で書き、HTML（`.html`）は `adr/build_index.mjs` がMarkdownから生成し、`adr/html/` に置きます（ADR-0005・ADR-0006）。

<a href="html/index.html" target="_blank" rel="noopener noreferrer">HTML版の一覧を開く ↗</a>（キーワード検索・ステータスでの絞り込み・並べ替えができます）

## 一覧

<!-- adr:index:start -->
全 8 件　（提案中 1　承認 7　却下 0　廃止 0　置換 0）

| 番号 | タイトル | ステータス | 決定日 | 対象範囲 | HTML |
| --- | --- | --- | --- | --- | --- |
| ADR-0001 | [AIエージェント向けルールをAGENTS.mdに置き、CLAUDE.mdから取り込む](adr-0001-share-agent-rules-with-agents-md.md) | 承認 | 2026.11.14 | リポジトリ直下の `AGENTS.md`・`CLAUDE.md` | [開く](html/adr-0001-share-agent-rules-with-agents-md.html) |
| ADR-0002 | [ADR一覧をスクリプトで生成し、MarkdownとHTMLで提供する](adr-0002-generate-adr-index.md) | 承認 | 2026.11.14 | `adr/README.md`・`adr/index.html`・`adr/build_index.mjs` | [開く](html/adr-0002-generate-adr-index.html) |
| ADR-0003 | [リポジトリのスクリプトをNode.jsに統一し、Pythonを使わない](adr-0003-use-nodejs-for-scripts.md) | 承認 | 2026.11.14 | `bases/sync_styles.mjs`・`adr/build_index.mjs`・リポジトリのスクリプト全般 | [開く](html/adr-0003-use-nodejs-for-scripts.html) |
| ADR-0004 | [業務定義シートとアウトラインの共通CSSを、共通デザインに揃える](adr-0004-unify-tab-design.md) | 承認 | 2026.11.14 | `business_definition_sheet.html`・`outline.html` の共通CSSの範囲 | [開く](html/adr-0004-unify-tab-design.html) |
| ADR-0005 | [ADRはMarkdownだけを書き、HTMLはスクリプトで生成する](adr-0005-generate-adr-html-from-markdown.md) | 承認 | 2026.11.14 | `adr/` のADR・`adr/build_index.mjs`・`adr/render_adr.mjs`・`AGENTS.md` のADRルール | [開く](html/adr-0005-generate-adr-html-from-markdown.html) |
| ADR-0006 | [生成したADRのHTMLを adr/html/ に置く](adr-0006-move-adr-html-to-subdirectory.md) | 承認 | 2026.11.14 | `adr/html/`・`adr/build_index.mjs`・`adr/render_adr.mjs` | [開く](html/adr-0006-move-adr-html-to-subdirectory.html) |
| ADR-0007 | [ADRは重要な決定だけに使い、作業の管理はIssueとPRで行う](adr-0007-limit-adr-scope.md) | 承認 | 2026.11.14 | `AGENTS.md` のADRルール・雛形 `adr.md`・`adr.html` | [開く](html/adr-0007-limit-adr-scope.html) |
| ADR-0008 | [bases/ の基準をMarkdownに要約し、AIはまずそれを読む](adr-0008-summarize-bases-in-markdown.md) | 提案中 | 2026.11.14 | `bases/README.md`・`AGENTS.md` のルール | [開く](html/adr-0008-summarize-bases-in-markdown.html) |
<!-- adr:index:end -->

上の一覧と各ADRのHTMLは `adr/build_index.mjs` が生成します。マーカー（`adr:index:start`〜`adr:index:end`）の間と、`html/` 配下のHTMLは手で編集しないでください。

## ADRを追加する

ADRにするのは、技術・道具の選択、ディレクトリ構成や命名の決まり、リポジトリ全体に効くルール、元に戻しにくい変更に当たる決定だけです。それ以外の変更はPRの説明とコミットメッセージに記録します（ADR-0007）。

1. `node adr/build_index.mjs` を実行し、表示される「次の番号」を確認します。
2. リポジトリ直下の雛形 `adr.md` を複製し、`adr/adr-［番号］-［英小文字とハイフンの要約］.md` を作ります。HTMLは作りません。
3. ［ ］内を書き換えます。一覧には、見出し（`# ADR-0000：タイトル`）、冒頭の要約（`> `で始まる行）、ステータス・決定日・対象範囲の表を使います。書き方は雛形にあるもの（見出し・段落・リスト・表・引用）だけを使います。
4. もう一度 `node adr/build_index.mjs` を実行し、ADRのHTML（`html/`）と、このファイル・`html/index.html` の一覧を生成します。

ステータスを変えたときやタイトルを直したときも、同じように再実行します。`node adr/build_index.mjs --check` は書き換えずに確認だけを行い、HTMLや一覧が古いときは終了コード1を返します。

スクリプトは次の場合にエラーで止まり、一覧を書き換えません。

- ファイル名が `adr-0000-英小文字とハイフン.md` の形でない
- 番号が重複している
- 元になる `.md` がない `html/adr-*.html` が残っている
- 見出しの番号がファイル名と違う
- ステータスが「提案中・承認・却下・廃止・置換」のいずれでもない
