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

// 将核心辅助函数暴露到全局
window.getHtmlContent = getHtmlContent;
window.getSmartManagers = getSmartManagers;
window.setGlobalData = setGlobalData;
window.getGlobalData = getGlobalData;
window.safeCall = safeCall;

// 导出辅助函数（用于模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getHtmlContent,
        getSmartManagers,
        setGlobalData,
        getGlobalData,
        safeCall
    };
}