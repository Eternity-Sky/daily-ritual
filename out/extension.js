"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const CalendarProvider_1 = require("./providers/CalendarProvider");
const CheckInPanel_1 = require("./panels/CheckInPanel");
const FortunePanel_1 = require("./panels/FortunePanel");
const StorageManager_1 = require("./utils/StorageManager");
function activate(context) {
    console.log('每日仪式插件已激活！');
    // 初始化存储管理器
    const storageManager = new StorageManager_1.StorageManager(context.globalState);
    // 注册日历视图提供者
    const calendarProvider = new CalendarProvider_1.CalendarProvider(context.extensionUri, storageManager);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('daily-ritual.calendarView', calendarProvider));
    // 注册命令
    const openCalendarCommand = vscode.commands.registerCommand('daily-ritual.openCalendar', () => {
        calendarProvider.showCalendar();
    });
    const checkInCommand = vscode.commands.registerCommand('daily-ritual.checkIn', () => {
        CheckInPanel_1.CheckInPanel.createOrShow(context.extensionUri, storageManager);
    });
    const showFortuneCommand = vscode.commands.registerCommand('daily-ritual.showFortune', () => {
        FortunePanel_1.FortunePanel.createOrShow(context.extensionUri, storageManager);
    });
    context.subscriptions.push(openCalendarCommand, checkInCommand, showFortuneCommand);
    // 显示欢迎消息
    showWelcomeMessage();
}
exports.activate = activate;
function showWelcomeMessage() {
    const today = new Date().toLocaleDateString('zh-CN');
    vscode.window.showInformationMessage(`🎉 欢迎使用每日仪式！今天是 ${today}，记得打卡哦！`);
}
function deactivate() {
    console.log('每日仪式插件已停用！');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map