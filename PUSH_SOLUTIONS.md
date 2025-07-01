# GitHub 推送解决方案

由于遇到权限问题，这里提供三种推送代码到 GitHub 的解决方案：

## 方案一：手动上传（推荐）
最简单的方式是通过 GitHub 网页端手动上传文件：

1. 访问 https://github.com/gamelibs/devtrace-extension
2. 点击 "uploading an existing file" 或 "Add file" -> "Upload files"
3. 将项目根目录下的所有文件拖拽上传（不包括 .git 文件夹）
4. 填写提交信息：`Initial commit - DevTrace Extension v2.3`
5. 点击 "Commit changes"

## 方案二：使用 SSH 密钥（安全推荐）
如果您有 SSH 密钥配置：

```bash
# 添加 SSH 远程仓库
git remote add origin git@github.com:gamelibs/devtrace-extension.git

# 推送代码
git push -u origin main
```

## 方案三：使用正确的 Token 认证
如果 Token 有正确权限：

```bash
# 设置远程仓库（不在URL中暴露token）
git remote add origin https://github.com/gamelibs/devtrace-extension.git

# 使用 Token 认证推送
git push -u origin main
```

系统会提示输入用户名和密码：
- Username: 您的 GitHub 用户名
- Password: 您的 Personal Access Token

## 检查 Token 权限
确保您的 Personal Access Token 具有以下权限：
- ✅ repo (完整仓库访问权限)
- ✅ write:packages (如果需要)
- ✅ workflow (如果需要 GitHub Actions)

## 注意事项
1. 出于安全考虑，我已经移除了暴露 Token 的远程配置
2. 如果使用方案一手动上传，上传完成后 GitHub Pages 会自动部署
3. 推送成功后，访问 https://gamelibs.github.io/devtrace-extension/ 查看网站

推荐先使用方案一快速上传，然后配置 SSH 密钥用于后续开发。
