'use strict';
// outline.html から electron/datas/ の JSON ファイルを読み書きするための橋渡し
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('puzzlesFile', {
  label: 'datas/outline.json',
  // 起動時に同期で読み込む（ファイルがなければ null）
  load: () => ipcRenderer.sendSync('outline:load'),
  // 変更のたびに保存する（成功で true、失敗でエラーメッセージを返す Promise）
  save: (json) => ipcRenderer.invoke('outline:save', json),
});
