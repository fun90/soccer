// core.js - 核心模块：全局变量和智能内容管理器

// 全局变量存储解析结果
let currentLeagueData = '';
let currentMatchData = '';
let currentStatsData = '';
let currentEventsData = '';
let currentCombinedData = '';

// 智能分片存储系统
class SmartContentManager {
    constructor(type) {
        this.type = type;
        this.content = '';
        this.isLargeContent = false;
        this.textarea = document.getElementById(type + '-html');
        this.placeholder = null;
        
        if (!this.textarea) {
            console.error(`SmartContentManager: 无法找到textarea元素 ${type}-html`);
            return;
        }
        
        console.log(`SmartContentManager: 初始化 ${type} 智能管理器`);
        this.setupSmartTextarea();
    }
    
    setupSmartTextarea() {
        // 监听粘贴事件
        this.textarea.addEventListener('paste', (e) => this.handlePaste(e));
        this.textarea.addEventListener('input', (e) => this.handleInput(e));
        
        // 创建占位符
        this.createPlaceholder();
    }
    
    createPlaceholder() {
        const container = this.textarea.parentElement;
        this.placeholder = document.createElement('div');
        this.placeholder.className = 'content-placeholder';
        this.placeholder.style.display = 'none';
        this.placeholder.onclick = () => this.expandContent();
        container.insertBefore(this.placeholder, this.textarea);
    }
    
    handlePaste(e) {
        // 获取粘贴内容
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        console.log(`SmartContentManager: 粘贴事件触发，内容长度: ${pastedText.length}`);
        
        // 统一阻止默认粘贴行为，避免重复事件触发
        e.preventDefault();
        
        if (pastedText.length > 50000) { // 超过50KB时启用智能模式
            console.log(`SmartContentManager: 内容超过50KB，启用智能存储模式`);
            this.setLargeContent(pastedText);
        } else {
            console.log(`SmartContentManager: 内容较小，直接设置到textarea`);
            // 手动设置textarea值，避免input事件重复触发
            this.textarea.value = pastedText;
            
            // 更新计数器
            safeCall('updateCharCounter', this.type);
            
            // 触发统一的内容就绪事件（在document上触发，确保script.js能监听到）
            document.dispatchEvent(new CustomEvent('smartContentReady', {
                detail: {
                    type: this.type,
                    contentLength: pastedText.length,
                    content: pastedText
                }
            }));
            console.log(`SmartContentManager: 触发smartContentReady事件，类型: ${this.type}`);
        }
    }
    
    handleInput(e) {
        const content = e.target.value;
        if (content.length > 50000 && !this.isLargeContent) {
            this.setLargeContent(content);
        }
        // 安全调用updateCharCounter函数
        safeCall('updateCharCounter', this.type);
    }
    
    setLargeContent(content) {
        this.content = content;
        this.isLargeContent = true;
        
        // 隐藏textarea，显示占位符
        this.textarea.style.display = 'none';
        this.placeholder.style.display = 'block';
        this.placeholder.className = 'content-placeholder has-content';
        
        // 更新占位符内容
        this.updatePlaceholder();
        
        // 更新计数器
        // 安全调用updateCharCounter函数
        safeCall('updateCharCounter', this.type);
        
        // 触发自定义事件，通知内容已处理完成（在document上触发，确保script.js能监听到）
        document.dispatchEvent(new CustomEvent('smartContentReady', {
            detail: {
                type: this.type,
                contentLength: this.content.length,
                content: this.content
            }
        }));
        console.log(`SmartContentManager: 触发smartContentReady事件，类型: ${this.type}`);
    }
    
    updatePlaceholder() {
        const size = (this.content.length / 1024).toFixed(1);
        const preview = this.content.substring(0, 300);
        
        this.placeholder.innerHTML = `
            <div class="content-info">
                <span><strong>📄 大量内容已加载</strong></span>
                <span>${size}KB | ${this.content.length.toLocaleString()}字符</span>
            </div>
            <div class="content-preview-text">${preview}${this.content.length > 300 ? '\n\n...' : ''}</div>
            <div style="font-size: 12px; color: #6c757d;">
                点击展开编辑 • 内容已优化存储，不会影响页面性能
                <button class="expand-btn" onclick="event.stopPropagation(); smartManagers['${this.type}'].expandContent()">展开编辑</button>
                <button class="expand-btn" onclick="event.stopPropagation(); smartManagers['${this.type}'].clearContent()" style="background: #dc3545;">清除</button>
            </div>
        `;
    }
    
    expandContent() {
        if (this.isLargeContent) {
            // 显示警告
            const shouldExpand = confirm('展开大量内容可能会导致页面卡顿，确定要继续吗？\n\n建议：直接点击"提取"按钮进行处理。');
            if (!shouldExpand) return;
            
            // 显示加载提示
            this.placeholder.innerHTML = '<div class="processing"><div class="spinner"></div>正在加载大量内容...</div>';
            
            // 延迟加载避免卡顿
            setTimeout(() => {
                this.textarea.value = this.content;
                this.textarea.style.display = 'block';
                this.placeholder.style.display = 'none';
                this.textarea.focus();
            }, 100);
        }
    }
    
    clearContent() {
        this.content = '';
        this.isLargeContent = false;
        this.textarea.value = '';
        this.textarea.style.display = 'block';
        this.placeholder.style.display = 'none';
        // 安全调用updateCharCounter函数
        safeCall('updateCharCounter', this.type);
    }
    
    getContent() {
        return this.isLargeContent ? this.content : this.textarea.value;
    }
    
    hasContent() {
        return this.getContent().length > 0;
    }
    
    getContentLength() {
        return this.getContent().length;
    }
}

// 初始化智能管理器
let smartManagers = {};

// 初始化函数
function initializeSmartTextareas() {
    console.log('开始初始化SmartContentManager...');
    
    // 确保DOM元素存在
    const textareas = ['league', 'match', 'stats'];
    textareas.forEach(type => {
        const element = document.getElementById(type + '-html');
        if (element) {
            console.log(`找到textarea元素: ${type}-html`);
        } else {
            console.error(`未找到textarea元素: ${type}-html`);
        }
    });
    
    smartManagers.league = new SmartContentManager('league');
    smartManagers.match = new SmartContentManager('match');
    smartManagers.stats = new SmartContentManager('stats');
    
    console.log('SmartContentManager初始化完成');
}

// 注意：getHtmlContent函数已移至helpers.js模块

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeSmartTextareas();
});

// 将全局变量和函数暴露到window对象，确保跨模块访问
window.currentLeagueData = currentLeagueData;
window.currentMatchData = currentMatchData;
window.currentStatsData = currentStatsData;
window.currentEventsData = currentEventsData;
window.currentCombinedData = currentCombinedData;
window.smartManagers = smartManagers;
window.initializeSmartTextareas = initializeSmartTextareas;

// 导出核心变量和类（用于模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        currentLeagueData,
        currentMatchData,
        currentStatsData,
        currentEventsData,
        currentCombinedData,
        SmartContentManager,
        smartManagers,
        getHtmlContent,
        initializeSmartTextareas
    };
}