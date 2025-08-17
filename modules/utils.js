// utils.js - 工具函数模块：批处理、兼容函数等通用工具
// 简化版本：保持原有功能，减少复杂性

// 分批处理大量数据
function processBatch(items, batchSize, processor, onComplete, onProgress) {
    let index = 0;
    const results = [];
    
    function processBatchInternal() {
        try {
            const endIndex = Math.min(index + batchSize, items.length);
            
            for (let i = index; i < endIndex; i++) {
                const result = processor(items[i], i);
                if (result !== null) {
                    results.push(result);
                }
            }
            
            index = endIndex;
            
            if (onProgress) {
                onProgress(index, items.length);
            }
            
            if (index < items.length) {
                // 使用setTimeout让出主线程，避免页面卡顿
                setTimeout(processBatchInternal, 0);
            } else {
                onComplete(results);
            }
        } catch (error) {
            console.error('批处理错误:', error);
            onComplete(results); // 返回已处理的结果
        }
    }
    
    processBatchInternal();
}

// 兼容性包装器 - 使用重构后的解析器
function parseCombinedData() {
    // 委托给重构后的parseFullMatchData函数
    if (typeof parseFullMatchData === 'function') {
        parseFullMatchData();
    } else {
        // 降级处理
        const outputDiv = document.getElementById('combined-output');
        outputDiv.innerHTML = '<div class="error">解析器未加载，请刷新页面重试</div>';
    }
}

// 兼容性函数 - 委托给简化后的解析器
function parseStats() {
    try {
        const htmlContent = getHtmlContent('stats');
        const outputDiv = document.getElementById('stats-output');
        
        if (!htmlContent) {
            outputDiv.innerHTML = '<div class="error">请先输入HTML内容</div>';
            return;
        }
        
        const result = parseStatsFromFullHtml(htmlContent);
        
        if (result.success) {
            setGlobalData('currentStatsData', result.markdown);
            outputDiv.innerHTML = `<div class="success">成功提取技术统计</div><pre>${result.markdown}</pre>`;
        } else {
            outputDiv.innerHTML = '<div class="error">未找到技术统计数据，请检查HTML格式</div>';
        }
        
    } catch (error) {
        outputDiv.innerHTML = `<div class="error">解析失败: ${error.message}</div>`;
    }
}

// 兼容性函数 - 委托给简化后的解析器
function parseEvents() {
    try {
        const htmlContent = getHtmlContent('events');
        const outputDiv = document.getElementById('events-output');
        
        if (!htmlContent) {
            outputDiv.innerHTML = '<div class="error">请先输入详细事件HTML内容</div>';
            return;
        }
        
        const result = parseEventsFromFullHtml(htmlContent);
        
        if (result.success) {
            setGlobalData('currentEventsData', result.markdown);
            outputDiv.innerHTML = `<div class="success">成功提取 ${result.data} 个事件</div><pre>${result.markdown}</pre>`;
        } else {
            outputDiv.innerHTML = '<div class="error">未找到详细事件数据，请检查HTML格式</div>';
        }
        
    } catch (error) {
        outputDiv.innerHTML = `<div class="error">解析失败: ${error.message}</div>`;
    }
}

// 导出工具函数（用于模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        processBatch,
        parseCombinedData,
        parseStats,
        parseEvents
    };
}