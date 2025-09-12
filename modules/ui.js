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
    let textarea, btn;
    
    if (type === 'json') {
        textarea = document.getElementById('json-content');
        btn = document.getElementById('json-minimize-btn');
    } else {
        textarea = document.getElementById(type + '-html');
        btn = document.getElementById(type + '-minimize-btn');
    }
    
    if (textarea && btn) {
        if (textarea.classList.contains('textarea-minimized')) {
            textarea.classList.remove('textarea-minimized');
            btn.textContent = '折叠';
        } else {
            textarea.classList.add('textarea-minimized');
            btn.textContent = '展开';
        }
    }
}

// 字符计数器更新
function updateCharCounter(type) {
    const counter = document.getElementById(type + '-char-counter');
    if (!counter) return;
    
    // 兼容性获取smartManagers
    const managers = getSmartManagers();
    const smartLength = managers[type] ? managers[type].getContentLength() : 0;
    let textarea;
    
    if (type === 'json') {
        textarea = document.getElementById('json-content');
    } else {
        textarea = document.getElementById(type + '-html');
    }
    
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

function clearJsonInput() {
    document.getElementById('json-content').value = '';
    document.getElementById('json-output').innerHTML = '等待解析...';
    updateCharCounter('json');
}

// 只清空输入内容，保留解析结果的清空函数
function clearInputOnly(type) {
    const textarea = document.getElementById(type + '-html');
    if (textarea) {
        textarea.value = '';
        textarea.style.display = 'block'; // 确保textarea显示
    }
    
    // 清空SmartContentManager内容
    const managers = getSmartManagers();
    if (managers[type]) {
        managers[type].clearContent();
    }
    
    // 更新字符计数器
    updateCharCounter(type);
    
    console.log(`✅ 已清空${type}的输入内容，保留解析结果`);
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

// JSON解析函数
function parseJsonData() {
    const jsonContent = document.getElementById('json-content').value.trim();
    const fieldsInput = document.getElementById('json-fields').value.trim();
    const output = document.getElementById('json-output');
    
    if (!jsonContent) {
        output.innerHTML = '<div class="error">请粘贴JSON数据</div>';
        return;
    }
    
    if (!fieldsInput) {
        output.innerHTML = '<div class="error">请输入要提取的字段名</div>';
        return;
    }
    
    try {
        // 解析JSON
        const data = JSON.parse(jsonContent);
        const fields = fieldsInput.split(',').map(f => f.trim()).filter(f => f);
        
        // 检查数据结构
        let records = [];
        if (data.model && Array.isArray(data.model)) {
            records = data.model;
        } else if (Array.isArray(data)) {
            records = data;
        } else {
            records = [data];
        }
        
        if (records.length === 0) {
            output.innerHTML = '<div class="error">未找到数据记录</div>';
            return;
        }
        
        // 生成表格
        const tableHtml = generateTable(records, fields);
        output.innerHTML = tableHtml;
        
        // 存储解析结果到全局变量
        setGlobalData('currentJsonData', records);
        setGlobalData('currentJsonFields', fields);
        
        console.log(`✅ 成功解析JSON数据: ${records.length}条记录, ${fields.length}个字段`);
        
    } catch (error) {
        console.error('JSON解析失败:', error);
        output.innerHTML = `<div class="error">JSON格式错误: ${error.message}</div>`;
    }
}

// 生成表格HTML
function generateTable(records, fields) {
    if (!records || records.length === 0) {
        return '<div class="error">无数据记录</div>';
    }
    
    // 表格头部
    let tableHtml = `
        <div class="table-container">
            <table class="json-table">
                <thead>
                    <tr>
    `;
    
    // 生成表头 - 添加日期列作为第一列
    const fieldNames = {
        'stockCode': '股票代码',
        'stockName': '股票名称', 
        'holdingShare': '持股数量',
        'costPrice': '成本价',
        'lastestMarketPrice': '最新价',
        'marketCap': '市值',
        'floatProfit': '浮动盈亏'
    };
    
    // 首先添加日期列
    tableHtml += `<th>日期</th>`;
    
    fields.forEach(field => {
        const displayName = fieldNames[field] || field;
        tableHtml += `<th>${displayName}</th>`;
    });
    
    tableHtml += `
                    </tr>
                </thead>
                <tbody>
    `;
    
    // 生成表格行 - 添加日期列作为第一列
    const currentDate = new Date().toISOString().slice(0, 10); // yyyy-MM-dd格式
    
    records.forEach((record, index) => {
        tableHtml += '<tr>';
        
        // 首先添加日期列
        tableHtml += `<td>${currentDate}</td>`;
        
        fields.forEach(field => {
            const value = record[field];
            let cellContent = value !== null && value !== undefined ? value : '-';
            let cellClass = '';
            
            // 数值格式化和样式
            if (typeof value === 'number') {
                cellClass = 'number';
                if (field.includes('Price') || field.includes('Cap') || field.includes('Profit')) {
                    if (value > 0) cellClass += ' positive';
                    else if (value < 0) cellClass += ' negative';
                    
                    if (field === 'marketCap' && value > 1000) {
                        cellContent = (value / 10000).toFixed(2) + '万';
                    } else if (Math.abs(value) >= 1000) {
                        cellContent = value.toLocaleString();
                    } else {
                        cellContent = value.toFixed(4);
                    }
                } else {
                    cellContent = value.toLocaleString();
                }
            }
            
            tableHtml += `<td class="${cellClass}">${cellContent}</td>`;
        });
        tableHtml += '</tr>';
    });
    
    tableHtml += `
                </tbody>
            </table>
        </div>
    `;
    
    return tableHtml;
}

// 复制表格数据
function copyTable() {
    const records = getGlobalData('currentJsonData');
    const fields = getGlobalData('currentJsonFields');
    
    if (!records || !fields) {
        alert('请先解析JSON数据');
        return;
    }
    
    // 生成制表符分隔的文本 - 不包含表头
    let content = '';
    
    // 数据行 - 添加日期列作为第一列
    const currentDate = new Date().toISOString().slice(0, 10); // yyyy-MM-dd格式
    
    records.forEach(record => {
        const dataFields = fields.map(field => {
            const value = record[field];
            return value !== null && value !== undefined ? value : '';
        });
        const row = [currentDate, ...dataFields];
        content += row.join('\t') + '\n';
    });
    
    // 复制到剪贴板
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(content).then(() => {
            showCopySuccess('表格数据');
        }).catch(err => {
            fallbackCopyTextToClipboard(content, '表格数据');
        });
    } else {
        fallbackCopyTextToClipboard(content, '表格数据');
    }
}

// 下载表格为CSV
function downloadTable() {
    const records = getGlobalData('currentJsonData');
    const fields = getGlobalData('currentJsonFields');
    
    if (!records || !fields) {
        alert('请先解析JSON数据');
        return;
    }
    
    // 生成CSV内容
    let csvContent = '';
    
    // 表头 - 添加日期列作为第一列
    const fieldNames = {
        'stockCode': '股票代码',
        'stockName': '股票名称', 
        'holdingShare': '持股数量',
        'costPrice': '成本价',
        'lastestMarketPrice': '最新价',
        'marketCap': '市值',
        'floatProfit': '浮动盈亏'
    };
    
    const headers = ['日期', ...fields.map(field => fieldNames[field] || field)];
    csvContent += headers.join(',') + '\n';
    
    // 数据行 - 添加日期列作为第一列
    const currentDate = new Date().toISOString().slice(0, 10); // yyyy-MM-dd格式
    
    records.forEach(record => {
        const dataFields = fields.map(field => {
            const value = record[field];
            let cellValue = value !== null && value !== undefined ? value : '';
            // 如果值包含逗号或换行符，需要用引号包围
            if (typeof cellValue === 'string' && (cellValue.includes(',') || cellValue.includes('\n') || cellValue.includes('"'))) {
                cellValue = '"' + cellValue.replace(/"/g, '""') + '"';
            }
            return cellValue;
        });
        const row = [currentDate, ...dataFields];
        csvContent += row.join(',') + '\n';
    });
    
    // 创建下载链接
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `json_data_${new Date().toISOString().slice(0, 10)}.csv`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 显示成功提示
    showCopySuccess('CSV文件已下载');
}

// 将关键函数暴露到全局，确保跨模块访问
window.updateCharCounter = updateCharCounter;
window.clearInputOnly = clearInputOnly;
window.parseJsonData = parseJsonData;
window.clearJsonInput = clearJsonInput;
window.copyTable = copyTable;
window.downloadTable = downloadTable;

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
        clearJsonInput,
        copyMarkdown,
        fallbackCopyTextToClipboard,
        showCopySuccess,
        showCopyError,
        clearInputOnly,
        parseJsonData,
        generateTable,
        copyTable,
        downloadTable
    };
}