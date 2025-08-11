# shiflow wechat-auto-sender // 识流微信运营助手lite
依赖node.js, npm 构建Mac、Windows版本的电脑版软件，帮助运营提前配置文案、图片，实现一键点击并发送对应配置好的文案、图片。提高运营效率。

<img width="1800" height="1600" alt="image" src="https://github.com/user-attachments/assets/7aafd94e-97a9-4beb-a9e7-ce79162214db" />

# 识流运营助手 Lite

一个基于 Electron 的微信自动发送工具，帮助运营人员提高工作效率。

## 🚀 功能特性

- **微信自动化操作**：支持自动发送消息、自动回复等操作
- **跨平台支持**：支持 Windows 和 macOS 系统
- **原生性能**：使用 robotjs 和 node-window-manager 提供高性能的桌面自动化
- **现代化界面**：基于 Electron 构建的现代化用户界面

## 📋 系统要求

- **操作系统**：Windows 10+ 或 macOS 10.15+
- **Node.js**：v16.0.0 或更高版本
- **内存**：至少 4GB RAM
- **存储空间**：至少 100MB 可用空间

## 🛠️ 安装说明

### 1. 克隆项目

```bash
git clone https://github.com/your-username/wechat-auto-sender.git
cd wechat-auto-sender
```

### 2. 安装依赖

#### 方法一：使用 npm（推荐）

```bash
# 安装依赖
npm install

# 重建原生依赖（如果需要）
npm run rebuild
```

#### 方法二：使用代理（如果网络访问受限）

```bash
# 配置代理（根据您的网络环境调整）
npm config set proxy http://127.0.0.1:8118
npm config set https-proxy http://127.0.0.1:8118

# 安装依赖
npm install

# 重建原生依赖
npm run rebuild
```

### 3. 启动应用

```bash
npm start
```

## 🚀 使用方法

1. 启动应用程序
2. 确保微信客户端已登录
3. 配置自动化任务参数
4. 开始执行自动化操作

## 📦 构建应用

### 构建所有平台版本

```bash
npm run dist
```

### 构建特定平台版本

```bash
# Windows 版本
npm run dist:win

# macOS 版本
npm run dist:mac
```

## 🏗️ 技术架构

- **主进程**：Electron 主进程，负责应用生命周期管理
- **渲染进程**：基于 HTML/CSS/JavaScript 的用户界面
- **原生模块**：
  - `robotjs`：提供跨平台的桌面自动化功能
  - `node-window-manager`：窗口管理和操作
- **构建工具**：electron-builder 用于应用打包和分发

## 📁 项目结构

```
wechat-auto-sender/
├── main.js              # Electron 主进程
├── renderer.js          # 渲染进程脚本
├── index.html           # 主界面 HTML
├── package.json         # 项目配置和依赖
├── assets/              # 应用资源文件
│   ├── app_icon.icns   # macOS 应用图标
│   └── app_icon.ico    # Windows 应用图标
└── dist/                # 构建输出目录
```

## 🔧 开发说明

### 开发环境设置

1. 确保已安装 Node.js 和 npm
2. 克隆项目并安装依赖
3. 使用 `npm start` 启动开发环境

### 调试模式

```bash
# 启用调试信息
DEBUG=electron-builder npm run rebuild
```

### 常见问题解决

#### 原生依赖构建失败

如果遇到 `robotjs` 等原生模块构建失败：

```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
npm run rebuild
```

#### 网络连接问题

如果下载依赖包时遇到网络问题：

```bash
# 使用淘宝镜像源
npm config set registry https://registry.npmmirror.com

# 或配置代理
npm config set proxy http://your-proxy:port
npm config set https-proxy http://your-proxy:port
```

## 📝 更新日志

### v1.0.0
- 初始版本发布
- 支持基本的微信自动化操作
- 跨平台支持（Windows/macOS）

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式
shuishan@shiflow.com
---

⭐ 如果这个项目对您有帮助，请给我们一个 Star！欢迎打赏
<img width="300" height="300" alt="image" src="https://github.com/user-attachments/assets/1a3da3b7-3ccb-4c7e-9c82-7dfc285c984d" />

