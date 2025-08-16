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
    
    // 模块化架构信息（调试用）
    window.APP_INFO = {
        name: 'HTML体育数据解析器',
        version: '2.0.0',
        architecture: 'modular',
        modules: modules,
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