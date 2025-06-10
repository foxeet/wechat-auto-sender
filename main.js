// main.js
const { app, BrowserWindow, ipcMain, clipboard, nativeImage } = require('electron');
const robot = require('robotjs');
const { windowManager } = require('node-window-manager');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function dataURLToPNGBuffer(dataURL) {
  const parts = dataURL.split(',');
  return Buffer.from(parts[1], 'base64');
}

async function waitForWeChatActive() {
  while (true) {
    const activeWin = windowManager.getActiveWindow();
    if (activeWin && activeWin.getTitle().includes('微信')) return;
    await delay(500);
  }
}

async function sendToWeChat(item) {
  // 1. 等待微信成为活动窗口
  await waitForWeChatActive();

  // 2. 写入剪贴板
  if (item.type === 'text') {
    clipboard.writeText(item.value);
  } else if (item.type === 'image') {
    const buf = dataURLToPNGBuffer(item.value);
    const img = nativeImage.createFromBuffer(buf);
    clipboard.writeImage(img);
  }
  await delay(200);

  // 3. 模拟粘贴（⌘+V 或 Ctrl+V）
  if (process.platform === 'darwin') {
    robot.keyTap('v', 'command');
  } else {
    robot.keyTap('v', 'control');
  }
  await delay(200);

  // 4. 模拟 Alt+S 发送消息（通用快捷键）
  robot.keyTap('s', 'alt');
  await delay(300);
}

ipcMain.handle('send-item', async (event, item) => {
  try {
    await sendToWeChat(item);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 800,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
