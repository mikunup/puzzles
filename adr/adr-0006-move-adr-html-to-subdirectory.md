# ADR-0006：生成したADRのHTMLを adr/html/ に置く

ADR / puzzles・ADRの管理

> 生成したADRのHTMLと一覧 `index.html` を `adr/html/` に置き、`adr/` にはMarkdownとスクリプトだけを残す。HTML版を見たい人は `adr/html/` を開く。

| 項目 | 内容 |
| --- | --- |
| ステータス | 承認 |
| 決定日 | 2026.11.14 |
| 決定者 | mikunup（リポジトリ管理者） |
| 関係者 | Claude Code（実装） |
| 対象範囲 | `adr/html/`・`adr/build_index.mjs`・`adr/render_adr.mjs` |

## 01. 背景・課題

ADR-0005で、ADRのHTMLをMarkdownから生成するようにした。生成したHTMLは `adr/` にMarkdownと並べて置いていたため、ADRが増えるとファイル数が2倍になり、元データのMarkdownが探しにくくなっていた。

### 現状

- `adr/` に、ADRのMarkdown・生成したHTML・`index.html`・`README.md`・スクリプトが混在している。

### 制約・前提

- HTMLは生成物で、編集するのはMarkdownだけ（ADR-0005）。
- HTML版は、ブラウザでファイルを開くだけで読めるようにする。

> **この ADR で決めること**
> 生成したADRのHTMLをどこに置くか。

## 02. 判断基準

1. **元データのMarkdownを探しやすいこと**
   `adr/` を開いたときに、編集するファイルだけが並ぶようにするため。
2. **HTML版の入口がわかりやすいこと**
   HTML版を見たい人が、迷わず一覧にたどり着けるようにするため。

## 03. 検討した選択肢

| 判断基準 | 選択肢 A：`adr/html/` に置く（採用） | 選択肢 B：現状維持（`adr/` に並べる） |
| --- | --- | --- |
| Markdownを探しやすい | ◎ `adr/` はMarkdownとスクリプトだけ | △ HTMLと混在し、ファイル数が2倍 |
| HTML版の入口 | ◎ `adr/html/index.html` に集まる | ○ `adr/index.html` だが、他のファイルに埋もれる |

◎：基準を十分に満たす　○：満たす　△：課題がある　×：満たさない

### 選択肢ごとの詳細

#### 選択肢 A：`adr/html/` に置く

生成したHTMLと `index.html` を `adr/html/` に置く。HTML内の相対リンクは、生成時に1つ上の階層へ向け直す。

- **良い点**：`adr/` が元データだけになる。HTML版は1か所にまとまる。
- **懸念点**：リンクの書き換えが必要になる（生成時に自動で行う）。

#### 選択肢 B：現状維持

`adr/` にMarkdownとHTMLを並べたままにする。

- **良い点**：作業が発生しない。
- **懸念点**：ADRが増えるほど `adr/` が見づらくなる。

## 04. 決定

> **DECISION**
> 生成したADRのHTMLと一覧 `index.html` を `adr/html/` に置く（選択肢 A）。`render_adr.mjs` などのスクリプトは `adr/` に残す。

### 決定の理由

- 基準 1：`adr/` には編集するMarkdownとスクリプトだけが残る。
- 基準 2：HTML版を見たい人は `adr/html/index.html` を開けばよい。
- 選択肢 Bは、ADRが増えるほど元データが探しにくくなるため選ばなかった。
- スクリプトの置き場所は、利用者が「AIのトークン量が少ないほう」を条件にAIへ任せた。AI（Claude Code）は、スクリプトを移すと実行コマンドの説明（`AGENTS.md`・`README` など）、ADRの参考資料のリンク、スクリプト内のパスの処理を書き換える必要があり、トークン量が増えると判断して `adr/` に残した。この判断は書き換え箇所の見積もりによるもので、トークン量は測っていない。

## 05. 結果・影響

### 良い影響

- `adr/` のファイル数がADR1件につき1つになる。

### 受け入れる不利益

- HTML版のURL（パス）が `adr/` から `adr/html/` に変わる。

### その他の影響

- 生成時に、ADR同士のリンクは同じ階層のHTMLへ、それ以外の相対リンク（`../AGENTS.md` など）は1つ上の階層へ向け直す。
- `AGENTS.md`・`adr/README.md`・`adr.md`・`README.md`・`README.html` のパスを更新した。ADR-0002の参考資料のリンクも `html/index.html` に直した。

## 06. 実施と見直し

| 作業 | 担当 | 期限 | 状態 |
| --- | --- | --- | --- |
| `build_index.mjs`・`render_adr.mjs` の出力先とリンクを `adr/html/` に合わせる | Claude Code | 2026.11.14 | 完了 |
| 既存のHTMLを `adr/html/` に生成し直す | Claude Code | 2026.11.14 | 完了 |
### 確認する指標

`adr/` 直下に `.html` がなく、`node adr/build_index.mjs --check` が通ること。

### 見直しの条件・時期

なし

## 07. 関連ADR・参考資料

- [ADR-0005：ADRはMarkdownだけを書き、HTMLはスクリプトで生成する](adr-0005-generate-adr-html-from-markdown.md) — 関連する（生成したHTMLの置き場所を変える）

## 08. 変更履歴

| 日付 | ステータス | 内容 | 記入者 |
| --- | --- | --- | --- |
| 2026.11.14 | 承認 | 利用者の指示で作成 | Claude Code |

---

DECISION RECORD / ADR-0006 Claude Code
