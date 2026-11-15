import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
if (args.some(arg => arg !== "--check")) {
  console.error("使い方: node build_model_markdown.mjs [--check]");
  process.exit(1);
}

function section(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) throw new Error(`HTMLの初期データ定義を確認してください: ${start} / ${end}`);
  return source.slice(startIndex, endIndex);
}

function cell(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\|/g, "&#124;").replace(/\r\n?|\n/g, "<br>");
}

function table(headers, rows) {
  return [headers, headers.map(() => "---"), ...rows].map(row => `| ${row.map(cell).join(" | ")} |`).join("\n");
}

function identified(items, label) {
  const result = new Map();
  for (const item of items) {
    if (!item.id || result.has(item.id)) throw new Error(`${label}: IDが空か重複しています: ${item.id}`);
    result.set(item.id, item);
  }
  return result;
}

function required(items, id, label) {
  const item = items.get(id);
  if (!item) throw new Error(`${label}: 参照先がありません: ${id}`);
  return item;
}

function flowMarkdown(html) {
  const source = section(html, "    const SAMPLE =", "    const EMPTY =");
  const flows = runInNewContext(`${source}\n[{id:"sample",data:SAMPLE()},{id:REQUESTED_INVOICE_TAB,data:REQUESTED_INVOICE_FLOW},{id:REQUESTED_INVOICE_INFORMATION_TAB,data:invoiceInformationFlow()}]`, {}, { timeout: 1000 });
  const output = [
    "# 業務フロー：請求書の発行",
    "`business_flow.html` の初期データから `node build_model_markdown.mjs` で生成。直接編集せず、HTMLを更新して再生成する。ブラウザ内だけの保存・編集内容は含まない。",
    "行は情報項目またはステータス、列は担当・外部の主体を表す。実線は作業の流れ・情報の受け渡し、点線は参照・帳票とのやりとり。矢印は接続元 → 接続先。配置は実行条件や権限を確定するものではない。",
  ];
  for (const [index, { id, data }] of flows.entries()) {
    const rows = identified(data.rows, "行");
    const roles = identified(data.roles, "担当");
    const objects = identified(data.objects, "作業・帳票");
    identified(data.edges, "接続");
    for (const object of data.objects) {
      if (object.placement) {
        required(rows, object.placement.row, object.id);
        required(roles, object.placement.col, object.id);
      }
    }
    const objectName = objectId => `${required(objects, objectId, "接続").label} [${objectId}]`;
    output.push(
      `## ${index + 1}. ${cell(data.title)}${index === 0 ? "（初期サンプル）" : index === 1 ? "（状態別の行）" : ""}`,
      `対象ID：\`${id}\`${index === 0 ? "（この文書での識別名。実際の初期タブIDは起動時に生成）" : ""}`,
      `行のタイトル：${cell(data.axisTitles?.rows || "情報項目／ステータス")} ／ 列のタイトル：${cell(data.axisTitles?.roles || "みるもの（担当・外部）")}`,
      "### 情報項目／ステータス（行）",
      table(["ID", "名前", "備考"], data.rows.map(row => [row.id, row.name, row.remark])),
      "### 担当・外部（列）",
      table(["ID", "名前"], data.roles.map(role => [role.id, role.name])),
      "### 作業・帳票",
      table(["ID", "名前", "種類", "補足", "行ID", "担当・外部ID", "配置状態"], data.objects.map(object => [object.id, object.label, object.type === "doc" ? "帳票・外部資料" : "作業", object.note, object.placement?.row, object.placement?.col, object.placement ? "配置済み" : "未配置"])),
      "### 接続",
      table(["ID", "接続元", "接続先", "意味", "描画経路"], data.edges.map(edge => [edge.id, objectName(edge.from), objectName(edge.to), edge.style === "dashed" ? "参照・帳票とのやりとり（点線）" : "作業の流れ・情報の受け渡し（実線）", edge.route])),
    );
  }
  return output.join("\n\n") + "\n";
}

function objectMarkdown(html) {
  let nextId = 0;
  const source = section(html, "    const item =", "    function normalizeProperty(");
  const kindsSource = section(html, "    const OBJECT_KINDS =", "    const TYPES =");
  const { model, kinds } = runInNewContext(`${kindsSource}\n${source}\n({model:sample(),kinds:OBJECT_KINDS})`, { uid: () => `sample-${String(++nextId).padStart(3, "0")}` }, { timeout: 1000 });
  for (const object of model.objects) {
    if (!Object.hasOwn(kinds, object.kind || "undecided")) throw new Error(`${object.id}: オブジェクトの種別が不正です`);
  }
  const objects = identified(model.objects, "オブジェクト");
  identified([...model.objects, ...model.objects.flatMap(object => [...object.props, ...object.methods]), ...model.collections, ...model.collections.flatMap(collection => [...collection.methods, ...collection.itemMethods])], "モデル要素");
  const properties = new Map(model.objects.flatMap(object => object.props.map(property => [property.id, { object, property }])));
  const output = [
    "# オブジェクトモデル",
    "`object_model.html` の初期データから `node build_model_markdown.mjs` で生成。直接編集せず、HTMLを更新して再生成する。ブラウザ内だけの保存・編集内容は含まない。",
    "IDは再生成による不要な差分を避けるため、この文書用に生成順で固定した識別名。ブラウザ上のIDとは異なり、初期データの構成変更で変わる場合がある。型はHTMLの保存形式の値で記載する。オブジェクトやコレクションを、そのままDBテーブルとはみなさない。",
    "## オブジェクト一覧",
    table(["ID", "名前", "種別", "識別子の定義", "説明"], model.objects.map(object => [object.id, object.name, kinds[object.kind || "undecided"], object.identifier || "未定義", object.desc])),
  ];
  for (const object of model.objects) {
    output.push(
      `### ${cell(object.name)} [${object.id}]`,
      table(["プロパティID", "名前", "型", "参照先", "Enum候補（保存値＝表示名）", "初期値"], object.props.map(property => [property.id, property.name, property.type, property.ref ? `${required(objects, property.ref, property.id).name} [${property.ref}]` : "", (property.enumValues || []).map(value => `${value.value}＝${value.label}`).join("、"), property.defaultValue])),
      "操作：\n\n" + table(["ID", "名前"], object.methods.map(method => [method.id, method.name])),
    );
  }
  output.push("## コレクション");
  for (const collection of model.collections) {
    output.push(
      `### ${cell(collection.name)} [${collection.id}]`,
      `説明：${cell(collection.desc) || "記載なし"}`,
      "元のオブジェクト：" + collection.sources.map(id => `${cell(required(objects, id, collection.id).name)} [${id}]`).join("、"),
      table(["表示順", "プロパティID", "オブジェクト", "項目名"], collection.columns.map((id, index) => {
        const { object, property } = required(properties, id, collection.id);
        if (!collection.sources.includes(object.id)) throw new Error(`${collection.id}: 表示項目が元のオブジェクトに含まれません: ${id}`);
        return [index + 1, id, object.name, property.name];
      })),
      "一覧の操作：\n\n" + table(["ID", "名前"], collection.methods.map(method => [method.id, method.name])),
      "1件の操作：\n\n" + table(["ID", "名前"], collection.itemMethods.map(method => [method.id, method.name])),
    );
  }
  return output.join("\n\n") + "\n";
}

try {
  const outputs = [
    ["business_flow.md", flowMarkdown(readFileSync(join(root, "business_flow.html"), "utf8"))],
    ["object_model.md", objectMarkdown(readFileSync(join(root, "object_model.html"), "utf8"))],
  ];
  for (const [name, expected] of outputs) {
    const path = join(root, name);
    const current = existsSync(path) ? readFileSync(path, "utf8") : null;
    if (current === expected) {
      console.log(`${name}: 最新です。`);
    } else if (args.includes("--check")) {
      console.error(`${name}: 更新が必要です。node build_model_markdown.mjs を実行してください。`);
      process.exitCode = 1;
    } else {
      writeFileSync(path, expected);
      console.log(`${name}: 生成しました。`);
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
