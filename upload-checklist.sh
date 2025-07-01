#!/bin/bash

# DevTrace Extension - 手动上传文件列表
# 将以下文件上传到 GitHub 仓库

echo "=== DevTrace Extension 文件上传清单 ==="
echo ""
echo "请将以下文件上传到 https://github.com/gamelibs/devtrace-extension："
echo ""

# 核心扩展文件
echo "📦 核心扩展文件："
echo "  ✓ manifest.json"
echo "  ✓ background.js"
echo "  ✓ popup.js"
echo "  ✓ popup.html"
echo ""

# 图标文件
echo "🎨 图标文件："
echo "  ✓ icon16.png"
echo "  ✓ icon48.png"
echo "  ✓ icon128.png"
echo ""

# 文档文件
echo "📚 文档文件："
echo "  ✓ README.md"
echo "  ✓ DEPLOYMENT_GUIDE.md"
echo ""

# 构建脚本
echo "🔧 构建脚本："
echo "  ✓ build-production.sh"
echo "  ✓ deploy-github.sh"
echo ""

# GitHub Pages 网站
echo "🌐 GitHub Pages 网站："
echo "  ✓ docs/index.html"
echo "  ✓ docs/privacy.html"
echo "  ✓ docs/support.html"
echo ""

# GitHub Actions
echo "⚙️ GitHub Actions："
echo "  ✓ .github/workflows/deploy.yml"
echo ""

# 构建输出
echo "📦 构建文件："
echo "  ✓ build/devtrace-v2.3.zip"
echo ""

echo "=== 上传步骤 ==="
echo "1. 访问：https://github.com/gamelibs/devtrace-extension"
echo "2. 点击 'Add file' -> 'Upload files'"
echo "3. 拖拽所有上述文件到页面"
echo "4. 提交信息：'Initial commit - DevTrace Extension v2.3'"
echo "5. 点击 'Commit changes'"
echo ""
echo "上传完成后，GitHub Pages 将自动部署到："
echo "https://gamelibs.github.io/devtrace-extension/"
