#!/bin/bash

# DevTrace GitHub Pages 部署脚本

echo "🚀 部署 DevTrace 到 GitHub Pages..."

# 检查Git仓库状态
if [ ! -d ".git" ]; then
    echo "📂 初始化Git仓库..."
    git init
    git branch -M main
fi

# 检查远程仓库
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 添加远程仓库..."
    git remote add origin https://github.com/gamelibs/devtrace-extension.git
else
    echo "✅ 远程仓库已配置"
fi

# 提交更改
echo "� 提交更改..."
git add .
git commit -m "DevTrace v2.3: Network Request Inspector

- Professional network request inspector for developers
- Privacy-first design with on-demand permissions  
- Advanced filtering and export capabilities
- Chrome Web Store ready"

# 推送到GitHub
echo "🚀 推送到GitHub..."
git push -u origin main

echo "✅ 部署完成!"
echo ""
echo "🌐 网站链接:"
echo "├── 主页: https://gamelibs.github.io/devtrace-extension/"
echo "├── 隐私政策: https://gamelibs.github.io/devtrace-extension/privacy.html"
echo "└── 支持页面: https://gamelibs.github.io/devtrace-extension/support.html"
echo ""
echo "📦 Chrome Web Store发布包: build/devtrace-v2.3.zip"
