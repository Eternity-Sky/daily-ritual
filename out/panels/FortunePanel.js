"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FortunePanel = void 0;
const vscode = require("vscode");
class FortunePanel {
    static createOrShow(extensionUri, storageManager) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (FortunePanel.currentPanel) {
            FortunePanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel(FortunePanel.viewType, '今日运势', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [extensionUri]
        });
        FortunePanel.currentPanel = new FortunePanel(panel, extensionUri, storageManager);
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
                case 'refreshFortune':
                    this._update();
                    return;
            }
        }, null, this._disposables);
    }
    dispose() {
        FortunePanel.currentPanel = undefined;
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
    <title>今日运势</title>
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
            max-width: 600px;
            width: 100%;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .title {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #48dbfb 100%);
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
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 8px;
        }
        
        .fortune-card {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 24px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        
        .fortune-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        
        .fortune-level {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 12px;
            color: var(--vscode-textLink-foreground);
        }
        
        .fortune-description {
            font-size: 16px;
            line-height: 1.6;
            color: var(--vscode-editor-foreground);
            margin-bottom: 20px;
        }
        
        .fortune-details {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 24px;
        }
        
        .detail-item {
            background: var(--vscode-editor-background);
            padding: 16px;
            border-radius: 12px;
            text-align: center;
        }
        
        .detail-label {
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 8px;
        }
        
        .detail-value {
            font-size: 18px;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
        
        .quote-card {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 24px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .quote-text {
            font-size: 18px;
            line-height: 1.6;
            font-style: italic;
            margin-bottom: 16px;
            color: var(--vscode-editor-foreground);
        }
        
        .quote-author {
            text-align: right;
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
        }
        
        .refresh-btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .refresh-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }
        
        .lucky-colors {
            display: flex;
            gap: 8px;
            justify-content: center;
            margin-top: 12px;
        }
        
        .color-dot {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid var(--vscode-editor-background);
        }
        
        .lucky-numbers {
            display: flex;
            gap: 8px;
            justify-content: center;
            margin-top: 12px;
        }
        
        .number-badge {
            width: 32px;
            height: 32px;
            background: var(--vscode-textLink-foreground);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">🔮 今日运势</div>
            <div class="subtitle">探索今天的幸运密码</div>
        </div>
        
        <div class="date" id="currentDate"></div>
        
        <div class="fortune-card">
            <div class="fortune-icon" id="fortuneIcon">🌟</div>
            <div class="fortune-level" id="fortuneLevel">运势极佳</div>
            <div class="fortune-description" id="fortuneDescription">
                今天是个充满机遇的日子！你的创意和灵感将达到顶峰，适合尝试新事物和挑战自我。
            </div>
            
            <div class="fortune-details">
                <div class="detail-item">
                    <div class="detail-label">幸运指数</div>
                    <div class="detail-value" id="luckyScore">95%</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">适合活动</div>
                    <div class="detail-value" id="suitableActivity">学习编程</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">幸运颜色</div>
                    <div class="lucky-colors" id="luckyColors">
                        <div class="color-dot" style="background: #ff6b6b;"></div>
                        <div class="color-dot" style="background: #4ecdc4;"></div>
                        <div class="color-dot" style="background: #45b7d1;"></div>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">幸运数字</div>
                    <div class="lucky-numbers" id="luckyNumbers">
                        <div class="number-badge">7</div>
                        <div class="number-badge">3</div>
                        <div class="number-badge">9</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="quote-card">
            <div class="quote-text" id="quoteText">
                "编程是一种艺术，而调试是一种科学。"
            </div>
            <div class="quote-author" id="quoteAuthor">— 未知程序员</div>
        </div>
        
        <button class="refresh-btn" onclick="refreshFortune()">
            🔄 刷新运势
        </button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        // 运势数据
        const fortunes = [
            {
                icon: '🌟',
                level: '运势极佳',
                description: '今天是个充满机遇的日子！你的创意和灵感将达到顶峰，适合尝试新事物和挑战自我。',
                score: '95%',
                activity: '学习编程',
                colors: ['#ff6b6b', '#4ecdc4', '#45b7d1'],
                numbers: [7, 3, 9]
            },
            {
                icon: '✨',
                level: '运势良好',
                description: '今天心情愉快，工作效率很高。适合完成积压的任务，会有意想不到的收获。',
                score: '85%',
                activity: '整理代码',
                colors: ['#a8e6cf', '#dcedc1', '#ffd3b6'],
                numbers: [2, 8, 5]
            },
            {
                icon: '💫',
                level: '运势平稳',
                description: '今天适合按部就班地工作，保持稳定的节奏。不要急于求成，稳扎稳打会有好结果。',
                score: '75%',
                activity: '代码重构',
                colors: ['#ff9ff3', '#f368e0', '#ff6b6b'],
                numbers: [1, 6, 4]
            },
            {
                icon: '🌙',
                level: '运势一般',
                description: '今天可能会遇到一些小挑战，但不要气馁。保持耐心和专注，问题会迎刃而解。',
                score: '65%',
                activity: '阅读文档',
                colors: ['#54a0ff', '#5f27cd', '#00d2d3'],
                numbers: [3, 7, 2]
            },
            {
                icon: '🌈',
                level: '运势上升',
                description: '虽然开始时可能有些困难，但随着时间的推移，运势会逐渐好转。保持积极的心态。',
                score: '70%',
                activity: '写测试',
                colors: ['#ff9ff3', '#54a0ff', '#5f27cd'],
                numbers: [8, 1, 5]
            }
        ];
        
        // 励志语录
        const quotes = [
            {
                text: "编程是一种艺术，而调试是一种科学。",
                author: "— 未知程序员"
            },
            {
                text: "代码是写给人看的，只是顺便让计算机执行。",
                author: "— Harold Abelson"
            },
            {
                text: "最好的代码是没有代码。",
                author: "— Jeff Atwood"
            },
            {
                text: "编程不是关于你知道什么，而是关于你能学什么。",
                author: "— Chris Pine"
            },
            {
                text: "简单是终极的复杂。",
                author: "— Leonardo da Vinci"
            },
            {
                text: "成功不是偶然的，它是努力、坚持、学习、牺牲的结果。",
                author: "— A.P.J. Abdul Kalam"
            },
            {
                text: "每一天都是新的开始，每一个小时都是新的机会。",
                author: "— 未知"
            },
            {
                text: "编程教会你如何思考。",
                author: "— Steve Jobs"
            }
        ];
        
        let currentFortune = null;
        let currentQuote = null;

        // 初始化
        document.addEventListener('DOMContentLoaded', () => {
            updateDate();
            generateFortune();
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

        // 生成运势
        function generateFortune() {
            // 基于日期生成固定的运势，这样同一天看到的运势是一样的
            const today = new Date().toISOString().split('T')[0];
            const seed = today.split('-').join('');
            const fortuneIndex = parseInt(seed) % fortunes.length;
            const quoteIndex = parseInt(seed) % quotes.length;
            
            currentFortune = fortunes[fortuneIndex];
            currentQuote = quotes[quoteIndex];
            
            updateUI();
        }

        // 更新UI
        function updateUI() {
            if (!currentFortune || !currentQuote) return;
            
            document.getElementById('fortuneIcon').textContent = currentFortune.icon;
            document.getElementById('fortuneLevel').textContent = currentFortune.level;
            document.getElementById('fortuneDescription').textContent = currentFortune.description;
            document.getElementById('luckyScore').textContent = currentFortune.score;
            document.getElementById('suitableActivity').textContent = currentFortune.activity;
            document.getElementById('quoteText').textContent = currentQuote.text;
            document.getElementById('quoteAuthor').textContent = currentQuote.author;
            
            // 更新幸运颜色
            const colorsContainer = document.getElementById('luckyColors');
            colorsContainer.innerHTML = '';
            currentFortune.colors.forEach(color => {
                const colorDot = document.createElement('div');
                colorDot.className = 'color-dot';
                colorDot.style.background = color;
                colorsContainer.appendChild(colorDot);
            });
            
            // 更新幸运数字
            const numbersContainer = document.getElementById('luckyNumbers');
            numbersContainer.innerHTML = '';
            currentFortune.numbers.forEach(number => {
                const numberBadge = document.createElement('div');
                numberBadge.className = 'number-badge';
                numberBadge.textContent = number;
                numbersContainer.appendChild(numberBadge);
            });
        }

        // 刷新运势
        function refreshFortune() {
            // 随机生成新的运势
            const fortuneIndex = Math.floor(Math.random() * fortunes.length);
            const quoteIndex = Math.floor(Math.random() * quotes.length);
            
            currentFortune = fortunes[fortuneIndex];
            currentQuote = quotes[quoteIndex];
            
            updateUI();
            
            vscode.postMessage({
                command: 'refreshFortune'
            });
        }
    </script>
</body>
</html>`;
    }
}
exports.FortunePanel = FortunePanel;
FortunePanel.viewType = 'daily-ritual.fortune';
//# sourceMappingURL=FortunePanel.js.map