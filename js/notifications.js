/**
 * LifeOS — Toast & Push Notification System
 * Uygulama içi toast bildirimleri + Push bildirim altyapısı
 */

import { appState } from './state.js';

// ═══ Toast System ═══

let toastContainer = null;

function ensureContainer() {
    if (!toastContainer) {
        toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
    }
    return toastContainer;
}

const TOAST_ICONS = {
    success: 'fa-solid fa-circle-check',
    info:    'fa-solid fa-circle-info',
    warning: 'fa-solid fa-triangle-exclamation',
    error:   'fa-solid fa-circle-xmark',
    fire:    'fa-solid fa-fire'
};

/**
 * Show a toast notification
 * @param {string} title 
 * @param {string} message 
 * @param {'success'|'info'|'warning'|'error'|'fire'} type 
 * @param {number} duration - ms
 */
export function showToast(title, message, type = 'info', duration = 4000) {
    const container = ensureContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <i class="toast-icon ${TOAST_ICONS[type] || TOAST_ICONS.info}"></i>
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ''}
        </div>
        <button class="toast-close"><i class="fa-solid fa-xmark"></i></button>
    `;
    
    container.appendChild(toast);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));
    
    // Auto dismiss
    if (duration > 0) {
        setTimeout(() => dismissToast(toast), duration);
    }
    
    // Max 4 visible toasts
    const toasts = container.querySelectorAll('.toast:not(.toast-out)');
    if (toasts.length > 4) {
        dismissToast(toasts[0]);
    }
    
    return toast;
}

function dismissToast(toast) {
    if (!toast || toast.classList.contains('toast-out')) return;
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
}

// ═══ Push Notification System ═══

let pushPermission = 'default';

/**
 * Request push notification permission
 */
export async function requestPushPermission() {
    if (!('Notification' in window)) {
        console.log('Push notifications not supported');
        return false;
    }
    
    if (Notification.permission === 'granted') {
        pushPermission = 'granted';
        return true;
    }
    
    if (Notification.permission !== 'denied') {
        const result = await Notification.requestPermission();
        pushPermission = result;
        return result === 'granted';
    }
    
    return false;
}

/**
 * Send a push notification (browser)
 */
export function sendPushNotification(title, body, icon = '💧') {
    if (Notification.permission !== 'granted') return;
    
    try {
        const notification = new Notification(title, {
            body,
            icon: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${icon}</text></svg>`,
            badge: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎯</text></svg>`,
            tag: 'lifeos-' + Date.now(),
            silent: false
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        // Auto close after 8s
        setTimeout(() => notification.close(), 8000);
    } catch (e) {
        console.error('Push notification error:', e);
    }
}

// ═══ Water Reminder System ═══

let waterReminderInterval = null;

export function startWaterReminder() {
    stopWaterReminder();
    
    const notifSettings = getNotifSettings();
    if (!notifSettings.waterReminder) return;
    
    const intervalMs = (notifSettings.waterIntervalMinutes || 120) * 60 * 1000;
    
    waterReminderInterval = setInterval(() => {
        const goalLitres = (appState.waterGoal || 3000) / 1000;
        const current = appState.waterIntake || 0;
        
        if (current < goalLitres) {
            const remaining = (goalLitres - current).toFixed(1);
            showToast('💧 Su Hatırlatması', `Bugün ${remaining}L daha içmen lazım!`, 'info', 6000);
            
            if (document.hidden) {
                sendPushNotification(
                    '💧 Su İçme Zamanı!',
                    `Bugün ${current.toFixed(1)}L içtin, hedef: ${goalLitres.toFixed(1)}L`,
                    '💧'
                );
            }
        }
    }, intervalMs);
}

export function stopWaterReminder() {
    if (waterReminderInterval) {
        clearInterval(waterReminderInterval);
        waterReminderInterval = null;
    }
}

// ═══ Streak Check ═══

export function calculateStreak() {
    if (!appState.history || appState.history.length === 0) return 0;
    
    // Sort history by date descending
    const sortedHistory = [...appState.history].sort((a, b) => {
        const dateA = parseTRDate(a.date);
        const dateB = parseTRDate(b.date);
        return dateB - dateA;
    });
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if today has any data (from current active day)
    const hasDataToday = (appState.consumedCalories > 0 || appState.waterIntake > 0 || appState.sleepHours > 0);
    
    let checkDate = new Date(today);
    if (hasDataToday) {
        streak = 1;
        checkDate.setDate(checkDate.getDate() - 1);
    }
    
    for (const day of sortedHistory) {
        const dayDate = parseTRDate(day.date);
        if (!dayDate) continue;
        dayDate.setHours(0, 0, 0, 0);
        
        if (dayDate.getTime() === checkDate.getTime()) {
            // Check if the day has meaningful data
            if (day.consumedCalories > 0 || day.waterIntake > 0 || day.sleepHours > 0) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        } else if (dayDate < checkDate) {
            break;
        }
    }
    
    return streak;
}

function parseTRDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('.');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

// ═══ Goal Notifications ═══

export function checkGoals() {
    const notifSettings = getNotifSettings();
    if (!notifSettings.goalNotifications) return;
    
    // Calorie goal reached
    if (appState.consumedCalories >= appState.calorieGoal && appState.calorieGoal > 0) {
        const key = `goal_cal_${appState.lastAccessDate}`;
        if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            showToast('🎯 Kalori Hedefine Ulaştın!', `${appState.consumedCalories} / ${appState.calorieGoal} kcal`, 'warning', 6000);
        }
    }
    
    // Water goal reached
    const goalLitres = (appState.waterGoal || 3000) / 1000;
    if (appState.waterIntake >= goalLitres && goalLitres > 0) {
        const key = `goal_water_${appState.lastAccessDate}`;
        if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            showToast('💧 Su Hedefini Tamamladın!', `${appState.waterIntake.toFixed(1)}L — Harikasın!`, 'success', 6000);
        }
    }
    
    // Streak milestone
    const streak = calculateStreak();
    if (streak > 0 && streak % 7 === 0) {
        const key = `streak_${streak}`;
        if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            showToast('🔥 Yeni Streak Rekoru!', `${streak} gün üst üste veri girdin!`, 'fire', 8000);
            if (document.hidden) {
                sendPushNotification('🔥 Streak Rekoru!', `${streak} gün üst üste — devam et!`, '🔥');
            }
        }
    }
}

// ═══ Notification Settings ═══

const DEFAULT_NOTIF_SETTINGS = {
    waterReminder: true,
    waterIntervalMinutes: 120,
    goalNotifications: true,
    streakNotifications: true,
    pushEnabled: false
};

export function getNotifSettings() {
    try {
        const saved = localStorage.getItem('lifeOsNotifSettings');
        return saved ? { ...DEFAULT_NOTIF_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_NOTIF_SETTINGS };
    } catch {
        return { ...DEFAULT_NOTIF_SETTINGS };
    }
}

export function saveNotifSettings(settings) {
    localStorage.setItem('lifeOsNotifSettings', JSON.stringify(settings));
}

// ═══ Init ═══

export function initNotifications() {
    ensureContainer();
    
    const settings = getNotifSettings();
    
    // Start water reminder
    if (settings.waterReminder) {
        startWaterReminder();
    }
    
    // Request push permission if enabled
    if (settings.pushEnabled) {
        requestPushPermission();
    }
    
    // Listen for state changes to check goals
    window.addEventListener('stateUpdated', () => {
        checkGoals();
    });
    
    // Visibility change - send push if app hidden, show welcome when visible
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // App became visible again
        }
    });
}
