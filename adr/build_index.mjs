#!/usr/bin/env node
// Rebuild the ADR list in adr/README.md and adr/index.html from adr/adr-NNNN-*.md.

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ADR_DIR = dirname(fileURLToPath(import.meta.url));
const START = "<!-- adr:index:start -->";
const END = "<!-- adr:index:end -->";
const BLOCK = new RegExp(escapeRegExp(START) + "[\\s\\S]*?" + escapeRegExp(END), "g");
const FILE_NAME = /^adr-(\d{4})-[a-z0-9-]+\.md$/;
const TITLE = /^# ADR-(\d{4})：(.+)$/m;
const STATUSES = {
  "提案中": "proposed",
  "承認": "accepted",
  "却下": "rejected",
  "廃止": "deprecated",
  "置換": "superseded",
};

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[char]);
}

function metadata(text, label) {
  const match = text.match(new RegExp(`^\\|\\s*${label}\\s*\\|\\s*(.*?)\\s*\\|\\s*$`, "m"));
  return match ? match[1] : "";
}

// Drop Markdown links but keep their text, for search and README cells.
function plain(text) {
  return text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim();
}

function inlineHtml(text) {
  return escapeHtml(plain(text)).replace(/`([^`]+)`/g, "<code>$1</code>");
}

function readRecords(adrDir = ADR_DIR) {
  const records = [];
  const numbers = new Map();
  const files = readdirSync(adrDir).filter((name) => name.startsWith("adr-") && name.endsWith(".md")).sort();
  for (const name of files) {
    const fileMatch = name.match(FILE_NAME);
    if (!fileMatch) {
      throw new Error(`${name}: ファイル名は adr-0000-英小文字とハイフン.md の形にしてください。`);
    }
    const number = fileMatch[1];
    if (numbers.has(number)) {
      throw new Error(`${name}: ADR-${number} は ${numbers.get(number)} と番号が重複しています。`);
    }
    numbers.set(number, name);
    const htmlName = name.replace(/\.md$/, ".html");
    if (!existsSync(join(adrDir, htmlName))) {
      throw new Error(`${name}: 対になる ${htmlName} がありません。`);
    }
    const text = readFileSync(join(adrDir, name), "utf8");
    const title = text.match(TITLE);
    if (!title || title[1] !== number) {
      throw new Error(`${name}: 1行目の見出しを「# ADR-${number}：タイトル」にしてください。`);
    }
    const status = plain(metadata(text, "ステータス"));
    if (!(status in STATUSES)) {
      throw new Error(`${name}: ステータスは ${Object.keys(STATUSES).join("・")} のいずれかにしてください（現在：${status || "未記入"}）。`);
    }
    const lead = text.match(/^> (?!\*\*)(.+)$/m);
    records.push({
      number,
      title: title[2].trim(),
      status,
      date: plain(metadata(text, "決定日")),
      scope: metadata(text, "対象範囲"),
      summary: lead ? lead[1].trim() : "",
      md: name,
      html: htmlName,
    });
  }
  return records;
}

function markdownBlock(records) {
  if (!records.length) {
    return `${START}\nまだADRはありません。\n${END}`;
  }
  const counts = Object.keys(STATUSES)
    .map((status) => `${status} ${records.filter((r) => r.status === status).length}`)
    .join("　");
  const lines = [
    START,
    `全 ${records.length} 件　（${counts}）`,
    "",
    "| 番号 | タイトル | ステータス | 決定日 | 対象範囲 | HTML |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  for (const r of records) {
    const cells = [
      `ADR-${r.number}`,
      `[${r.title}](${r.md})`,
      r.status,
      r.date,
      plain(r.scope),
      `[開く](${r.html})`,
    ];
    lines.push("| " + cells.map((cell) => cell.replaceAll("|", "\\|")).join(" | ") + " |");
  }
  lines.push(END);
  return lines.join("\n");
}

function htmlBlock(records) {
  const rows = [START];
  for (const r of records) {
    const search = [`adr-${r.number}`, r.title, r.status, r.date, plain(r.scope), plain(r.summary)].join(" ");
    rows.push(
      `            <tr data-number="${r.number}" data-status="${STATUSES[r.status]}" data-search="${escapeHtml(search.toLowerCase())}">` +
      `<th scope="row"><a href="${escapeHtml(r.html)}">ADR-${r.number}</a></th>` +
      `<td><a class="adr-title" href="${escapeHtml(r.html)}">${inlineHtml(r.title)}</a>` +
      `<small>${inlineHtml(r.summary)}</small></td>` +
      `<td><span class="status status-${STATUSES[r.status]}">${escapeHtml(r.status)}</span></td>` +
      `<td>${escapeHtml(r.date)}</td>` +
      `<td>${inlineHtml(r.scope)}</td>` +
      `<td><a href="${escapeHtml(r.md)}">MD</a></td></tr>`
    );
  }
  rows.push(`            ${END}`);
  return rows.join("\n");
}

function build(adrDir = ADR_DIR, check = false) {
  const records = readRecords(adrDir);
  const targets = { "README.md": markdownBlock(records), "index.html": htmlBlock(records) };
  const updates = [];
  for (const [name, block] of Object.entries(targets)) {
    const page = join(adrDir, name);
    const original = readFileSync(page, "utf8");
    if (original.split(START).length !== 2 || original.split(END).length !== 2 || (original.match(BLOCK) || []).length !== 1) {
      throw new Error(`${name}: 一覧の開始・終了マーカーを1組配置してください。`);
    }
    const updated = original.replace(BLOCK, () => block);
    if (original !== updated) {
      updates.push([page, name, updated]);
    }
  }
  // Validate every page before writing, so a broken page never leaves the two lists out of sync.
  for (const [page, name, updated] of updates) {
    if (!check) {
      writeFileSync(page, updated, "utf8");
    }
    console.log(`${check ? "未反映" : "更新"}: adr/${name}`);
  }
  const last = Math.max(0, ...records.map((r) => Number(r.number)));
  console.log(`ADR ${records.length} 件。次の番号：ADR-${String(last + 1).padStart(4, "0")}`);
  return updates.length;
}

function main(args) {
  if (args.includes("-h") || args.includes("--help")) {
    console.log("使い方: node adr/build_index.mjs [--check]\n\nadr/ 配下のADRから、README.md と index.html の一覧を作り直します。\n\n  --check  書き換えずに未反映の有無を確認");
    return 0;
  }
  const unknown = args.filter((arg) => arg !== "--check");
  if (unknown.length) {
    console.error(`エラー: 不明な引数です：${unknown.join(" ")}`);
    return 2;
  }
  const check = args.includes("--check");
  let changed;
  try {
    changed = build(ADR_DIR, check);
  } catch (error) {
    console.error(`エラー: ${error.message}`);
    return 1;
  }
  if (!changed) {
    console.log("一覧は最新です。");
  }
  return Number(check && changed > 0);
}

process.exitCode = main(process.argv.slice(2));
