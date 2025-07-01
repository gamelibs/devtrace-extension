#!/bin/bash

echo "=== DevTrace Extension Git 推送指南 ==="
echo ""
echo "准备推送到：https://github.com/gamelibs/devtrace-extension"
echo ""
echo "⚠️  重要：当提示输入密码时，请使用您的 Personal Access Token，不是 GitHub 密码！"
echo ""
echo "您的 Token 应该以 'github_pat_' 开头，例如："
echo "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"
echo ""
echo "用户名：gamelibs"
echo "密码：[您的Personal Access Token]"
echo ""

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "发现未提交的更改，正在提交..."
    git add .
    git commit -m "DevTrace Extension v2.3 - Ready for Chrome Web Store"
fi

echo "开始推送..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 推送成功！"
    echo ""
    echo "🌐 GitHub 仓库：https://github.com/gamelibs/devtrace-extension"
    echo "🚀 GitHub Pages 将在几分钟内部署到："
    echo "    https://gamelibs.github.io/devtrace-extension/"
    echo ""
    echo "📦 Chrome Web Store 扩展包已准备就绪："
    echo "    build/devtrace-v2.3.zip"
else
    echo ""
    echo "❌ 推送失败！"
    echo ""
    echo "可能的解决方案："
    echo "1. 确保使用正确的 Personal Access Token"
    echo "2. 检查 Token 是否有 'repo' 权限"
    echo "3. 确认用户名是 'gamelibs'"
    echo ""
    echo "如果继续遇到问题，可以使用手动上传方式"
fi
