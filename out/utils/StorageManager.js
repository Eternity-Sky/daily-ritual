"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageManager = void 0;
class StorageManager {
    constructor(globalState) {
        this.globalState = globalState;
    }
    // 获取所有打卡记录
    getCheckInRecords() {
        return this.globalState.get(StorageManager.CHECK_IN_KEY, []);
    }
    // 添加打卡记录
    addCheckInRecord(record) {
        const records = this.getCheckInRecords();
        const existingIndex = records.findIndex(r => r.date === record.date);
        if (existingIndex >= 0) {
            records[existingIndex] = record;
        }
        else {
            records.push(record);
        }
        this.globalState.update(StorageManager.CHECK_IN_KEY, records);
        this.updateStats();
    }
    // 检查今天是否已打卡
    hasCheckedInToday() {
        const today = new Date().toISOString().split('T')[0];
        const records = this.getCheckInRecords();
        return records.some(record => record.date === today);
    }
    // 获取今天的打卡记录
    getTodayCheckIn() {
        const today = new Date().toISOString().split('T')[0];
        const records = this.getCheckInRecords();
        return records.find(record => record.date === today);
    }
    // 获取用户统计信息
    getUserStats() {
        return this.globalState.get(StorageManager.STATS_KEY, {
            totalCheckIns: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastCheckInDate: ''
        });
    }
    // 更新统计信息
    updateStats() {
        const records = this.getCheckInRecords();
        const sortedRecords = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        let lastDate = '';
        // 计算连续打卡天数
        for (let i = 0; i < sortedRecords.length; i++) {
            const currentDate = new Date(sortedRecords[i].date);
            if (i === 0) {
                tempStreak = 1;
                lastDate = sortedRecords[i].date;
            }
            else {
                const prevDate = new Date(sortedRecords[i - 1].date);
                const diffDays = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    tempStreak++;
                }
                else {
                    if (tempStreak > longestStreak) {
                        longestStreak = tempStreak;
                    }
                    tempStreak = 1;
                }
            }
        }
        // 检查当前连续天数
        if (sortedRecords.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const lastCheckIn = sortedRecords[0];
            if (lastCheckIn.date === today) {
                currentStreak = tempStreak;
            }
            else {
                const diffDays = Math.floor((new Date(today).getTime() - new Date(lastCheckIn.date).getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    currentStreak = tempStreak;
                }
            }
        }
        if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
        }
        const stats = {
            totalCheckIns: records.length,
            currentStreak,
            longestStreak,
            lastCheckInDate: sortedRecords.length > 0 ? sortedRecords[0].date : ''
        };
        this.globalState.update(StorageManager.STATS_KEY, stats);
    }
    // 获取设置
    getSettings() {
        return this.globalState.get(StorageManager.SETTINGS_KEY, {
            enableNotifications: true,
            theme: 'default'
        });
    }
    // 更新设置
    updateSettings(settings) {
        this.globalState.update(StorageManager.SETTINGS_KEY, settings);
    }
}
exports.StorageManager = StorageManager;
StorageManager.CHECK_IN_KEY = 'daily-ritual.check-ins';
StorageManager.SETTINGS_KEY = 'daily-ritual.settings';
StorageManager.STATS_KEY = 'daily-ritual.stats';
//# sourceMappingURL=StorageManager.js.map