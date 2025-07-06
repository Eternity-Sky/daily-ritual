import * as vscode from 'vscode';
import { CalendarProvider } from './providers/CalendarProvider';
import { CheckInPanel } from './panels/CheckInPanel';
import { FortunePanel } from './panels/FortunePanel';
import { StorageManager } from './utils/StorageManager';

export function activate(context: vscode.ExtensionContext) {
    console.log('每日仪式插件已激活！');

    // 初始化存储管理器
    const storageManager = new StorageManager(context.globalState);

    // 注册日历视图提供者
    const calendarProvider = new CalendarProvider(context.extensionUri, storageManager);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('daily-ritual.calendarView', calendarProvider)
    );

    // 注册命令
    const openCalendarCommand = vscode.commands.registerCommand('daily-ritual.openCalendar', () => {
        calendarProvider.showCalendar();
    });

    const checkInCommand = vscode.commands.registerCommand('daily-ritual.checkIn', () => {
        CheckInPanel.createOrShow(context.extensionUri, storageManager);
    });

    const showFortuneCommand = vscode.commands.registerCommand('daily-ritual.showFortune', () => {
        FortunePanel.createOrShow(context.extensionUri, storageManager);
    });

    context.subscriptions.push(openCalendarCommand, checkInCommand, showFortuneCommand);

    // 显示欢迎消息
    showWelcomeMessage();
}

function showWelcomeMessage() {
    const today = new Date().toLocaleDateString('zh-CN');
    vscode.window.showInformationMessage(`🎉 欢迎使用每日仪式！今天是 ${today}，记得打卡哦！`);
}

export function deactivate() {
    console.log('每日仪式插件已停用！');
} 