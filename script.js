// script.js - 模块加载器和应用入口点
// HTML体育数据解析器 - 重构后的模块化架构

// 加载所有必要的模块
(function() {
    'use strict';
    
    // 模块加载配置
    const modules = [
        'modules/helpers.js',   // 辅助函数：减少重复代码的通用工具
        'modules/core.js',      // 核心功能：全局变量、SmartContentManager
        'modules/parsers.js',   // 解析器：联赛、比赛、统计、事件解析
        'modules/ui.js',        // UI管理：界面交互、标签切换、文本控制
        'modules/utils.js'      // 工具函数：批处理、兼容函数
    ];
    
    // 顺序加载模块，确保依赖关系正确
    function loadModules() {
        return new Promise((resolve, reject) => {
            let index = 0;
            
            function loadNext() {
                if (index >= modules.length) {
                    resolve();
                    return;
                }
                
                const modulePath = modules[index];
                const script = document.createElement('script');
                script.src = modulePath;
                script.onload = () => {
                    index++;
                    // 短暂延迟确保模块完全初始化
                    setTimeout(loadNext, 50);
                };
                script.onerror = () => {
                    console.error(`Failed to load module: ${modulePath}`);
                    reject(new Error(`Module load failed: ${modulePath}`));
                };
                document.head.appendChild(script);
            }
            
            loadNext();
        });
    }
    
    // 应用初始化
    function initializeApp() {
        console.log('HTML体育数据解析器 - 模块化版本已加载');
        console.log('已加载模块：', modules);
        
        // 确保所有必要的函数都已定义
        const requiredFunctions = [
            'parseLeagues', 'parseMatches', 'parseFullMatchData',
            'switchTab', 'clearLeagueInput', 'clearMatchInput', 'clearStatsInput',
            'copyMarkdown', 'updateCharCounter'
        ];
        
        const missingFunctions = requiredFunctions.filter(func => typeof window[func] === 'undefined');
        
        if (missingFunctions.length > 0) {
            console.warn('以下函数未定义:', missingFunctions);
        } else {
            console.log('✅ 所有核心函数已正确加载');
        }
        
        // 手动初始化SmartContentManager
        if (typeof initializeSmartTextareas === 'function') {
            initializeSmartTextareas();
        } else if (typeof window.initializeSmartTextareas === 'function') {
            window.initializeSmartTextareas();
        } else {
            console.error('initializeSmartTextareas函数未找到');
        }
        
        // 延迟初始化粘贴快捷键监听器，确保所有模块都已加载
        setTimeout(() => {
            initializePasteShortcuts();
            updateShortcutHints();
        }, 200);
    }
    
    // 错误处理
    function handleLoadError(error) {
        console.error('模块加载失败:', error);
        
        // 显示用户友好的错误信息
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #dc3545;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-size: 14px;
            max-width: 80%;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            ⚠️ 应用模块加载失败<br>
            <small>请检查网络连接或刷新页面重试</small>
        `;
        
        document.body.appendChild(errorDiv);
        
        // 5秒后移除错误提示
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
    
    // 等待DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            loadModules()
                .then(initializeApp)
                .catch(handleLoadError);
        });
    } else {
        // DOM已经加载完成
        loadModules()
            .then(initializeApp)
            .catch(handleLoadError);
    }
    
    // 平台检测函数
    function detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform.toLowerCase();
        
        if (userAgent.includes('mac') || platform.includes('mac')) {
            return 'mac';
        } else if (userAgent.includes('win') || platform.includes('win')) {
            return 'windows';
        } else if (userAgent.includes('linux') || platform.includes('linux') || 
                   userAgent.includes('ubuntu') || userAgent.includes('debian') || 
                   userAgent.includes('fedora') || userAgent.includes('centos') || 
                   userAgent.includes('opensuse') || userAgent.includes('arch')) {
            return 'linux';
        } else {
            // 默认返回通用平台（可能是移动设备或其他）
            return 'generic';
        }
    }
    
    // 获取平台对应的快捷键文本
    function getPlatformShortcuts() {
        const platform = detectPlatform();
        
        switch(platform) {
            case 'mac':
                return {
                    paste: 'Cmd+V',
                    clear: 'Esc',
                    modifier: 'metaKey'
                };
            case 'windows':
            case 'linux':
            default:
                return {
                    paste: 'Ctrl+V',
                    clear: 'Esc',
                    modifier: 'ctrlKey'
                };
        }
    }
    
    // 粘贴快捷键监听器初始化
    function initializePasteShortcuts() {
        const shortcuts = getPlatformShortcuts();
        // 监听全局粘贴事件
        document.addEventListener('paste', function(event) {
            console.log('🔍 检测到粘贴事件:', event.target);
            
            // 检查是否在textarea中粘贴
            const target = event.target;
            if (target && target.tagName === 'TEXTAREA') {
                const textareaId = target.id;
                console.log('📝 粘贴目标textarea:', textareaId);
                
                // 根据textarea ID确定处理类型
                let parseFunction = null;
                let clearFunction = null;
                
                if (textareaId === 'league-html') {
                    parseFunction = 'parseLeagues';
                    clearFunction = 'clearLeagueInput';
                } else if (textareaId === 'match-html') {
                    parseFunction = 'parseMatches';
                    clearFunction = 'clearMatchInput';
                } else if (textareaId === 'stats-html') {
                    parseFunction = 'parseFullMatchData';
                    clearFunction = 'clearStatsInput';
                }
                
                if (parseFunction) {
                    console.log('🎯 找到解析函数:', parseFunction);
                    
                    // 延迟执行，确保粘贴内容已加载
                    setTimeout(() => {
                        // 先触发SmartContentManager处理（如果存在）
                        const type = textareaId.replace('-html', '');
                        if (typeof window.updateCharCounter === 'function') {
                            window.updateCharCounter(type);
                            console.log('📊 已更新字符计数器:', type);
                        }
                        
                        // 获取实际内容长度（考虑SmartContentManager）
                        let contentLength = target.value.trim().length;
                        let actualContent = target.value;
                        
                        // 如果SmartContentManager接管了内容，从管理器获取
                        if (contentLength === 0 && typeof window.getHtmlContent === 'function') {
                            actualContent = window.getHtmlContent(type);
                            contentLength = actualContent ? actualContent.trim().length : 0;
                            console.log('📋 从SmartContentManager获取内容长度:', contentLength);
                        }
                        
                        console.log('📏 最终内容长度:', contentLength);
                        
                        // 如果有内容，自动触发解析（降低阈值）
                        if (contentLength > 50) {
                            console.log('✅ 普通粘贴内容长度足够，开始自动提取...');
                            showPasteHint('检测到粘贴内容，正在自动提取...');
                            
                            // 延迟执行解析，给用户看到提示
                            setTimeout(() => {
                                console.log('🚀 通过普通粘贴事件执行解析函数:', parseFunction);
                                if (typeof window[parseFunction] === 'function') {
                                    window[parseFunction]();
                                } else {
                                    console.error('❌ 解析函数不存在:', parseFunction);
                                }
                            }, 800);
                        } else {
                            console.log('⚠️ 普通粘贴内容长度不足，跳过自动提取');
                        }
                    }, 300); // 增加延迟，给SmartContentManager更多处理时间
                } else {
                    console.log('❌ 未找到对应的解析函数');
                }
            } else {
                console.log('❓ 粘贴目标不是textarea:', target.tagName);
            }
        });
        
        // 备用方案：监听textarea的input事件（处理各种输入方式）
        document.addEventListener('input', function(event) {
            const target = event.target;
            if (target && target.tagName === 'TEXTAREA' && target.id.endsWith('-html')) {
                console.log('📝 检测到textarea内容变化:', target.id);
                
                // 防抖处理，避免频繁触发
                clearTimeout(target.inputTimer);
                target.inputTimer = setTimeout(() => {
                    // 获取实际内容长度（考虑SmartContentManager）
                    const type = target.id.replace('-html', '');
                    let contentLength = target.value.trim().length;
                    
                    // 如果SmartContentManager接管了内容，从管理器获取
                    if (contentLength === 0 && typeof window.getHtmlContent === 'function') {
                        const actualContent = window.getHtmlContent(type);
                        contentLength = actualContent ? actualContent.trim().length : 0;
                        console.log('📋 Input事件 - 从SmartContentManager获取内容长度:', contentLength);
                    } else {
                        console.log('📏 Input事件 - 直接获取内容长度:', contentLength);
                    }
                    
                    // 只有在内容较多时才自动触发（避免用户手动输入时误触发）
                    if (contentLength > 500) {
                        const textareaId = target.id;
                        let parseFunction = null;
                        
                        if (textareaId === 'league-html') {
                            parseFunction = 'parseLeagues';
                        } else if (textareaId === 'match-html') {
                            parseFunction = 'parseMatches';
                        } else if (textareaId === 'stats-html') {
                            parseFunction = 'parseFullMatchData';
                        }
                        
                        if (parseFunction && typeof window[parseFunction] === 'function') {
                            console.log('🔄 通过input事件触发自动提取:', parseFunction);
                            showPasteHint('检测到大量内容，正在自动提取...');
                            setTimeout(() => {
                                window[parseFunction]();
                            }, 500);
                        }
                    }
                }, 1000); // 1秒防抖
            }
        });
        
        // 监听SmartContentManager的内容就绪事件
        document.addEventListener('smartContentReady', function(event) {
            console.log('🎯 SmartContentManager内容就绪事件:', event.detail);
            
            const { type, contentLength } = event.detail;
            let parseFunction = null;
            
            if (type === 'league') {
                parseFunction = 'parseLeagues';
            } else if (type === 'match') {
                parseFunction = 'parseMatches';
            } else if (type === 'stats') {
                parseFunction = 'parseFullMatchData';
            }
            
            if (parseFunction && contentLength > 50) {
                console.log('✅ SmartContentManager内容长度足够，开始自动提取...');
                showPasteHint('检测到大量内容，正在自动提取...');
                
                // 延迟执行解析
                setTimeout(() => {
                    console.log('🚀 通过SmartContentManager事件执行解析函数:', parseFunction);
                    if (typeof window[parseFunction] === 'function') {
                        window[parseFunction]();
                    } else {
                        console.error('❌ 解析函数不存在:', parseFunction);
                    }
                }, 800);
            } else {
                console.log('⚠️ SmartContentManager内容长度不足或无对应解析函数');
            }
        });
        
        // 监听快捷键
        document.addEventListener('keydown', function(event) {
            // 粘贴快捷键 - 跨平台兼容
            const isPasteShortcut = detectPlatform() === 'mac' ? 
                (event.metaKey && event.key === 'v') : 
                (event.ctrlKey && event.key === 'v');
                
            if (isPasteShortcut) {
                // 检查当前激活的tab
                const activeTab = document.querySelector('.tab-content.active');
                if (activeTab) {
                    const tabId = activeTab.id;
                    
                    // 自动聚焦到对应的textarea
                    setTimeout(() => {
                        let targetTextarea = null;
                        if (tabId === 'leagues') {
                            targetTextarea = document.getElementById('league-html');
                        } else if (tabId === 'matches') {
                            targetTextarea = document.getElementById('match-html');
                        } else if (tabId === 'stats') {
                            targetTextarea = document.getElementById('stats-html');
                        }
                        
                        if (targetTextarea && !targetTextarea.contains(event.target)) {
                            targetTextarea.focus();
                        }
                    }, 50);
                }
            }
            
            // 清空快捷键 - Escape键或Ctrl/Cmd+Delete
            const isClearShortcut = event.key === 'Escape' || 
                ((event.ctrlKey || event.metaKey) && (event.key === 'Delete' || event.key === 'Backspace'));
                
            if (isClearShortcut) {
                const activeTab = document.querySelector('.tab-content.active');
                if (activeTab) {
                    const tabId = activeTab.id;
                    
                    // 根据当前tab清空对应内容
                    if (tabId === 'leagues' && typeof window.clearLeagueInput === 'function') {
                        window.clearLeagueInput();
                        showPasteHint('已清空联赛信息内容');
                    } else if (tabId === 'matches' && typeof window.clearMatchInput === 'function') {
                        window.clearMatchInput();
                        showPasteHint('已清空比赛数据内容');
                    } else if (tabId === 'stats' && typeof window.clearStatsInput === 'function') {
                        window.clearStatsInput();
                        showPasteHint('已清空技术统计内容');
                    }
                }
            }
        });
        
        console.log(`✅ 粘贴快捷键监听器已初始化 [${detectPlatform()}平台]`);
        console.log(`   快捷键: 粘贴=${shortcuts.paste}, 清空=Esc`);
        
        // 添加一些调试信息
        if (detectPlatform() === 'mac') {
            console.log('   检测到macOS，使用Cmd键组合');
        } else if (detectPlatform() === 'linux') {
            console.log('   检测到Linux系统，使用Ctrl键组合');
        } else if (detectPlatform() === 'windows') {
            console.log('   检测到Windows系统，使用Ctrl键组合');
        }
        
        // 添加测试函数到控制台
        window.testAutoParse = function(type = 'league', large = false) {
            console.log('🧪 开始测试自动解析功能...');
            
            const baseContent = '<span onclick="CheckLeague(1,2)">测试联赛[5]</span>';
            let testContent;
            
            if (large) {
                // 生成超过50KB的内容来触发SmartContentManager
                testContent = baseContent.repeat(2000); // 确保超过50KB
                console.log('📦 生成大文件测试内容 (触发SmartContentManager)');
            } else {
                // 生成小内容，不触发SmartContentManager
                testContent = baseContent.repeat(10);
                console.log('📄 生成小文件测试内容 (普通粘贴模式)');
            }
            
            const textarea = document.getElementById(type + '-html');
            if (textarea) {
                textarea.value = testContent;
                
                // 模拟粘贴事件
                const pasteEvent = new ClipboardEvent('paste', {
                    clipboardData: new DataTransfer()
                });
                textarea.dispatchEvent(pasteEvent);
                
                console.log('✅ 测试内容已填入，模拟粘贴事件已触发');
                console.log('📊 测试内容长度:', testContent.length);
            } else {
                console.error('❌ 未找到textarea元素:', type + '-html');
            }
        };
        
        // 快捷测试函数
        window.testSmallPaste = () => testAutoParse('league', false);
        window.testLargePaste = () => testAutoParse('league', true);
        
        // 测试新流程的函数
        window.testNewWorkflow = function(type = 'league') {
            console.log('🧪 测试新工作流程: 粘贴→自动提取→自动复制→清空输入→保留结果');
            
            const baseContent = '<span onclick="CheckLeague(1,2)">测试联赛[5]</span>';
            const testContent = baseContent.repeat(10); // 足够触发自动提取
            
            const textarea = document.getElementById(type + '-html');
            const outputDiv = document.getElementById(
                type === 'league' ? 'league-output' : 
                type === 'match' ? 'match-output' : 
                'combined-output'
            );
            
            if (textarea && outputDiv) {
                console.log('📝 步骤1: 模拟粘贴内容');
                textarea.value = testContent;
                
                // 触发input事件，模拟内容变化
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                
                console.log('✅ 测试内容已填入');
                console.log('📊 等待自动提取、复制和清空...');
                
                // 检查工作流程结果
                setTimeout(() => {
                    const inputCleared = textarea.value.length === 0;
                    const hasOutput = outputDiv.innerHTML.includes('成功提取');
                    
                    console.log('📋 工作流程结果检查:');
                    console.log(`   输入已清空: ${inputCleared ? '✅' : '❌'}`);
                    console.log(`   结果已保留: ${hasOutput ? '✅' : '❌'}`);
                    
                    if (inputCleared && hasOutput) {
                        console.log('🎉 新工作流程测试成功！');
                    } else {
                        console.log('⚠️ 工作流程可能需要调整');
                    }
                }, 3000);
            } else {
                console.error('❌ 未找到必要的元素');
            }
        };
        
        console.log('💡 调试提示:');
        console.log('   - testSmallPaste() : 测试小文件粘贴 (普通模式)');
        console.log('   - testLargePaste() : 测试大文件粘贴 (SmartContentManager模式)');
        console.log('   - testNewWorkflow() : 测试新工作流程 (粘贴→提取→复制→清空→保留)');
    }
    
    // 显示粘贴提示
    function showPasteHint(message) {
        const hint = document.createElement('div');
        hint.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 123, 255, 0.9);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10001;
            font-size: 14px;
            text-align: center;
            animation: fadeInOut 2s ease;
        `;
        hint.innerHTML = `🚀 ${message}`;
        
        // 添加动画样式
        if (!document.getElementById('paste-hint-style')) {
            const style = document.createElement('style');
            style.id = 'paste-hint-style';
            style.innerHTML = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(hint);
        
        // 2秒后移除
        setTimeout(() => {
            if (hint.parentNode) {
                hint.parentNode.removeChild(hint);
            }
        }, 2000);
    }
    
    // 更新UI中的快捷键提示
    function updateShortcutHints() {
        const shortcuts = getPlatformShortcuts();
        
        // 更新header中的使用提示
        const usageHint = document.querySelector('.usage-hint span:last-child');
        if (usageHint) {
            usageHint.textContent = `极简操作：粘贴(${shortcuts.paste})HTML内容即可自动提取并复制结果，无需手动点击`;
        }
        
        // 更新所有textarea的placeholder
        const placeholders = [
            {
                id: 'league-html',
                text: `直接粘贴(${shortcuts.paste})包含联赛信息的HTML代码，将自动提取并复制结果...`
            },
            {
                id: 'match-html', 
                text: `直接粘贴(${shortcuts.paste})包含比赛信息的HTML代码，将自动提取并复制结果...`
            },
            {
                id: 'stats-html',
                text: `直接粘贴(${shortcuts.paste})完整的比赛页面HTML代码，将自动提取并复制结果...`
            }
        ];
        
        placeholders.forEach(item => {
            const textarea = document.getElementById(item.id);
            if (textarea) {
                textarea.placeholder = item.text;
            }
        });
        
        console.log(`✅ 已为${detectPlatform()}平台更新快捷键提示: ${shortcuts.paste}, ${shortcuts.clear}`);
    }
    
    // 将函数暴露到全局供其他模块使用
    window.initializePasteShortcuts = initializePasteShortcuts;
    window.showPasteHint = showPasteHint;
    window.detectPlatform = detectPlatform;
    window.getPlatformShortcuts = getPlatformShortcuts;
    window.updateShortcutHints = updateShortcutHints;
    
    // 模块化架构信息（调试用）
    window.APP_INFO = {
        name: 'HTML体育数据解析器',
        version: '2.1.0',
        architecture: 'modular',
        modules: modules,
        features: ['auto-parse', 'auto-copy', 'cross-platform-shortcuts'],
        platform: detectPlatform(),
        shortcuts: getPlatformShortcuts(),
        lastRefactored: new Date().toISOString().split('T')[0]
    };
    
})();

// 全局错误处理
window.addEventListener('error', function(event) {
    console.error('应用运行时错误:', event.error);
});

// 全局未处理的Promise拒绝处理
window.addEventListener('unhandledrejection', function(event) {
    console.error('未处理的Promise拒绝:', event.reason);
    event.preventDefault(); // 阻止默认的错误输出
});