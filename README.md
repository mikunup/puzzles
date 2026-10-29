# puzzles — 業務・画面設計の資料とツール

業務の整理、オブジェクト設計、画面設計・テスト、計画づくりに使うHTMLをまとめています。各リンクは別タブで開く指定にしています。

<a href="README.html" target="_blank" rel="noopener noreferrer">HTML版の資料一覧を開く ↗</a>

## 使い始める

1. `README.html`をブラウザで開き、目的に合う資料を選びます。
2. 業務定義 → 業務シーケンス → オブジェクト整理 → 画面設計 → 画面単体テストの順で、情報を具体化できます。
3. スケジュール計画書とカレンダーは、計画・実施状況の整理に使います。

## HTMLごとの用途

### 業務を整理する

| HTML | 用途 | 使い方・機能 |
| --- | --- | --- |
| <a href="business_definition_sheet.html" target="_blank" rel="noopener noreferrer">業務定義シート ↗</a><br><code>business_definition_sheet.html</code> | 業務の目的・担当・入力情報・作業内容・成果物を整理し、業務ごとの定義シートを作成します。 | シートの追加・入力、ブラウザ内保存、JSON読み込み／書き出し、印刷・PDF。 |
| <a href="business_sequence.html" target="_blank" rel="noopener noreferrer">業務シーケンス図 ↗</a><br><code>business_sequence.html</code> | 情報項目と担当のマトリクスに作業・帳票を置き、矢印でつないで業務の流れを整理します。 | 図の編集、ブラウザ内保存、JSON読み込み／書き出し、印刷・PDF。 |
| <a href="object_model.html" target="_blank" rel="noopener noreferrer">オブジェクト整理 ↗</a><br><code>object_model.html</code> | オブジェクトの名前・プロパティ・操作を整理し、シングルとコレクションの表示項目・操作を設計します。 | オブジェクト・コレクションの編集、ブラウザ内保存、JSON読み込み／書き出し。 |

### 画面を設計・テストする

| HTML | 用途 | 使い方・機能 |
| --- | --- | --- |
| <a href="screen_design_template.html" target="_blank" rel="noopener noreferrer">画面・機能設計書 ↗</a><br><code>screen_design_template.html</code> | Web自動販売機を例に、画面一覧・遷移、オブジェクト、データ・権限、画面要素、操作、検証と結果を定義します。 | 設計例を参照し、HTML内の内容を編集して自分のシステムの設計書に使います。見本の購入・保存は実行しません。 |
| <a href="screen_unit_test.html" target="_blank" rel="noopener noreferrer">画面単体テストケース ↗</a><br><code>screen_unit_test.html</code> | 画面グループごとに「目的 → 前提 → ケース表」を読み、正常・バリデーション・異常を確認します。 | OK／NG・保留の記録、実績メモ、集計、ブラウザ内保存、結果のJSON書き出し。自動テストの実行ページではありません。 |

### 計画・スケジュールを整理する

| HTML | 用途 | 使い方・機能 |
| --- | --- | --- |
| <a href="schedule_plan.html" target="_blank" rel="noopener noreferrer">スケジュール計画書 ↗</a><br><code>schedule_plan.html</code> | プロジェクトの目的・マイルストーン・ガントチャート・WBS・体制・リスクをまとめます。 | HTML内の内容を編集して、プロジェクト計画・役割分担・進捗報告の資料に使います。 |
| <a href="calenderschedule.html" target="_blank" rel="noopener noreferrer">カレンダースケジュール ↗</a><br><code>calenderschedule.html</code> | カレンダーに予定や工程を入力し、ガントチャートやマトリクスシーケンスで確認します。 | 予定の追加・編集、表示切り替え、ブラウザ内保存。 |

### デザインを参照・資料を作成する

| HTML | 用途 | 使い方・機能 |
| --- | --- | --- |
| <a href="color.html" target="_blank" rel="noopener noreferrer">カラーコードの説明 ↗</a><br><code>color.html</code> | tome.jpgの代表色を使い、HEX・RGBの読み方と色の組み合わせを学びます。 | 色見本、カラーコードのコピー、RGBスライダー。 |
| <a href="atomic_component.html" target="_blank" rel="noopener noreferrer">デザイン要素の説明資料 ↗</a><br><code>atomic_component.html</code> | 背景色・重なった四角のアイコン・文字・ボタン・余白・角丸を、見本とCSSで確認します。 | 共通デザインを再利用する時の参照資料。 |
| <a href="document_template.html" target="_blank" rel="noopener noreferrer">説明資料の雛形 ↗</a><br><code>document_template.html</code> | 左に目次、右に本文を置いた説明資料を作成します。 | HTML内の見出し・本文・表・手順・コード例を差し替えて利用します。 |

## 編集と保存

- **編集ツールのページ**：業務定義シート・業務シーケンス図・オブジェクト整理・カレンダーでは、画面内で内容を入力します。
- **資料のページ**：画面設計書・スケジュール計画書・説明資料の雛形は、HTML内の文章や表を書き換えて使います。
- **テストの記録**：画面単体テストケースは、画面内で実施結果とメモを入力できます。
- **ブラウザ内の保存**：データは端末間で自動共有されず、HTMLファイル自体にも書き戻されません。別のブラウザや保存場所では同じ記録を参照できない場合があります。
- **書き出し**：JSON機能があるページでは、データの受け渡しや控えに書き出しを使います。読み込み機能の有無は各ページのボタンを確認してください。

## 参照画像

`tome.jpg`は配色とパズルモチーフの参照画像です。`color.html`と`atomic_component.html`の画像表示に使うため、HTMLと同じフォルダーに置いてください。
