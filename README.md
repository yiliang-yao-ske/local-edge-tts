# Local Edge TTS - Obsidian 插件

这是一个基于 Microsoft Edge TTS 的 Obsidian 插件，支持高质量的多语言文本朗读功能。

## ✨ 主要功能

- 🎯 **高质量语音合成**：使用 Microsoft Edge 的神经网络语音技术
- 🌍 **多语言支持**：支持中文、英语、西班牙语等多种语言
- 🎚️ **语音控制**：可调节播放速度、选择不同声音
- 📝 **智能文本处理**：自动过滤 Markdown 格式，提升朗读效果
- 🔊 **便捷操作**：支持快捷键、状态栏、命令面板等多种触发方式

## 🚀 支持的语音

### 中文 🇨🇳
- 晓晓 (女) - zh-CN-XiaoxiaoNeural
- 云希 (男) - zh-CN-YunxiNeural
- 云扬 (男) - zh-CN-YunyangNeural
- 晓伊 (女) - zh-CN-XiaoyiNeural
- 等多种中文语音...

### English 🇺🇸🇬🇧🇦🇺
- Aria (Female) - en-US-AriaNeural
- Jenny (Female) - en-US-JennyNeural
- Guy (Male) - en-US-GuyNeural
- Sonia (UK Female) - en-GB-SoniaNeural
- Ryan (UK Male) - en-GB-RyanNeural
- Natasha (AU Female) - en-AU-NatashaNeural
- 等多种英语语音...

### Español 🇪🇸🇲🇽🇦🇷
- Elvira (Mujer) - es-ES-ElviraNeural
- Álvaro (Hombre) - es-ES-AlvaroNeural
- Dalia (México Mujer) - es-MX-DaliaNeural
- Jorge (México Hombre) - es-MX-JorgeNeural
- Elena (Argentina Mujer) - es-AR-ElenaNeural
- 等多种西班牙语语音...

## 📋 系统要求

- Windows 操作系统
- Python 3.7+ 已安装
- edge-tts Python 包已安装

### 安装 Python 依赖

```bash
pip install edge-tts
```

## 🔧 安装方法

1. 将插件文件夹复制到 Obsidian 的插件目录
2. 在 Obsidian 设置中启用 "Local Edge TTS" 插件
3. 确保系统已安装 Python 和 edge-tts

## 🎮 使用方法

### 基本操作
- **朗读整个笔记**：点击工具栏的音频图标 🔊
- **朗读选中文本**：选中文本后使用命令 "朗读选中文本"
- **停止朗读**：使用命令 "停止朗读"

### 快捷命令
- `朗读笔记` - 朗读当前整个笔记
- `朗读选中文本` - 朗读选中的文本
- `停止朗读` - 停止当前朗读

### 设置选项
- **语音选择**：选择不同的语音（中/英/西班牙语）
- **播放速度**：调整朗读速度（0.5x - 2.0x）
- **测试语音**：播放测试文本预览语音效果
- **通知设置**：控制是否显示操作通知

## 🛠️ 技术说明

- 使用 Python edge-tts 库进行语音合成
- 音频文件临时存储在插件的 temp 文件夹中
- 支持智能的 Markdown 文本过滤
- 跨平台文件路径处理

## 🔍 故障排除

### 常见问题
1. **插件无法加载**：确保已安装 Python 和 edge-tts
2. **语音无法播放**：检查音频权限和文件路径
3. **中文乱码**：确保系统编码支持 UTF-8

### 检查命令
```bash
# 检查 Python 安装
python --version

# 检查 edge-tts 安装
pip show edge-tts

# 手动测试 TTS
python tts_helper.py speak --text "测试" --voice "zh-CN-XiaoxiaoNeural"
```

## 📜 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！