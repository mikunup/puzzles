#!/usr/bin/env node
// Embed bases/base.css into standalone HTML pages without external dependencies.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const START = "<!-- bases:styles:start -->";
const END = "<!-- bases:styles:end -->";
const BLOCK = new RegExp(escapeRegExp(START) + "[\\s\\S]*?" + escapeRegExp(END), "g");

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function htmlFiles(dir) {
  return readdirSync(dir).filter((name) => name.endsWith(".html")).map((name) => join(dir, name));
}

function sync(root = ROOT, check = false) {
  const css = readFileSync(join(root, "bases/base.css"), "utf8").trimEnd();
  if (css.toLowerCase().includes("</style")) {
    throw new Error("base.cssにHTMLの終了タグは記述できません。");
  }
  const block = `${START}\n<style>\n${css}\n</style>\n${END}`;
  const pages = [...htmlFiles(root), ...htmlFiles(join(root, "bases"))].sort();
  const updates = [];
  for (const page of pages) {
    const original = readFileSync(page, "utf8");
    if (original.split(START).length !== 2 || original.split(END).length !== 2 || (original.match(BLOCK) || []).length !== 1) {
      throw new Error(`${relative(root, page)}: 共通CSSの開始・終了マーカーを1組配置してください。`);
    }
    const updated = original.replace(BLOCK, () => block);
    if (original !== updated) {
      updates.push([page, updated]);
    }
  }
  // Validate every page before writing, so missing markers never cause partial updates.
  for (const [page, updated] of updates) {
    if (!check) {
      writeFileSync(page, updated, "utf8");
    }
    console.log(`${check ? "未反映" : "更新"}: ${relative(root, page)}`);
  }
  return updates.length;
}

function watch() {
  console.log("base.cssとHTMLを監視中。終了: Ctrl+C");
  let previousError = null;
  setInterval(() => {
    try {
      sync();
      previousError = null;
    } catch (error) {
      if (error.message !== previousError) {
        console.log(`エラー: ${error.message}`);
        previousError = error.message;
      }
    }
  }, 500);
  process.on("SIGINT", () => process.exit(0));
}

function main(args) {
  if (args.includes("-h") || args.includes("--help")) {
    console.log("使い方: node bases/sync_styles.mjs [--check | --watch]\n\nbase.cssを各HTML内の共通CSS領域へ反映します。\n\n  --check  書き換えずに未反映の有無を確認\n  --watch  変更を監視し、保存時に自動反映（Ctrl+Cで終了）");
    return 0;
  }
  const unknown = args.filter((arg) => arg !== "--check" && arg !== "--watch");
  if (unknown.length) {
    console.error(`エラー: 不明な引数です：${unknown.join(" ")}`);
    return 2;
  }
  if (args.includes("--check") && args.includes("--watch")) {
    console.error("エラー: --check と --watch は同時に指定できません。");
    return 2;
  }
  if (args.includes("--watch")) {
    watch();
    return undefined;
  }
  const check = args.includes("--check");
  let changed;
  try {
    changed = sync(ROOT, check);
  } catch (error) {
    console.error(`エラー: ${error.message}`);
    return 1;
  }
  if (!changed) {
    console.log("すべてのHTMLに反映済みです。");
  }
  return Number(check && changed > 0);
}

process.exitCode = main(process.argv.slice(2));
