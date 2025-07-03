// Enhanced background.js for Web Request Capture v2.0
let captureState = {
    isCapturing: false,
    capturedRequests: [],
    settings: {
        maxRequests: 1000,
        saveDetails: false,
        blockAds: true,
        blockStatic: false,
        defaultView: 'popup',
        captureMode: 'all_domains', // 新增：捕获模式
        allowedDomains: [], // 新增：白名单域名列表
        blockedDomains: [
            'doubleclick.net',
            'googlesyndication.com',
            'googletagmanager.com',
            'facebook.com/tr',
            'google-analytics.com',
            'googleadservices.com'
        ]
    },
    targetDomain: null,
    requestCounter: 0
};

// 窗口管理
let captureWindow = null;

// 广告和追踪域名黑名单
const AD_DOMAINS = [
    'doubleclick.net', 'googlesyndication.com', 'googletagmanager.com',
    'google-analytics.com', 'googleadservices.com', 'facebook.com',
    'amazon-adsystem.com', 'adsystem.amazon.com', 'scorecardresearch.com'
];

// 静态资源类型
const STATIC_TYPES = ['image', 'stylesheet', 'font', 'media'];

// 初始化存储设置
chrome.runtime.onInstalled.addListener(() => {
    loadSettings();
});

// 消息处理器
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        switch (request.message) {
            case 'start_capture':
                handleStartCapture(request, sendResponse);
                break;
            case 'stop_capture':
                handleStopCapture(sendResponse);
                break;
            case 'get_captured_data':
                sendResponse({ 
                    requests: captureState.capturedRequests,
                    total: captureState.requestCounter,
                    isCapturing: captureState.isCapturing
                });
                break;
            case 'clear_requests':
                handleClearRequests(sendResponse);
                break;
            case 'update_settings':
                handleUpdateSettings(request.settings, sendResponse);
                break;
            case 'get_settings':
                sendResponse({ settings: captureState.settings });
                break;
            case 'add_blocked_domain':
                handleAddBlockedDomain(request.domain, sendResponse);
                break;
            case 'remove_blocked_domain':
                handleRemoveBlockedDomain(request.domain, sendResponse);
                break;
            case 'close_window':
                handleCloseWindow(sendResponse);
                break;
            case 'minimize_window':
                handleMinimizeWindow(sendResponse);
                break;
            case 'open_window':
                handleOpenWindow(sendResponse);
                break;
            default:
                sendResponse({ error: 'Unknown message type' });
        }
    } catch (error) {
        console.error('Background script error:', error);
        sendResponse({ error: error.message });
    }
    return true; // 保持消息通道开放
});

// 开始捕获请求
async function handleStartCapture(request, sendResponse) {
    try {
        if (!request.url || !request.url.trim()) {
            throw new Error('URL is required');
        }

        let targetUrl;
        try {
            targetUrl = new URL(request.url);
        } catch (urlError) {
            throw new Error('Invalid URL format. Please check the URL and try again.');
        }

        // 根据捕获模式决定监听的URL模式
        const captureMode = captureState.settings.captureMode || 'all_domains';
        let urls;
        
        switch (captureMode) {
            case 'main_domain_only':
                urls = [`${targetUrl.protocol}//${targetUrl.host}/*`];
                break;
            case 'include_subdomains':
                urls = [`${targetUrl.protocol}//*.${targetUrl.hostname}/*`, `${targetUrl.protocol}//${targetUrl.host}/*`];
                break;
            case 'all_domains':
            case 'whitelist':
                urls = ["<all_urls>"]; // 监听所有URL，在shouldCaptureRequest中进行过滤
                break;
            default:
                urls = [`${targetUrl.protocol}//${targetUrl.host}/*`];
        }

        // 请求权限
        const granted = await chrome.permissions.request({
            origins: urls
        });

        if (!granted) {
            throw new Error('Permission denied for this domain');
        }

        // 重置状态
        captureState.capturedRequests = [];
        captureState.requestCounter = 0;
        captureState.isCapturing = true;
        captureState.targetDomain = targetUrl.hostname;

        // 添加请求监听器 - 根据模式监听不同范围的请求
        chrome.webRequest.onBeforeRequest.addListener(
            handleWebRequest,
            { urls: urls },
            ["requestBody"]
        );

        // 添加响应监听器以获取状态码和响应头
        chrome.webRequest.onCompleted.addListener(
            handleWebResponse,
            { urls: urls },
            ["responseHeaders"]
        );

        // 更新图标
        chrome.action.setIcon({ path: "icon48.png" });

        sendResponse({ 
            success: true, 
            targetDomain: captureState.targetDomain,
            captureMode: captureMode
        });

        console.log(`Started capturing requests for domain: ${captureState.targetDomain} (mode: ${captureMode})`);
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

// 停止捕获请求
function handleStopCapture(sendResponse) {
    try {
        captureState.isCapturing = false;
        
        // 移除监听器
        chrome.webRequest.onBeforeRequest.removeListener(handleWebRequest);
        chrome.webRequest.onCompleted.removeListener(handleWebResponse);
        
        // 恢复默认图标
        chrome.action.setIcon({ path: "default_icon48.png" });
        
        sendResponse({ 
            success: true, 
            totalCaptured: captureState.requestCounter 
        });

        console.log(`Stopped capturing. Total requests: ${captureState.requestCounter}`);
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

// 清空请求数据
function handleClearRequests(sendResponse) {
    captureState.capturedRequests = [];
    captureState.requestCounter = 0;
    sendResponse({ success: true });
}

// 更新设置
function handleUpdateSettings(newSettings, sendResponse) {
    try {
        captureState.settings = { ...captureState.settings, ...newSettings };
        saveSettings();
        sendResponse({ success: true });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

// 添加域名到黑名单
function handleAddBlockedDomain(domain, sendResponse) {
    try {
        if (!domain || typeof domain !== 'string') {
            throw new Error('Invalid domain');
        }
        
        // 清理域名格式
        const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        
        // 检查是否已存在
        if (!captureState.settings.blockedDomains.includes(cleanDomain)) {
            captureState.settings.blockedDomains.push(cleanDomain);
            saveSettings();
            
            console.log(`✅ Added domain to blacklist: ${cleanDomain}`);
            console.log(`📋 Current blacklist:`, captureState.settings.blockedDomains);
            sendResponse({ 
                success: true, 
                domain: cleanDomain,
                blockedDomains: captureState.settings.blockedDomains 
            });
        } else {
            sendResponse({ 
                success: false, 
                error: 'Domain already in blacklist',
                blockedDomains: captureState.settings.blockedDomains 
            });
        }
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

// 从黑名单移除域名
function handleRemoveBlockedDomain(domain, sendResponse) {
    try {
        const index = captureState.settings.blockedDomains.indexOf(domain);
        if (index > -1) {
            captureState.settings.blockedDomains.splice(index, 1);
            saveSettings();
            
            console.log(`Removed domain from blacklist: ${domain}`);
            sendResponse({ 
                success: true, 
                domain: domain,
                blockedDomains: captureState.settings.blockedDomains 
            });
        } else {
            sendResponse({ 
                success: false, 
                error: 'Domain not found in blacklist',
                blockedDomains: captureState.settings.blockedDomains 
            });
        }
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

// 处理Web请求
function handleWebRequest(details) {
    if (!captureState.isCapturing) return;

    try {
        const url = new URL(details.url);
        const domain = url.hostname;

        // 检查是否应该捕获此请求
        if (!shouldCaptureRequest(domain, details.type)) {
            return;
        }

        // 创建请求记录
        const requestRecord = {
            id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: details.url,
            method: details.method || 'GET',
            domain: domain,
            type: details.type || 'other',
            timestamp: Date.now(),
            initiator: details.initiator || 'unknown',
            status: 'pending' // 将在响应时更新
        };

        // 添加详细信息（如果启用）
        if (captureState.settings.saveDetails) {
            requestRecord.requestHeaders = details.requestHeaders || [];
            if (details.requestBody) {
                requestRecord.requestBody = details.requestBody;
            }
        }

        // 添加到捕获列表（FIFO策略）
        addRequestToCapture(requestRecord);

        // 通知popup更新
        notifyPopupUpdate();

    } catch (error) {
        console.error('Error processing web request:', error);
    }
}

// 处理Web响应
function handleWebResponse(details) {
    if (!captureState.isCapturing) return;

    try {
        // 查找对应的请求记录并更新状态
        const requestIndex = captureState.capturedRequests.findIndex(
            req => req.url === details.url && req.status === 'pending'
        );

        if (requestIndex !== -1) {
            captureState.capturedRequests[requestIndex].status = details.statusCode || 0;
            if (captureState.settings.saveDetails) {
                captureState.capturedRequests[requestIndex].responseHeaders = details.responseHeaders || [];
            }
        }
    } catch (error) {
        console.error('Error processing web response:', error);
    }
}

// 检查是否应该捕获请求
function shouldCaptureRequest(domain, type) {
    // 新增：支持多种捕获模式
    const captureMode = captureState.settings.captureMode || 'main_domain_only';
    
    switch (captureMode) {
        case 'main_domain_only':
            // 原有模式：只捕获主域名
            if (domain !== captureState.targetDomain) {
                return false;
            }
            break;
            
        case 'include_subdomains':
            // 包含子域名模式
            if (!domain.endsWith(captureState.targetDomain) && domain !== captureState.targetDomain) {
                return false;
            }
            break;
            
        case 'all_domains':
            // 捕获所有域名（包括iframe和第三方资源）
            // 不进行域名过滤，捕获所有请求
            break;
            
        case 'whitelist':
            // 白名单模式：只捕获指定的域名列表
            const allowedDomains = captureState.settings.allowedDomains || [captureState.targetDomain];
            const isAllowed = allowedDomains.some(allowedDomain => 
                domain === allowedDomain || domain.endsWith('.' + allowedDomain)
            );
            if (!isAllowed) {
                return false;
            }
            break;
            
        default:
            // 默认只捕获主域名
            if (domain !== captureState.targetDomain) {
                return false;
            }
    }

    // 检查广告屏蔽
    if (captureState.settings.blockAds && isAdDomain(domain)) {
        return false;
    }

    // 检查静态资源屏蔽
    if (captureState.settings.blockStatic && STATIC_TYPES.includes(type)) {
        return false;
    }

    // 检查自定义屏蔽域名
    if (captureState.settings.blockedDomains.some(blocked => domain.includes(blocked))) {
        console.log(`🚫 Blocked domain request: ${domain} (matches blacklist)`);
        return false;
    }

    return true;
}

// 检查是否为广告域名
function isAdDomain(domain) {
    return AD_DOMAINS.some(adDomain => domain.includes(adDomain));
}

// 添加请求到捕获列表
function addRequestToCapture(requestRecord) {
    // 检查重复URL
    const existingIndex = captureState.capturedRequests.findIndex(
        req => req.url === requestRecord.url
    );

    if (existingIndex === -1) {
        // 新请求，添加到列表
        captureState.capturedRequests.push(requestRecord);
        captureState.requestCounter++;

        // 执行FIFO策略，保持最大数量限制
        if (captureState.capturedRequests.length > captureState.settings.maxRequests) {
            captureState.capturedRequests.shift(); // 移除最旧的请求
        }
    }
}

// 通知popup更新数据
function notifyPopupUpdate() {
    // 节流：避免过于频繁的更新
    if (!notifyPopupUpdate.lastUpdate || Date.now() - notifyPopupUpdate.lastUpdate > 500) {
        chrome.runtime.sendMessage({
            type: 'data_updated',
            data: {
                requests: captureState.capturedRequests,
                total: captureState.requestCounter,
                isCapturing: captureState.isCapturing
            }
        }).catch(() => {
            // Popup可能已关闭，忽略错误
        });
        notifyPopupUpdate.lastUpdate = Date.now();
    }
}

// 加载设置
function loadSettings() {
    chrome.storage.local.get(['captureSettings'], (result) => {
        if (result.captureSettings) {
            captureState.settings = { ...captureState.settings, ...result.captureSettings };
        }
    });
}

// 保存设置
function saveSettings() {
    chrome.storage.local.set({ 
        captureSettings: captureState.settings 
    });
}

// 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
    openCaptureWindow();
});

// 打开捕获窗口
async function openCaptureWindow() {
    try {
        // 如果窗口已经存在，则聚焦到该窗口
        if (captureWindow) {
            try {
                await chrome.windows.update(captureWindow.id, { focused: true });
                return;
            } catch (error) {
                // 窗口可能已经被关闭，重新创建
                captureWindow = null;
            }
        }

        // 获取当前活动窗口的位置，用于智能定位新窗口
        const currentWindow = await chrome.windows.getCurrent();
        
        // 计算新窗口位置：在当前窗口右侧，如果空间不足则在左侧
        const screenWidth = 1920; // 默认屏幕宽度，实际会根据显示器调整
        const windowWidth = 850;
        const windowHeight = 650;
        
        let left = currentWindow.left + currentWindow.width + 10;
        if (left + windowWidth > screenWidth) {
            left = Math.max(0, currentWindow.left - windowWidth - 10);
        }
        
        const top = currentWindow.top;

        // 创建新的扩展窗口
        captureWindow = await chrome.windows.create({
            url: 'popup.html',
            type: 'popup',
            width: windowWidth,
            height: windowHeight,
            left: left,
            top: top,
            focused: true
        });

        console.log('Capture window created successfully');
    } catch (error) {
        console.error('Failed to create capture window:', error);
    }
}

// 关闭窗口
function handleCloseWindow(sendResponse) {
    if (captureWindow) {
        chrome.windows.remove(captureWindow.id).then(() => {
            captureWindow = null;
            sendResponse({ success: true });
        }).catch((error) => {
            sendResponse({ success: false, error: error.message });
        });
    } else {
        sendResponse({ success: true });
    }
}

// 最小化窗口
function handleMinimizeWindow(sendResponse) {
    if (captureWindow) {
        chrome.windows.update(captureWindow.id, { state: 'minimized' }).then(() => {
            sendResponse({ success: true });
        }).catch((error) => {
            sendResponse({ success: false, error: error.message });
        });
    } else {
        sendResponse({ success: false, error: 'No window to minimize' });
    }
}

// 打开独立窗口
function handleOpenWindow(sendResponse) {
    openCaptureWindow().then(() => {
        sendResponse({ success: true });
    }).catch((error) => {
        sendResponse({ success: false, error: error.message });
    });
}

// 监听窗口关闭事件
chrome.windows.onRemoved.addListener((windowId) => {
    if (captureWindow && captureWindow.id === windowId) {
        captureWindow = null;
        // 如果正在捕获，则停止捕获
        if (captureState.isCapturing) {
            handleStopCapture(() => {});
        }
    }
});