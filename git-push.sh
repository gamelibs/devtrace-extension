#!/bin/bash

echo "=== DevTrace Extension Git 推送指南 ==="
echo ""
echo "准备推送到：https://github.com/gamelibs/devtrace-extension"
echo ""
echo "⚠️  重要：确保您的 Personal Access Token 有正确权限！"
echo ""
echo "🔑 Token 必须具备的权限："
echo "   ✅ repo (完整仓库访问权限)"
echo "   ✅ workflow (如果使用GitHub Actions)"
echo ""
echo "📝 如果还没有创建Token或权限不足，请："
echo "   1. 访问：https://github.com/settings/tokens"
echo "   2. 点击 'Generate new token (classic)'"
echo "   3. 勾选 'repo' 权限"
echo "   4. 生成并复制Token"
echo ""
echo "🔐 推送时的认证信息："
echo "   用户名：gamelibs"
echo "   密码：[您的Personal Access Token]"
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
    echo "🔍 可能的原因和解决方案："
    echo ""
    echo "1. 📋 Token权限不足"
    echo "   解决：确保Token勾选了 'repo' 权限"
    echo "   重新创建：https://github.com/settings/tokens"
    echo ""
    echo "2. 🔑 Token无效或过期"
    echo "   解决：生成新的Personal Access Token"
    echo ""
    echo "3. 👤 用户名错误"
    echo "   确认：用户名应该是 'gamelibs'"
    echo ""
    echo "4. 📝 Token格式错误"
    echo "   确认：Token应以 'github_pat_' 开头"
    echo ""
    echo "💡 验证Token权限的方法："
    echo "   查看文件：TOKEN_GUIDE.md"
fi
