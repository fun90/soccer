// utils.js - 工具函数模块：批处理、兼容函数等通用工具

// 分批处理大量数据
function processBatch(items, batchSize, processor, onComplete, onProgress) {
    let index = 0;
    const results = [];
    
    function processBatchInternal() {
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
    }
    
    processBatchInternal();
}

// 合并解析技术统计和详细事件（保留兼容性）
function parseCombinedData() {
    const statsHtml = getHtmlContent('stats');
    const eventsHtml = getHtmlContent('events');
    const outputDiv = document.getElementById('combined-output');
    if (!statsHtml && !eventsHtml) {
        outputDiv.innerHTML = '<div class="error">请先输入技术统计或详细事件的HTML内容</div>';
        return;
    }
    
    // 显示处理中状态
    outputDiv.innerHTML = '<div class="processing"><div class="spinner"></div>正在解析数据，请稍候...</div>';
    
    // 使用setTimeout避免阻塞UI
    setTimeout(() => {
        try {
            let combinedMarkdown = '# 比赛数据报告\n\n';
            let hasStats = false;
            let hasEvents = false;
            
            // 解析技术统计
            if (statsHtml) {
                const statsResult = parseStatsData(statsHtml);
                if (statsResult.success) {
                    combinedMarkdown += statsResult.markdown;
                    hasStats = true;
                    
                }
            }
            
            // 解析详细事件
            if (eventsHtml) {
                const eventsResult = parseEventsData(eventsHtml);
                if (eventsResult.success) {
                    if (hasStats) {
                        combinedMarkdown += '\n\n---\n\n';
                    }
                    combinedMarkdown += eventsResult.markdown;
                    hasEvents = true;
                }
            }
            
            if (hasStats || hasEvents) {
                setGlobalData('currentCombinedData', combinedMarkdown);
                const statsCount = hasStats ? '技术统计' : '';
                const eventsCount = hasEvents ? '详细事件' : '';
                const separator = hasStats && hasEvents ? ' + ' : '';
                
                outputDiv.innerHTML = `<div class="success">成功提取 ${statsCount}${separator}${eventsCount}</div><pre>${combinedMarkdown}</pre>`;
            } else {
                outputDiv.innerHTML = '<div class="error">未找到有效数据，请检查HTML格式</div>';
            }
            
        } catch (error) {
            outputDiv.innerHTML = `<div class="error">解析失败: ${error.message}</div>`;
        }
    }, 10);
}

// 解析技术统计数据（辅助函数）
function parseStatsData(htmlContent) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        let markdown = '## 技术统计\n\n';
        
        // 提取比赛信息
        const matchInfo = extractMatchInfo(doc);
        if (matchInfo.homeTeam && matchInfo.awayTeam) {
            markdown += `### ${matchInfo.homeTeam} ${matchInfo.homeScore} - ${matchInfo.awayScore} ${matchInfo.awayTeam}\n\n`;
            
            // 基本比赛信息
            if (matchInfo.league || matchInfo.matchTime || matchInfo.venue) {
                const basicInfo = [];
                if (matchInfo.league) basicInfo.push(`**联赛**: ${matchInfo.league}`);
                if (matchInfo.matchTime) basicInfo.push(`**时间**: ${matchInfo.matchTime}`);
                if (matchInfo.venue) basicInfo.push(`**场地**: ${matchInfo.venue}`);
                markdown += basicInfo.join(' | ') + '\n\n';
            }
            
            // 比赛状态信息
            if (matchInfo.currentTime || matchInfo.weather || matchInfo.temperature) {
                const statusInfo = [];
                if (matchInfo.currentTime) statusInfo.push(`**比赛进行**: ${matchInfo.currentTime}`);
                if (matchInfo.weather) statusInfo.push(`**天气**: ${matchInfo.weather}`);
                if (matchInfo.temperature) statusInfo.push(`**温度**: ${matchInfo.temperature}`);
                markdown += statusInfo.join(' | ') + '\n\n';
            }
        }
        
        markdown += '| 统计项目 | 主队 | 客队 |\n';
        markdown += '|----------|------|------|\n';
        
        const statItems = doc.querySelectorAll('.lists');
        const statsData = [];
        
        if (statItems.length === 0) {
            return { success: false, markdown: '', data: [] };
        }
        
        statItems.forEach(item => {
            const dataDiv = item.querySelector('.data');
            if (dataDiv) {
                const spans = dataDiv.querySelectorAll('span');
                if (spans.length >= 3) {
                    const homeValue = spans[0].textContent.trim();
                    const statName = spans[1].textContent.trim();
                    const awayValue = spans[2].textContent.trim();
                    
                    markdown += `| ${statName} | ${homeValue} | ${awayValue} |\n`;
                    
                    statsData.push({
                        name: statName,
                        home: homeValue,
                        away: awayValue
                    });
                }
            }
        });
        
        return { success: true, markdown: markdown, data: statsData };
        
    } catch (error) {
        return { success: false, markdown: '', data: [] };
    }
}

// 解析详细事件数据（辅助函数）
function parseEventsData(htmlContent) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        let markdown = '## 详细事件\n\n';
        
        // 查找比赛队伍信息
        const teamInfo = doc.querySelector('.teamtit .data');
        let homeTeam = '';
        let awayTeam = '';
        let homeScore = '0';
        let awayScore = '0';
        
        if (teamInfo) {
            const homeTeamSpan = teamInfo.querySelector('.homeTN');
            const awayTeamSpan = teamInfo.querySelector('.guestTN');
            
            if (homeTeamSpan) {
                // 获取队伍名称（去除比分）
                const homeScoreElement = homeTeamSpan.querySelector('i');
                if (homeScoreElement) {
                    homeScore = homeScoreElement.textContent.trim();
                    // 创建临时元素来获取纯文本内容
                    const tempSpan = homeTeamSpan.cloneNode(true);
                    const scoreElement = tempSpan.querySelector('i');
                    if (scoreElement) scoreElement.remove();
                    homeTeam = tempSpan.textContent.trim();
                } else {
                    homeTeam = homeTeamSpan.textContent.trim();
                }
            }
            
            if (awayTeamSpan) {
                // 获取队伍名称（去除比分）
                const awayScoreElement = awayTeamSpan.querySelector('i');
                if (awayScoreElement) {
                    awayScore = awayScoreElement.textContent.trim();
                    // 创建临时元素来获取纯文本内容
                    const tempSpan = awayTeamSpan.cloneNode(true);
                    const scoreElement = tempSpan.querySelector('i');
                    if (scoreElement) scoreElement.remove();
                    awayTeam = tempSpan.textContent.trim();
                } else {
                    awayTeam = awayTeamSpan.textContent.trim();
                }
            }
        }
        
        markdown += `### ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}\n\n`;
        markdown += '| 时间 | 主队事件 | 客队事件 |\n';
        markdown += '|------|---------|----------|\n';
        
        // 查找事件列表
        const eventItems = doc.querySelectorAll('.lists');
        
        if (eventItems.length === 0) {
            return { success: false, markdown: '', data: [] };
        }
        
        eventItems.forEach(item => {
            const dataDiv = item.querySelector('.data');
            if (dataDiv) {
                const spans = dataDiv.querySelectorAll('span');
                if (spans.length >= 3) {
                    const homeEvent = spans[0] ? parseEventContent(spans[0]) : '';
                    const time = spans[1] ? spans[1].textContent.trim() : '';
                    const awayEvent = spans[2] ? parseEventContent(spans[2]) : '';
                    
                    markdown += `| ${time} | ${homeEvent} | ${awayEvent} |\n`;
                }
            }
        });
        
        return { success: true, markdown: markdown, data: eventItems.length };
        
    } catch (error) {
        return { success: false, markdown: '', data: [] };
    }
}

// 解析技术统计（保留兼容性）
function parseStats() {
    const htmlContent = getHtmlContent('stats');
    const outputDiv = document.getElementById('stats-output');
    
    if (!htmlContent) {
        outputDiv.innerHTML = '<div class="error">请先输入HTML内容</div>';
        return;
    }
    
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        let markdown = '# 技术统计\n\n';
        markdown += '| 统计项目 | 主队 | 客队 |\n';
        markdown += '|----------|------|------|\n';
        
        const statItems = doc.querySelectorAll('.lists');
        const statsData = [];
        
        if (statItems.length === 0) {
            outputDiv.innerHTML = '<div class="error">未找到技术统计数据，请检查HTML格式</div>';
            return;
        }
        
        statItems.forEach(item => {
            const dataDiv = item.querySelector('.data');
            if (dataDiv) {
                const spans = dataDiv.querySelectorAll('span');
                if (spans.length >= 3) {
                    const homeValue = spans[0].textContent.trim();
                    const statName = spans[1].textContent.trim();
                    const awayValue = spans[2].textContent.trim();
                    
                    markdown += `| ${statName} | ${homeValue} | ${awayValue} |\n`;
                    
                    statsData.push({
                        name: statName,
                        home: homeValue,
                        away: awayValue
                    });
                }
            }
        });
        
        setGlobalData('currentStatsData', markdown);
        outputDiv.innerHTML = `<div class="success">成功提取 ${statItems.length} 项技术统计</div><pre>${markdown}</pre>`;
        
        
    } catch (error) {
        outputDiv.innerHTML = `<div class="error">解析失败: ${error.message}</div>`;
    }
}

// 解析详细事件（保留兼容性）
function parseEvents() {
    const htmlContent = getHtmlContent('events');
    const outputDiv = document.getElementById('events-output');
    
    if (!htmlContent) {
        outputDiv.innerHTML = '<div class="error">请先输入详细事件HTML内容</div>';
        return;
    }
    
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        let markdown = '# 详细事件\n\n';
        
        // 查找比赛队伍信息
        const teamInfo = doc.querySelector('.teamtit .data');
        let homeTeam = '';
        let awayTeam = '';
        let homeScore = '0';
        let awayScore = '0';
        
        if (teamInfo) {
            const homeTeamSpan = teamInfo.querySelector('.homeTN');
            const awayTeamSpan = teamInfo.querySelector('.guestTN');
            
            if (homeTeamSpan) {
                homeTeam = homeTeamSpan.textContent.replace(/\d+$/, '').trim();
                const homeScoreMatch = homeTeamSpan.textContent.match(/\d+$/);
                if (homeScoreMatch) homeScore = homeScoreMatch[0];
            }
            
            if (awayTeamSpan) {
                awayTeam = awayTeamSpan.textContent.replace(/\d+$/, '').trim();
                const awayScoreMatch = awayTeamSpan.textContent.match(/\d+$/);
                if (awayScoreMatch) awayScore = awayScoreMatch[0];
            }
        }
        
        markdown += `## ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}\n\n`;
        markdown += '| 时间 | 主队事件 | 客队事件 |\n';
        markdown += '|------|---------|----------|\n';
        
        // 查找事件列表
        const eventItems = doc.querySelectorAll('.lists');
        
        if (eventItems.length === 0) {
            outputDiv.innerHTML = '<div class="error">未找到详细事件数据，请检查HTML格式</div>';
            return;
        }
        
        eventItems.forEach(item => {
            const dataDiv = item.querySelector('.data');
            if (dataDiv) {
                const spans = dataDiv.querySelectorAll('span');
                if (spans.length >= 3) {
                    const homeEvent = spans[0] ? parseEventContent(spans[0]) : '';
                    const time = spans[1] ? spans[1].textContent.trim() : '';
                    const awayEvent = spans[2] ? parseEventContent(spans[2]) : '';
                    
                    markdown += `| ${time} | ${homeEvent} | ${awayEvent} |\n`;
                }
            }
        });
        
        setGlobalData('currentEventsData', markdown);
        outputDiv.innerHTML = `<div class="success">成功提取 ${eventItems.length} 个事件</div><pre>${markdown}</pre>`;
        
    } catch (error) {
        outputDiv.innerHTML = `<div class="error">解析失败: ${error.message}</div>`;
    }
}

// 导出工具函数（用于模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        processBatch,
        parseCombinedData,
        parseStatsData,
        parseEventsData,
        parseStats,
        parseEvents
    };
}