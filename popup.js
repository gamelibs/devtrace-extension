// Enhanced popup.js for Web Request Capture v2.0

/**
 * 主应用类
 */
class WebRequestCaptureApp {    constructor() {
        this.currentData = [];
        this.filteredData = [];
        this.isCapturing = false;
        this.downloadStatus = new Map(); // 添加下载状态追踪
        this.excludedResources = new Set(); // 追踪被排除的资源
        this.settings = {
            maxRequests: 100,
            saveDetails: false,
            blockAds: true,
            blockStatic: false,
            defaultView: 'popup',  // 'popup' 或 'window'
            captureMode: 'all_domains', // 新增：捕获模式
            allowedDomains: [] // 新增：白名单域名列表
        };
        this.filters = {
            domain: '',
            status: '',
            type: ''
        };
        
        this.initializeApp();
    }

    /**
     * 初始化应用
     */
    async initializeApp() {
        try {
            console.log('DevTrace: Initializing application...');
            await this.loadSettings();
            this.bindEvents();
            this.setupMessageListener();
            this.loadSavedUrl();
            this.updateUI();
            
            // 检查用户偏好，如果设置为窗口模式且当前是popup，则自动打开独立窗口
            if (this.settings.defaultView === 'window' && this.isPopupMode()) {
                console.log('DevTrace: User prefers window mode, auto-opening standalone window...');
                setTimeout(() => {
                    this.openWindow();
                    // 立即关闭popup
                    setTimeout(() => {
                        window.close();
                    }, 300);
                }, 100);
            }
            
            console.log('DevTrace: Application initialized successfully');
        } catch (error) {
            console.error('DevTrace: Failed to initialize app:', error);
            this.showError('Failed to initialize application');
        }
    }    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 控制按钮
        document.getElementById('startButton').addEventListener('click', () => this.startCapture());
        document.getElementById('stopButton').addEventListener('click', () => this.stopCapture());
        document.getElementById('openWindowButton').addEventListener('click', () => this.openWindow());
        
        // 数据操作按钮
        document.getElementById('clearButton').addEventListener('click', () => this.clearData());
        const resetBtn = document.getElementById('resetSessionButton');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetSession());
        }
        document.getElementById('exportButton').addEventListener('click', () => this.exportData());
        document.getElementById('exportResourcesButton').addEventListener('click', () => this.exportResources());
        
        // 筛选控件
        document.getElementById('domainFilter').addEventListener('change', (e) => this.updateFilter('domain', e.target.value));
        document.getElementById('statusFilter').addEventListener('change', (e) => this.updateFilter('status', e.target.value));
        document.getElementById('typeFilter').addEventListener('change', (e) => this.updateFilter('type', e.target.value));
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());
        
        // 资源选择复选框事件监听器
        document.getElementById('selectAllCheckbox').addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('resource-checkbox')) {
                this.toggleResourceSelection(e.target);
            }
        });
        
        // 设置面板
        document.getElementById('settingsButton').addEventListener('click', () => this.toggleSettings());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('cancelSettings').addEventListener('click', () => this.closeSettings());
        
        // 捕获模式变化事件
        document.getElementById('captureModeSelect').addEventListener('change', (e) => {
            this.toggleWhitelistSettings(e.target.value === 'whitelist');
        });
        
        // 黑名单域名管理
        this.setupBlacklistHandlers();
        
        // URL输入框回车事件
        document.getElementById('urlInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.startCapture();
            }
        });

        // 添加窗口拖拽功能
        this.addDragFunctionality();
    }

    /**
     * 设置黑名单域名处理器
     */
    setupBlacklistHandlers() {
        const addDomainBtn = document.getElementById('addBlockedDomainBtn');
        const domainInput = document.getElementById('blockedDomainInput');
        
        if (addDomainBtn && domainInput) {
            // 添加域名按钮点击事件
            addDomainBtn.addEventListener('click', () => {
                this.addBlockedDomain();
            });
            
            // 输入框回车事件
            domainInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addBlockedDomain();
                }
            });
        }
        
        // 加载并显示当前黑名单
        this.loadBlockedDomains();
    }

    /**
     * 添加黑名单域名
     */
    addBlockedDomain() {
        const input = document.getElementById('blockedDomainInput');
        const domain = input.value.trim();
        
        if (!domain) {
            this.showToast('Please enter a domain name', 'warning');
            return;
        }
        
        // 基本域名格式验证
        if (!this.isValidDomain(domain)) {
            this.showToast('Please enter a valid domain name (e.g., example.com)', 'error');
            return;
        }
        
        // 发送添加黑名单域名的消息
        chrome.runtime.sendMessage({
            message: 'add_blocked_domain',
            domain: domain
        }, (response) => {
            if (response && response.success) {
                this.showToast(`Domain "${domain}" added to blacklist`, 'success');
                input.value = ''; // 清空输入框
                this.loadBlockedDomains(); // 重新加载显示
            } else {
                const error = response?.error || 'Failed to add domain';
                if (error.includes('already exists')) {
                    this.showToast(`Domain "${domain}" is already in blacklist`, 'warning');
                } else {
                    this.showToast(error, 'error');
                }
            }
        });
    }

    /**
     * 移除黑名单域名
     */
    removeBlockedDomain(domain) {
        chrome.runtime.sendMessage({
            message: 'remove_blocked_domain',
            domain: domain
        }, (response) => {
            if (response && response.success) {
                this.showToast(`Domain "${domain}" removed from blacklist`, 'success');
                this.loadBlockedDomains(); // 重新加载显示
            } else {
                this.showToast(response?.error || 'Failed to remove domain', 'error');
            }
        });
    }

    /**
     * 加载并显示黑名单域名
     */
    loadBlockedDomains() {
        chrome.runtime.sendMessage({ message: 'get_settings' }, (response) => {
            if (response && response.settings && response.settings.blockedDomains) {
                this.displayBlockedDomains(response.settings.blockedDomains);
            }
        });
    }

    /**
     * 显示黑名单域名标签
     */
    displayBlockedDomains(blockedDomains) {
        const container = document.getElementById('blockedDomainsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!blockedDomains || blockedDomains.length === 0) {
            container.innerHTML = '<div class="no-domains">No blocked domains</div>';
            return;
        }
        
        blockedDomains.forEach(domain => {
            const tag = document.createElement('div');
            tag.className = 'domain-tag';
            tag.innerHTML = `
                <span class="domain-text">${domain}</span>
                <button class="remove-btn" data-domain="${domain}" title="Remove ${domain}">×</button>
            `;
            
            // 添加删除按钮事件
            const removeBtn = tag.querySelector('.remove-btn');
            removeBtn.addEventListener('click', () => {
                this.removeBlockedDomain(domain);
            });
            
            container.appendChild(tag);
        });
    }

    /**
     * 验证域名格式
     */
    isValidDomain(domain) {
        // 基本域名格式验证
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        if (!domainRegex.test(domain)) {
            return false;
        }
        
        // 检查是否包含至少一个点（除非是localhost等特殊情况）
        if (!domain.includes('.') && !['localhost', 'local'].includes(domain.toLowerCase())) {
            return false;
        }
        
        return true;
    }

    /**
     * 设置消息监听器
     */
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'data_updated') {
                this.handleDataUpdate(message.data);
            }
        });
    }

    /**
     * 加载保存的URL
     */
    loadSavedUrl() {
        chrome.storage.local.get(['lastUrl'], (result) => {
            if (result.lastUrl && result.lastUrl.trim()) {
                try {
                    // 验证保存的URL是否有效
                    const testUrl = result.lastUrl.startsWith('http') ? result.lastUrl : `https://${result.lastUrl}`;
                    new URL(testUrl); // 测试URL是否有效
                    document.getElementById('urlInput').value = result.lastUrl;
                } catch (error) {
                    console.warn('Saved URL is invalid, clearing it:', result.lastUrl);
                    // 清除无效的保存URL
                    chrome.storage.local.remove(['lastUrl']);
                }
            }
        });
    }

    /**
     * 加载设置
     */
    async loadSettings() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ message: 'get_settings' }, (response) => {
                if (response && response.settings) {
                    this.settings = response.settings;
                    this.updateSettingsUI();
                }
                resolve();
            });
        });
    }

    /**
     * 开始捕获
     */
    async startCapture() {
        console.log('DevTrace: startCapture() called');
        
        const url = document.getElementById('urlInput').value.trim();
        console.log('DevTrace: Input URL:', url);
        
        if (!url) {
            console.log('DevTrace: Empty URL');
            this.showError('Please enter a valid URL');
            return;
        }

        try {
            // 添加协议前缀（如果缺少）
            const fullUrl = url.startsWith('http') ? url : `https://${url}`;
            console.log('DevTrace: Full URL:', fullUrl);
            
            const targetDomain = new URL(fullUrl).hostname;
            console.log('DevTrace: Target domain:', targetDomain);
            
            // 保存URL
            chrome.storage.local.set({ lastUrl: url });
            
            // 发送开始捕获消息
            chrome.runtime.sendMessage({ 
                message: 'start_capture', 
                url: fullUrl 
            }, (response) => {
                console.log('DevTrace: Background response:', response);
                
                if (response && response.success) {
                    this.isCapturing = true;
                    this.updateCaptureState();
                    this.openUrlInCurrentTab(fullUrl);
                    document.getElementById('targetDomain').textContent = response.targetDomain || targetDomain;
                    
                    // 显示包含捕获模式的成功消息
                    const captureMode = response.captureMode || 'main_domain_only';
                    const modeText = this.getCaptureModeText(captureMode);
                    this.showSuccess(`Started capturing requests for ${response.targetDomain || targetDomain} (${modeText})`);
                } else {
                    const errorMsg = response?.error || 'Failed to start capture';
                    console.log('DevTrace: Capture failed:', errorMsg);
                    
                    if (errorMsg.includes('Permission denied')) {
                        this.showError('Permission denied. Please grant access to analyze this website.');
                    } else {
                        this.showError(errorMsg);
                    }
                }
            });
        } catch (error) {
            console.error('DevTrace: URL parsing error:', error);
            this.showError('Invalid URL format. Please enter a valid URL (e.g., example.com or https://example.com)');
        }
    }

    /**
     * 停止捕获
     */
    stopCapture() {
        chrome.runtime.sendMessage({ message: 'stop_capture' }, (response) => {
            if (response && response.success) {
                this.isCapturing = false;
                this.updateCaptureState();
                this.showSuccess(`Capture stopped. Total requests: ${response.totalCaptured || 0}`);
            } else {
                this.showError('Failed to stop capture');
            }
        });
    }    /**
     * 在原浏览器窗口打开URL
     */
    openUrlInCurrentTab(url) {
        // 获取所有非扩展窗口
        chrome.windows.getAll({ windowTypes: ['normal'] }, (windows) => {
            if (windows.length > 0) {
                // 找到最近活动的普通浏览器窗口
                const targetWindow = windows.find(w => w.focused) || windows[0];
                
                // 在该窗口的活动标签页中打开URL
                chrome.tabs.query({ active: true, windowId: targetWindow.id }, (tabs) => {
                    if (tabs.length > 0) {
                        chrome.tabs.update(tabs[0].id, { url: url });
                    } else {
                        // 如果没有活动标签页，创建新标签页
                        chrome.tabs.create({ url: url, windowId: targetWindow.id });
                    }
                });
            } else {
                // 如果没有普通浏览器窗口，创建新窗口
                chrome.windows.create({ url: url, type: 'normal' });
            }
        });
    }

    /**
     * 处理数据更新
     */
    handleDataUpdate(data) {
        this.currentData = data.requests || [];
        if (typeof data.isCapturing === 'boolean') this.isCapturing = data.isCapturing;
        if (data.targetDomain) {
            const td = document.getElementById('targetDomain');
            if (td) td.textContent = data.targetDomain;
        }
        this.updateCaptureState();
        this.applyFilters();
        this.updateTable();
        this.updateStats();
    }

    /**
     * 更新筛选器
     */
    updateFilter(filterType, value) {
        this.filters[filterType] = value;
        this.applyFilters();
        this.updateTable();
        this.updateStats();
    }

    /**
     * 应用筛选器
     */
    applyFilters() {
        this.filteredData = this.currentData.filter(request => {
            // 域名筛选
            if (this.filters.domain && request.domain !== this.filters.domain) {
                return false;
            }
            
            // 状态码筛选
            if (this.filters.status) {
                const status = request.status;
                const statusCategory = this.getStatusCategory(status);
                if (statusCategory !== this.filters.status) {
                    return false;
                }
            }
            
            // 类型筛选
            if (this.filters.type && request.type !== this.filters.type) {
                return false;
            }
            
            return true;
        });

        // 更新筛选器选项
        this.updateFilterOptions();
    }

    /**
     * 获取状态码分类
     */
    getStatusCategory(status) {
        if (status >= 200 && status < 300) return '2xx';
        if (status >= 300 && status < 400) return '3xx';
        if (status >= 400 && status < 500) return '4xx';
        if (status >= 500) return '5xx';
        return 'unknown';
    }

    /**
     * 更新筛选器选项
     */
    updateFilterOptions() {
        // 更新域名选项
        const domains = [...new Set(this.currentData.map(req => req.domain))];
        const domainSelect = document.getElementById('domainFilter');
        const currentDomain = domainSelect.value;
        
        domainSelect.innerHTML = '<option value="">All Domains</option>';
        domains.forEach(domain => {
            const option = document.createElement('option');
            option.value = domain;
            option.textContent = domain;
            if (domain === currentDomain) option.selected = true;
            domainSelect.appendChild(option);
        });
    }    /**
     * 清除筛选器
     */
    clearFilters() {
        // 重置筛选器状态
        this.filters = { domain: '', status: '', type: '' };
        
        // 重置UI控件
        document.getElementById('domainFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('typeFilter').value = '';
        
        // 重新应用筛选（实际上是显示所有数据）
        this.applyFilters();
        this.updateTable();
        this.updateStats();
        
        this.showSuccess('Filters cleared - showing all data');
    }

    /**
     * 更新表格
     */    updateTable() {
        const tableBody = document.getElementById('dataTableBody');
          if (this.filteredData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="11" class="empty-state">
                        <div class="empty-state-icon">${this.currentData.length === 0 ? '📊' : '🔍'}</div>
                        <div>${this.currentData.length === 0 ? 'No requests captured yet' : 'No requests match current filters'}</div>
                    </td>
                </tr>
            `;
            return;
        }        const rows = this.filteredData.map((request, index) => {
            const time = new Date(request.timestamp).toLocaleTimeString();
            const methodClass = `method-${request.method.toLowerCase()}`;
            const statusClass = `status-${this.getStatusCategory(request.status)}`;
            const size = this.formatSize(request.size || 0);
            
            // 获取下载状态
            const downloadStatus = this.downloadStatus.get(request.url);
            let downloadStatusHtml = '';
            let actionButtonHtml = '';
            
            if (this.isDownloadableResource(request)) {
                if (downloadStatus === 'downloading') {
                    downloadStatusHtml = '<span class="download-status downloading">⏳ Downloading</span>';
                    actionButtonHtml = '<button class="save-btn saving" disabled>Saving...</button>';
                } else if (downloadStatus === 'completed') {
                    downloadStatusHtml = '<span class="download-status completed">✅ Downloaded</span>';
                    actionButtonHtml = '<button class="save-btn saved" disabled>Saved</button>';
                } else if (downloadStatus === 'failed') {
                    downloadStatusHtml = '<span class="download-status failed">❌ Failed</span>';
                    actionButtonHtml = `<button class="save-btn" data-url="${encodeURIComponent(request.url)}" data-index="${index}">Save</button>`;
                } else {
                    downloadStatusHtml = '<span class="download-status pending">📥 Ready</span>';
                    actionButtonHtml = `<button class="save-btn" data-url="${encodeURIComponent(request.url)}" data-index="${index}">Save</button>`;
                }
            } else {
                downloadStatusHtml = '<span class="download-status excluded">➖ Excluded</span>';
                actionButtonHtml = '<button class="save-btn" disabled>N/A</button>';
            }
              const isExcluded = this.excludedResources?.has(request.url) || false;
            const checkboxChecked = !isExcluded ? 'checked' : '';
            const rowClass = isExcluded ? 'row-excluded' : '';
            
            return `
                <tr data-index="${index}" class="${rowClass}">
                    <td><input type="checkbox" class="resource-checkbox" data-url="${encodeURIComponent(request.url)}" ${checkboxChecked}></td>
                    <td>${index + 1}</td>
                    <td>${time}</td>
                    <td><span class="method-badge ${methodClass}">${request.method}</span></td>
                    <td>${request.domain}</td>
                    <td class="url-cell" title="${request.url}">${request.url}</td>
                    <td><span class="status-badge ${statusClass}">${request.status || 'Pending'}</span></td>
                    <td>${request.type}</td>
                    <td>${size}</td>
                    <td>${downloadStatusHtml}</td>
                    <td>${actionButtonHtml}</td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = rows;
          // 添加保存按钮的事件监听器
        this.addSaveButtonListeners();
        
        // 更新全选复选框状态
        this.updateSelectAllCheckbox();
    }

    /**
     * 添加保存按钮的事件监听器
     */
    addSaveButtonListeners() {
        const saveButtons = document.querySelectorAll('.save-btn[data-url]');
        saveButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const url = decodeURIComponent(e.target.getAttribute('data-url'));
                const index = parseInt(e.target.getAttribute('data-index'));
                this.saveIndividualResource(url, index);
            });
        });
    }/**
     * 格式化文件大小
     */
    formatSize(bytes) {
        if (bytes === 0) return '-';
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }    /**
     * 格式化字节数显示
     */
    formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 更新统计信息
     */
    updateStats() {
        document.getElementById('captureCount').textContent = this.currentData.length;
        document.getElementById('filteredCount').textContent = this.filteredData.length;
        document.getElementById('totalRequests').textContent = this.currentData.length;
        
        // 计算内存使用
        const memoryKB = Math.round(JSON.stringify(this.currentData).length / 1024);
        document.getElementById('memoryUsage').textContent = `${memoryKB} KB`;
        
        // 更新可导出资源数量
        this.updateExportResourcesButton();
    }    /**
     * 更新导出资源按钮状态
     */
    updateExportResourcesButton() {
        const exportResourcesBtn = document.getElementById('exportResourcesButton');
        if (!exportResourcesBtn) return;

        // 使用选中的可下载资源数量
        const selectedDownloadableCount = this.getSelectedResourcesCount();

        if (selectedDownloadableCount > 0) {
            exportResourcesBtn.textContent = `Export Resources (${selectedDownloadableCount})`;
            exportResourcesBtn.disabled = false;
        } else {
            exportResourcesBtn.textContent = 'Export Resources (0)';
            exportResourcesBtn.disabled = true;
        }
    }    /**
     * 判断是否为可下载的资源（黑名单模式：排除特定URL模式）
     */
    isDownloadableResource(request) {
        const url = request.url.toLowerCase();
        
        // 黑名单：排除不符合资源要求的URL模式
        const excludePatterns = [
            // CDN和网络服务相关
            '/cdn-cgi/',           // Cloudflare CDN CGI
            '/rum?',               // Real User Monitoring
            '/beacon',             // 信标请求
            '/analytics',          // 分析服务
            '/tracking',           // 跟踪服务
            '/metrics',            // 指标收集
            '/telemetry',          // 遥测数据
            
            // API和动态内容
            '/api/',               // API接口
            '/ajax/',              // Ajax请求
            '/graphql',            // GraphQL接口
            '/rpc/',               // RPC调用
            '/jsonrpc',            // JSON-RPC
            
            // 广告和营销
            '/ads/',               // 广告
            '/advertisement',      // 广告
            '/doubleclick',        // Google广告
            '/googletagmanager',   // Google标签管理器
            '/googlesyndication',  // Google广告联盟
            
            // 统计和监控
            '/collect?',           // 数据收集
            '/ping?',              // Ping请求
            '/health',             // 健康检查
            '/status',             // 状态检查
            '/monitor',            // 监控
            
            // 动态脚本和查询
            '.php?',               // 带参数的PHP
            '.asp?',               // 带参数的ASP
            '.jsp?',               // 带参数的JSP
            '.cgi?',               // 带参数的CGI
            
            // WebSocket和实时通信
            '/ws/',                // WebSocket
            '/socket.io/',         // Socket.IO
            '/sockjs/',            // SockJS
            
            // 其他不需要的请求
            '/favicon.ico',        // 网站图标（通常很小且不重要）
            '/robots.txt',         // 爬虫协议文件
            '/sitemap.xml',        // 站点地图
        ];
        
        // 检查URL是否匹配黑名单模式
        const isExcluded = excludePatterns.some(pattern => url.includes(pattern));
        
        // 如果匹配黑名单，则不可下载
        return !isExcluded;
    }

    /**
     * 更新捕获状态
     */
    updateCaptureState() {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const startButton = document.getElementById('startButton');
        const stopButton = document.getElementById('stopButton');

        const capturing = this.isCapturing;
        const dotClass = capturing ? 'status-dot capturing' : 'status-dot stopped';
        const text = capturing ? 'Capturing...' : 'Stopped';

    if (statusDot) statusDot.className = dotClass;
    if (statusText) statusText.textContent = text;

        if (startButton) startButton.disabled = capturing;
        if (stopButton) stopButton.disabled = !capturing;
    }    /**
     * 清空数据
     */
    clearData() {
        if (this.currentData.length === 0) {
            this.showError('No data to clear');
            return;
        }
          if (confirm(`Are you sure you want to clear all ${this.currentData.length} captured requests?\n\nThis action cannot be undone.`)) {
            chrome.runtime.sendMessage({ message: 'clear_requests' }, (response) => {
                if (response && response.success) {
                    this.currentData = [];
                    this.filteredData = [];
                    this.downloadStatus.clear(); // 清除下载状态
                    this.updateTable();
                    this.updateStats();
                    this.showSuccess('All captured data cleared successfully');
                } else {
                    this.showError('Failed to clear data');
                }
            });
        }
    }    /**
     * 导出数据
     */    /**
     * 导出数据（简化为URL数组格式）
     */
    exportData() {
        if (this.filteredData.length === 0) {
            this.showError('No data to export');
            return;
        }

        // 使用资源检查功能过滤，只导出选中的可下载资源URL
        const selectedDownloadableUrls = this.filteredData
            .filter(request => this.isDownloadableResource(request) && !this.excludedResources.has(request.url))
            .map(request => request.url);

        if (selectedDownloadableUrls.length === 0) {
            this.showError('No selected downloadable resources found to export');
            return;
        }

        // 创建简化的JSON数据（仅包含URL数组）
        const dataStr = JSON.stringify(selectedDownloadableUrls, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // 生成包含完整时间的文件名
        const now = new Date();
        const dateStr = now.getFullYear() + 
                       String(now.getMonth() + 1).padStart(2, '0') + 
                       String(now.getDate()).padStart(2, '0');
        const timeStr = String(now.getHours()).padStart(2, '0') + 
                       String(now.getMinutes()).padStart(2, '0') + 
                       String(now.getSeconds()).padStart(2, '0');
        const filename = `resource_urls_${dateStr}_${timeStr}.json`;
        
        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                this.showError('Export failed: ' + chrome.runtime.lastError.message);
            } else {
                this.showSuccess(`Exported ${selectedDownloadableUrls.length} selected resource URLs to ${filename}`);
            }
            URL.revokeObjectURL(url);
        });
    }/**
     * 保存单个资源
     */
    async saveIndividualResource(url, index) {
        // 从过滤后的数据中找到对应的资源
        const resource = this.filteredData[index];
        if (!resource || resource.url !== url) {
            this.showToast('Resource not found', 'error');
            return;
        }

        // 检查是否可下载
        if (!this.isDownloadableResource(resource)) {
            this.showToast('This resource type is not downloadable', 'warning');
            return;
        }        try {
            // 第一步：更新状态为正在下载
            this.updateResourceStatus(index, 'downloading');
            
            // 第二步：打开文件夹选择器
            console.log('Opening folder picker for resource:', resource.url);
              if (window.showDirectoryPicker) {
                // 先显示说明
                this.showToast('📁 Note: Due to browser security, some files may be saved to Downloads folder with organized structure', 'info');
                
                const directoryHandle = await window.showDirectoryPicker({
                    mode: 'readwrite'
                });
                  console.log('User selected folder:', directoryHandle.name);
                this.showToast(`Selected folder: ${directoryHandle.name}`, 'success');                // 第三步：保存资源（智能选择方案）
                await this.saveResourceSmart(resource, directoryHandle, index);
            } else {
                this.showToast('Your browser does not support folder picker', 'error');
            }        } catch (error) {
            this.updateResourceStatus(index, 'failed');
            if (error.name === 'AbortError') {
                this.showToast('Folder selection cancelled', 'info');
                this.updateResourceStatus(index, 'ready');
            } else {
                console.error('Save individual resource failed:', error);
                this.showToast('Failed to save resource: ' + error.message, 'error');
            }        }    }

    /**
     * 智能保存资源（尝试直接保存，失败则降级到Downloads）
     */
    async saveResourceSmart(resource, directoryHandle, index) {
        try {
            // 先尝试直接保存到用户选择的目录
            await this.saveResourceToUserDirectory(resource, directoryHandle, index);
        } catch (error) {
            console.log('Direct save failed, falling back to Downloads API:', error.message);
            // 降级到Downloads API
            this.showToast('⚠️ Using Downloads folder due to browser restrictions...', 'warning');
            await this.saveResourceWithDownloadsAPI(resource, directoryHandle.name, index);
        }
    }

    /**
     * 保存资源到用户选择的目录
     */
    async saveResourceToUserDirectory(resource, directoryHandle, index) {
        try {
            // 解析URL获取域名和路径
            const url = new URL(resource.url);
            const domain = url.hostname;
            const pathname = url.pathname;
            
            console.log('Saving resource to user directory:');
            console.log('  Domain:', domain);
            console.log('  Path:', pathname);
            
            // 分析路径，创建目录结构
            const pathSegments = pathname.split('/').filter(segment => segment !== '');
            console.log('  Path segments:', pathSegments);
            
            // 创建域名文件夹
            let currentHandle = directoryHandle;
            
            // 第一级：域名文件夹
            try {
                const domainHandle = await currentHandle.getDirectoryHandle(domain, { create: true });
                currentHandle = domainHandle;
                console.log('  ✅ Created/accessed domain folder:', domain);
            } catch (error) {
                console.error('Failed to create domain folder:', error);
                throw new Error(`Failed to create domain folder: ${domain}`);
            }
            
            // 后续级别：路径文件夹（排除最后一个文件名）
            if (pathSegments.length > 1) {
                const directorySegments = pathSegments.slice(0, -1); // 去掉最后的文件名
                
                for (const segment of directorySegments) {
                    if (segment && segment.trim() !== '') {
                        try {
                            const segmentHandle = await currentHandle.getDirectoryHandle(segment, { create: true });
                            currentHandle = segmentHandle;
                            console.log('  ✅ Created/accessed path folder:', segment);
                        } catch (error) {
                            console.error(`Failed to create path folder: ${segment}`, error);
                            // 继续，不中断整个过程
                        }
                    }
                }
            }            // 获取资源数据
            console.log('  📥 Fetching resource data...');
            
            // 尝试直接fetch
            let blob;
            const response = await fetch(resource.url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            blob = await response.blob();
              // 生成文件名
            const filename = this.generateFilename(resource, index + 1);
            console.log('  📝 Generated filename:', filename);
            
            // 获取文件数据
            console.log('  📥 Getting file data...');
            
            // 创建文件并写入数据
            const fileHandle = await currentHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            
            await writable.write(blob);
            await writable.close();
            
            // 更新状态为已下载
            this.updateResourceStatus(index, 'downloaded');
            
            // 显示成功信息
            const directoryPath = [domain, ...pathSegments.slice(0, -1)].filter(p => p).join('/');
            this.showToast(`✅ File saved: ${directoryPath}/${filename}`, 'success');
              } catch (error) {
            console.error('Failed to save resource to user directory:', error);
            this.updateResourceStatus(index, 'failed');
            // 重新抛出错误，让上级方法处理降级
            throw error;
        }
    }    /**
     * 使用Chrome Downloads API保存单个资源（降级方案）
     */
    async saveResourceWithDownloadsAPI(resource, folderName, index) {
        try {
            // 解析URL获取域名和路径
            const url = new URL(resource.url);
            const domain = url.hostname;
            const pathname = url.pathname;
            
            // 生成目录路径
            const pathSegments = pathname.split('/').filter(segment => segment !== '');
            const directorySegments = pathSegments.slice(0, -1); // 去掉文件名部分
            
            let directoryPath = domain;
            if (directorySegments.length > 0) {
                directoryPath += '/' + directorySegments.join('/');
            }
            
            // 生成文件名
            const filename = this.generateFilename(resource, index + 1);
            
            // 生成完整的下载路径（直接使用用户选择的文件夹名，不添加时间戳）
            const fullPath = `${folderName}/${directoryPath}/${filename}`;
            
            console.log('Downloading resource to:', fullPath);
            
            // 使用Chrome Downloads API下载
            await new Promise((resolve, reject) => {
                chrome.downloads.download({
                    url: resource.url,
                    filename: fullPath,
                    saveAs: false
                }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        console.error('Download failed:', chrome.runtime.lastError.message);
                        this.updateResourceStatus(index, 'failed');
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        console.log('Download started:', filename);
                        
                        // 监听下载完成
                        const onDownloadChanged = (downloadDelta) => {
                            if (downloadDelta.id === downloadId && downloadDelta.state) {
                                if (downloadDelta.state.current === 'complete') {
                                    chrome.downloads.onChanged.removeListener(onDownloadChanged);
                                    this.updateResourceStatus(index, 'downloaded');
                                    console.log('Download completed:', filename);
                                    resolve(downloadId);
                                } else if (downloadDelta.state.current === 'interrupted') {
                                    chrome.downloads.onChanged.removeListener(onDownloadChanged);
                                    this.updateResourceStatus(index, 'failed');
                                    reject(new Error('Download was interrupted'));
                                }
                            }
                        };
                        
                        chrome.downloads.onChanged.addListener(onDownloadChanged);
                        
                        // 设置超时
                        setTimeout(() => {
                            chrome.downloads.onChanged.removeListener(onDownloadChanged);
                            this.updateResourceStatus(index, 'failed');
                            reject(new Error('Download timeout'));
                        }, 30000); // 30秒超时
                    }
                });
            });
            
            // 显示成功信息
            this.showToast(`✅ File saved: Downloads/${fullPath}`, 'success');
            
        } catch (error) {
            console.error('Failed to save resource:', error);
            this.updateResourceStatus(index, 'failed');
            this.showToast('❌ Failed to save file: ' + error.message, 'error');
        }
    }

    /**
     * 更新资源状态
     */
    updateResourceStatus(index, status) {
        const statusCell = document.querySelector(`tr[data-index="${index}"] .download-status`);
        if (statusCell) {
            statusCell.textContent = this.getStatusText(status);
            statusCell.className = `download-status status-${status}`;
        }
    }

    /**
     * 获取状态文本
     */
    getStatusText(status) {
        const statusTexts = {
            'ready': 'Ready',
            'downloading': 'Downloading...',
            'downloaded': 'Downloaded',
            'failed': 'Failed',
            'excluded': 'N/A'
        };
        return statusTexts[status] || status;
    }

    /**
     * 按域名+路径创建目录结构（保留用于批量导出）
     */
    async createDirectoryStructure(resource, directoryHandle) {
        try {
            // 解析URL获取域名和路径
            const url = new URL(resource.url);
            const domain = url.hostname;
            const pathname = url.pathname;
            
            console.log('Creating directory structure for:');
            console.log('  Domain:', domain);
            console.log('  Path:', pathname);
            
            // 分析路径，创建目录结构
            const pathSegments = pathname.split('/').filter(segment => segment !== '');
            console.log('  Path segments:', pathSegments);
            
            // 创建域名文件夹
            let currentHandle = directoryHandle;
            
            // 第一级：域名文件夹
            try {
                const domainHandle = await currentHandle.getDirectoryHandle(domain, { create: true });
                currentHandle = domainHandle;
                console.log('  ✅ Created/accessed domain folder:', domain);
            } catch (error) {
                console.error('Failed to create domain folder:', error);
                throw new Error(`Failed to create domain folder: ${domain}`);
            }
            
            // 后续级别：路径文件夹（排除最后一个文件名）
            if (pathSegments.length > 1) {
                const directorySegments = pathSegments.slice(0, -1); // 去掉最后的文件名
                
                for (const segment of directorySegments) {
                    if (segment && segment.trim() !== '') {
                        try {
                            const segmentHandle = await currentHandle.getDirectoryHandle(segment, { create: true });
                            currentHandle = segmentHandle;
                            console.log('  ✅ Created/accessed path folder:', segment);
                        } catch (error) {
                            console.error(`Failed to create path folder: ${segment}`, error);
                            // 继续，不中断整个过程
                        }
                    }
                }
            }
            
            // 显示成功信息
            const directoryPath = [domain, ...pathSegments.slice(0, -1)].filter(p => p).join('/');
            this.showToast(`✅ Directory structure created: ${directoryPath}`, 'success');
            
        } catch (error) {
            console.error('Failed to create directory structure:', error);
            this.showToast('❌ Failed to create directory structure: ' + error.message, 'error');
        }
    }    /**
     * 导出资源文件 - 直接批量保存到Downloads目录
     */
    async exportResources() {
        // 只导出选中的可下载资源
        const resources = this.getSelectedDownloadableResources();

        if (resources.length === 0) {
            this.showToast('No selected downloadable resources found', 'warning');
            return;
        }

        // 生成时间戳用于文件夹名
        const now = new Date();
        const timestamp = now.getFullYear() + 
                         String(now.getMonth() + 1).padStart(2, '0') + 
                         String(now.getDate()).padStart(2, '0') + '_' +
                         String(now.getHours()).padStart(2, '0') + 
                         String(now.getMinutes()).padStart(2, '0') + 
                         String(now.getSeconds()).padStart(2, '0');

        const exportFolderName = `WebRequestCapture_${timestamp}`;
        
        this.showToast(`🚀 Starting batch export of ${resources.length} resources using Chrome Downloads API to Downloads/${exportFolderName}/`, 'info');
        
        // 重置所有资源的下载状态
        resources.forEach((resource, index) => {
            const originalIndex = this.filteredData.findIndex(r => r.url === resource.url);
            if (originalIndex !== -1) {
                this.updateResourceStatus(originalIndex, 'downloading');
            }
        });
        
        let downloaded = 0;
        let failed = 0;        // 批量下载所有资源，直接使用Chrome Downloads API
        for (let i = 0; i < resources.length; i++) {
            const resource = resources[i];
            const originalIndex = this.filteredData.findIndex(r => r.url === resource.url);
            
            try {
                // 直接使用Chrome Downloads API批量保存
                await this.saveResourceWithChromeDownloads(resource, exportFolderName, originalIndex, i + 1);
                downloaded++;
                
                if (originalIndex !== -1) {
                    this.updateResourceStatus(originalIndex, 'downloaded');
                }
            } catch (error) {
                console.error('Failed to download resource:', resource.url, error);
                failed++;
                
                if (originalIndex !== -1) {
                    this.updateResourceStatus(originalIndex, 'failed');
                }
            }
            
            // 添加延迟避免过快请求
            if (i < resources.length - 1) {
                await this.sleep(100);
            }
        }

        // 创建索引文件
        await this.createBatchExportIndexFile(exportFolderName, resources);

        // 显示最终结果
        if (downloaded > 0) {
            this.showToast(`✅ Batch export completed! ${downloaded} files saved to Downloads/${exportFolderName}/`, 'success');
        }        if (failed > 0) {
            this.showToast(`⚠️ ${failed} files failed to download due to server restrictions`, 'warning');
        }
    }

    /**
     * 使用文件夹选择器导出资源
     */
    async exportResourcesWithFolderPicker(resources, categorizedResources) {        // 选择目标文件夹 - 仅用于确定文件夹名称
        let userSelectedFolderName = 'WebRequestCapture';
        try {
            const directoryHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'downloads'
            });
            userSelectedFolderName = directoryHandle.name;
            console.log('User selected folder name:', userSelectedFolderName);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Folder picker error:', error);
            }
        }

        // 生成导出文件夹名称
        const timestamp = new Date().getFullYear() + 
                         String(new Date().getMonth() + 1).padStart(2, '0') + 
                         String(new Date().getDate()).padStart(2, '0') + '_' +
                         String(new Date().getHours()).padStart(2, '0') + 
                         String(new Date().getMinutes()).padStart(2, '0');
        const exportFolderName = `${userSelectedFolderName}_${timestamp}`;        this.showToast(`📁 Files will be organized in Downloads/${exportFolderName}/ with proper folder structure`, 'info');
        this.showToast(`🚀 Starting export of ${resources.length} resources...`, 'info');
        
        // 重置下载状态
        resources.forEach(resource => {
            this.downloadStatus.set(resource.url, 'pending');
        });
        this.updateTable();
        
        let downloaded = 0;
        let failed = 0;
        
        // 为每个分类创建文件夹并下载资源
        for (const [categoryPath, categoryResources] of Object.entries(categorizedResources)) {
            if (categoryResources.length === 0) continue;            for (let i = 0; i < categoryResources.length; i++) {
                const resource = categoryResources[i];
                try {
                    await this.downloadResourceWithChrome(resource, exportFolderName, categoryPath, i + 1);
                    downloaded++;
                } catch (error) {
                    console.error('Failed to download resource:', resource.url, error);
                    failed++;
                }
                
                // 添加延迟避免过快请求
                if (i < categoryResources.length - 1) {
                    await this.sleep(50);
                }
            }
        }        // 创建索引文件
        await this.createResourceIndexFile(exportFolderName, categorizedResources);

        if (downloaded > 0) {
            this.showToast(`Export completed! ${downloaded} files saved to Downloads/${exportFolderName}/`, 'success');
        }
        if (failed > 0) {
            this.showToast(`${failed} files failed due to server restrictions.`, 'warning');
        }
    }    /**
     * 使用默认方式导出资源（Chrome下载API）
     */async exportResourcesDefault(resources, categorizedResources) {
        // 生成时间戳用于文件夹名
        const now = new Date();
        const timestamp = now.getFullYear() + 
                         String(now.getMonth() + 1).padStart(2, '0') + 
                         String(now.getDate()).padStart(2, '0') + '_' +
                         String(now.getHours()).padStart(2, '0') + 
                         String(now.getMinutes()).padStart(2, '0') + 
                         String(now.getSeconds()).padStart(2, '0');

        const folderName = `WebRequestCapture_${timestamp}`;
        
        this.showToast(`Starting export of ${resources.length} resources...`, 'info');
        
        let downloaded = 0;
        let failed = 0;
        
        // 为每个分类下载资源
        for (const [categoryPath, categoryResources] of Object.entries(categorizedResources)) {
            if (categoryResources.length === 0) continue;

            for (let i = 0; i < categoryResources.length; i++) {
                const resource = categoryResources[i];
                try {
                    await this.downloadResourceWithChrome(resource, folderName, categoryPath, i + 1);
                    downloaded++;
                } catch (error) {
                    console.error('Failed to download resource:', resource.url, error);
                    failed++;
                }
                
                // 添加延迟避免过快请求
                if (i < categoryResources.length - 1) {
                    await this.sleep(100);
                }
            }
        }

        // 创建索引文件
        await this.createResourceIndexFile(folderName, categorizedResources);

        if (downloaded > 0) {
            this.showToast(`Export completed! ${downloaded} files downloaded to Downloads/${folderName}`, 'success');
        }
        if (failed > 0) {
            this.showToast(`${failed} files failed to download.`, 'warning');
        }
    }    /**
     * 按域名和路径组织资源
     */
    categorizeResources(resources) {
        console.log('=== Categorizing Resources ===');
        console.log('Total resources to categorize:', resources.length);
        
        const categories = {};

        resources.forEach((resource, index) => {
            try {
                console.log(`Processing resource ${index + 1}:`, resource.url);
                
                const url = new URL(resource.url);
                const domain = url.hostname;
                const path = url.pathname;
                
                console.log(`  Domain: ${domain}, Path: ${path}`);
                  // 获取路径的目录部分（去掉文件名）
                const pathSegments = path.split('/').filter(segment => segment !== '');
                console.log(`  Path segments:`, pathSegments);
                
                let categoryKey;
                // 如果是根路径的文件（没有路径或只有一个段），放在域名根目录
                if (pathSegments.length === 0) {
                    categoryKey = domain;
                } else {
                    // 去掉最后一个段（通常是文件名），保留目录路径
                    const directorySegments = pathSegments.slice(0, -1);
                    if (directorySegments.length === 0) {
                        categoryKey = domain;
                    } else {
                        categoryKey = `${domain}/${directorySegments.join('/')}`;
                    }
                }
                
                console.log(`  Final category: ${categoryKey}`);
                
                if (!categories[categoryKey]) {
                    categories[categoryKey] = [];
                }
                categories[categoryKey].push(resource);
            } catch (error) {
                console.error(`Error processing resource ${index + 1}:`, resource.url, error);
                // 如果URL解析失败，放到 Others 分类
                if (!categories['Others']) {
                    categories['Others'] = [];
                }
                categories['Others'].push(resource);
            }
        });

        console.log('=== Categorization Complete ===');
        console.log('Categories created:', Object.keys(categories));
        Object.entries(categories).forEach(([key, resources]) => {
            console.log(`  ${key}: ${resources.length} resources`);
        });

        return categories;
    }    /**
     * 使用Chrome下载API下载资源
     */
    async downloadResourceWithChrome(resource, folderName, categoryPath, index) {
        // 设置下载状态为正在下载
        this.downloadStatus.set(resource.url, 'downloading');
        this.updateTable(); // 更新表格显示状态
        
        return new Promise((resolve, reject) => {
            try {
                const filename = this.generateFilename(resource, index);
                
                // 清理分类路径，确保安全
                const safeCategoryPath = this.sanitizePath(categoryPath);
                const filepath = `${folderName}/${safeCategoryPath}/${filename}`;

                chrome.downloads.download({
                    url: resource.url,
                    filename: filepath,
                    saveAs: false
                }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        console.error('Download failed:', chrome.runtime.lastError.message);
                        this.downloadStatus.set(resource.url, 'failed');
                        this.updateTable();
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        console.log('Download started:', filename);
                        
                        // 监听下载完成
                        const onDownloadChanged = (downloadDelta) => {
                            if (downloadDelta.id === downloadId && downloadDelta.state) {
                                if (downloadDelta.state.current === 'complete') {
                                    chrome.downloads.onChanged.removeListener(onDownloadChanged);
                                    this.downloadStatus.set(resource.url, 'completed');
                                    this.updateTable();
                                    console.log('Download completed:', filename);
                                    resolve(downloadId);
                                } else if (downloadDelta.state.current === 'interrupted') {
                                    chrome.downloads.onChanged.removeListener(onDownloadChanged);
                                    this.downloadStatus.set(resource.url, 'failed');
                                    this.updateTable();
                                    reject(new Error('Download was interrupted'));
                                }
                            }
                        };
                        
                        chrome.downloads.onChanged.addListener(onDownloadChanged);
                        
                        // 设置超时
                        setTimeout(() => {
                            chrome.downloads.onChanged.removeListener(onDownloadChanged);
                            this.downloadStatus.set(resource.url, 'failed');
                            this.updateTable();
                            reject(new Error('Download timeout'));
                        }, 30000); // 30秒超时
                    }
                });
            } catch (error) {
                this.downloadStatus.set(resource.url, 'failed');
                this.updateTable();
                reject(error);
            }
        });
    }

    /**
     * 清理路径，确保文件系统安全
     */
    sanitizePath(path) {
        if (!path) return 'root';
        
        return path
            .replace(/[<>:"/\\|?*]/g, '_')  // 替换不安全字符
            .replace(/\.\./g, '_')          // 防止目录遍历
            .replace(/^\./, '_')            // 处理隐藏文件
            .replace(/\s+/g, '_')           // 替换空格
            .replace(/_{2,}/g, '_')         // 合并连续下划线
            .replace(/^_+|_+$/g, '')        // 移除开头和结尾的下划线
            .substring(0, 200);             // 限制长度
    }/**
     * 生成文件名
     */
    generateFilename(resource, index) {
        try {
            const url = new URL(resource.url);
            let filename = url.pathname.split('/').pop();
            
            // 如果没有文件名，尝试从查询参数获取
            if (!filename || filename === '') {
                filename = url.searchParams.get('filename') || 
                          url.searchParams.get('name') || 
                          url.searchParams.get('file');
            }
            
            // 如果还是没有文件名，根据URL路径生成
            if (!filename || filename === '') {
                const pathSegments = url.pathname.split('/').filter(s => s !== '');
                if (pathSegments.length > 0) {
                    filename = pathSegments[pathSegments.length - 1];
                }
            }
            
            // 如果依然没有文件名，生成默认名称
            if (!filename || filename === '') {
                const ext = this.getExtensionFromUrl(resource.url);
                filename = `resource_${index}_${Date.now()}${ext}`;
            }
            
            // 如果没有扩展名，尝试添加一个
            if (!filename.includes('.')) {
                const ext = this.getExtensionFromUrl(resource.url);
                if (ext) {
                    filename += ext;
                }
            }

            // 清理文件名，确保安全
            filename = this.sanitizeFilename(filename);
            
            // 确保文件名不为空且有效
            if (!filename || filename === '' || filename === '.') {
                filename = `resource_${index}_${Date.now()}.bin`;
            }

            return filename;
        } catch (error) {
            console.warn('Failed to generate filename for:', resource.url, error);
            return `resource_${index}_${Date.now()}.bin`;
        }
    }

    /**
     * 从URL推断扩展名
     */
    getExtensionFromUrl(url) {
        try {
            const urlLower = url.toLowerCase();
            
            // 常见的扩展名列表
            const commonExtensions = [
                // 图片
                '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff', '.avif',
                // 音频
                '.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', '.wma', '.opus',
                // 视频
                '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.3gp', '.mpg', '.mpeg',
                // 文档
                '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf',
                // 代码和数据
                '.css', '.js', '.json', '.xml', '.yaml', '.yml', '.html', '.htm',
                // 字体
                '.ttf', '.woff', '.woff2', '.eot', '.otf',
                // 3D和游戏
                '.obj', '.fbx', '.dae', '.blend', '.unity3d', '.asset', '.lm', '.model',
                // 压缩文件
                '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2',
                // 其他
                '.bin', '.dat', '.bundle', '.pak', '.cache', '.db'
            ];
            
            // 查找匹配的扩展名
            for (const ext of commonExtensions) {
                if (urlLower.includes(ext)) {
                    return ext;
                }
            }
            
            // 如果没有找到已知扩展名，返回 .bin
            return '.bin';
        } catch {
            return '.bin';
        }
    }

    /**
     * 清理文件名，移除不安全字符
     */
    sanitizeFilename(filename) {
        if (!filename) return '';
        
        return filename
            .replace(/[<>:"/\\|?*]/g, '_')  // 替换文件系统不安全字符
            .replace(/\s+/g, '_')          // 替换空格
            .replace(/_{2,}/g, '_')        // 合并连续下划线
            .replace(/^_+|_+$/g, '')       // 移除开头和结尾的下划线
            .substring(0, 200);            // 限制长度
    }

    /**
     * 创建资源索引文件
     */
    async createResourceIndexFile(folderName, categorizedResources) {
        try {
            const indexContent = this.generateIndexContent(categorizedResources);
            const blob = new Blob([indexContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            await new Promise((resolve, reject) => {
                chrome.downloads.download({
                    url: url,
                    filename: `${folderName}/index.txt`,
                    saveAs: false
                }, (downloadId) => {
                    URL.revokeObjectURL(url);
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(downloadId);
                    }
                });
            });
        } catch (error) {
            console.error('Failed to create index file:', error);
        }
    }    /**
     * 生成索引文件内容
     */
    generateIndexContent(categorizedResources) {
        const timestamp = new Date().toISOString();
        let content = `Web Request Capture Pro - Resource Export Index\n`;
        content += `Generated: ${timestamp}\n`;
        content += `=================================================\n\n`;

        let totalCount = 0;
        for (const [categoryPath, resources] of Object.entries(categorizedResources)) {
            if (resources.length === 0) continue;

            content += `Directory: ${categoryPath} (${resources.length} files)\n`;
            content += '-'.repeat(Math.max(categoryPath.length + 20, 50)) + '\n';

            resources.forEach((resource, index) => {
                const filename = this.generateFilename(resource, index + 1);
                content += `${index + 1}. ${filename}\n`;
                content += `   URL: ${resource.url}\n`;
                content += `   Status: ${resource.status}\n`;
                content += `   Type: ${resource.type}\n`;
                content += `   Method: ${resource.method}\n`;
                if (resource.size) {
                    content += `   Size: ${this.formatBytes(resource.size)}\n`;
                }
                content += '\n';
            });

            totalCount += resources.length;
        }

        content += `\nSummary:\n`;
        content += `Total Resources: ${totalCount}\n`;
        content += `Total Directories: ${Object.keys(categorizedResources).length}\n`;
        
        return content;
    }

    /**
     * 创建批量导出的索引文件
     */
    async createBatchExportIndexFile(exportFolderName, resources) {
        try {
            const now = new Date();
            const exportDate = now.toLocaleString();
            
            let indexContent = `Web Request Capture Pro - Batch Export\n`;
            indexContent += `Export Date: ${exportDate}\n`;
            indexContent += `Total Resources: ${resources.length}\n`;
            indexContent += `\n========================================\n\n`;
              resources.forEach((resource, index) => {
                const url = new URL(resource.url);
                const domain = url.hostname;
                const path = url.pathname;
                const filename = this.generateFilename(resource, index + 1);
                
                // 生成目录路径
                const pathSegments = path.split('/').filter(segment => segment !== '');
                const directorySegments = pathSegments.slice(0, -1);
                let directoryPath = domain;
                if (directorySegments.length > 0) {
                    directoryPath += '/' + directorySegments.join('/');
                }
                
                indexContent += `${index + 1}. ${filename}\n`;
                indexContent += `   URL: ${resource.url}\n`;
                indexContent += `   Directory: ${directoryPath}\n`;
                indexContent += `   Type: ${resource.type || 'unknown'}\n`;
                indexContent += `   Method: ${resource.method || 'GET'}\n`;
                indexContent += `\n`;
            });
            
            const indexBlob = new Blob([indexContent], { type: 'text/plain' });
            const indexUrl = URL.createObjectURL(indexBlob);
            
            // 使用Chrome Downloads API保存索引文件
            chrome.downloads.download({
                url: indexUrl,
                filename: `${exportFolderName}/export_index.txt`,
                saveAs: false
            }, (downloadId) => {
                URL.revokeObjectURL(indexUrl);
                if (chrome.runtime.lastError) {
                    console.error('Failed to save index file:', chrome.runtime.lastError);
                }
            });
            
        } catch (error) {
            console.error('Failed to create index file:', error);
        }
    }

    /**
     * 延迟函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 切换设置面板
     */
    toggleSettings() {
        const panel = document.getElementById('settingsPanel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        if (panel.style.display === 'block') {
            this.updateSettingsUI();
        }
    }

    /**
     * 更新设置UI
     */
    updateSettingsUI() {
        document.getElementById('maxRequestsSetting').value = this.settings.maxRequests;
        document.getElementById('saveDetailsSetting').checked = this.settings.saveDetails;
        document.getElementById('blockAdsSetting').checked = this.settings.blockAds;
        document.getElementById('blockStaticSetting').checked = this.settings.blockStatic;
        document.getElementById('defaultViewSetting').value = this.settings.defaultView || 'popup';
        document.getElementById('captureModeSelect').value = this.settings.captureMode || 'all_domains';
        
        // 设置白名单域名
        if (this.settings.allowedDomains) {
            document.getElementById('allowedDomainsInput').value = this.settings.allowedDomains.join('\n');
        }
        
        // 显示/隐藏白名单设置
        this.toggleWhitelistSettings(this.settings.captureMode === 'whitelist');
        
        // 加载并显示黑名单域名
        this.loadBlockedDomains();
    }

    /**
     * 保存设置
     */
    saveSettings() {
        const newSettings = {
            maxRequests: parseInt(document.getElementById('maxRequestsSetting').value),
            saveDetails: document.getElementById('saveDetailsSetting').checked,
            blockAds: document.getElementById('blockAdsSetting').checked,
            blockStatic: document.getElementById('blockStaticSetting').checked,
            defaultView: document.getElementById('defaultViewSetting').value,
            captureMode: document.getElementById('captureModeSelect').value,
            allowedDomains: document.getElementById('allowedDomainsInput').value
                .split('\n')
                .map(domain => domain.trim())
                .filter(domain => domain.length > 0)
        };

        chrome.runtime.sendMessage({ 
            message: 'update_settings', 
            settings: newSettings 
        }, (response) => {
            if (response && response.success) {
                this.settings = newSettings;
                this.closeSettings();
                this.showSuccess('Settings saved successfully');
            } else {
                this.showError('Failed to save settings');
            }
        });
    }

    /**
     * 关闭设置面板
     */
    closeSettings() {
        document.getElementById('settingsPanel').style.display = 'none';
    }

    /**
     * 切换白名单设置显示
     */
    toggleWhitelistSettings(show) {
        const container = document.getElementById('whitelistContainer');
        if (container) {
            container.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * 获取捕获模式的显示文本
     */
    getCaptureModeText(captureMode) {
        const modeTexts = {
            'main_domain_only': 'Main Domain Only',
            'include_subdomains': 'Include Subdomains',
            'all_domains': 'All Domains + iframes',
            'whitelist': 'Whitelist Mode'
        };
        return modeTexts[captureMode] || 'Unknown Mode';
    }

    /**
     * 更新UI状态
     */
    updateUI() {
        this.updateCaptureState();
        this.updateStats();
        
        // 获取当前数据
        chrome.runtime.sendMessage({ message: 'get_captured_data' }, (response) => {
            if (response) {
                this.currentData = response.requests || [];
                this.isCapturing = !!response.isCapturing;
                if (response.targetDomain) {
                    const td = document.getElementById('targetDomain');
                    if (td) td.textContent = response.targetDomain;
                }
                this.applyFilters();
                this.updateTable();
                this.updateStats();
                this.updateCaptureState();
            }
        });
    }    /**
     * 重置当前会话
     */
    resetSession() {
        if (!confirm('Reset current session? This will clear captured requests for the active domain.')) return;
        chrome.runtime.sendMessage({ message: 'reset_session' }, (response) => {
            if (response && response.success) {
                this.currentData = [];
                this.filteredData = [];
                this.updateTable();
                this.updateStats();
                this.showSuccess('Session reset');
            } else {
                this.showError('Failed to reset session');
            }
        });
    }
    /**
     * 显示错误消息
     */
    showError(message) {
        console.error(message);
        
        // 创建临时错误提示
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            font-size: 13px;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 5秒后自动移除（错误消息显示时间稍长）
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }/**
     * 显示成功消息
     */
    showSuccess(message) {
        console.log(message);
        
        // 创建临时成功提示
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            font-size: 13px;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        `;
        toast.textContent = message;
        
        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(toast);
        
        // 3秒后自动移除
        setTimeout(() => {
            toast.remove();
            style.remove();
        }, 3000);
    }

    /**
     * 显示提示消息
     */
    showToast(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // 定义不同类型的颜色
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        
        const backgroundColor = colors[type] || colors.info;
        
        // 创建提示元素
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            font-size: 13px;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
        `;
        toast.textContent = message;
        
        // 添加动画样式
        if (!document.getElementById('toast-animation-style')) {
            const style = document.createElement('style');
            style.id = 'toast-animation-style';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        // 根据类型决定显示时间
        const duration = type === 'error' ? 5000 : 3000;
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);
    }

    /**
     * 打开独立窗口
     */
    openWindow() {
        console.log('DevTrace: Opening standalone window...');
        chrome.runtime.sendMessage({ message: 'open_window' }, (response) => {
            if (response && response.success) {
                console.log('DevTrace: Standalone window opened successfully');
                // 如果是popup模式且用户手动点击，也关闭popup
                if (this.isPopupMode()) {
                    setTimeout(() => {
                        window.close();
                    }, 300);
                }
            } else {
                console.error('DevTrace: Failed to open standalone window:', response?.error);
                this.showError('Failed to open standalone window');
            }
        });
    }

    /**
     * 检测是否为popup模式
     */
    isPopupMode() {
        // 检查窗口尺寸，popup通常有固定的小尺寸
        return window.outerWidth <= 850 && window.outerHeight <= 650;
    }

    /**
     * 使用Chrome Downloads API保存资源（批量保存专用）
     */
    async saveResourceWithChromeDownloads(resource, batchFolderName, index, fileNumber) {
        try {
            // 解析URL获取域名和路径
            const url = new URL(resource.url);
            const domain = url.hostname;
            const pathname = url.pathname;
            
            // 生成目录路径
            const pathSegments = pathname.split('/').filter(segment => segment !== '');
            const directorySegments = pathSegments.slice(0, -1); // 去掉文件名部分
            
            let directoryPath = domain;
            if (directorySegments.length > 0) {
                directoryPath += '/' + directorySegments.join('/');
            }
            
            // 生成文件名
            const filename = this.generateFilename(resource, fileNumber);
            
            // 生成完整的下载路径（使用统一的批量文件夹名）
            const fullPath = `${batchFolderName}/${directoryPath}/${filename}`;
            
            console.log('Batch downloading resource to:', fullPath);
            
            // 使用Chrome Downloads API下载
            await new Promise((resolve, reject) => {
                chrome.downloads.download({
                    url: resource.url,
                    filename: fullPath,
                    saveAs: false
                }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        console.error('Batch download failed:', chrome.runtime.lastError.message);
                        if (index !== -1) {
                            this.updateResourceStatus(index, 'failed');
                        }
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        console.log('Batch download started:', filename);
                        
                        // 监听下载完成
                        const onDownloadChanged = (downloadDelta) => {
                            if (downloadDelta.id === downloadId && downloadDelta.state) {
                                if (downloadDelta.state.current === 'complete') {
                                    chrome.downloads.onChanged.removeListener(onDownloadChanged);
                                    if (index !== -1) {
                                        this.updateResourceStatus(index, 'downloaded');
                                    }
                                    console.log('Batch download completed:', filename);
                                    resolve(downloadId);
                                } else if (downloadDelta.state.current === 'interrupted') {
                                    chrome.downloads.onChanged.removeListener(onDownloadChanged);
                                    if (index !== -1) {
                                        this.updateResourceStatus(index, 'failed');
                                    }
                                    reject(new Error('Download was interrupted'));
                                }
                            }
                        };
                        
                        chrome.downloads.onChanged.addListener(onDownloadChanged);
                        
                        // 设置超时
                        setTimeout(() => {
                            chrome.downloads.onChanged.removeListener(onDownloadChanged);
                            if (index !== -1) {
                                this.updateResourceStatus(index, 'failed');
                            }
                            reject(new Error('Download timeout'));
                        }, 30000); // 30秒超时
                    }
                });
            });
            
            // 显示成功信息（只对前几个文件显示，避免信息过多）
            if (fileNumber <= 3) {
                this.showToast(`✅ File ${fileNumber} saved: ${filename}`, 'success');
            }
            
        } catch (error) {
            console.error('Failed to save resource with Chrome Downloads:', error);
            if (index !== -1) {
                this.updateResourceStatus(index, 'failed');
            }
            throw error;
        }
    }

    /**
     * 添加窗口拖拽功能
     */
    addDragFunctionality() {
        const header = document.querySelector('.header');
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        header.style.cursor = 'move';
        header.style.userSelect = 'none';

        header.addEventListener('mousedown', (e) => {
            // 只在点击标题区域时启用拖拽
            if (e.target.closest('.url-section') || e.target.closest('.window-controls')) {
                return;
            }
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            // 获取当前窗口位置
            chrome.windows.getCurrent((window) => {
                startLeft = window.left;
                startTop = window.top;
            });
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            chrome.windows.getCurrent((window) => {
                chrome.windows.update(window.id, {
                    left: startLeft + deltaX,
                    top: startTop + deltaY
                });
            });
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });    }

    /**
     * 切换全选/取消全选
     */
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.resource-checkbox');
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        
        checkboxes.forEach(checkbox => {
            const url = decodeURIComponent(checkbox.getAttribute('data-url'));
            if (checked) {
                this.excludedResources.delete(url);
                checkbox.checked = true;
            } else {
                this.excludedResources.add(url);
                checkbox.checked = false;
            }
        });
        
        this.updateTable();
        this.updateExportResourcesButton();
        
        // 显示操作提示
        const selectedCount = this.getSelectedResourcesCount();
        this.showToast(`${checked ? 'Selected' : 'Deselected'} all resources (${selectedCount} items)`, 'info');
    }

    /**
     * 切换单个资源的选择状态
     */
    toggleResourceSelection(checkbox) {
        const url = decodeURIComponent(checkbox.getAttribute('data-url'));
        const row = checkbox.closest('tr');
        
        if (checkbox.checked) {
            this.excludedResources.delete(url);
            row.classList.remove('row-excluded');
        } else {
            this.excludedResources.add(url);
            row.classList.add('row-excluded');
        }
        
        // 更新全选复选框状态
        this.updateSelectAllCheckbox();
        this.updateExportResourcesButton();
    }

    /**
     * 更新全选复选框的状态
     */
    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        const checkboxes = document.querySelectorAll('.resource-checkbox');
        const checkedCount = document.querySelectorAll('.resource-checkbox:checked').length;
        
        if (checkedCount === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedCount === checkboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }

    /**
     * 获取选中的资源数量
     */
    getSelectedResourcesCount() {
        return this.filteredData.filter(request => 
            this.isDownloadableResource(request) && !this.excludedResources.has(request.url)
        ).length;
    }

    /**
     * 获取选中的可下载资源
     */
    getSelectedDownloadableResources() {
        return this.filteredData.filter(request => 
            this.isDownloadableResource(request) && !this.excludedResources.has(request.url)
        );
    }
}

// 当DOM加载完成时初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new WebRequestCaptureApp();
});