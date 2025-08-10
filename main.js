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
  console.log('🔍 调试 - sendToWeChat 被调用，参数:', item);
  console.log('🔍 调试 - 内容类型:', item.type);
  console.log('🔍 调试 - 内容内容:', item.content);
  console.log('🔍 调试 - 内容长度:', item.content ? item.content.length : 'undefined');
  
  // 1. 等待微信成为活动窗口
  await waitForWeChatActive();

  // 2. 写入剪贴板
  if (item.type === 'text') {
    console.log('🔍 调试 - 准备写入文字到剪贴板:', item.content);
    clipboard.writeText(item.content);
    console.log('🔍 调试 - 文字已写入剪贴板');
  } else if (item.type === 'image') {
    console.log('🔍 调试 - 准备写入图片到剪贴板');
    const buf = dataURLToPNGBuffer(item.content);
    const img = nativeImage.createFromBuffer(buf);
    clipboard.writeImage(img);
    console.log('🔍 调试 - 图片已写入剪贴板');
  }
  await delay(200);

  // 3. 模拟粘贴（⌘+V 或 Ctrl+V）
  console.log('🔍 调试 - 准备模拟粘贴操作');
  if (process.platform === 'darwin') {
    robot.keyTap('v', 'command');
  } else {
    robot.keyTap('v', 'control');
  }
  console.log('🔍 调试 - 粘贴操作完成');
  await delay(200);

  // 4. 模拟 Alt+S 发送消息（通用快捷键）
  console.log('🔍 调试 - 准备模拟发送操作');
  robot.keyTap('s', 'alt');
  console.log('🔍 调试 - 发送操作完成');
  await delay(300);
}

ipcMain.handle('send-item', async (event, item) => {
  console.log('🔍 调试 - IPC send-item 被调用，参数:', item);
  try {
    const result = await sendToWeChat(item);
    console.log('🔍 调试 - sendToWeChat 执行成功，返回:', result);
    return { success: true };
  } catch (e) {
    console.log('🔍 调试 - sendToWeChat 执行失败，错误:', e);
    return { success: false, error: e.message };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 800,
    autoHideMenuBar: true,
    menuBarVisible: false,
    webPreferences: { 
      nodeIntegration: true, 
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false
    }
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
