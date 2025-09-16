// parsers.js - 解析器模块：处理联赛、比赛、统计和事件数据
// 简化版本：保持原有功能，减少复杂性

// 性能监控和缓存系统
const ParserCache = {
    // DOM解析缓存
    parsedDocs: new Map(),
    // 查询结果缓存
    queryCache: new Map(),
    // 解析结果缓存
    resultCache: new Map(),
    
    // 获取或创建解析的DOM
    getParsedDoc(content) {
        const contentHash = this._hash(content);
        if (!this.parsedDocs.has(contentHash)) {
            const parser = new DOMParser();
            this.parsedDocs.set(contentHash, parser.parseFromString(content, 'text/html'));
        }
        return this.parsedDocs.get(contentHash);
    },
    
    // 获取或执行查询
    getQueryResult(doc, selector, contentHash) {
        const key = `${contentHash}_${selector}`;
        if (!this.queryCache.has(key)) {
            this.queryCache.set(key, doc.querySelectorAll(selector));
        }
        return this.queryCache.get(key);
    },
    
    // 简单哈希函数
    _hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转为32位整数
        }
        return hash.toString();
    },
    
    // 清理缓存
    clear() {
        this.parsedDocs.clear();
        this.queryCache.clear();
        this.resultCache.clear();
    }
};

// 性能监控器
const PerformanceMonitor = {
    times: {},
    
    start(label) {
        this.times[label] = performance.now();
    },
    
    end(label) {
        if (this.times[label]) {
            const duration = performance.now() - this.times[label];
            console.log(`⚡ ${label}: ${duration.toFixed(2)}ms`);
            delete this.times[label];
            return duration;
        }
        return 0;
    }
};

// 通用工具函数
function showError(message, outputElement) {
    outputElement.innerHTML = `<div class="error">${message}</div>`;
}

function showSuccess(message, markdown, outputElement) {
    outputElement.innerHTML = `<div class="success">${message}</div><pre>${markdown}</pre>`;
}

function showProcessing(message, outputElement) {
    outputElement.innerHTML = `<div class="processing"><div class="spinner"></div>${message}</div>`;
}

function createMarkdownTable(headers, rows) {
    const headerRow = `| ${headers.join(' | ')} |`;
    const separatorRow = `|${headers.map(() => '------').join('|')}|`;
    const dataRows = rows.map(row => `| ${row.join(' | ')} |`);
    return [headerRow, separatorRow, ...dataRows].join('\n') + '\n';
}

// 解析联赛信息（简化版本）
function parseLeagues() {
    const htmlContent = getHtmlContent('league');
    const outputDiv = document.getElementById('league-output');
    
    if (!htmlContent) {
        showError('请先输入HTML内容', outputDiv);
        return;
    }
    
    PerformanceMonitor.start('parseLeagues');
    
    try {
        // 检查缓存
        const contentHash = ParserCache._hash(htmlContent);
        const cacheKey = `leagues_${contentHash}`;
        
        if (ParserCache.resultCache.has(cacheKey)) {
            const cachedResult = ParserCache.resultCache.get(cacheKey);
            showSuccess(`成功提取 ${cachedResult.count} 个联赛信息 (缓存)`, cachedResult.markdown, outputDiv);
            setGlobalData('currentLeagueData', cachedResult.markdown);
            autoCopyAndClear(cachedResult.markdown, '联赛信息', 'league');
            PerformanceMonitor.end('parseLeagues');
            return;
        }
        
        // 使用缓存的DOM解析
        const doc = ParserCache.getParsedDoc(htmlContent);
        
        // 查找比赛行数据
        const matchRows = ParserCache.getQueryResult(doc, 'tr[id^="tr1_"]', contentHash);
        
        if (matchRows.length === 0) {
            showError('未找到比赛数据，请检查HTML格式', outputDiv);
            PerformanceMonitor.end('parseLeagues');
            return;
        }
        
        // 提取联赛信息 - 使用Set去重
        const leaguesSet = new Set();
        
        for (const row of matchRows) {
            const firstCell = row.querySelector('td:first-child span');
            if (firstCell) {
                const leagueName = firstCell.textContent.trim();
                if (leagueName) {
                    leaguesSet.add(leagueName);
                }
            }
        }
        
        if (leaguesSet.size === 0) {
            showError('未找到联赛数据，请检查HTML格式', outputDiv);
            PerformanceMonitor.end('parseLeagues');
            return;
        }
        
        // 转换为数组并排序
        const leagues = Array.from(leaguesSet).sort();
        
        // 生成Markdown
        let markdown = '# 足球联赛列表\n\n';
        markdown += createMarkdownTable(['联赛名称'], leagues.map(league => [league]));
        
        // 缓存结果
        const result = { markdown, count: leagues.length };
        ParserCache.resultCache.set(cacheKey, result);
        
        setGlobalData('currentLeagueData', markdown);
        showSuccess(`成功提取 ${leagues.length} 个联赛信息`, markdown, outputDiv);
        
        // 自动复制结果到剪贴板并清空输入内容
        autoCopyAndClear(markdown, '联赛信息', 'league');
        
        PerformanceMonitor.end('parseLeagues');
        
    } catch (error) {
        showError(`解析失败: ${error.message}`, outputDiv);
        PerformanceMonitor.end('parseLeagues');
    }
}

// 解析比赛数据（简化版本）
function parseMatches() {
    const htmlContent = getHtmlContent('match');
    const leagueFilterText = document.getElementById('league-filter').value.trim();
    const outputDiv = document.getElementById('match-output');
    
    if (!htmlContent) {
        showError('请先输入HTML内容', outputDiv);
        return;
    }
    
    PerformanceMonitor.start('parseMatches');
    
    try {
        // 检查缓存
        const contentHash = ParserCache._hash(htmlContent + '|' + leagueFilterText);
        const cacheKey = `matches_${contentHash}`;
        
        if (ParserCache.resultCache.has(cacheKey)) {
            const cachedResult = ParserCache.resultCache.get(cacheKey);
            showSuccess(`${cachedResult.message} (缓存)`, cachedResult.markdown, outputDiv);
            setGlobalData('currentMatchData', cachedResult.markdown);
            autoCopyAndClear(cachedResult.markdown, '比赛数据', 'match');
            PerformanceMonitor.end('parseMatches');
            return;
        }
        
        // 显示处理中状态
        showProcessing('正在解析数据，请稍候...', outputDiv);
        
        // 解析联赛筛选条件
        const targetLeaguesSet = leagueFilterText ? 
            new Set(leagueFilterText.split('\n').map(league => league.trim()).filter(league => league)) : 
            new Set();
        
        // 使用setTimeout避免阻塞UI
        setTimeout(() => {
            try {
                // 使用缓存的DOM解析
                const doc = ParserCache.getParsedDoc(htmlContent);
                
                let markdown = '# 比赛数据\n\n';
                if (targetLeaguesSet.size > 0) {
                    markdown += `## 筛选联赛: ${Array.from(targetLeaguesSet).join(', ')}\n\n`;
                }
                markdown += createMarkdownTable(['时间', '联赛', '状态', '主队', '比分', '客队', '半场'], []);
                
                // 使用缓存的查询结果
                const matchRows = ParserCache.getQueryResult(doc, 'tr[id^="tr1_"]', contentHash);
                
                if (matchRows.length === 0) {
                    showError('未找到比赛数据，请检查HTML格式', outputDiv);
                    PerformanceMonitor.end('parseMatches');
                    return;
                }
                
                // 处理比赛行
                function processMatchRow(row, index) {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 7) {
                        const cellTexts = [
                            cells[1]?.textContent.trim() || '-', // time
                            cells[0]?.querySelector('span')?.textContent.trim() || '-', // league
                            '-', // status (占位)
                            cells[3]?.textContent.trim() || '-', // homeTeam
                            cells[4]?.textContent.trim() || '-', // score
                            cells[5]?.textContent.trim() || '-', // awayTeam
                            cells[6]?.textContent.trim() || '-'  // halfTime
                        ];
                        
                        // 联赛筛选
                        if (targetLeaguesSet.size > 0) {
                            const league = cellTexts[1];
                            let isMatch = false;
                            
                            if (targetLeaguesSet.has(league)) {
                                isMatch = true;
                            } else {
                                for (const targetLeague of targetLeaguesSet) {
                                    if (league.includes(targetLeague) || targetLeague.includes(league)) {
                                        isMatch = true;
                                        break;
                                    }
                                }
                            }
                            
                            if (!isMatch) {
                                return null;
                            }
                        }
                        
                        return `| ${cellTexts.join(' | ')} |\n`;
                    }
                    return null;
                }
                
                // 进度更新函数
                function updateProgress(processed, total) {
                    const percent = Math.round((processed / total) * 100);
                    showProcessing(`正在处理数据... ${percent}% (${processed}/${total})`, outputDiv);
                }
                
                // 处理完成函数
                function onComplete(results) {
                    markdown += results.join('');
                    setGlobalData('currentMatchData', markdown);
                    
                    const filteredCount = results.length;
                    const totalMessage = targetLeaguesSet.size > 0 ? 
                        `成功筛选出 ${filteredCount} 场比赛数据 (总共 ${matchRows.length} 场)` : 
                        `成功提取 ${filteredCount} 场比赛数据`;
                    
                    // 缓存结果
                    const result = { markdown, message: totalMessage, count: filteredCount };
                    ParserCache.resultCache.set(cacheKey, result);
                    
                    showSuccess(totalMessage, markdown, outputDiv);
                    
                    // 自动复制结果到剪贴板并清空输入内容
                    autoCopyAndClear(markdown, '比赛数据', 'match');
                    
                    PerformanceMonitor.end('parseMatches');
                }
                
                // 智能批处理
                const batchSize = matchRows.length > 1000 ? 50 : matchRows.length > 500 ? 100 : 200;
                processBatch(Array.from(matchRows), batchSize, processMatchRow, onComplete, updateProgress);
                
            } catch (error) {
                showError(`解析失败: ${error.message}`, outputDiv);
                PerformanceMonitor.end('parseMatches');
            }
        }, 10);
        
    } catch (error) {
        showError(`解析失败: ${error.message}`, outputDiv);
        PerformanceMonitor.end('parseMatches');
    }
}

// 解析完整比赛数据（优化版本）
function parseFullMatchData() {
    const htmlContent = getHtmlContent('stats');
    const outputDiv = document.getElementById('combined-output');
    
    if (!htmlContent) {
        outputDiv.innerHTML = '<div class="error">请先输入完整的比赛页面HTML内容</div>';
        return;
    }
    
    PerformanceMonitor.start('parseFullMatchData');
    
    try {
        // 检查缓存
        const contentHash = ParserCache._hash(htmlContent);
        const cacheKey = `fullMatchData_${contentHash}`;
        
        if (ParserCache.resultCache.has(cacheKey)) {
            const cachedResult = ParserCache.resultCache.get(cacheKey);
            outputDiv.innerHTML = `<div class="success">${cachedResult.message} (缓存)</div><pre>${cachedResult.markdown}</pre>`;
            setGlobalData('currentCombinedData', cachedResult.markdown);
            autoCopyAndClear(cachedResult.markdown, '比赛数据', 'stats');
            PerformanceMonitor.end('parseFullMatchData');
            return;
        }
        
        // 显示处理中状态
        outputDiv.innerHTML = '<div class="processing"><div class="spinner"></div>正在解析完整比赛数据，请稍候...</div>';
        
        // 使用setTimeout避免阻塞UI
        setTimeout(() => {
            try {
                let combinedMarkdown = '# 比赛数据报告\n\n';
                let hasStats = false;
                let hasEvents = false;
                
                // 从完整HTML中解析技术统计
                const statsResult = parseStatsFromFullHtml(htmlContent, contentHash);
                if (statsResult.success) {
                    combinedMarkdown += statsResult.markdown;
                    hasStats = true;
                }
                
                // 从完整HTML中解析详细事件
                const eventsResult = parseEventsFromFullHtml(htmlContent, contentHash);
                if (eventsResult.success) {
                    if (hasStats) {
                        combinedMarkdown += '\n\n---\n\n';
                    }
                    combinedMarkdown += eventsResult.markdown;
                    hasEvents = true;
                }
                
                if (hasStats || hasEvents) {
                    const statsCount = hasStats ? '技术统计' : '';
                    const eventsCount = hasEvents ? '详细事件' : '';
                    const separator = hasStats && hasEvents ? ' + ' : '';
                    const message = `成功提取 ${statsCount}${separator}${eventsCount}`;
                    
                    // 缓存结果
                    const result = { markdown: combinedMarkdown, message, hasStats, hasEvents };
                    ParserCache.resultCache.set(cacheKey, result);
                    
                    setGlobalData('currentCombinedData', combinedMarkdown);
                    outputDiv.innerHTML = `<div class="success">${message}</div><pre>${combinedMarkdown}</pre>`;
                    
                    // 自动复制结果到剪贴板并清空输入内容
                    autoCopyAndClear(combinedMarkdown, '比赛数据', 'stats');
                } else {
                    outputDiv.innerHTML = '<div class="error">未找到有效数据，请检查HTML格式。确保包含技术统计(.lists)或详细事件(.lists)数据。</div>';
                }
                
                PerformanceMonitor.end('parseFullMatchData');
                
            } catch (error) {
                outputDiv.innerHTML = `<div class="error">解析失败: ${error.message}</div>`;
                PerformanceMonitor.end('parseFullMatchData');
            }
        }, 10);
        
    } catch (error) {
        outputDiv.innerHTML = `<div class="error">解析失败: ${error.message}</div>`;
        PerformanceMonitor.end('parseFullMatchData');
    }
}

// 从完整HTML中解析技术统计（简化版本）
function parseStatsFromFullHtml(htmlContent, contentHash = null) {
    try {
        const hash = contentHash || ParserCache._hash(htmlContent);
        const cacheKey = `stats_${hash}`;
        
        // 检查缓存
        if (ParserCache.resultCache.has(cacheKey)) {
            return ParserCache.resultCache.get(cacheKey);
        }
        
        // 使用缓存的DOM解析
        const doc = ParserCache.getParsedDoc(htmlContent);
        
        let markdown = '## 技术统计\n\n';
        
        // 提取比赛信息
        const matchInfo = extractMatchInfo(doc, hash);
        if (matchInfo.homeTeam && matchInfo.awayTeam) {
            markdown += `### ${matchInfo.homeTeam} ${matchInfo.homeScore} - ${matchInfo.awayScore} ${matchInfo.awayTeam}\n\n`;
            
            // 基本信息
            const basicInfo = [];
            if (matchInfo.league) basicInfo.push(`**联赛**: ${matchInfo.league}`);
            if (matchInfo.matchTime) basicInfo.push(`**时间**: ${matchInfo.matchTime}`);
            if (matchInfo.venue) basicInfo.push(`**场地**: ${matchInfo.venue}`);
            
            if (basicInfo.length > 0) {
                markdown += basicInfo.join(' | ') + '\n\n';
            }
            
            // 状态信息
            const statusInfo = [];
            if (matchInfo.currentTime) statusInfo.push(`**比赛进行**: ${matchInfo.currentTime}`);
            if (matchInfo.weather) statusInfo.push(`**天气**: ${matchInfo.weather}`);
            if (matchInfo.temperature) statusInfo.push(`**温度**: ${matchInfo.temperature}`);
            
            if (statusInfo.length > 0) {
                markdown += statusInfo.join(' | ') + '\n\n';
            }
        }
        
        // 查找统计项目 - 使用优先级查询
        const selectors = ['#teamTechDiv .lists', '.teamTechDiv .lists', '.lists'];
        let statItems = null;
        
        for (const selector of selectors) {
            statItems = ParserCache.getQueryResult(doc, selector, hash);
            if (statItems.length > 0) {
                // 如果是通用选择器，需要过滤
                if (selector === '.lists') {
                    statItems = Array.from(statItems).filter(item => {
                        const dataDiv = item.querySelector('.data');
                        if (dataDiv) {
                            const spans = dataDiv.querySelectorAll('span');
                            return spans.length >= 3;
                        }
                        return false;
                    });
                }
                break;
            }
        }
        
        if (!statItems || statItems.length === 0) {
            const result = { success: false, markdown: '', data: [] };
            ParserCache.resultCache.set(cacheKey, result);
            return result;
        }
        
        // 提取统计数据
        const statsData = [];
        const tableRows = [];
        const timeRegex = /分钟|'/;
        
        for (const item of statItems) {
            const dataDiv = item.querySelector('.data');
            if (dataDiv) {
                const spans = dataDiv.querySelectorAll('span');
                if (spans.length >= 3) {
                    const homeValue = spans[0].textContent.trim();
                    const statName = spans[1].textContent.trim();
                    const awayValue = spans[2].textContent.trim();
                    
                    // 过滤时间相关项目
                    if (statName && !timeRegex.test(statName)) {
                        tableRows.push([statName, homeValue, awayValue]);
                        statsData.push({
                            name: statName,
                            home: homeValue,
                            away: awayValue
                        });
                    }
                }
            }
        }
        
        // 生成表格
        markdown += createMarkdownTable(['统计项目', '主队', '客队'], tableRows);
        
        const result = { success: statsData.length > 0, markdown: markdown, data: statsData };
        ParserCache.resultCache.set(cacheKey, result);
        return result;
        
    } catch (error) {
        return { success: false, markdown: '', data: [] };
    }
}

// 从完整HTML中解析详细事件（简化版本）
function parseEventsFromFullHtml(htmlContent, contentHash = null) {
    try {
        const hash = contentHash || ParserCache._hash(htmlContent);
        const cacheKey = `events_${hash}`;
        
        // 检查缓存
        if (ParserCache.resultCache.has(cacheKey)) {
            return ParserCache.resultCache.get(cacheKey);
        }
        
        // 使用缓存的DOM解析
        const doc = ParserCache.getParsedDoc(htmlContent);
        
        let markdown = '## 详细事件\n\n';
        
        // 查找比赛队伍信息 - 优先从analyhead获取
        let homeTeam = '', awayTeam = '', homeScore = '0', awayScore = '0';
        
        // 先尝试从analyhead获取
        const matchInfo = extractMatchInfo(doc, hash);
        if (matchInfo.homeTeam && matchInfo.awayTeam) {
            homeTeam = matchInfo.homeTeam;
            awayTeam = matchInfo.awayTeam;
            homeScore = matchInfo.homeScore;
            awayScore = matchInfo.awayScore;
        } else {
            // 备选：从事件区域获取
            const teamInfo = ParserCache.getQueryResult(doc, '.teamtit .data', hash)[0];
            if (teamInfo) {
                const homeTeamSpan = teamInfo.querySelector('.homeTN');
                const awayTeamSpan = teamInfo.querySelector('.guestTN');
                
                if (homeTeamSpan) {
                    const homeScoreElement = homeTeamSpan.querySelector('i');
                    if (homeScoreElement) {
                        homeScore = homeScoreElement.textContent.trim();
                        homeTeam = homeTeamSpan.textContent.replace(homeScore, '').trim();
                    } else {
                        homeTeam = homeTeamSpan.textContent.trim();
                    }
                }
                
                if (awayTeamSpan) {
                    const awayScoreElement = awayTeamSpan.querySelector('i');
                    if (awayScoreElement) {
                        awayScore = awayScoreElement.textContent.trim();
                        awayTeam = awayTeamSpan.textContent.replace(awayScore, '').trim();
                    } else {
                        awayTeam = awayTeamSpan.textContent.trim();
                    }
                }
            }
        }
        
        if (homeTeam && awayTeam) {
            markdown += `### ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}\n\n`;
        }
        
        // 查找事件列表 - 使用优先级查询
        const selectors = ['#teamEventDiv .lists', '.teamEventDiv .lists', '.lists'];
        let eventItems = null;
        
        for (const selector of selectors) {
            eventItems = ParserCache.getQueryResult(doc, selector, hash);
            if (eventItems.length > 0) {
                // 如果是通用选择器，需要过滤事件相关数据
                if (selector === '.lists') {
                    const timeRegex = /\d+'|分钟/;
                    eventItems = Array.from(eventItems).filter(item => {
                        const dataDiv = item.querySelector('.data');
                        if (dataDiv) {
                            const spans = dataDiv.querySelectorAll('span');
                            if (spans.length >= 3) {
                                const timeText = spans[1].textContent.trim();
                                return timeRegex.test(timeText);
                            }
                        }
                        return false;
                    });
                }
                break;
            }
        }
        
        if (!eventItems || eventItems.length === 0) {
            const result = { success: false, markdown: '', data: [] };
            ParserCache.resultCache.set(cacheKey, result);
            return result;
        }
        
        // 提取事件数据
        const eventRows = [];
        const timeRegex = /\d+/;
        
        // 事件统计用于预测伤停补时
        let eventStats = {
            goalsNoVAR: 0,
            goalsVAR: 0,
            pensNoVAR: 0,
            pensVAR: 0,
            subs: 0,
            minorInjuries: 0,
            seriousInjuries: 0,
            varOther: 0,
            redsOrBrawls: 0,
            coolingBreaks: 0,
            timeWastings: 0
        };
        
        for (const item of eventItems) {
            const dataDiv = item.querySelector('.data');
            if (dataDiv) {
                const spans = dataDiv.querySelectorAll('span');
                if (spans.length >= 3) {
                    const time = spans[1]?.textContent.trim() || '';
                    
                    // 只处理有效时间格式的事件
                    if (time && (time.includes('\'') || timeRegex.test(time))) {
                        const homeEventResult = spans[0] ? parseEventContent(spans[0], true) : { content: '', stats: {} };
                        const awayEventResult = spans[2] ? parseEventContent(spans[2], true) : { content: '', stats: {} };
                        
                        // 累计事件统计
                        ['goalsNoVAR', 'goalsVAR', 'pensNoVAR', 'pensVAR', 'subs', 'minorInjuries', 
                         'seriousInjuries', 'varOther', 'redsOrBrawls', 'coolingBreaks', 'timeWastings'].forEach(key => {
                            eventStats[key] += (homeEventResult.stats[key] || 0) + (awayEventResult.stats[key] || 0);
                        });
                        
                        eventRows.push([time, homeEventResult.content || '', awayEventResult.content || '']);
                    }
                }
            }
        }
        
        // 预测上半场伤停补时
        const predictedStoppage = predictFirstHalfStoppage(eventStats);
        
        // 生成表格
        markdown += createMarkdownTable(['时间', '主队事件', '客队事件'], eventRows);
        
        // 添加伤停补时预测
        if (eventRows.length > 0) {
            markdown += `\n### 📊 伤停补时预测\n\n`;
            markdown += `**上半场预计伤停补时：${predictedStoppage} 分钟**\n\n`;
            markdown += `*基于事件统计：进球${eventStats.goalsNoVAR + eventStats.goalsVAR}个，换人${eventStats.subs}次，红牌${eventStats.redsOrBrawls}张*\n\n`;
        }
        
        const result = { success: eventRows.length > 0, markdown: markdown, data: eventRows.length };
        ParserCache.resultCache.set(cacheKey, result);
        return result;
        
    } catch (error) {
        return { success: false, markdown: '', data: [] };
    }
}

// 解析事件内容
function parseEventContent(spanElement, includeStats = false) {
    if (!spanElement) {
        return includeStats ? { content: '-', stats: {} } : '-';
    }
    
    let content = '';
    let eventType = '';
    let players = [];
    let assistPlayer = '';
    
    // 初始化统计对象
    let stats = {
        goalsNoVAR: 0,
        goalsVAR: 0,
        pensNoVAR: 0,
        pensVAR: 0,
        subs: 0,
        minorInjuries: 0,
        seriousInjuries: 0,
        varOther: 0,
        redsOrBrawls: 0,
        coolingBreaks: 0,
        timeWastings: 0
    };
    
    // 首先检查文本内容中的VAR相关关键词
    const fullTextContent = spanElement.textContent.toLowerCase();
    
    // 首先检查是否有图片标识（事件类型）
    const images = spanElement.querySelectorAll('img');
    if (images.length > 0) {
        images.forEach(img => {
            const src = img.getAttribute('src');
            const title = img.getAttribute('title');
            
            if (src && title) {
                if (src.includes('bf_img2/1.png') || title === '入球') {
                    eventType = '⚽进球';
                    // 检查是否包含VAR信息
                    const textContent = spanElement.textContent.toLowerCase();
                    if (textContent.includes('var') || textContent.includes('视频') || textContent.includes('复审')) {
                        stats.goalsVAR = 1;
                    } else {
                        stats.goalsNoVAR = 1;
                    }
                } else if (src.includes('bf_img2/14.png') || title === '视频裁判') {
                    // VAR视频裁判事件 - 检查文本内容确定具体类型
                    if (fullTextContent.includes('入球') || fullTextContent.includes('进球') || fullTextContent.includes('入球复审')) {
                        eventType = '⚽进球(VAR)';
                        stats.goalsVAR = 1;
                    } else if (fullTextContent.includes('点球') || fullTextContent.includes('點球')) {
                        eventType = '[点球(VAR)]';
                        stats.pensVAR = 1;
                    } else {
                        // 处理"视频回看"等其他VAR事件
                        if (fullTextContent.includes('回看') || fullTextContent.includes('复核') || fullTextContent.includes('检查')) {
                            eventType = '[VAR回看]';
                        } else {
                            eventType = '[VAR复审]';
                        }
                        stats.varOther = 1;
                    }
                } else if (src.includes('bf_img2/3.png') || title === '黄牌') {
                    eventType = '🟨黄牌';
                } else if (src.includes('bf_img2/2.png') || title === '紅牌' || title === '红牌') {
                    eventType = '🟥红牌';
                    stats.redsOrBrawls = 1;
                } else if (src.includes('bf_img2/11.png') || title === '换人') {
                    eventType = '🔄换人';
                    stats.subs = 1;
                } else if (src.includes('bf_img2/7.png') || title === '点球') {
                    eventType = '⚽点球';
                    // 检查是否包含VAR信息
                    if (fullTextContent.includes('var') || fullTextContent.includes('视频') || fullTextContent.includes('复审')) {
                        stats.pensVAR = 1;
                    } else {
                        stats.pensNoVAR = 1;
                    }
                } else if (title.includes('点球') || title.includes('點球')) {
                    eventType = `[${title}]`;
                    // 检查是否包含VAR信息
                    const textContent = spanElement.textContent.toLowerCase();
                    if (textContent.includes('var') || textContent.includes('视频')) {
                        stats.pensVAR = 1;
                    } else {
                        stats.pensNoVAR = 1;
                    }
                } else if (title.includes('伤') || title.includes('傷') || title.includes('医疗')) {
                    eventType = `[${title}]`;
                    // 判断是否严重伤情
                    if (title.includes('担架') || title.includes('头部') || title.includes('重伤')) {
                        stats.seriousInjuries = 1;
                    } else {
                        stats.minorInjuries = 1;
                    }
                } else if (title.includes('var') || title.includes('VAR') || title.includes('视频')) {
                    eventType = `[${title}]`;
                    stats.varOther = 1;
                } else if (title.includes('饮水') || title.includes('暂停') || title.includes('降温')) {
                    eventType = `[${title}]`;
                    stats.coolingBreaks = 1;
                } else if (title.includes('拖延') || title.includes('耗时') || title.includes('警告')) {
                    eventType = `[${title}]`;
                    stats.timeWastings = 1;
                } else {
                    eventType = `[${title}]`; // 使用原始title作为事件类型，添加括号标识
                }
            }
        });
        
        // 如果只有图片没有球员名称，直接返回事件类型
        const playerLinks = spanElement.querySelectorAll('a');
        if (playerLinks.length === 0) {
            // 检查是否有其他文本内容（球员姓名）
            const textContent = spanElement.textContent.trim();
            // 移除图片的alt/title文本，只保留实际的球员名称
            const imgTitles = Array.from(images).map(img => img.getAttribute('title') || '').join('');
            const playerText = textContent.replace(imgTitles, '').trim();
            
            if (playerText && playerText !== eventType) {
                content = `${eventType} ${playerText}`;
            } else {
                content = eventType;
            }
            
            return includeStats ? { content, stats } : content;
        }
    }
    
    // 收集球员信息（有链接的情况）
    const playerLinks = spanElement.querySelectorAll('a');
    playerLinks.forEach(link => {
        const playerName = link.textContent.trim();
        if (playerName) {
            if (playerName.includes('助攻:')) {
                assistPlayer = playerName.replace('助攻:', '').replace('(', '').replace(')', '').trim();
            } else {
                players.push(playerName);
            }
        }
    });
    
    // 格式化输出
    if (eventType === '⚽进球') {
        content = eventType;
        if (players.length > 0) {
            content += ` ${players.join(' ')}`;
        }
        if (assistPlayer) {
            content += ` (助攻: ${assistPlayer})`;
        }
    } else if (eventType === '🔄换人') {
        if (players.length >= 2) {
            content = `${eventType} ↑${players[0]} ↓${players[1]}`;
        } else if (players.length === 1) {
            content = `${eventType} ${players[0]}`;
        } else {
            content = eventType;
        }
    } else if (eventType === '🟨黄牌' || eventType === '🟥红牌') {
        if (players.length > 0) {
            content = `${players.join(' ')} ${eventType}`;
        } else {
            content = eventType;
        }
    } else if (eventType) {
        // 其他识别到的事件类型
        if (players.length > 0) {
            content = `${eventType} ${players.join(' ')}`;
        } else {
            content = eventType;
        }
    } else {
        // 如果没有识别到事件类型，检查文本内容
        const textContent = spanElement.textContent.trim();
        if (textContent) {
            content = textContent;
        } else {
            content = '-';
        }
    }
    
    return includeStats ? { content: content || '-', stats } : (content || '-');
}

/**
 * 上半场伤停补时预测（分钟）
 * 传入各类事件的数量，返回建议显示的补时时长（整数分钟）
 */
function predictFirstHalfStoppage({
  baseMin = 1,          // 上半场基础值：1（无特殊事件时取 1）
  goalsNoVAR = 0,       // 进球（无 VAR）
  goalsVAR = 0,         // 进球（含 VAR 复核）
  pensNoVAR = 0,        // 点球（无 VAR）
  pensVAR = 0,          // 点球（含 VAR 复核）
  subs = 0,             // 换人（人数）
  minorInjuries = 0,    // 轻伤/短暂治疗（次）
  seriousInjuries = 0,  // 严重伤情/担架/头部评估（次）
  varOther = 0,         // 其他 VAR 介入（非进球/点球）
  redsOrBrawls = 0,     // 红牌/群体冲突（次）
  coolingBreaks = 0,    // 饮水暂停（次）
  timeWastings = 0,     // 明显拖延被警告等（次）
  extraSeconds = 0      // 设备/场地问题等自定义额外秒数
} = {}) {
  // 事件权重（秒）
  const W = {
    goal: 75,
    varAfterGoal: 90,   // 进球后的 VAR 额外时间
    pen: 120,
    varForPen: 90,      // 点球的 VAR 额外时间
    sub: 35,
    minorInjury: 90,
    seriousInjury: 240,
    varOther: 120,
    redOrBrawl: 90,
    cooling: 180,
    timeWasting: 45
  };

  // 累加总秒数（按事件发生时段的典型耗时）
  const totalSeconds =
      goalsNoVAR * W.goal +
      goalsVAR    * (W.goal + W.varAfterGoal) +
      pensNoVAR   * W.pen +
      pensVAR     * (W.pen + W.varForPen) +
      subs        * W.sub +
      minorInjuries  * W.minorInjury +
      seriousInjuries* W.seriousInjury +
      varOther    * W.varOther +
      redsOrBrawls* W.redOrBrawl +
      coolingBreaks  * W.cooling +
      timeWastings   * W.timeWasting +
      Math.max(0, extraSeconds);

  // 折算为"应加分钟"（>45s 进 1）
  const minutesFromEvents =
    Math.floor(totalSeconds / 60) + ((totalSeconds % 60) > 45 ? 1 : 0);

  // 总补时 = 基础值 + 事件分钟
  return Math.max(0, baseMin + minutesFromEvents);
}

// 提取比赛信息（优化版本）
function extractMatchInfo(doc, contentHash = null) {
    // 如果有contentHash，尝试从缓存获取
    if (contentHash) {
        const cacheKey = `matchInfo_${contentHash}`;
        if (ParserCache.resultCache.has(cacheKey)) {
            return ParserCache.resultCache.get(cacheKey);
        }
    }
    
    const matchInfo = {
        homeTeam: '',
        awayTeam: '',
        homeScore: '0',
        awayScore: '0',
        league: '',
        matchTime: '',
        venue: '',
        currentTime: '',
        weather: '',
        temperature: ''
    };
    
    // 使用缓存查询（如果有contentHash）
    let analyHead;
    if (contentHash) {
        const analyHeadResults = ParserCache.getQueryResult(doc, '.analyhead', contentHash);
        analyHead = analyHeadResults[0];
    } else {
        analyHead = doc.querySelector('.analyhead');
    }
    
    if (!analyHead) {
        return matchInfo;
    }
    
    // 优化：批量查询所有需要的元素
    const homeLink = analyHead.querySelector('.home a');
    const guestLink = analyHead.querySelector('.guest a');
    const vsDiv = analyHead.querySelector('.vs');
    
    // 提取主队和客队信息
    if (homeLink) {
        matchInfo.homeTeam = homeLink.textContent.trim();
    }
    
    if (guestLink) {
        matchInfo.awayTeam = guestLink.textContent.trim();
    }
    
    // 批量提取vs区域的信息
    if (vsDiv) {
        // 优化：使用Map缓存选择器查询结果
        const vsSelectors = {
            league: '.LName',
            time: '.time',
            venue: '.place',
            currentTime: '#mState'
        };
        
        // 批量查询
        const leagueLink = vsDiv.querySelector(vsSelectors.league);
        const timeSpan = vsDiv.querySelector(vsSelectors.time);
        const venueLink = vsDiv.querySelector(vsSelectors.venue);
        const currentTimeElement = vsDiv.querySelector(vsSelectors.currentTime);
        
        if (leagueLink) matchInfo.league = leagueLink.textContent.trim();
        if (timeSpan) matchInfo.matchTime = timeSpan.textContent.trim();
        if (venueLink) matchInfo.venue = venueLink.textContent.trim();
        if (currentTimeElement) {
            const timeText = currentTimeElement.textContent.trim();
            matchInfo.currentTime = timeText === '中' ? '中场休息' : timeText;
        }
        
        // 优化：批量提取比分
        const scoreElements = vsDiv.querySelectorAll('.score');
        if (scoreElements.length >= 2) {
            matchInfo.homeScore = scoreElements[0].textContent.trim();
            matchInfo.awayScore = scoreElements[1].textContent.trim();
        }
        
        // 优化：批量处理天气和温度信息
        const labelElements = vsDiv.querySelectorAll('label');
        for (const label of labelElements) {
            const labelText = label.textContent.trim();
            if (labelText.includes('天气：')) {
                matchInfo.weather = labelText.replace('天气：', '').trim();
            } else if (labelText.includes('温度：')) {
                matchInfo.temperature = labelText.replace('温度：', '').trim();
            }
        }
    }
    
    // 缓存结果（如果有contentHash）
    if (contentHash) {
        const cacheKey = `matchInfo_${contentHash}`;
        ParserCache.resultCache.set(cacheKey, matchInfo);
    }
    
    return matchInfo;
}

// 解析技术统计数据（新增功能）
function parseTechnicalStats() {
    const htmlContent = getHtmlContent('tech-stats');
    const outputDiv = document.getElementById('tech-stats-output');
    
    if (!htmlContent) {
        showError('请先输入HTML内容', outputDiv);
        return;
    }
    
    PerformanceMonitor.start('parseTechnicalStats');
    
    try {
        // 检查缓存
        const contentHash = ParserCache._hash(htmlContent);
        const cacheKey = `techStats_${contentHash}`;
        
        if (ParserCache.resultCache.has(cacheKey)) {
            const cachedResult = ParserCache.resultCache.get(cacheKey);
            showSuccess(`${cachedResult.message} (缓存)`, cachedResult.markdown, outputDiv);
            setGlobalData('currentTechStatsData', cachedResult.markdown);
            autoCopyAndClear(cachedResult.markdown, '技术统计', 'tech-stats');
            PerformanceMonitor.end('parseTechnicalStats');
            return;
        }
        
        // 显示处理中状态
        showProcessing('正在解析技术统计数据，请稍候...', outputDiv);
        
        // 使用setTimeout避免阻塞UI
        setTimeout(() => {
            try {
                // 使用缓存的DOM解析
                const doc = ParserCache.getParsedDoc(htmlContent);
                
                let markdown = '# 技术统计数据\n\n';
                
                // 查找技术统计容器
                const techStatsContainer = doc.querySelector('.technical-statistics');
                if (!techStatsContainer) {
                    showError('未找到技术统计数据，请检查HTML格式', outputDiv);
                    PerformanceMonitor.end('parseTechnicalStats');
                    return;
                }
                
                // 提取比赛信息
                const matchInfo = extractMatchInfoFromStats(doc, contentHash);
                if (matchInfo.homeTeam && matchInfo.awayTeam) {
                    markdown += `### ${matchInfo.homeTeam} ${matchInfo.homeScore || '0'} - ${matchInfo.awayScore || '0'} ${matchInfo.awayTeam}\n\n`;
                    
                    if (matchInfo.matchTime) {
                        markdown += `**开赛时间**: ${matchInfo.matchTime}\n\n`;
                    }
                    
                    if (matchInfo.weather) {
                        markdown += `**天气信息**: ${matchInfo.weather}\n\n`;
                    }
                }
                
                // 解析顶部数据 (角球、红黄牌、控球率)
                const topData = parseTopStats(techStatsContainer);
                if (topData.length > 0) {
                    markdown += '## 主要统计\n\n';
                    markdown += createMarkdownTable(['统计项目', '主队', '客队'], topData);
                    markdown += '\n';
                }
                
                // 解析底部数据 (进攻、射门等)
                const bottomData = parseBottomStats(techStatsContainer);
                if (bottomData.length > 0) {
                    markdown += '## 详细统计\n\n';
                    markdown += createMarkdownTable(['统计项目', '主队', '客队'], bottomData);
                }
                
                // 解析事件数据
                const eventData = parseEventData(doc);
                if (eventData.length > 0) {
                    markdown += '\n## 比赛事件\n\n';
                    markdown += createMarkdownTable(['时间', '事件类型', '描述'], eventData);
                }
                
                if (topData.length === 0 && bottomData.length === 0 && eventData.length === 0) {
                    showError('未找到有效的技术统计或事件数据', outputDiv);
                    PerformanceMonitor.end('parseTechnicalStats');
                    return;
                }
                
                const totalStats = topData.length + bottomData.length;
                const eventCount = eventData.length;
                const message = eventCount > 0 ? 
                    `成功提取 ${totalStats} 项技术统计数据 + ${eventCount} 个比赛事件` : 
                    `成功提取 ${totalStats} 项技术统计数据`;
                
                // 缓存结果
                const result = { markdown, message, count: totalStats };
                ParserCache.resultCache.set(cacheKey, result);
                
                setGlobalData('currentTechStatsData', markdown);
                showSuccess(message, markdown, outputDiv);
                
                // 自动复制结果到剪贴板并清空输入内容
                autoCopyAndClear(markdown, '技术统计', 'tech-stats');
                
                PerformanceMonitor.end('parseTechnicalStats');
                
            } catch (error) {
                showError(`解析失败: ${error.message}`, outputDiv);
                PerformanceMonitor.end('parseTechnicalStats');
            }
        }, 10);
        
    } catch (error) {
        showError(`解析失败: ${error.message}`, outputDiv);
        PerformanceMonitor.end('parseTechnicalStats');
    }
}

// 从技术统计页面提取比赛信息
function extractMatchInfoFromStats(doc, contentHash) {
    const matchInfo = {
        homeTeam: '',
        awayTeam: '',
        homeScore: '0',
        awayScore: '0',
        matchTime: '',
        weather: ''
    };
    
    // 查找比赛时间和天气信息
    const topTitle = doc.querySelector('.top-title');
    if (topTitle) {
        // 提取开赛时间
        const timeText = topTitle.textContent;
        const timeMatch = timeText.match(/(\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2})/);
        if (timeMatch) {
            matchInfo.matchTime = timeMatch[1];
        }
        
        // 提取天气信息
        const weatherElements = topTitle.querySelectorAll('.item');
        const weatherData = [];
        
        weatherElements.forEach(item => {
            const textElement = item.querySelector('.text');
            if (textElement) {
                const value = textElement.textContent.trim();
                if (item.classList.contains('weather')) {
                    weatherData.push(`天气: ${value}`);
                } else if (item.classList.contains('temperature')) {
                    weatherData.push(`温度: ${value}`);
                } else if (item.classList.contains('wind')) {
                    weatherData.push(`风速: ${value}`);
                } else if (item.classList.contains('humidity')) {
                    weatherData.push(`湿度: ${value}`);
                }
            }
        });
        
        if (weatherData.length > 0) {
            matchInfo.weather = weatherData.join(', ');
        }
    }
    
    // 尝试从现有的extractMatchInfo函数获取队名和比分
    const existingInfo = extractMatchInfo(doc, contentHash);
    if (existingInfo.homeTeam) {
        matchInfo.homeTeam = existingInfo.homeTeam;
        matchInfo.awayTeam = existingInfo.awayTeam;
        matchInfo.homeScore = existingInfo.homeScore;
        matchInfo.awayScore = existingInfo.awayScore;
    }
    
    return matchInfo;
}

// 解析顶部统计数据 (角球、红黄牌、控球率)
function parseTopStats(container) {
    const stats = [];
    
    // 解析左右两侧的数据
    const leftSide = container.querySelector('.ts-t-left');
    const rightSide = container.querySelector('.ts-t-right');
    const center = container.querySelector('.ts-t-center');
    
    // 处理角球数据
    if (leftSide && rightSide) {
        const leftCorner = leftSide.querySelector('.corner .text');
        const rightCorner = rightSide.querySelector('.corner .text');
        if (leftCorner && rightCorner) {
            stats.push(['角球', leftCorner.textContent.trim(), rightCorner.textContent.trim()]);
        }
        
        // 处理红牌数据
        const leftRed = leftSide.querySelector('.card-red .text');
        const rightRed = rightSide.querySelector('.card-red .text');
        if (leftRed && rightRed) {
            stats.push(['红牌', leftRed.textContent.trim(), rightRed.textContent.trim()]);
        }
        
        // 处理黄牌数据
        const leftYellow = leftSide.querySelector('.card-yellow .text');
        const rightYellow = rightSide.querySelector('.card-yellow .text');
        if (leftYellow && rightYellow) {
            stats.push(['黄牌', leftYellow.textContent.trim(), rightYellow.textContent.trim()]);
        }
    }
    
    // 处理控球率
    if (center) {
        const barPanel = center.querySelector('.bar-panel');
        if (barPanel) {
            const leftNum = barPanel.querySelector('.left .tnum');
            const rightNum = barPanel.querySelector('.right .tnum');
            const centerText = barPanel.querySelector('.barcenter');
            
            if (leftNum && rightNum && centerText) {
                stats.push([
                    centerText.textContent.trim(),
                    leftNum.textContent.trim(),
                    rightNum.textContent.trim()
                ]);
            }
        }
    }
    
    return stats;
}

// 解析底部统计数据 (进攻、射门等)
function parseBottomStats(container) {
    const stats = [];
    
    const bottomSection = container.querySelector('.ts-bottom');
    if (!bottomSection) return stats;
    
    // 查找所有统计项目
    const barPanels = bottomSection.querySelectorAll('.bar-panel');
    
    barPanels.forEach(panel => {
        const leftNum = panel.querySelector('.left .tnum');
        const rightNum = panel.querySelector('.right .tnum');
        const centerText = panel.querySelector('.barcenter');
        
        if (leftNum && rightNum && centerText) {
            const statName = centerText.textContent.trim();
            const leftValue = leftNum.textContent.trim();
            const rightValue = rightNum.textContent.trim();
            
            stats.push([statName, leftValue, rightValue]);
        }
    });
    
    return stats;
}

// 解析事件数据
function parseEventData(doc) {
    const events = [];
    
    // 查找事件列表容器
    const eventList = doc.querySelector('.event-list');
    if (!eventList) {
        return events;
    }
    
    // 获取所有事件项
    const eventItems = eventList.querySelectorAll('li');
    
    eventItems.forEach(item => {
        // 获取时间
        const timeElement = item.querySelector('.time');
        const time = timeElement ? timeElement.textContent.trim() : '';
        
        // 获取事件描述
        const descElement = item.querySelector('.vs-content p');
        const description = descElement ? descElement.textContent.trim() : '';
        
        if (description) {
            // 确定事件类型
            let eventType = '其他';
            
            // 检查图标类型
            const iconElement = item.querySelector('.icon svg use');
            if (iconElement) {
                const iconHref = iconElement.getAttribute('xlink:href');
                
                if (iconHref) {
                    if (iconHref.includes('jiaoqiu')) {
                        eventType = '⚽ 角球';
                    } else if (iconHref.includes('jinqiu')) {
                        eventType = '⚽ 进球';
                    } else if (iconHref.includes('dianqiu')) {
                        eventType = '⚽ 点球';
                    } else if (iconHref.includes('huangpai')) {
                        eventType = '🟨 黄牌';
                    } else if (iconHref.includes('hongpai')) {
                        eventType = '🟥 红牌';
                    } else if (iconHref.includes('huanren')) {
                        eventType = '🔄 换人';
                    } else if (iconHref.includes('wulongqiu')) {
                        eventType = '⚽ 乌龙球';
                    } else if (iconHref.includes('lianghuangyihong')) {
                        eventType = '🟥 两黄变红';
                    } else if (iconHref.includes('yuewei')) {
                        eventType = '⚠️ 越位';
                    } else if (iconHref.includes('renyiqiu')) {
                        eventType = '⚽ 任意球';
                    } else if (iconHref.includes('qiumenqiu')) {
                        eventType = '⚽ 球门球';
                    } else if (iconHref.includes('shangtingbushi')) {
                        eventType = '⏱️ 伤停补时';
                    } else if (iconHref.includes('jingong')) {
                        eventType = '⚔️ 进攻';
                    } else if (iconHref.includes('weixianjingong')) {
                        eventType = '🔥 危险进攻';
                    } else if (iconHref.includes('shijianbai')) {
                        eventType = '📋 赛事信息';
                    } else if (iconHref.includes('shaozibai')) {
                        eventType = '🎯 比赛开始';
                    }
                }
            }
            
            // 检查系统事件
            if (item.classList.contains('system')) {
                const htElement = item.querySelector('.ft');
                if (htElement && htElement.textContent.trim() === 'HT') {
                    eventType = '⏱️ 半场结束';
                } else if (description.includes('比赛开始')) {
                    eventType = '🎯 比赛开始';
                    return;
                } else if (description.includes('天气情况')) {
                    eventType = '🌤️ 天气信息';
                } else if (description.includes('场地情况')) {
                    eventType = '🏟️ 场地信息';
                } else {
                    eventType = '📋 赛事信息';
                    return;
                }
            }
            
            // 如果没有时间显示，使用空字符串
            const displayTime = time || '-';
            
            events.push([displayTime, eventType, description]);
        }
    });
    
    // 按时间倒序排列（最新事件在上）
    return events.reverse();
}

// 将解析函数暴露到全局，确保跨模块访问
window.parseLeagues = parseLeagues;
window.parseMatches = parseMatches;
window.parseFullMatchData = parseFullMatchData;
window.parseStatsFromFullHtml = parseStatsFromFullHtml;
window.parseEventsFromFullHtml = parseEventsFromFullHtml;
window.parseTechnicalStats = parseTechnicalStats;

// 导出解析器函数（用于模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseLeagues,
        parseMatches,
        parseFullMatchData,
        parseStatsFromFullHtml,
        parseEventsFromFullHtml,
        parseEventContent,
        extractMatchInfo,
        predictFirstHalfStoppage
    };
}