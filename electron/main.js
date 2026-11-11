'use strict';
const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENTRY = path.join(ROOT, 'outline.html');
const DATA_DIR = path.join(__dirname, 'datas');
const DATA_FILE = path.join(DATA_DIR, 'outline.json');
const MAX_BYTES = 50 * 1024 * 1024;

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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
