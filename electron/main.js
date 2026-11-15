'use strict';
const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENTRY = path.join(ROOT, 'outline.html');
const DATA_DIR = path.join(__dirname, 'datas');
const DATA_FILE = path.join(DATA_DIR, 'outline.json');
const MAX_BYTES = 50 * 1024 * 1024;
const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude';
const TODAY_TIMEOUT_MS = 180 * 1000;
const TODAY_MAX_OUTPUT = 1024 * 1024;
// /today に許可するツール：未完了タスクのツリー取得（node スクリプト）と読み取りだけ
const TODAY_TOOLS = 'Bash(node scripts/outline_tree.mjs:*),Read';

// outline.html の状態を electron/datas/outline.json に保存・読み込みする
ipcMain.on('outline:load', (e) => {
  try {
    e.returnValue = fs.existsSync(DATA_FILE) ? fs.readFileSync(DATA_FILE, 'utf-8') : null;
  } catch (err) {
    console.error('読み込みに失敗しました:', err);
    e.returnValue = null;
  }
});

ipcMain.handle('outline:save', (_e, json) => {
  if (typeof json !== 'string' || Buffer.byteLength(json) > MAX_BYTES) return '保存データが不正です。';
  try {
    const text = JSON.stringify(JSON.parse(json), null, 2) + '\n';
    fs.mkdirSync(DATA_DIR, { recursive: true });
    // 書き込み途中で終了してもファイルが壊れないよう、一時ファイルに書いてから置き換える
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, text, 'utf-8');
    fs.renameSync(tmp, DATA_FILE);
    return true;
  } catch (err) {
    console.error('保存に失敗しました:', err);
    return String(err.message || err);
  }
});

// 「今日のタスク」：electron/ を作業フォルダに claude -p "/today …" を実行する（同時に1つまで）
let todayChild = null;

function stopToday() {
  if (todayChild) { todayChild.kill(); todayChild = null; }
}

ipcMain.handle('today:run', (_e, args) => {
  if (todayChild) return { ok: false, error: 'すでに実行中です。' };
  // 引数は制御文字を除き、100文字までにする。shell を通さずに起動する
  const text = String(args ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 100);
  return new Promise((resolve) => {
    let out = '', err = '', settled = false;
    const finish = (result) => { if (!settled) { settled = true; clearTimeout(timer); todayChild = null; resolve(result); } };
    const child = spawn(CLAUDE_BIN, ['-p', ('/today ' + text).trim(), '--allowedTools', TODAY_TOOLS], {
      cwd: __dirname, shell: false, stdio: ['ignore', 'pipe', 'pipe'],
    });
    todayChild = child;
    child.stdout.setEncoding('utf-8');
    child.stderr.setEncoding('utf-8');
    const timer = setTimeout(() => { child.kill(); finish({ ok: false, error: '180秒を超えたため中止しました。' }); }, TODAY_TIMEOUT_MS);
    child.stdout.on('data', (d) => { if (out.length < TODAY_MAX_OUTPUT) out += d; });
    child.stderr.on('data', (d) => { if (err.length < TODAY_MAX_OUTPUT) err += d; });
    child.on('error', (e) => finish({
      ok: false,
      error: e.code === 'ENOENT'
        ? `claude が見つかりません（${CLAUDE_BIN}）。環境変数 CLAUDE_BIN に claude のパスを指定して起動してください。`
        : String(e.message || e),
    }));
    child.on('close', (code, signal) => {
      if (signal) finish({ ok: false, canceled: true, error: '中止しました。' });
      else if (code === 0) finish({ ok: true, text: out });
      else finish({ ok: false, error: (err || out).trim() || `claude が終了コード ${code} で終了しました。` });
    });
  });
});

ipcMain.handle('today:cancel', () => { const running = !!todayChild; stopToday(); return running; });

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    title: 'アウトライン｜puzzles',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(ENTRY);

  // リポジトリ内の HTML（README.html など）はアプリ内で遷移、外部リンクは既定ブラウザで開く
  const isLocal = (url) => url.startsWith('file://') && decodeURI(new URL(url).pathname).startsWith(ROOT);
  win.webContents.on('will-navigate', (e, url) => {
    if (!isLocal(url)) { e.preventDefault(); shell.openExternal(url); }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!isLocal(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

// outline.html は Ctrl+R を「やり直す」に使うため、既定メニューのリロード（Ctrl/Cmd+R）を外す
function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    {
      label: '表示',
      submenu: [
        { label: 'アウトラインへ戻る', accelerator: 'CmdOrCtrl+Shift+H', click: (_, w) => w && w.loadFile(ENTRY) },
        { label: '再読み込み', accelerator: 'F5', role: 'reload' },
        { role: 'toggleDevTools', accelerator: isMac ? 'Alt+Cmd+I' : 'Ctrl+Shift+I' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', stopToday);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
