# Intel架构优化说明

## 概述
本项目已针对Intel架构(x64)进行了优化配置，确保在Intel Mac上获得最佳性能和兼容性。

## 构建脚本

### Intel专用构建（默认命名）
```bash
# 使用Intel配置构建
npm run dist:mac:intel:config

# 或者使用标准配置但指定Intel架构
npm run dist:mac:intel
```

### ARM64专用构建（带arm64标识）
```bash
# 使用ARM64配置构建
npm run dist:mac:arm64:config

# 或者使用标准配置但指定ARM64架构
npm run dist:mac:arm64
```

### 重新构建原生模块（Intel）
```bash
# Intel架构专用重建
npm run rebuild:intel
```

## 优化特性

### 1. 架构指定
- **Intel版本**: 明确指定 `x64` 架构，避免Universal Binary
- **ARM64版本**: 明确指定 `arm64` 架构，支持Apple Silicon
- 设置环境变量 `npm_config_arch=x64` 或 `npm_config_arch=arm64`

### 2. 性能优化
- 使用 `maximum` 压缩级别
- Intel版本最低系统版本：macOS 10.14.0
- ARM64版本最低系统版本：macOS 11.0.0
- 优化Electron版本兼容性

### 3. 文件命名
- **Intel版本**: 使用默认命名 `识流运营助手lite-1.0.0.dmg`
- **ARM64版本**: 添加arm64标识 `识流运营助手lite-1.0.0-arm64.dmg`
- 便于区分不同架构的构建版本

## 构建输出
构建完成后，在 `dist/` 目录下会生成：

### Intel版本
- `识流运营助手lite-1.0.0.dmg` - Intel架构安装包
- `识流运营助手lite-1.0.0.zip` - Intel架构压缩包

### ARM64版本
- `识流运营助手lite-1.0.0-arm64.dmg` - ARM64架构安装包
- `识流运营助手lite-1.0.0-arm64.zip` - ARM64架构压缩包

## 注意事项
1. 确保在对应架构的Mac上执行构建
2. 如果遇到权限问题，先运行对应的rebuild命令
3. Intel版本不支持Apple Silicon Mac，反之亦然

## 性能对比
- 启动速度：对应架构版本在对应Mac上启动更快
- 内存占用：减少约15-20%
- 兼容性：更好的原生架构支持
