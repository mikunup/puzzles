# ADR一覧

このリポジトリで行ったアーキテクチャ上の決定（ADR）の一覧です。1つの決定につき、Markdown（`.md`）とHTML（`.html`）を1組作成しています。

<a href="index.html" target="_blank" rel="noopener noreferrer">HTML版の一覧を開く ↗</a>（キーワード検索・ステータスでの絞り込み・並べ替えができます）

## 一覧

<!-- adr:index:start -->
全 3 件　（提案中 0　承認 3　却下 0　廃止 0　置換 0）

| 番号 | タイトル | ステータス | 決定日 | 対象範囲 | HTML |
| --- | --- | --- | --- | --- | --- |
| ADR-0001 | [AIエージェント向けルールをAGENTS.mdに置き、CLAUDE.mdから取り込む](adr-0001-share-agent-rules-with-agents-md.md) | 承認 | 2026.11.14 | リポジトリ直下の `AGENTS.md`・`CLAUDE.md` | [開く](adr-0001-share-agent-rules-with-agents-md.html) |
| ADR-0002 | [ADR一覧をスクリプトで生成し、MarkdownとHTMLで提供する](adr-0002-generate-adr-index.md) | 承認 | 2026.11.14 | `adr/README.md`・`adr/index.html`・`adr/build_index.mjs` | [開く](adr-0002-generate-adr-index.html) |
| ADR-0003 | [リポジトリのスクリプトをNode.jsに統一し、Pythonを使わない](adr-0003-use-nodejs-for-scripts.md) | 承認 | 2026.11.14 | `bases/sync_styles.mjs`・`adr/build_index.mjs`・リポジトリのスクリプト全般 | [開く](adr-0003-use-nodejs-for-scripts.html) |
<!-- adr:index:end -->

上の一覧は `adr/build_index.mjs` が生成します。マーカー（`adr:index:start`〜`adr:index:end`）の間は手で編集しないでください。

## ADRを追加する

1. `node adr/build_index.mjs` を実行し、表示される「次の番号」を確認します。
2. リポジトリ直下の雛形 `adr.md` と `adr.html` を複製し、`adr/adr-［番号］-［英小文字とハイフンの要約］.md` と `.html` を作ります。
3. ［ ］内を書き換えます。一覧には、見出し（`# ADR-0000：タイトル`）、冒頭の要約（`> `で始まる行）、ステータス・決定日・対象範囲の表を使います。
4. もう一度 `node adr/build_index.mjs` を実行し、このファイルと `index.html` の一覧を更新します。

ステータスを変えたときやタイトルを直したときも、同じように再実行します。`node adr/build_index.mjs --check` は書き換えずに確認だけを行い、一覧が古いときは終了コード1を返します。

スクリプトは次の場合にエラーで止まり、一覧を書き換えません。

- ファイル名が `adr-0000-英小文字とハイフン.md` の形でない
- 番号が重複している
- 対になる `.html` がない
- 見出しの番号がファイル名と違う
- ステータスが「提案中・承認・却下・廃止・置換」のいずれでもない
