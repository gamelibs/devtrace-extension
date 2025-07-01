#!/bin/bash

echo "=== GitHub Token 权限验证工具 ==="
echo ""
echo "此工具将帮您验证 Personal Access Token 是否有正确权限"
echo ""

# 提示输入Token
read -s -p "请输入您的 Personal Access Token: " TOKEN
echo ""
echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ Token不能为空"
    exit 1
fi

echo "🔍 正在验证Token权限..."
echo ""

# 验证Token基本信息
echo "1. 检查Token有效性..."
USER_INFO=$(curl -s -H "Authorization: token $TOKEN" https://api.github.com/user)

if echo "$USER_INFO" | grep -q '"login"'; then
    USERNAME=$(echo "$USER_INFO" | grep '"login"' | cut -d'"' -f4)
    echo "   ✅ Token有效，用户名: $USERNAME"
else
    echo "   ❌ Token无效或已过期"
    echo "   请到 https://github.com/settings/tokens 重新生成"
    exit 1
fi

echo ""
echo "2. 检查仓库访问权限..."

# 检查仓库权限
REPO_INFO=$(curl -s -H "Authorization: token $TOKEN" https://api.github.com/repos/gamelibs/devtrace-extension)

if echo "$REPO_INFO" | grep -q '"full_name"'; then
    echo "   ✅ 可以访问仓库: gamelibs/devtrace-extension"
    
    # 检查推送权限
    if echo "$REPO_INFO" | grep -q '"push": true'; then
        echo "   ✅ 有推送权限"
        echo ""
        echo "🎉 Token配置正确！可以使用 git push"
        echo ""
        echo "使用方法："
        echo "   git remote add origin https://github.com/gamelibs/devtrace-extension.git"
        echo "   git push -u origin main"
        echo ""
        echo "推送时输入："
        echo "   Username: $USERNAME"
        echo "   Password: [您刚才输入的Token]"
    else
        echo "   ❌ 没有推送权限"
        echo ""
        echo "解决方案："
        echo "1. 重新创建Token时勾选 'repo' 权限"
        echo "2. 访问：https://github.com/settings/tokens"
    fi
else
    echo "   ❌ 无法访问仓库或仓库不存在"
    echo ""
    echo "可能原因："
    echo "1. Token权限不足（需要 'repo' 权限）"
    echo "2. 仓库名称错误"
    echo "3. 没有访问该仓库的权限"
fi

echo ""
echo "3. 检查Token权限范围..."

# 获取Token权限范围
RATE_LIMIT=$(curl -s -H "Authorization: token $TOKEN" https://api.github.com/rate_limit)
if echo "$RATE_LIMIT" | grep -q '"rate"'; then
    echo "   ℹ️  Token可以正常调用GitHub API"
else
    echo "   ⚠️  Token权限可能有限制"
fi

echo ""
echo "=== 验证完成 ==="
