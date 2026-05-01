"use strict";
// src/utils/dateUtils.ts
// Copied from Next.js lib/utils/dateUtils.ts — zero changes needed.
Object.defineProperty(exports, "__esModule", { value: true });
exports.toLocalDateString = toLocalDateString;
exports.todayString = todayString;
exports.yesterdayString = yesterdayString;
exports.computeLiveStreak = computeLiveStreak;
function toLocalDateString(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0"),
    ].join("-");
}
function todayString() {
    return toLocalDateString(new Date());
}
function yesterdayString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toLocalDateString(d);
}
function computeLiveStreak(currentStreak, lastActiveDate) {
    if (!lastActiveDate)
        return 0;
    const today = todayString();
    const yesterday = yesterdayString();
    if (lastActiveDate === today || lastActiveDate === yesterday) {
        return currentStreak;
    }
    return 0;
}
//# sourceMappingURL=dateUtils.js.map