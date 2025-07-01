# GitHub Personal Access Token 权限设置指南

## 创建 Personal Access Token 的步骤

### 1. 访问 GitHub Token 设置页面
访问：https://github.com/settings/tokens

### 2. 点击 "Generate new token" 
选择 "Generate new token (classic)"

### 3. 填写基本信息
- **Note**: `DevTrace Extension Development` (给token起个名字)
- **Expiration**: 选择过期时间（建议30天或更长）

### 4. 🔑 **重要：选择正确的权限范围**

**必须勾选的权限：**
- ✅ **repo** (完整的仓库访问权限)
  - ✅ repo:status
  - ✅ repo_deployment
  - ✅ public_repo
  - ✅ repo:invite
  - ✅ security_events

**可选但推荐的权限：**
- ✅ **workflow** (如果使用GitHub Actions)
- ✅ **write:packages** (如果需要发布包)
- ✅ **read:org** (如果是组织仓库)

### 5. 生成Token
点击 "Generate token" 按钮

### 6. 复制Token
⚠️ **重要：立即复制Token并保存，页面刷新后将无法再看到！**

Token格式类似：
```
github_pat_11XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 验证Token权限
创建Token后，可以用以下命令验证权限：

```bash
# 替换YOUR_TOKEN为实际token
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/repos/gamelibs/devtrace-extension
```

如果返回仓库信息且包含 `"permissions": {"push": true}` 则权限正确。

## 常见权限问题

### 问题1：403 Permission denied
**原因**：Token权限不足
**解决**：确保勾选了 `repo` 权限

### 问题2：Token not found
**原因**：Token格式错误或已过期
**解决**：重新生成Token

### 问题3：Repository not found
**原因**：Token没有访问该仓库的权限
**解决**：确保Token有 `repo` 权限，且仓库存在

## 使用Token推送代码

```bash
# 设置远程仓库
git remote add origin https://github.com/gamelibs/devtrace-extension.git

# 推送时会提示输入用户名和密码
git push -u origin main
# Username: gamelibs
# Password: [粘贴您的Personal Access Token]
```

## 安全提示
1. 不要在代码中硬编码Token
2. 不要在URL中包含Token
3. 定期更新Token
4. 只给Token必要的权限
