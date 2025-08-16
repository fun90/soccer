// ui.js - UI管理模块：处理界面交互、标签切换、textarea控制

// 切换标签页
function switchTab(tabName) {
    // 隐藏所有标签内容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 移除所有按钮的active类
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 显示选中的标签内容
    document.getElementById(tabName).classList.add('active');
    
    // 激活选中的按钮
    event.target.classList.add('active');
}

// textarea折叠功能
function expandTextarea(type) {
    const textarea = document.getElementById(type + '-html');
    const btn = document.getElementById(type + '-minimize-btn');
    
    if (textarea.value.length > 10000) {
        btn.style.display = 'inline-block';
    }
}

function maybeMinimizeTextarea(type) {
    // 先不自动折叠，由用户手动控制
}

function toggleTextarea(type) {
    const textarea = document.getElementById(type + '-html');
    const btn = document.getElementById(type + '-minimize-btn');
    
    if (textarea.classList.contains('textarea-minimized')) {
        textarea.classList.remove('textarea-minimized');
        btn.textContent = '折叠';
    } else {
        textarea.classList.add('textarea-minimized');
        btn.textContent = '展开';
    }
}

// 字符计数器更新
function updateCharCounter(type) {
    const counter = document.getElementById(type + '-char-counter');
    
    // 兼容性获取smartManagers
    const managers = getSmartManagers();
    const smartLength = managers[type] ? managers[type].getContentLength() : 0;
    const textarea = document.getElementById(type + '-html');
    const textareaLength = textarea ? textarea.value.length : 0;
    
    let totalLength = 0;
    let source = '';
    
    if (smartLength > 0) {
        totalLength = smartLength;
        source = managers[type] && managers[type].isLargeContent ? '智能存储: ' : '';
    } else {
        totalLength = textareaLength;
    }
    
    counter.textContent = `${source}${totalLength.toLocaleString()} 字符`;
    
    // 超过500KB时显示警告
    if (totalLength > 500000) {
        counter.classList.add('warning');
        counter.textContent += ' (数据量较大，处理可能较慢)';
    } else {
        counter.classList.remove('warning');
    }
}

// 清空输入函数
function clearLeagueInput() {
    document.getElementById('league-html').value = '';
    document.getElementById('league-output').innerHTML = '等待提取...';
    const managers = getSmartManagers();
    if (managers.league) managers.league.clearContent();
    updateCharCounter('league');
}

function clearMatchInput() {
    document.getElementById('league-filter').value = '';
    document.getElementById('match-html').value = '';
    document.getElementById('match-output').innerHTML = '等待提取...';
    const managers = getSmartManagers();
    if (managers.match) managers.match.clearContent();
    updateCharCounter('match');
}

function clearStatsInput() {
    document.getElementById('stats-html').value = '';
    document.getElementById('combined-output').innerHTML = '等待提取...';
    const managers = getSmartManagers();
    if (managers.stats) managers.stats.clearContent();
    updateCharCounter('stats');
}


// 复制Markdown内容到剪贴板
function copyMarkdown(type) {
    let content = '';
    let typeName = '';
    
    const dataMap = {
        'leagues': { varName: 'currentLeagueData', typeName: '联赛信息' },
        'matches': { varName: 'currentMatchData', typeName: '比赛数据' },
        'stats': { varName: 'currentStatsData', typeName: '技术统计' },
        'events': { varName: 'currentEventsData', typeName: '详细事件' },
        'combined': { varName: 'currentCombinedData', typeName: '比赛数据' }
    };
    
    const data = dataMap[type];
    if (data) {
        content = getGlobalData(data.varName);
        typeName = data.typeName;
    }
    
    if (!content) {
        alert('请先提取数据后再复制');
        return;
    }
    
    // 使用现代剪贴板API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(content).then(() => {
            showCopySuccess(typeName);
        }).catch(err => {
            fallbackCopyTextToClipboard(content, typeName);
        });
    } else {
        // 降级到传统方法
        fallbackCopyTextToClipboard(content, typeName);
    }
}

// 降级复制方法
function fallbackCopyTextToClipboard(text, typeName) {
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
            showCopySuccess(typeName);
        } else {
            showCopyError();
        }
    } catch (err) {
        showCopyError();
    }
    
    document.body.removeChild(textArea);
}

// 显示复制成功提示
function showCopySuccess(typeName) {
    // 创建临时提示元素
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        animation: slideIn 0.3s ease;
    `;
    toast.innerHTML = `✅ ${typeName}已复制到剪贴板`;
    
    // 添加动画样式
    if (!document.getElementById('copy-toast-style')) {
        const style = document.createElement('style');
        style.id = 'copy-toast-style';
        style.innerHTML = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // 3秒后移除提示
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// 显示复制失败提示
function showCopyError() {
    alert('复制失败，请手动选择内容复制');
}

// 将关键函数暴露到全局，确保跨模块访问
window.updateCharCounter = updateCharCounter;

// 导出UI函数（用于模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        switchTab,
        expandTextarea,
        maybeMinimizeTextarea,
        toggleTextarea,
        updateCharCounter,
        clearLeagueInput,
        clearMatchInput,
        clearStatsInput,
        copyMarkdown,
        fallbackCopyTextToClipboard,
        showCopySuccess,
        showCopyError
    };
}