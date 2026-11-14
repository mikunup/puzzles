# ADR-0003：リポジトリのスクリプトをNode.jsに統一し、Pythonを使わない

ADR / puzzles・開発環境

> リポジトリで使うスクリプトはNode.jsで書き、Pythonのスクリプト（`bases/sync_styles.py`・`adr/build_index.py`）は同じ動きのNode.js版に置き換えて削除する。

| 項目 | 内容 |
| --- | --- |
| ステータス | 承認 |
| 決定日 | 2026.11.14 |
| 決定者 | mikunup（リポジトリ管理者） |
| 関係者 | Claude Code（調査・移植） |
| 対象範囲 | `bases/sync_styles.mjs`・`adr/build_index.mjs`・リポジトリのスクリプト全般 |

<details>
<summary>ステータスの意味</summary>

| ステータス | 意味 |
| --- | --- |
| 提案中 | レビュー・合意を待っている状態。 |
| 承認 | 合意され、この決定に従って進める状態。 |
| 却下 | 検討したが採用しなかった状態。理由を残します。 |
| 廃止 | 前提が変わり、もう従わない状態。 |
| 置換 | 別のADRで置き換えた状態。「関連ADR」に後継を記載します。 |

</details>

## 目次

1. [背景・課題](#01-背景課題)
2. [判断基準](#02-判断基準)
3. [検討した選択肢](#03-検討した選択肢)
4. [決定](#04-決定)
5. [結果・影響](#05-結果影響)
6. [実施と見直し](#06-実施と見直し)
7. [関連ADR・参考資料](#07-関連adr参考資料)
8. [変更履歴](#08-変更履歴)

## 01. 背景・課題

リポジトリ管理者は、Node.jsが使えればよい環境で作業している。一方、共通CSSを各HTMLへ反映する `bases/sync_styles.py` と、ADR-0002で作ったADR一覧を生成する `adr/build_index.py` はPythonで書かれており、Node.jsとは別にPython 3の実行環境が必要だった。

### 現状

- Pythonのスクリプトが2つある（`bases/sync_styles.py`・`adr/build_index.py`）。
- `electron/` はすでにNode.js（npm）を使っている。

### 制約・前提

- 利用者の環境はNode.jsがあればよく、Pythonを前提にしない。
- 既存コマンドの動き（`--check`・`--watch`、終了コード、表示するメッセージ、書き換える内容）を変えない。
- 外部パッケージを使わず、`npm install` なしで動くこと。

> **この ADR で決めること**
> リポジトリのスクリプトを、どの実行環境で動かすか。

## 02. 判断基準

1. **利用者が用意する実行環境が1つで済むこと**
   利用者はNode.jsだけが使えればよく、別の言語の環境を用意する手間をなくすため。
2. **既存の動きを変えないこと**
   共通CSSの反映やADR一覧の生成の結果が変わると、HTMLが意図せず書き換わるため。
3. **追加のインストールが不要であること**
   クローンしてすぐにスクリプトを実行できるようにするため。

## 03. 検討した選択肢

| 判断基準 | 選択肢 A：Node.jsに統一（採用） | 選択肢 B：Pythonのまま | 選択肢 C：新しいものだけNode.js |
| --- | --- | --- | --- |
| 実行環境が1つで済む | ◎ Node.jsだけで、`electron/` も含めて動く | △ Python 3が必要（`electron/` にはNode.jsも必要） | × PythonとNode.jsの両方が必要 |
| 既存の動きを変えない | ○ 移植が必要だが、同じ出力になることを確認した | ◎ 変更なし | ◎ 既存のスクリプトはそのまま |
| 追加のインストールが不要 | ◎ Node.jsの標準モジュールだけを使う | ◎ 標準ライブラリだけを使う | ◎ どちらも標準の機能だけを使う |

◎：基準を十分に満たす　○：満たす　△：課題がある　×：満たさない

### 選択肢ごとの詳細

#### 選択肢 A：Node.jsに統一

2つのPythonスクリプトを、同じ動きのNode.js版（`.mjs`、標準モジュールのみ）に置き換え、Python版を削除する。今後のスクリプトもNode.jsで書く。

- **良い点**：利用者はNode.jsだけを用意すればよい。スクリプトの言語が1つになり、保守しやすい。
- **懸念点**：移植の手間がかかる。実行コマンドが `python3` から `node` に変わる。

#### 選択肢 B：Pythonのまま

スクリプトはPythonで書き続ける。

- **良い点**：作業が発生しない。
- **懸念点**：Node.jsだけの環境ではスクリプトを実行できない。

#### 選択肢 C：新しいものだけNode.js

既存の `bases/sync_styles.py` は残し、これから作るスクリプトだけをNode.jsで書く。

- **良い点**：既存のスクリプトに手を入れずに済む。
- **懸念点**：PythonとNode.jsの両方が必要になり、利用者の手間が最も大きい。

## 04. 決定

> **DECISION**
> リポジトリで使うスクリプトはNode.js（標準モジュールのみ、拡張子 `.mjs`）で書く。既存のPythonスクリプトは同じ動きのNode.js版に置き換えて削除する（選択肢 A）。

### 決定の理由

利用者が「Node.jsが使えればよい」としているため、基準 1を最も重視した。

- 基準 1：Node.jsだけで、すべてのスクリプトと `electron/` が動く。
- 基準 2：移植後の出力がPython版と一致することを確認した（下記「確認した内容」）。
- 基準 3：Node.jsの標準モジュールだけを使い、`npm install` は不要。
- 選択肢 Bは、Node.jsだけの環境で動かないため選ばなかった。
- 選択肢 Cは、PythonとNode.jsの両方が必要になるため選ばなかった。

### 確認した内容（Node.js v26.2.0）

- `bases/sync_styles.mjs`：リポジトリのコピーで `base.css` を変更して両方を実行し、19ページの書き換え結果が完全に一致した。`--check` はどちらも同じ2ページを未反映として報告した。`--watch` は保存後に各ページを更新した。
- `adr/build_index.mjs`：153件のADR（記号やリンクを含むものを含む）で、表示と `README.md`・`index.html` の生成結果が完全に一致した。

## 05. 結果・影響

### 良い影響

- 利用者はNode.jsだけを用意すれば、共通CSSの反映・ADR一覧の生成・`electron/` のすべてを使える。
- スクリプトの言語がNode.jsに揃い、読む・直すときに迷わない。

### 受け入れる不利益

- Pythonだけがある環境では、スクリプトを実行できない。
- 実行コマンドが変わる（`python3 bases/sync_styles.py` → `node bases/sync_styles.mjs`、`python3 adr/build_index.py` → `node adr/build_index.mjs`）。

### その他の影響

- `README.md`・`README.html`・`bases/display.html`・`AGENTS.md` のコマンドを書き換えた。`AGENTS.md` に「スクリプトはNode.jsで書く」ルールを追加した。
- `base.css` 冒頭のコメント（`sync_styles.py` → `sync_styles.mjs`）は、各HTMLの埋め込みCSSを文字列置換で直した。共通CSSの同期は実行していない。

## 06. 実施と見直し

| 作業 | 担当 | 期限 | 状態 |
| --- | --- | --- | --- |
| `bases/sync_styles.mjs` を作成し、`bases/sync_styles.py` を削除する | Claude Code | 2026.11.14 | 完了 |
| `adr/build_index.mjs` を作成し、`adr/build_index.py` を削除する | Claude Code | 2026.11.14 | 完了 |
| README・`bases/display.html`・`AGENTS.md` のコマンドを書き換える | Claude Code | 2026.11.14 | 完了 |
| このADRをMarkdownとHTMLで作成する | Claude Code | 2026.11.14 | 完了 |

### 確認する指標

リポジトリに `.py` ファイルがなく、`node bases/sync_styles.mjs --check` と `node adr/build_index.mjs --check` がNode.jsだけで実行できること。

### 見直しの条件・時期

Node.jsの標準モジュールでは実現しにくい処理が必要になった場合に、外部パッケージの利用や他の言語を含めて見直す。

## 07. 関連ADR・参考資料

- [ADR-0002：ADR一覧をスクリプトで生成し、MarkdownとHTMLで提供する](adr-0002-generate-adr-index.md) — 関連する（一覧を生成するスクリプトをNode.jsで作る）
- [bases/sync_styles.mjs](../bases/sync_styles.mjs) — 共通CSSを各HTMLへ反映するスクリプト
- [build_index.mjs](build_index.mjs) — ADR一覧を生成するスクリプト
- [AGENTS.md](../AGENTS.md) — 「スクリプトはNode.jsで書く」ルール

## 08. 変更履歴

| 日付 | ステータス | 内容 | 記入者 |
| --- | --- | --- | --- |
| 2026.11.14 | 提案中 | 初版を作成 | Claude Code |
| 2026.11.14 | 承認 | 利用者が「Node.jsが使えればよい」として、ADRへの記録とPythonの削除を指示 | mikunup |

---

DECISION RECORD / ADR-0003 Claude Code
