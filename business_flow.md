# 業務フロー：請求書の発行

`business_flow.html` の初期データから `node build_model_markdown.mjs` で生成。直接編集せず、HTMLを更新して再生成する。ブラウザ内だけの保存・編集内容は含まない。

行は情報項目またはステータス、列は担当・外部の主体を表す。実線は作業の流れ・情報の受け渡し、点線は参照・帳票とのやりとり。矢印は接続元 → 接続先。配置は実行条件や権限を確定するものではない。

## 1. 請求書の発行（初期サンプル）

対象ID：`sample`（この文書での識別名。実際の初期タブIDは起動時に生成）

行のタイトル：情報項目／ステータス ／ 列のタイトル：みるもの（担当・外部）

### 情報項目／ステータス（行）

| ID | 名前 | 備考 |
| --- | --- | --- |
| r1 | 受注データ |  |
| r2 | 請求データ |  |
| r3 | 仕訳データ（売上） |  |
| r4 | 仕訳データ（銀行明細） |  |
| r5 | 未入金一覧 |  |
| r6 | 〃 |  |

### 担当・外部（列）

| ID | 名前 |
| --- | --- |
| c1 | 営業 |
| c2 | 営業アシ |
| c3 | 経理 |
| c4 |  |

### 作業・帳票

| ID | 名前 | 種類 | 補足 | 行ID | 担当・外部ID | 配置状態 |
| --- | --- | --- | --- | --- | --- | --- |
| n1 | 作成 | 作業 |  | r1 | c1 | 配置済み |
| n2 | 登録 | 作業 |  | r1 | c2 | 配置済み |
| n3 | 閲覧 | 作業 |  | r1 | c3 | 配置済み |
| n4 | 確認 | 作業 |  | r2 | c1 | 配置済み |
| n5 | 作成 | 作業 |  | r2 | c2 | 配置済み |
| n6 | 確定 | 作業 |  | r2 | c3 | 配置済み |
| n7 | 請求書 | 帳票・外部資料 |  | r2 | c4 | 配置済み |
| n8 | 登録 | 作業 |  | r3 | c3 | 配置済み |
| n9 | 登録 | 作業 |  | r4 | c3 | 配置済み |
| n10 | 銀行明細 | 帳票・外部資料 |  | r4 | c4 | 配置済み |
| n11 | 確認 | 作業 | クライアントに連絡して状況を確認する | r5 | c1 | 配置済み |
| n12 | 振分 | 作業 | 営業担当者別に振り分け作業を行う | r5 | c2 | 配置済み |
| n13 | 作成 | 作業 |  | r5 | c3 | 配置済み |
| n14 | 補助元帳 | 帳票・外部資料 |  | r5 | c4 | 配置済み |
| n15 | 更新 | 作業 |  | r6 | c1 | 配置済み |
| n16 | 閲覧 | 作業 |  | r6 | c3 | 配置済み |

### 接続

| ID | 接続元 | 接続先 | 意味 | 描画経路 |
| --- | --- | --- | --- | --- |
| e1 | 作成 [n1] | 登録 [n2] | 作業の流れ・情報の受け渡し（実線） | auto |
| e2 | 登録 [n2] | 閲覧 [n3] | 参照・帳票とのやりとり（点線） | auto |
| e3 | 登録 [n2] | 作成 [n5] | 参照・帳票とのやりとり（点線） | auto |
| e4 | 作成 [n5] | 確認 [n4] | 作業の流れ・情報の受け渡し（実線） | auto |
| e5 | 確認 [n4] | 確定 [n6] | 作業の流れ・情報の受け渡し（実線） | below |
| e6 | 確定 [n6] | 請求書 [n7] | 参照・帳票とのやりとり（点線） | auto |
| e7 | 請求書 [n7] | 登録 [n8] | 参照・帳票とのやりとり（点線） | auto |
| e8 | 銀行明細 [n10] | 登録 [n9] | 参照・帳票とのやりとり（点線） | auto |
| e9 | 補助元帳 [n14] | 作成 [n13] | 参照・帳票とのやりとり（点線） | auto |
| e10 | 作成 [n13] | 振分 [n12] | 作業の流れ・情報の受け渡し（実線） | auto |
| e11 | 振分 [n12] | 確認 [n11] | 作業の流れ・情報の受け渡し（実線） | auto |
| e12 | 確認 [n11] | 更新 [n15] | 作業の流れ・情報の受け渡し（実線） | auto |
| e13 | 更新 [n15] | 閲覧 [n16] | 参照・帳票とのやりとり（点線） | auto |

## 2. 請求書の発行（状態別の行）

対象ID：`invoice-issue-requested-v1`

行のタイトル：情報項目／ステータス ／ 列のタイトル：担当・送付先

### 情報項目／ステータス（行）

| ID | 名前 | 備考 |
| --- | --- | --- |
| invoice-row-order | 受注データ | 営業アシが請求データを作成する際の入力情報。 |
| invoice-row-draft | 請求データ（作成済み） | 営業アシが受注データをもとに請求データを作成する。 |
| invoice-row-checked | 請求データ（確認済み） | 営業が請求データを確認する。 |
| invoice-row-request | 請求書作成依頼 | 営業が経理へ請求書作成を依頼する。 |
| invoice-row-final | 請求データ（確定済み） | 経理が請求データを確定する。 |
| invoice-row-issued | 請求書（作成済み） | 経理が確定した請求データから請求書を作成する。 |
| invoice-row-approved | 請求書（確認済み） | 営業が経理の作成した請求書を確認する。 |
| invoice-row-sent | 請求書（送付済み） | 営業がお客様に請求書を送付する。 |

### 担当・外部（列）

| ID | 名前 |
| --- | --- |
| invoice-role-assistant | 営業アシ |
| invoice-role-sales | 営業 |
| invoice-role-accounting | 経理 |
| invoice-role-customer | お客様 |

### 作業・帳票

| ID | 名前 | 種類 | 補足 | 行ID | 担当・外部ID | 配置状態 |
| --- | --- | --- | --- | --- | --- | --- |
| invoice-object-order | 受注データ | 帳票・外部資料 | 請求データ作成のもとになる情報。 | invoice-row-order | invoice-role-assistant | 配置済み |
| invoice-object-draft | 請求データ作成 | 作業 | 受注データをもとに作成する。 | invoice-row-draft | invoice-role-assistant | 配置済み |
| invoice-object-check-data | 請求データ確認 | 作業 | 営業が内容を確認する。 | invoice-row-checked | invoice-role-sales | 配置済み |
| invoice-object-request | 請求書作成依頼 | 作業 | 経理へ作成を依頼する。 | invoice-row-request | invoice-role-sales | 配置済み |
| invoice-object-finalize | 請求データ確定 | 作業 | 確認済みの請求データを確定する。 | invoice-row-final | invoice-role-accounting | 配置済み |
| invoice-object-issue | 請求書作成 | 作業 | 確定した請求データから作成する。 | invoice-row-issued | invoice-role-accounting | 配置済み |
| invoice-object-invoice | 請求書 | 帳票・外部資料 | 経理が作成した確認前の請求書。 | invoice-row-issued | invoice-role-accounting | 配置済み |
| invoice-object-check-invoice | 請求書確認 | 作業 | 経理が作成した請求書を確認する。 | invoice-row-approved | invoice-role-sales | 配置済み |
| invoice-object-send | 請求書送付 | 作業 | 確認した請求書をお客様へ送付する。 | invoice-row-sent | invoice-role-sales | 配置済み |
| invoice-object-customer-invoice | 請求書（お客様宛） | 帳票・外部資料 | 営業からお客様へ送付した請求書。 | invoice-row-sent | invoice-role-customer | 配置済み |

### 接続

| ID | 接続元 | 接続先 | 意味 | 描画経路 |
| --- | --- | --- | --- | --- |
| invoice-edge-1 | 受注データ [invoice-object-order] | 請求データ作成 [invoice-object-draft] | 参照・帳票とのやりとり（点線） | auto |
| invoice-edge-2 | 請求データ作成 [invoice-object-draft] | 請求データ確認 [invoice-object-check-data] | 作業の流れ・情報の受け渡し（実線） | auto |
| invoice-edge-3 | 請求データ確認 [invoice-object-check-data] | 請求書作成依頼 [invoice-object-request] | 作業の流れ・情報の受け渡し（実線） | auto |
| invoice-edge-4 | 請求書作成依頼 [invoice-object-request] | 請求データ確定 [invoice-object-finalize] | 作業の流れ・情報の受け渡し（実線） | auto |
| invoice-edge-5 | 請求データ確定 [invoice-object-finalize] | 請求書作成 [invoice-object-issue] | 作業の流れ・情報の受け渡し（実線） | auto |
| invoice-edge-6 | 請求書作成 [invoice-object-issue] | 請求書 [invoice-object-invoice] | 作業の流れ・情報の受け渡し（実線） | auto |
| invoice-edge-7 | 請求書 [invoice-object-invoice] | 請求書確認 [invoice-object-check-invoice] | 参照・帳票とのやりとり（点線） | auto |
| invoice-edge-8 | 請求書確認 [invoice-object-check-invoice] | 請求書送付 [invoice-object-send] | 作業の流れ・情報の受け渡し（実線） | auto |
| invoice-edge-9 | 請求書送付 [invoice-object-send] | 請求書（お客様宛） [invoice-object-customer-invoice] | 作業の流れ・情報の受け渡し（実線） | auto |

## 3. 請求書の発行（情報単位）

対象ID：`invoice-issue-information-v1`

行のタイトル：情報項目 ／ 列のタイトル：担当・送付先

### 情報項目／ステータス（行）

| ID | 名前 | 備考 |
| --- | --- | --- |
| invoice-row-order | 受注データ | 営業アシが請求データを作成する際の入力情報。 |
| invoice-row-data | 請求データ | 営業アシが作成し、営業が確認して経理へ請求書作成を依頼する。経理がこの請求データを確定する。 |
| invoice-row-document | 請求書 | 経理が作成し、営業が確認してお客様へ送付する。確認・送付の状態は作業と矢印で表す。 |

### 担当・外部（列）

| ID | 名前 |
| --- | --- |
| invoice-role-assistant | 営業アシ |
| invoice-role-sales | 営業 |
| invoice-role-accounting | 経理 |
| invoice-role-customer | お客様 |

### 作業・帳票

| ID | 名前 | 種類 | 補足 | 行ID | 担当・外部ID | 配置状態 |
| --- | --- | --- | --- | --- | --- | --- |
| invoice-object-order | 受注データ | 帳票・外部資料 | 請求データ作成のもとになる情報。 | invoice-row-order | invoice-role-assistant | 配置済み |
| invoice-object-draft | 請求データ作成 | 作業 | 受注データをもとに作成する。 | invoice-row-data | invoice-role-assistant | 配置済み |
| invoice-object-check-data | 請求データ確認 | 作業 | 営業が内容を確認する。 | invoice-row-data | invoice-role-sales | 配置済み |
| invoice-object-request | 請求書作成依頼 | 作業 | 経理へ作成を依頼する。 | invoice-row-data | invoice-role-sales | 配置済み |
| invoice-object-finalize | 請求データ確定 | 作業 | 確認済みの請求データを確定する。 | invoice-row-data | invoice-role-accounting | 配置済み |
| invoice-object-issue | 請求書作成 | 作業 | 確定した請求データから作成する。 | invoice-row-document | invoice-role-accounting | 配置済み |
| invoice-object-invoice | 請求書 | 帳票・外部資料 | 経理が作成した確認前の請求書。 | invoice-row-document | invoice-role-accounting | 配置済み |
| invoice-object-check-invoice | 請求書確認 | 作業 | 経理が作成した請求書を確認する。 | invoice-row-document | invoice-role-sales | 配置済み |
| invoice-object-send | 請求書送付 | 作業 | 確認した請求書をお客様へ送付する。 | invoice-row-document | invoice-role-sales | 配置済み |
| invoice-object-customer-invoice | 請求書（お客様宛） | 帳票・外部資料 | 営業からお客様へ送付した請求書。 | invoice-row-document | invoice-role-customer | 配置済み |

### 接続

| ID | 接続元 | 接続先 | 意味 | 描画経路 |
| --- | --- | --- | --- | --- |
| invoice-edge-1 | 受注データ [invoice-object-order] | 請求データ作成 [invoice-object-draft] | 参照・帳票とのやりとり（点線） | auto |
| invoice-edge-2 | 請求データ作成 [invoice-object-draft] | 請求データ確認 [invoice-object-check-data] | 作業の流れ・情報の受け渡し（実線） | auto |
| invoice-edge-3 | 請求データ確認 [invoice-object-check-data] | 請求書作成依頼 [invoice-object-request] | 作業の流れ・情報の受け渡し（実線） | auto |
| invoice-edge-4 | 請求書作成依頼 [invoice-object-request] | 請求データ確定 [invoice-object-finalize] | 作業の流れ・情報の受け渡し（実線） | auto |
| invoice-edge-5 | 請求データ確定 [invoice-object-finalize] | 請求書作成 [invoice-object-issue] | 作業の流れ・情報の受け渡し（実線） | auto |
| invoice-edge-6 | 請求書作成 [invoice-object-issue] | 請求書 [invoice-object-invoice] | 作業の流れ・情報の受け渡し（実線） | auto |
| invoice-edge-7 | 請求書 [invoice-object-invoice] | 請求書確認 [invoice-object-check-invoice] | 参照・帳票とのやりとり（点線） | auto |
| invoice-edge-8 | 請求書確認 [invoice-object-check-invoice] | 請求書送付 [invoice-object-send] | 作業の流れ・情報の受け渡し（実線） | auto |
| invoice-edge-9 | 請求書送付 [invoice-object-send] | 請求書（お客様宛） [invoice-object-customer-invoice] | 作業の流れ・情報の受け渡し（実線） | auto |
