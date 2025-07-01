# GitHub Pages 部署指南

## 🚨 当前状态
代码已准备就绪，但需要配置GitHub认证才能推送。

## 🔑 GitHub认证配置

### 方案1: 使用Personal Access Token (推荐)

1. **创建Personal Access Token**:
   - 访问: https://github.com/settings/tokens
   - 点击 "Generate new token" → "Generate new token (classic)"
   - 选择权限: `repo` (完整仓库访问权限)
   - 复制生成的token (只显示一次!)

2. **配置Git凭据**:
   ```bash
   # 方法1: 设置远程URL包含token
   git remote set-url origin https://YOUR_TOKEN@github.com/gamelibs/devtrace-extension.git
   
   # 方法2: 使用Git凭据管理器
   git config --global credential.helper store
   # 然后在下次push时输入用户名和token
   ```

3. **推送代码**:
   ```bash
   git push origin main
   ```

### 方案2: 使用SSH密钥

1. **生成SSH密钥**:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. **添加到GitHub**:
   - 复制公钥: `cat ~/.ssh/id_ed25519.pub`
   - 访问: https://github.com/settings/keys
   - 点击 "New SSH key" 并粘贴公钥

3. **更改远程URL**:
   ```bash
   git remote set-url origin git@github.com:gamelibs/devtrace-extension.git
   git push origin main
   ```

## 📋 手动部署步骤

如果自动脚本不工作，可以手动操作：

### 1. 推送代码到GitHub
```bash
# 配置认证后执行:
git push origin main
```

### 2. 启用GitHub Pages
1. 访问: https://github.com/gamelibs/devtrace-extension
2. 点击 **Settings** 标签  
3. 滚动到 **Pages** 部分
4. 在 **Source** 下选择 **GitHub Actions**
5. 点击 **Save**

### 3. 等待部署
- GitHub Actions会自动运行
- 通常需要2-5分钟
- 完成后访问: https://gamelibs.github.io/devtrace-extension/

## 🔍 检查部署状态

1. **查看Actions状态**:
   - 访问: https://github.com/gamelibs/devtrace-extension/actions
   - 确认 "Deploy to GitHub Pages" 工作流运行成功

2. **验证网站**:
   - 主页: https://gamelibs.github.io/devtrace-extension/
   - 隐私政策: https://gamelibs.github.io/devtrace-extension/privacy.html
   - 支持页面: https://gamelibs.github.io/devtrace-extension/support.html

## ⚡ 快速解决方案

如果您有GitHub账号访问权限，最简单的方法是：

1. **在GitHub网页上直接上传文件**:
   - 访问: https://github.com/gamelibs/devtrace-extension
   - 将本地文件直接拖拽上传

2. **或者使用GitHub Desktop**:
   - 下载GitHub Desktop应用
   - 克隆仓库并同步文件

## 📞 需要帮助?

如果遇到问题，请提供以下信息：
- 是否有GitHub Personal Access Token
- 是否已设置SSH密钥  
- 希望使用哪种认证方式

配置完认证后，运行 `./deploy-github.sh` 即可完成部署！
