// helpers.js - 辅助函数模块：减少重复代码

// 获取HTML内容的通用函数
function getHtmlContent(type) {
    // 统一的内容获取逻辑
    if (typeof smartManagers !== 'undefined' && smartManagers[type]) {
        return smartManagers[type].getContent();
    } else if (window.smartManagers && window.smartManagers[type]) {
        return window.smartManagers[type].getContent();
    } else {
        const textarea = document.getElementById(type + '-html');
        return textarea ? textarea.value : '';
    }
}

// 获取智能管理器的通用函数
function getSmartManagers() {
    return (typeof smartManagers !== 'undefined') ? smartManagers : (window.smartManagers || {});
}

// 安全设置全局变量
function setGlobalData(varName, value) {
    if (typeof window[varName] !== 'undefined') {
        window[varName] = value;
    } else {
        // 如果全局变量不存在，创建它
        window[varName] = value;
    }
}

// 安全获取全局变量
function getGlobalData(varName) {
    if (typeof window[varName] !== 'undefined') {
        return window[varName];
    }
    return '';
}

// 通用的函数调用检查
function safeCall(functionName, ...args) {
    if (typeof window[functionName] === 'function') {
        return window[functionName](...args);
    } else if (typeof eval(functionName) === 'function') {
        return eval(functionName)(...args);
    } else {
        console.warn(`函数 ${functionName} 未找到`);
        return null;
    }
}

// 自动复制到剪贴板函数
function autoCopyToClipboard(content, typeName) {
    if (!content) return;
    
    // 使用现代剪贴板API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(content).then(() => {
            showAutoCopySuccess(typeName);
        }).catch(err => {
            fallbackAutoCopy(content, typeName);
        });
    } else {
        // 降级到传统方法
        fallbackAutoCopy(content, typeName);
    }
}

// 降级自动复制方法
function fallbackAutoCopy(text, typeName) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showAutoCopySuccess(typeName);
        }
    } catch (err) {
        // 自动复制失败时不显示错误，因为是自动操作
        console.log('自动复制失败，用户可手动复制');
    }
    
    document.body.removeChild(textArea);
}

// 显示自动复制成功提示
function showAutoCopySuccess(typeName) {
    // 创建临时提示元素
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        background: #17a2b8;
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 13px;
        animation: slideInLeft 0.3s ease;
        opacity: 0.9;
    `;
    toast.innerHTML = `📋 ${typeName}已自动复制`;
    
    // 添加动画样式
    if (!document.getElementById('auto-copy-toast-style')) {
        const style = document.createElement('style');
        style.id = 'auto-copy-toast-style';
        style.innerHTML = `
            @keyframes slideInLeft {
                from { transform: translateX(-100%); opacity: 0; }
                to { transform: translateX(0); opacity: 0.9; }
            }
            @keyframes slideOutLeft {
                from { transform: translateX(0); opacity: 0.9; }
                to { transform: translateX(-100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // 2秒后移除提示
    setTimeout(() => {
        toast.style.animation = 'slideOutLeft 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 2000);
}

// 将核心辅助函数暴露到全局
window.getHtmlContent = getHtmlContent;
window.getSmartManagers = getSmartManagers;
window.setGlobalData = setGlobalData;
window.getGlobalData = getGlobalData;
window.safeCall = safeCall;
window.autoCopyToClipboard = autoCopyToClipboard;

// 导出辅助函数（用于模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getHtmlContent,
        getSmartManagers,
        setGlobalData,
        getGlobalData,
        safeCall,
        autoCopyToClipboard
    };
}