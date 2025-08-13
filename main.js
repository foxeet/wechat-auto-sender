// main.js
const { app, BrowserWindow, ipcMain, clipboard, nativeImage, shell } = require('electron');
const robot = require('robotjs');
const { windowManager } = require('node-window-manager');
const macPermissions = process.platform === 'darwin' ? require('node-mac-permissions') : null;

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

// ------------------- macOS 权限检查（仅在点击执行时使用）-------------------
// 权限状态缓存，避免重复检查
let permissionCache = {
  robot: null,
  windowManager: null,
  lastCheck: 0
};

// 缓存有效期：5分钟
const CACHE_DURATION = 5 * 60 * 1000;

// 检查权限状态是否过期
function isPermissionCacheValid() {
  return permissionCache.lastCheck > 0 && 
         (Date.now() - permissionCache.lastCheck) < CACHE_DURATION;
}

// 清除权限缓存，强制重新检查
function clearPermissionCache() {
  permissionCache = {
    robot: null,
    windowManager: null,
    lastCheck: 0
  };
}

function checkRobotPermissions() {
  try {
    // 尝试获取鼠标位置，这会触发辅助功能权限检测
    robot.getMousePos();
    return true;
  } catch (e) {
    return false;
  }
}

async function checkWindowManagerPermissions() {
  try {
    // 尝试获取活动窗口，这会触发屏幕录制权限检测
    const activeWin = windowManager.getActiveWindow();
    return activeWin !== null;
  } catch (e) {
    return false;
  }
}

async function checkAllPermissions() {
  // 如果缓存有效，直接返回缓存结果
  if (isPermissionCacheValid()) {
    return {
      robot: permissionCache.robot,
      windowManager: permissionCache.windowManager,
      allGranted: permissionCache.robot && permissionCache.windowManager
    };
  }

  let robotOk, windowOk;

  if (process.platform === 'darwin' && macPermissions) {
    // macOS: 使用系统API检查权限状态
    try {
      const acc = macPermissions.getAuthStatus('accessibility');
      const scr = macPermissions.getAuthStatus('screen');
      
      robotOk = acc === 'authorized';
      windowOk = scr === 'authorized';
    } catch (e) {
      // 如果系统API失败，回退到实际测试
      robotOk = checkRobotPermissions();
      windowOk = await checkWindowManagerPermissions();
    }
  } else {
    // 非macOS: 直接测试权限
    robotOk = checkRobotPermissions();
    windowOk = await checkWindowManagerPermissions();
  }

  // 更新缓存
  permissionCache = {
    robot: robotOk,
    windowManager: windowOk,
    lastCheck: Date.now()
  };

  return {
    robot: robotOk,
    windowManager: windowOk,
    allGranted: robotOk && windowOk
  };
}

function openSystemPreferences() {
  if (process.platform !== 'darwin') return;
  
  // 打开辅助功能设置
  shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
  
  // 延迟打开屏幕录制设置
  setTimeout(() => {
    shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
  }, 800);
}

// 尝试触发系统权限弹窗（仅 macOS）
async function promptSystemPermissionsIfNeeded() {
  if (process.platform !== 'darwin') return;
  
  try {
    if (macPermissions) {
      let permissionsChanged = false;
      
      // 触发辅助功能权限弹窗
      const acc = macPermissions.getAuthStatus('accessibility');
      if (acc !== 'authorized') {
        const willPrompt = macPermissions.askForAccessibilityAccess();
        if (!willPrompt) {
          openSystemPreferences();
        }
        permissionsChanged = true;
      }
      
      // 触发屏幕录制权限弹窗
      const scr = macPermissions.getAuthStatus('screen');
      if (scr !== 'authorized') {
        const willOpen = macPermissions.askForScreenCaptureAccess();
        if (!willOpen) {
          setTimeout(() => openSystemPreferences(), 600);
        }
        permissionsChanged = true;
      }
      
      // 如果权限状态可能发生变化，清除缓存
      if (permissionsChanged) {
        clearPermissionCache();
      }
    }
  } catch (e) {
    console.error('尝试触发系统权限弹窗失败:', e.message);
  }
}

// Mac 微信发送消息兼容实现
async function sendMacMessage() {
  try {
    // 第一步：按回车发送（兼容 Enter 键发送）
    robot.keyTap('enter');
    await delay(100);
    
    // 第二步：按 Cmd+Enter 发送（兼容 Cmd+Enter 键发送）
    robot.keyTap('enter', 'command');
    await delay(50);
    
    // 第三步：确保 Command 键状态正确
    robot.keyToggle('command', 'up');
    await delay(50);
    
    // 第四步：清理可能的残留输入
    robot.keyTap('backspace');
    
    return true;
  } catch (error) {
    console.error('Mac 微信发送失败:', error);
    return false;
  }
}

async function sendToWeChat(item) {
  try {
    // 1. 等待微信成为活动窗口
    await waitForWeChatActive();

    // 2. 写入剪贴板
    if (item.type === 'text') {
      clipboard.writeText(item.content);
    } else if (item.type === 'image') {
      const buf = dataURLToPNGBuffer(item.content);
      const img = nativeImage.createFromBuffer(buf);
      clipboard.writeImage(img);
    }
    await delay(200);

    // 3. 模拟粘贴
    if (process.platform === 'darwin') {
      robot.keyTap('v', 'command');
    } else {
      robot.keyTap('v', 'control');
    }
    await delay(200);

    // 4. 智能发送消息
    if (process.platform === 'darwin') {
      await sendMacMessage();
    } else {
      robot.keyTap('s', 'alt');
    }
    
    await delay(300);
    return true;
  } catch (error) {
    console.error('发送到微信失败:', error);
    throw error;
  }
}

ipcMain.handle('send-item', async (event, item) => {
  try {
    await sendToWeChat(item);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// 权限相关 IPC
ipcMain.handle('check-permissions', async () => {
  try {
    return await checkAllPermissions();
  } catch (e) {
    return { robot: false, windowManager: false, allGranted: false };
  }
});

ipcMain.handle('open-system-preferences', () => {
  openSystemPreferences();
  return true;
});

ipcMain.handle('prompt-permissions', async () => {
  await promptSystemPermissionsIfNeeded();
  return true;
});

// 新增：强制刷新权限状态
ipcMain.handle('refresh-permissions', async () => {
  clearPermissionCache();
  return await checkAllPermissions();
});

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 800,
    autoHideMenuBar: true,
    menuBarVisible: false,
    icon: process.platform === 'darwin' ? 'assets/app_icon.icns' : 'assets/app_icon.ico',
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
