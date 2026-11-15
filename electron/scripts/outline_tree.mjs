#!/usr/bin/env node
// electron/datas/outline.json の未完了タスクを、階層とidつきのテキストで出力する（/today 用。読むだけ）
// 使い方：node scripts/outline_tree.mjs [タブ名]
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'datas', 'outline.json');
const NOTE_MAX = 200;
const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

// 子があれば子孫がすべて完了、子がなければ自分が完了なら「やりきった」とみなす
const done = (n) => (n.children?.length ? n.children.every(done) : n.completed === true);

function today() {
  const d = new Date();
  const p = (v) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}（${WEEK[d.getDay()]}）`;
}

function printNodes(list, depth, lines) {
  for (const n of list) {
    if (done(n)) continue;
    const marks = (n.completed ? '[x] ' : '[ ] ') + (n.aiFocus ? '✦ ' : '');
    lines.push(`${'  '.repeat(depth)}- ${marks}${n.text || '（無題）'} 〔id:${n.id}〕`);
    const note = (n.note || '').replace(/\s+/g, ' ').trim();
    if (note) lines.push(`${'  '.repeat(depth + 1)}> ${note.length > NOTE_MAX ? note.slice(0, NOTE_MAX) + '…' : note}`);
    printNodes(n.children || [], depth + 1, lines);
  }
}

let state;
try {
  state = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
} catch (err) {
  console.error(`datas/outline.json を読み込めません：${err.message}`);
  process.exit(1);
}

const tabs = (state.tabs || []).filter((t) => !t.archive);
const wanted = process.argv.slice(2).join(' ').trim();
const targets = wanted ? tabs.filter((t) => t.name === wanted) : tabs;
if (!targets.length) {
  console.error(`タブ「${wanted}」が見つかりません。タブ：${tabs.map((t) => t.name).join('、') || 'なし'}`);
  process.exit(1);
}

const lines = [`今日：${today()}`, '凡例：[ ] 未完了 / [x] 完了だが未完了の子がある / ✦ 前回のAIフォーカス / 〔id:…〕 項目のid', ''];
for (const t of targets) {
  lines.push(`## タブ：${t.name || '無題'}`);
  const before = lines.length;
  printNodes(t.nodes || [], 0, lines);
  if (lines.length === before) lines.push('（未完了の項目はありません）');
  lines.push('');
}
process.stdout.write(lines.join('\n'));
