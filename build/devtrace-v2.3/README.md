# DevTrace - Network Request Inspector

## � Professional network request inspector for developers

DevTrace helps developers trace, analyze and debug HTTP traffic with advanced filtering and export capabilities.

## ✨ Key Features

- 🔒 **Privacy-First**: All data processing happens locally
- ⚡ **On-Demand Permissions**: Only requests access to specific domains when needed
- 📊 **Real-time Analysis**: Monitor network requests with detailed information
- 💾 **Smart Export**: Batch export with original directory structure
- 🎯 **Advanced Filtering**: Exclude ads, trackers, and unwanted requests
- 🛠️ **Developer-Friendly**: Clean interface and powerful analysis tools

## � Quick Start

1. Install the extension from Chrome Web Store
2. Click the DevTrace icon in your toolbar
3. Enter a website URL to analyze
4. Grant permission when prompted
5. Browse the website to capture requests
6. Use filters and export tools to analyze data

## 🔧 Installation

Visit the [Chrome Web Store](https://chrome.google.com/webstore/) to install DevTrace.

## 🌐 Website

- Homepage: https://gamelibs.github.io/devtrace-extension/
- Privacy Policy: https://gamelibs.github.io/devtrace-extension/privacy.html
- Support: https://gamelibs.github.io/devtrace-extension/support.html

## 📄 License

Built for developers, by developers.
1. 在资源列表中，每个资源都有一个复选框，默认全部选中
2. 可以单击复选框取消选择不需要的资源
3. 点击表头的复选框可以全选/取消全选所有资源
4. 被排除的资源会以淡色背景显示
5. 点击单个资源的"Save"按钮，在弹出的文件夹选择器中选择保存位置
6. 系统会尝试保存到选择的目录，如遇到浏览器安全限制，会自动保存到Downloads文件夹并保持相同的目录结构
7. 查看状态列的实时更新（Downloading → Downloaded）

**注意**：由于浏览器安全策略，某些资源可能因CORS限制无法直接保存到用户选择的目录，系统会自动降级到Downloads文件夹，但保持相同的文件组织结构。

### 3. 批量导出选中资源
1. 使用筛选器选择需要的资源类型
2. 使用复选框选择/排除特定资源
3. 点击"Export Resources (X)"按钮，X显示当前选中的资源数量
4. 选择保存文件夹
5. 系统按域名和路径自动组织文件结构，仅导出选中的资源

### 4. 导出URL列表
1. 选择需要导出URL的资源（使用复选框）
2. 点击"Export Data"按钮
3. 系统将选中的可下载资源URL导出为JSON数组格式

## 📋 资源类型支持

### 支持的资源类型
- 🖼️ **图片文件**：JPG、PNG、GIF、WebP、SVG、BMP、ICO等
- 🎵 **音频文件**：MP3、WAV、OGG、AAC、FLAC等
- 🎬 **视频文件**：MP4、AVI、MOV、WebM、MKV等
- 📄 **文档文件**：PDF、DOC、XLS、PPT等
- 💻 **代码文件**：CSS、JS、JSON、XML、HTML等
- 🔠 **字体文件**：TTF、WOFF、WOFF2、EOT等
- 🎮 **游戏资源**：模型、纹理、音效等
- 📦 **压缩文件**：ZIP、RAR、7Z等

### 排除的资源类型（黑名单）
- ❌ **API接口**：/api/、/ajax/、/graphql等
- ❌ **统计追踪**：Google Analytics、广告追踪等
- ❌ **实时通信**：WebSocket、Socket.IO等
- ❌ **CDN服务**：Cloudflare CDN、RUM等
- ❌ **动态脚本**：带参数的PHP、ASP、JSP等

## 🛠️ 技术实现

### 混合保存机制
1. **智能尝试**：优先尝试直接保存到用户选择的目录
2. **自动降级**：遇到CORS限制时自动降级到Downloads文件夹
3. **保持结构**：无论哪种方式都保持域名+路径的目录结构
4. **用户友好**：清晰提示实际保存位置和处理过程

### 浏览器限制说明
- **CORS限制**：某些资源受同源策略保护，无法直接获取
- **安全策略**：部分网站返回403禁止访问错误
- **自动处理**：系统自动检测并选择最佳保存方式
- **成功保证**：通过降级机制确保文件总能成功保存

### 文件组织结构
```
选择的文件夹/
├── 域名1/
│   ├── 路径1/
│   │   ├── 文件1
│   │   └── 文件2
│   └── 路径2/
│       └── 文件3
├── 域名2/
│   └── 文件4
└── index.txt (资源索引文件)
```

## 📊 状态说明

| 状态 | 含义 | 颜色 |
|------|------|------|
| Ready | 可下载，等待用户操作 | 灰色 |
| Downloading | 正在下载中 | 蓝色（动画） |
| Downloaded | 下载完成 | 绿色 |
| Failed | 下载失败 | 红色 |
| N/A | 不支持下载的资源类型 | 灰色 |

## 🔧 开发者信息

- **版本**：v2.3
- **兼容性**：Chrome 90+
- **权限**：webRequest、downloads、storage、host_permissions
- **API使用**：File System Access API、Chrome Extensions API

## 📝 更新日志

### v2.3 (2024-06-25)
- 🆕 添加资源选择功能（复选框）
- 🎯 Export JSON和Export Resources仅导出选中资源
- 🎨 被排除资源的视觉反馈（淡色背景）
- 🔄 全选复选框支持中间状态显示
- 📊 按钮实时显示选中资源数量

### v2.2 (2024-06-24)
- 🎉 实现Export JSON功能，导出可下载资源URL数组
- 🔄 优化批量导出和单个保存的统一性
- 🎨 改进用户体验和状态显示
- 🐛 修复路径处理和文件组织结构

### v2.1 (2024-06-23)
- 🎉 实现内存直接写入功能
- 🔄 优化下载状态实时更新
- 🎨 改进用户界面和状态显示
- 🐛 修复文件名生成和状态更新问题

### v2.0
- 🏗️ 重构资源识别逻辑（黑名单模式）
- 📁 实现按域名+路径自动建目录
- 🎯 优化用户体验，去除多余确认提示
- 📊 添加实时下载状态显示
- 
### v1.0
- 初始版本
- 实现基本的资源捕获和导出功能

## 🤝 贡献

欢迎提交issue和pull request来改进这个项目!
