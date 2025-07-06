"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckInPanel = void 0;
const vscode = require("vscode");
class CheckInPanel {
    static createOrShow(extensionUri, storageManager) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (CheckInPanel.currentPanel) {
            CheckInPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel(CheckInPanel.viewType, '每日打卡', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [extensionUri]
        });
        CheckInPanel.currentPanel = new CheckInPanel(panel, extensionUri, storageManager);
    }
    constructor(panel, extensionUri, storageManager) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._storageManager = storageManager;
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case 'checkIn':
                    this._handleCheckIn(message.mood, message.note);
                    return;
            }
        }, null, this._disposables);
    }
    _handleCheckIn(mood, note) {
        const today = new Date().toISOString().split('T')[0];
        const record = {
            date: today,
            mood,
            note,
            timestamp: Date.now()
        };
        this._storageManager.addCheckInRecord(record);
        vscode.window.showInformationMessage(`✅ 打卡成功！心情：${mood}`);
        this._panel.dispose();
    }
    dispose() {
        CheckInPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }
    _getHtmlForWebview(webview) {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>每日打卡</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        
        .container {
            max-width: 500px;
            width: 100%;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .title {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle {
            color: var(--vscode-descriptionForeground);
            font-size: 16px;
        }
        
        .date {
            text-align: center;
            font-size: 18px;
            color: var(--vscode-textLink-foreground);
            margin-bottom: 30px;
            padding: 12px;
            background: var(--vscode-editor-background);
            border-radius: 8px;
        }
        
        .form-group {
            margin-bottom: 24px;
        }
        
        .form-label {
            display: block;
            margin-bottom: 12px;
            font-size: 16px;
            font-weight: 500;
        }
        
        .mood-selector {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
        }
        
        .mood-option {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 16px;
            border: 2px solid transparent;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: var(--vscode-editor-background);
        }
        
        .mood-option:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .mood-option.selected {
            border-color: var(--vscode-textLink-foreground);
            background: var(--vscode-textLink-foreground);
            color: white;
        }
        
        .mood-emoji {
            font-size: 32px;
            margin-bottom: 8px;
        }
        
        .mood-text {
            font-size: 14px;
            font-weight: 500;
        }
        
        .note-input {
            width: 100%;
            padding: 16px;
            border: 2px solid var(--vscode-input-border);
            border-radius: 12px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-size: 16px;
            resize: vertical;
            min-height: 100px;
            font-family: inherit;
        }
        
        .note-input:focus {
            outline: none;
            border-color: var(--vscode-textLink-foreground);
        }
        
        .check-in-btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .check-in-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }
        
        .check-in-btn:disabled {
            background: var(--vscode-disabledForeground);
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-top: 30px;
            padding-top: 30px;
            border-top: 1px solid var(--vscode-input-border);
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
        
        .stat-label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">🌟 每日打卡</div>
            <div class="subtitle">记录今天的心情，开启美好的一天</div>
        </div>
        
        <div class="date" id="currentDate"></div>
        
        <form id="checkInForm">
            <div class="form-group">
                <label class="form-label">今天的心情如何？</label>
                <div class="mood-selector">
                    <div class="mood-option" data-mood="😊">
                        <div class="mood-emoji">😊</div>
                        <div class="mood-text">开心</div>
                    </div>
                    <div class="mood-option" data-mood="😐">
                        <div class="mood-emoji">😐</div>
                        <div class="mood-text">一般</div>
                    </div>
                    <div class="mood-option" data-mood="😔">
                        <div class="mood-emoji">😔</div>
                        <div class="mood-text">难过</div>
                    </div>
                    <div class="mood-option" data-mood="😤">
                        <div class="mood-emoji">😤</div>
                        <div class="mood-text">疲惫</div>
                    </div>
                    <div class="mood-option" data-mood="🤩">
                        <div class="mood-emoji">🤩</div>
                        <div class="mood-text">兴奋</div>
                    </div>
                    <div class="mood-option" data-mood="😌">
                        <div class="mood-emoji">😌</div>
                        <div class="mood-text">平静</div>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">今日笔记</label>
                <textarea 
                    class="note-input" 
                    id="noteInput" 
                    placeholder="记录一下今天的心情、计划或者想说的话..."
                ></textarea>
            </div>
            
            <button type="submit" class="check-in-btn" id="checkInBtn">
                ✨ 打卡
            </button>
        </form>
        
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number" id="totalCheckIns">0</div>
                <div class="stat-label">总打卡天数</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" id="currentStreak">0</div>
                <div class="stat-label">连续打卡</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" id="longestStreak">0</div>
                <div class="stat-label">最长连续</div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let selectedMood = '';

        // 初始化
        document.addEventListener('DOMContentLoaded', () => {
            updateDate();
            setupMoodSelector();
            setupForm();
            loadStats();
        });

        // 更新日期显示
        function updateDate() {
            const now = new Date();
            const options = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                weekday: 'long' 
            };
            document.getElementById('currentDate').textContent = now.toLocaleDateString('zh-CN', options);
        }

        // 设置心情选择器
        function setupMoodSelector() {
            const moodOptions = document.querySelectorAll('.mood-option');
            moodOptions.forEach(option => {
                option.addEventListener('click', () => {
                    moodOptions.forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                    selectedMood = option.dataset.mood;
                });
            });
        }

        // 设置表单提交
        function setupForm() {
            const form = document.getElementById('checkInForm');
            const submitBtn = document.getElementById('checkInBtn');
            
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                if (!selectedMood) {
                    alert('请选择今天的心情！');
                    return;
                }
                
                const note = document.getElementById('noteInput').value;
                
                submitBtn.disabled = true;
                submitBtn.textContent = '打卡中...';
                
                vscode.postMessage({
                    command: 'checkIn',
                    mood: selectedMood,
                    note: note
                });
            });
        }

        // 加载统计数据
        function loadStats() {
            // 这里可以从存储中获取统计数据
            // 暂时使用默认值
            document.getElementById('totalCheckIns').textContent = '0';
            document.getElementById('currentStreak').textContent = '0';
            document.getElementById('longestStreak').textContent = '0';
        }
    </script>
</body>
</html>`;
    }
}
exports.CheckInPanel = CheckInPanel;
CheckInPanel.viewType = 'daily-ritual.checkIn';
//# sourceMappingURL=CheckInPanel.js.map