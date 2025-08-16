// parsers.js - 解析器模块：处理联赛、比赛、统计和事件数据

// 解析联赛信息
function parseLeagues() {
    const htmlContent = getHtmlContent('league');
    const outputDiv = document.getElementById('league-output');
    
    if (!htmlContent) {
        outputDiv.innerHTML = '<div class="error">请先输入HTML内容</div>';
        return;
    }
    
    try {
        // 使用DOMParser解析HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        let markdown = '# 足球联赛列表\n\n';
        
        // 查找联赛数据
        const leagueSpans = doc.querySelectorAll('span[onclick*="CheckLeague"]');
        
        if (leagueSpans.length === 0) {
            outputDiv.innerHTML = '<div class="error">未找到联赛数据，请检查HTML格式</div>';
            return;
        }
        
        // 按组织分类
        let currentGroup = '';
        let groupData = {};
        
        leagueSpans.forEach(span => {
            const text = span.textContent.trim();
            const match = text.match(/^(.+?)\[(\d+)\]$/);
            
            if (match) {
                const leagueName = match[1];
                const matchCount = match[2];
                
                // 尝试找到所属分组
                let groupElement = span.closest('.group');
                if (groupElement && groupElement.previousElementSibling) {
                    const groupTitle = groupElement.previousElementSibling.textContent.trim();
                    if (groupTitle !== currentGroup) {
                        currentGroup = groupTitle;
                        if (!groupData[currentGroup]) {
                            groupData[currentGroup] = [];
                        }
                    }
                }
                
                if (currentGroup && groupData[currentGroup]) {
                    groupData[currentGroup].push({
                        name: leagueName,
                        count: matchCount
                    });
                }
            }
        });
        
        // 生成Markdown
        if (Object.keys(groupData).length > 0) {
            for (const [groupName, leagues] of Object.entries(groupData)) {
                markdown += `## ${groupName}字母开头联赛\n\n`;
                markdown += '| 联赛名称 |\n';
                markdown += '|---------|\n';
                
                leagues.forEach(league => {
                    markdown += `| ${league.name} |\n`;
                });
                
                markdown += '\n';
            }
        } else {
            // 如果没有分组，直接列出所有联赛
            markdown += '| 联赛名称 |\n';
            markdown += '|---------|\n';
            
            leagueSpans.forEach(span => {
                const text = span.textContent.trim();
                const match = text.match(/^(.+?)\[(\d+)\]$/);
                if (match) {
                    markdown += `| ${match[1]} |\n`;
                }
            });
        }
        
        setGlobalData('currentLeagueData', markdown);
        outputDiv.innerHTML = `<div class="success">成功提取 ${leagueSpans.length} 个联赛信息</div><pre>${markdown}</pre>`;
        
    } catch (error) {
        outputDiv.innerHTML = `<div class="error">解析失败: ${error.message}</div>`;
    }
}

// 解析比赛数据
function parseMatches() {
    const htmlContent = getHtmlContent('match');
    const leagueFilterText = document.getElementById('league-filter').value.trim();
    const outputDiv = document.getElementById('match-output');
    
    if (!htmlContent) {
        outputDiv.innerHTML = '<div class="error">请先输入HTML内容</div>';
        return;
    }
    
    // 显示处理中状态
    outputDiv.innerHTML = '<div class="processing"><div class="spinner"></div>正在解析数据，请稍候...</div>';
    
    // 解析联赛筛选条件
    const targetLeagues = leagueFilterText ? 
        leagueFilterText.split('\n').map(league => league.trim()).filter(league => league) : 
        [];
    
    // 使用setTimeout避免阻塞UI
    setTimeout(() => {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            
            let markdown = '# 比赛数据\n\n';
            if (targetLeagues.length > 0) {
                markdown += `## 筛选联赛: ${targetLeagues.join(', ')}\n\n`;
            }
            markdown += '| 时间 | 联赛 | 状态 | 主队 | 比分 | 客队 | 半场 |\n';
            markdown += '|------|------|------|------|------|------|------|\n';
            
            const matchRows = doc.querySelectorAll('tr[id^="tr1_"]');
            
            if (matchRows.length === 0) {
                outputDiv.innerHTML = '<div class="error">未找到比赛数据，请检查HTML格式</div>';
                return;
            }
            
            // 处理单行数据的函数
            function processMatchRow(row, index) {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 8) {
                    const time = cells[2]?.textContent.trim() || '-';
                    const league = cells[1]?.textContent.trim() || '-';
                    const status = cells[3]?.textContent.trim() || '-';
                    const homeTeam = cells[4]?.querySelector('a')?.textContent.trim() || cells[4]?.textContent.trim() || '-';
                    const score = cells[5]?.textContent.trim() || '-';
                    const awayTeam = cells[6]?.querySelector('a')?.textContent.trim() || cells[6]?.textContent.trim() || '-';
                    const halfTime = cells[7]?.textContent.trim() || '-';
                    
                    // 如果设置了联赛筛选，检查是否匹配
                    if (targetLeagues.length > 0) {
                        const isMatch = targetLeagues.some(targetLeague => 
                            league.includes(targetLeague) || targetLeague.includes(league)
                        );
                        if (!isMatch) {
                            return null; // 跳过不匹配的联赛
                        }
                    }
                    
                    return `| ${time} | ${league} | ${status} | ${homeTeam} | ${score} | ${awayTeam} | ${halfTime} |\n`;
                }
                return null;
            }
            
            // 进度更新函数
            function updateProgress(processed, total) {
                const percent = Math.round((processed / total) * 100);
                outputDiv.innerHTML = `<div class="processing"><div class="spinner"></div>正在处理数据... ${percent}% (${processed}/${total})</div>`;
            }
            
            // 处理完成函数
            function onComplete(results) {
                markdown += results.join('');
                setGlobalData('currentMatchData', markdown);
                
                const filteredCount = results.length;
                const totalMessage = targetLeagues.length > 0 ? 
                    `成功筛选出 ${filteredCount} 场比赛数据 (总共 ${matchRows.length} 场)` : 
                    `成功提取 ${filteredCount} 场比赛数据`;
                outputDiv.innerHTML = `<div class="success">${totalMessage}</div><pre>${markdown}</pre>`;
            }
            
            // 分批处理，每批50条
            const batchSize = matchRows.length > 1000 ? 50 : 100;
            processBatch(Array.from(matchRows), batchSize, processMatchRow, onComplete, updateProgress);
            
        } catch (error) {
            outputDiv.innerHTML = `<div class="error">解析失败: ${error.message}</div>`;
        }
    }, 10);
}

// 解析完整比赛数据（新的主函数）
function parseFullMatchData() {
    const htmlContent = getHtmlContent('stats');
    const outputDiv = document.getElementById('combined-output');
    
    if (!htmlContent) {
        outputDiv.innerHTML = '<div class="error">请先输入完整的比赛页面HTML内容</div>';
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
            const statsResult = parseStatsFromFullHtml(htmlContent);
            if (statsResult.success) {
                combinedMarkdown += statsResult.markdown;
                hasStats = true;
                
            }
            
            // 从完整HTML中解析详细事件
            const eventsResult = parseEventsFromFullHtml(htmlContent);
            if (eventsResult.success) {
                if (hasStats) {
                    combinedMarkdown += '\n\n---\n\n';
                }
                combinedMarkdown += eventsResult.markdown;
                hasEvents = true;
            }
            
            if (hasStats || hasEvents) {
                setGlobalData('currentCombinedData', combinedMarkdown);
                const statsCount = hasStats ? '技术统计' : '';
                const eventsCount = hasEvents ? '详细事件' : '';
                const separator = hasStats && hasEvents ? ' + ' : '';
                
                outputDiv.innerHTML = `<div class="success">成功提取 ${statsCount}${separator}${eventsCount}</div><pre>${combinedMarkdown}</pre>`;
            } else {
                outputDiv.innerHTML = '<div class="error">未找到有效数据，请检查HTML格式。确保包含技术统计(.lists)或详细事件(.lists)数据。</div>';
            }
            
        } catch (error) {
            outputDiv.innerHTML = `<div class="error">解析失败: ${error.message}</div>`;
        }
    }, 10);
}

// 从完整HTML中解析技术统计
function parseStatsFromFullHtml(htmlContent) {
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
        
        // 查找技术统计区域 - 可能在不同的容器中
        let statItems = doc.querySelectorAll('#teamTechDiv .lists');
        if (statItems.length === 0) {
            // 尝试其他可能的选择器
            statItems = doc.querySelectorAll('.teamTechDiv .lists');
        }
        if (statItems.length === 0) {
            // 尝试更通用的选择器
            statItems = doc.querySelectorAll('.lists');
            // 过滤出技术统计相关的数据
            statItems = Array.from(statItems).filter(item => {
                const dataDiv = item.querySelector('.data');
                if (dataDiv) {
                    const spans = dataDiv.querySelectorAll('span');
                    return spans.length >= 3; // 技术统计通常有3个span（主队数据、项目名、客队数据）
                }
                return false;
            });
        }
        
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
                    
                    // 过滤掉可能的非统计数据
                    if (statName && !statName.includes('分钟') && !statName.includes('\'')) {
                        markdown += `| ${statName} | ${homeValue} | ${awayValue} |\n`;
                        
                        statsData.push({
                            name: statName,
                            home: homeValue,
                            away: awayValue
                        });
                    }
                }
            }
        });
        
        return { success: statsData.length > 0, markdown: markdown, data: statsData };
        
    } catch (error) {
        return { success: false, markdown: '', data: [] };
    }
}

// 从完整HTML中解析详细事件
function parseEventsFromFullHtml(htmlContent) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        let markdown = '## 详细事件\n\n';
        
        // 查找比赛队伍信息 - 优先从analyhead获取，备选从事件区域获取
        let homeTeam = '';
        let awayTeam = '';
        let homeScore = '0';
        let awayScore = '0';
        
        // 先尝试从analyhead获取
        const matchInfo = extractMatchInfo(doc);
        if (matchInfo.homeTeam && matchInfo.awayTeam) {
            homeTeam = matchInfo.homeTeam;
            awayTeam = matchInfo.awayTeam;
            homeScore = matchInfo.homeScore;
            awayScore = matchInfo.awayScore;
        } else {
            // 备选：从事件区域的teamtit获取
            const teamInfo = doc.querySelector('.teamtit .data');
            if (teamInfo) {
                const homeTeamSpan = teamInfo.querySelector('.homeTN');
                const awayTeamSpan = teamInfo.querySelector('.guestTN');
                
                if (homeTeamSpan) {
                    const homeScoreElement = homeTeamSpan.querySelector('i');
                    if (homeScoreElement) {
                        homeScore = homeScoreElement.textContent.trim();
                        const tempSpan = homeTeamSpan.cloneNode(true);
                        const scoreElement = tempSpan.querySelector('i');
                        if (scoreElement) scoreElement.remove();
                        homeTeam = tempSpan.textContent.trim();
                    } else {
                        homeTeam = homeTeamSpan.textContent.trim();
                    }
                }
                
                if (awayTeamSpan) {
                    const awayScoreElement = awayTeamSpan.querySelector('i');
                    if (awayScoreElement) {
                        awayScore = awayScoreElement.textContent.trim();
                        const tempSpan = awayTeamSpan.cloneNode(true);
                        const scoreElement = tempSpan.querySelector('i');
                        if (scoreElement) scoreElement.remove();
                        awayTeam = tempSpan.textContent.trim();
                    } else {
                        awayTeam = awayTeamSpan.textContent.trim();
                    }
                }
            }
        }
        
        if (homeTeam && awayTeam) {
            markdown += `### ${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}\n\n`;
        }
        
        markdown += '| 时间 | 主队事件 | 客队事件 |\n';
        markdown += '|------|---------|----------|\n';
        
        // 查找详细事件区域
        let eventItems = doc.querySelectorAll('#teamEventDiv .lists');
        if (eventItems.length === 0) {
            // 尝试其他可能的选择器
            eventItems = doc.querySelectorAll('.teamEventDiv .lists');
        }
        if (eventItems.length === 0) {
            // 尝试更通用的选择器，查找事件相关的lists
            const allLists = doc.querySelectorAll('.lists');
            eventItems = Array.from(allLists).filter(item => {
                const dataDiv = item.querySelector('.data');
                if (dataDiv) {
                    const spans = dataDiv.querySelectorAll('span');
                    // 事件数据通常也有3个span，但第二个是时间（包含'分钟'或单引号）
                    if (spans.length >= 3) {
                        const timeText = spans[1].textContent.trim();
                        return timeText.includes('\'') || timeText.includes('分钟') || /\d+'/.test(timeText);
                    }
                }
                return false;
            });
        }
        
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
                    
                    // 确保是有效的时间格式
                    if (time && (time.includes('\'') || /\d+/.test(time))) {
                        markdown += `| ${time} | ${homeEvent} | ${awayEvent} |\n`;
                    }
                }
            }
        });
        
        return { success: true, markdown: markdown, data: eventItems.length };
        
    } catch (error) {
        return { success: false, markdown: '', data: [] };
    }
}

// 解析事件内容
function parseEventContent(spanElement) {
    if (!spanElement) {
        return '-';
    }
    
    let content = '';
    let eventType = '';
    let players = [];
    let assistPlayer = '';
    
    // 首先检查是否有图片标识（事件类型）
    const images = spanElement.querySelectorAll('img');
    if (images.length > 0) {
        images.forEach(img => {
            const src = img.getAttribute('src');
            const title = img.getAttribute('title');
            
            if (src && title) {
                if (src.includes('bf_img2/1.png') || title === '入球') {
                    eventType = '⚽进球';
                } else if (src.includes('bf_img2/3.png') || title === '黄牌') {
                    eventType = '🟨黄牌';
                } else if (src.includes('bf_img2/2.png') || title === '紅牌' || title === '红牌') {
                    eventType = '🟥红牌';
                } else if (src.includes('bf_img2/11.png') || title === '换人') {
                    eventType = '🔄换人';
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
                return `${eventType} ${playerText}`;
            } else {
                return eventType;
            }
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
    
    return content || '-';
}

// 提取比赛信息（辅助函数）
function extractMatchInfo(doc) {
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
    
    // 查找analyhead区域
    const analyHead = doc.querySelector('.analyhead');
    if (!analyHead) {
        return matchInfo;
    }
    
    // 提取主队信息
    const homeDiv = analyHead.querySelector('.home');
    if (homeDiv) {
        const homeLink = homeDiv.querySelector('a');
        if (homeLink) {
            matchInfo.homeTeam = homeLink.textContent.trim();
        }
    }
    
    // 提取客队信息
    const guestDiv = analyHead.querySelector('.guest');
    if (guestDiv) {
        const guestLink = guestDiv.querySelector('a');
        if (guestLink) {
            matchInfo.awayTeam = guestLink.textContent.trim();
        }
    }
    
    // 提取比分和其他信息
    const vsDiv = analyHead.querySelector('.vs');
    if (vsDiv) {
        // 提取联赛名称
        const leagueLink = vsDiv.querySelector('.LName');
        if (leagueLink) {
            matchInfo.league = leagueLink.textContent.trim();
        }
        
        // 提取比赛时间
        const timeSpan = vsDiv.querySelector('.time');
        if (timeSpan) {
            matchInfo.matchTime = timeSpan.textContent.trim();
        }
        
        // 提取场地
        const venueLink = vsDiv.querySelector('.place');
        if (venueLink) {
            matchInfo.venue = venueLink.textContent.trim();
        }
        
        // 提取比分
        const scoreElements = vsDiv.querySelectorAll('.score');
        if (scoreElements.length >= 2) {
            matchInfo.homeScore = scoreElements[0].textContent.trim();
            matchInfo.awayScore = scoreElements[1].textContent.trim();
        }
        
        // 提取当前比赛进行时间
        const currentTimeElement = vsDiv.querySelector('#mState');
        if (currentTimeElement) {
            matchInfo.currentTime = currentTimeElement.textContent.trim();
        }
        
        // 提取天气和温度信息
        const labelElements = vsDiv.querySelectorAll('label');
        labelElements.forEach(label => {
            const labelText = label.textContent.trim();
            if (labelText.includes('天气：')) {
                matchInfo.weather = labelText.replace('天气：', '').trim();
            } else if (labelText.includes('温度：')) {
                matchInfo.temperature = labelText.replace('温度：', '').trim();
            }
        });
    }
    
    return matchInfo;
}

// 导出解析器函数（用于模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseLeagues,
        parseMatches,
        parseFullMatchData,
        parseStatsFromFullHtml,
        parseEventsFromFullHtml,
        parseEventContent,
        extractMatchInfo
    };
}