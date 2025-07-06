import * as vscode from 'vscode';
import { StorageManager } from '../utils/StorageManager';

export class CalendarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'daily-ritual.calendarView';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _storageManager: StorageManager
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // 处理来自 webview 的消息
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'checkIn':
                    this._handleCheckIn(data.mood, data.note);
                    break;
                case 'getData':
                    this._sendDataToWebview();
                    break;
            }
        });

        // 初始发送数据
        this._sendDataToWebview();
    }

    public showCalendar() {
        if (this._view) {
            this._view.show(true);
        }
    }

    private _handleCheckIn(mood: string, note: string) {
        const today = new Date().toISOString().split('T')[0];
        const record = {
            date: today,
            mood,
            note,
            timestamp: Date.now()
        };

        this._storageManager.addCheckInRecord(record);
        this._sendDataToWebview();
        
        vscode.window.showInformationMessage(`✅ 打卡成功！心情：${mood}`);
    }

    private _sendDataToWebview() {
        if (this._view) {
            const records = this._storageManager.getCheckInRecords();
            const stats = this._storageManager.getUserStats();
            const today = new Date().toISOString().split('T')[0];
            const hasCheckedInToday = this._storageManager.hasCheckedInToday();

            this._view.webview.postMessage({
                type: 'updateData',
                data: {
                    records,
                    stats,
                    today,
                    hasCheckedInToday
                }
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>每日仪式日历</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 16px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .stat-card {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 12px;
            border-radius: 8px;
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
        
        .calendar {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
        }
        
        .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .month-year {
            font-size: 18px;
            font-weight: bold;
        }
        
        .nav-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .nav-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .weekdays {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
            margin-bottom: 8px;
        }
        
        .weekday {
            text-align: center;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            padding: 8px 0;
        }
        
        .days {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
        }
        
        .day {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            position: relative;
        }
        
        .day:hover {
            background: var(--vscode-list-hoverBackground);
        }
        
        .day.other-month {
            color: var(--vscode-descriptionForeground);
        }
        
        .day.today {
            background: var(--vscode-textLink-foreground);
            color: white;
        }
        
        .day.checked-in {
            background: #4CAF50;
            color: white;
        }
        
        .day.checked-in::after {
            content: '✓';
            position: absolute;
            top: 2px;
            right: 2px;
            font-size: 10px;
        }
        
        .check-in-section {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 8px;
            padding: 16px;
        }
        
        .check-in-form {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .mood-selector {
            display: flex;
            gap: 8px;
            justify-content: center;
        }
        
        .mood-btn {
            padding: 8px 12px;
            border: 2px solid transparent;
            border-radius: 20px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s;
        }
        
        .mood-btn:hover {
            transform: scale(1.1);
        }
        
        .mood-btn.selected {
            border-color: var(--vscode-textLink-foreground);
            background: var(--vscode-textLink-foreground);
            color: white;
        }
        
        .note-input {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            resize: vertical;
            min-height: 60px;
        }
        
        .check-in-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
        }
        
        .check-in-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .check-in-btn:disabled {
            background: var(--vscode-disabledForeground);
            cursor: not-allowed;
        }
        
        .already-checked-in {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>📅 每日仪式</h2>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <div class="stat-number" id="totalCheckIns">0</div>
            <div class="stat-label">总打卡天数</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" id="currentStreak">0</div>
            <div class="stat-label">连续打卡</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" id="longestStreak">0</div>
            <div class="stat-label">最长连续</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" id="todayStatus">❌</div>
            <div class="stat-label">今日状态</div>
        </div>
    </div>
    
    <div class="calendar">
        <div class="calendar-header">
            <button class="nav-btn" onclick="previousMonth()">‹</button>
            <div class="month-year" id="monthYear"></div>
            <button class="nav-btn" onclick="nextMonth()">›</button>
        </div>
        <div class="weekdays">
            <div class="weekday">日</div>
            <div class="weekday">一</div>
            <div class="weekday">二</div>
            <div class="weekday">三</div>
            <div class="weekday">四</div>
            <div class="weekday">五</div>
            <div class="weekday">六</div>
        </div>
        <div class="days" id="days"></div>
    </div>
    
    <div class="check-in-section">
        <h3>今日打卡</h3>
        <div class="check-in-form" id="checkInForm">
            <div>
                <label>今天的心情：</label>
                <div class="mood-selector">
                    <button class="mood-btn" data-mood="😊">😊 开心</button>
                    <button class="mood-btn" data-mood="😐">😐 一般</button>
                    <button class="mood-btn" data-mood="😔">😔 难过</button>
                    <button class="mood-btn" data-mood="😤">😤 疲惫</button>
                    <button class="mood-btn" data-mood="🤩">🤩 兴奋</button>
                </div>
            </div>
            <div>
                <label>今日笔记：</label>
                <textarea class="note-input" id="noteInput" placeholder="记录一下今天的心情或计划..."></textarea>
            </div>
            <button class="check-in-btn" id="checkInBtn" onclick="checkIn()">打卡</button>
        </div>
        <div class="already-checked-in" id="alreadyCheckedIn" style="display: none;">
            今天已经打卡了！明天再来吧～
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentDate = new Date();
        let checkInData = {
            records: [],
            stats: {},
            today: '',
            hasCheckedInToday: false
        };
        let selectedMood = '';

        // 初始化
        document.addEventListener('DOMContentLoaded', () => {
            vscode.postMessage({ type: 'getData' });
            setupMoodSelector();
            renderCalendar();
        });

        // 设置心情选择器
        function setupMoodSelector() {
            const moodBtns = document.querySelectorAll('.mood-btn');
            moodBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    moodBtns.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    selectedMood = btn.dataset.mood;
                });
            });
        }

        // 渲染日历
        function renderCalendar() {
            const monthYear = document.getElementById('monthYear');
            const daysContainer = document.getElementById('days');
            
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            
            monthYear.textContent = \`\${year}年\${month + 1}月\`;
            
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());
            
            daysContainer.innerHTML = '';
            
            for (let i = 0; i < 42; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                
                const dayElement = document.createElement('div');
                dayElement.className = 'day';
                dayElement.textContent = date.getDate();
                
                if (date.getMonth() !== month) {
                    dayElement.classList.add('other-month');
                }
                
                const dateString = date.toISOString().split('T')[0];
                const todayString = new Date().toISOString().split('T')[0];
                
                if (dateString === todayString) {
                    dayElement.classList.add('today');
                }
                
                if (checkInData.records.some(record => record.date === dateString)) {
                    dayElement.classList.add('checked-in');
                }
                
                daysContainer.appendChild(dayElement);
            }
        }

        // 上个月
        function previousMonth() {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        }

        // 下个月
        function nextMonth() {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        }

        // 打卡
        function checkIn() {
            if (!selectedMood) {
                alert('请选择今天的心情！');
                return;
            }
            
            const note = document.getElementById('noteInput').value;
            
            vscode.postMessage({
                type: 'checkIn',
                mood: selectedMood,
                note: note
            });
        }

        // 监听来自扩展的消息
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'updateData':
                    checkInData = message.data;
                    updateUI();
                    break;
            }
        });

        // 更新UI
        function updateUI() {
            document.getElementById('totalCheckIns').textContent = checkInData.stats.totalCheckIns || 0;
            document.getElementById('currentStreak').textContent = checkInData.stats.currentStreak || 0;
            document.getElementById('longestStreak').textContent = checkInData.stats.longestStreak || 0;
            
            const todayStatus = document.getElementById('todayStatus');
            if (checkInData.hasCheckedInToday) {
                todayStatus.textContent = '✅';
                document.getElementById('checkInForm').style.display = 'none';
                document.getElementById('alreadyCheckedIn').style.display = 'block';
            } else {
                todayStatus.textContent = '❌';
                document.getElementById('checkInForm').style.display = 'block';
                document.getElementById('alreadyCheckedIn').style.display = 'none';
            }
            
            renderCalendar();
        }
    </script>
</body>
</html>`;
    }
} 