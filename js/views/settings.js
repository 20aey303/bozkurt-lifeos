import { appState, saveState, saveActiveToHistory } from '../state.js';
import { updateUI } from '../ui.js';
import { showToast, getNotifSettings, saveNotifSettings, requestPushPermission, startWaterReminder, stopWaterReminder } from '../notifications.js';

export function initSettings() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const apiKeyStatus = document.getElementById('apiKeyStatus');

    // Profile Elements
    const settingsName = document.getElementById('settingsName');
    const settingsAge = document.getElementById('settingsAge');
    const settingsTargetWeight = document.getElementById('settingsTargetWeight');
    const settingsHeight = document.getElementById('settingsHeight');
    const settingsGender = document.getElementById('settingsGender');
    const settingsActivity = document.getElementById('settingsActivity');
    const settingsGoal = document.getElementById('settingsGoal');
    const settingsCalorieAdj = document.getElementById('settingsCalorieAdj');
    const settingsWaterGoal = document.getElementById('settingsWaterGoal');
    const saveProfileBtn = document.getElementById('saveProfileBtn');

    // Load existing settings
    if (localStorage.getItem('geminiApiKey')) {
        apiKeyInput.value = localStorage.getItem('geminiApiKey');
    }

    if (settingsName) settingsName.value = appState.name || 'Kullanıcı';
    if (settingsAge) settingsAge.value = appState.age || 25;
    if (settingsTargetWeight) settingsTargetWeight.value = appState.targetWeight || 75;
    if (settingsHeight) settingsHeight.value = appState.height || 180;
    if (settingsGender) settingsGender.value = appState.gender || 'male';
    if (settingsActivity) settingsActivity.value = appState.activityLevel || '1.2';
    if (settingsGoal) settingsGoal.value = appState.goal || 'lose';
    if (settingsCalorieAdj) settingsCalorieAdj.value = appState.calorieAdjustment || -500;
    if (settingsWaterGoal) settingsWaterGoal.value = appState.waterGoal || 3000;

    // API Key Save
    if (saveApiKeyBtn && apiKeyInput) {
        saveApiKeyBtn.addEventListener('click', () => {
            const key = apiKeyInput.value.trim();
            if (key) {
                localStorage.setItem('geminiApiKey', key);
                saveApiKeyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Kaydedildi';
                saveApiKeyBtn.style.background = 'var(--accent-green)';
                if (apiKeyStatus) apiKeyStatus.style.display = 'block';
                
                showToast('🔑 API Anahtarı', 'Başarıyla kaydedildi!', 'success', 3000);
                
                setTimeout(() => {
                    saveApiKeyBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Kaydet';
                    saveApiKeyBtn.style.background = '';
                }, 2000);
            }
        });
    }

    // Profile Save & Calorie Calculation
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => {
            appState.name = settingsName.value.trim() || 'Kullanıcı';
            appState.age = parseInt(settingsAge.value) || 25;
            appState.targetWeight = parseFloat(settingsTargetWeight.value) || 75;
            appState.height = parseInt(settingsHeight.value) || 180;
            appState.gender = settingsGender.value;
            appState.activityLevel = parseFloat(settingsActivity.value);
            appState.goal = settingsGoal.value;
            appState.calorieAdjustment = parseInt(settingsCalorieAdj.value) || 0;
            appState.waterGoal = parseInt(settingsWaterGoal.value) || 3000;

            // Harris-Benedict Formula
            let bmr;
            const w = appState.weight || 80;
            if (appState.gender === 'male') {
                bmr = 88.362 + (13.397 * w) + (4.799 * appState.height) - (5.677 * appState.age);
            } else {
                bmr = 447.593 + (9.247 * w) + (3.098 * appState.height) - (4.330 * appState.age);
            }

            let tdee = bmr * appState.activityLevel;
            tdee += appState.calorieAdjustment;

            appState.calorieGoal = Math.round(tdee);

            // Makro Hesaplamaları
            if (!appState.macroGoals) appState.macroGoals = { protein: 0, carbs: 0, fat: 0 };
            
            appState.macroGoals.protein = Math.round(w * 2.2);
            appState.macroGoals.fat = Math.round(w * 1.0);
            
            const proteinCals = appState.macroGoals.protein * 4;
            const fatCals = appState.macroGoals.fat * 9;
            const remainingCals = appState.calorieGoal - (proteinCals + fatCals);
            appState.macroGoals.carbs = Math.max(0, Math.round(remainingCals / 4));

            saveState();
            updateUI();

            saveProfileBtn.innerHTML = `<i class="fa-solid fa-check"></i> Güncellendi (${appState.calorieGoal} kcal)`;
            saveProfileBtn.style.background = 'var(--accent-green)';
            saveProfileBtn.style.boxShadow = 'var(--shadow-glow-green)';
            
            showToast('✅ Profil Güncellendi', `Günlük kalori hedefi: ${appState.calorieGoal} kcal`, 'success', 4000);
            
            setTimeout(() => {
                saveProfileBtn.innerHTML = '<i class="fa-solid fa-calculator"></i> Profili Kaydet & Kaloriyi Hesapla';
                saveProfileBtn.style.background = '';
                saveProfileBtn.style.boxShadow = '';
            }, 3000);
        });
    }

    // ═══ Notification Settings ═══
    const notifWaterReminder = document.getElementById('notifWaterReminder');
    const notifGoalAlerts = document.getElementById('notifGoalAlerts');
    const notifStreakAlerts = document.getElementById('notifStreakAlerts');
    const notifPushEnabled = document.getElementById('notifPushEnabled');
    const saveNotifSettingsBtn = document.getElementById('saveNotifSettingsBtn');

    // Load notification settings
    const notifSettings = getNotifSettings();
    if (notifWaterReminder) notifWaterReminder.checked = notifSettings.waterReminder;
    if (notifGoalAlerts) notifGoalAlerts.checked = notifSettings.goalNotifications;
    if (notifStreakAlerts) notifStreakAlerts.checked = notifSettings.streakNotifications;
    if (notifPushEnabled) notifPushEnabled.checked = notifSettings.pushEnabled;

    if (saveNotifSettingsBtn) {
        saveNotifSettingsBtn.addEventListener('click', async () => {
            const newSettings = {
                waterReminder: notifWaterReminder ? notifWaterReminder.checked : true,
                waterIntervalMinutes: 120,
                goalNotifications: notifGoalAlerts ? notifGoalAlerts.checked : true,
                streakNotifications: notifStreakAlerts ? notifStreakAlerts.checked : true,
                pushEnabled: notifPushEnabled ? notifPushEnabled.checked : false
            };

            saveNotifSettings(newSettings);

            // Handle water reminder
            if (newSettings.waterReminder) {
                startWaterReminder();
            } else {
                stopWaterReminder();
            }

            // Handle push permission
            if (newSettings.pushEnabled) {
                const granted = await requestPushPermission();
                if (!granted) {
                    showToast('⚠️ Push Bildirim', 'Tarayıcı izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.', 'warning', 5000);
                    if (notifPushEnabled) notifPushEnabled.checked = false;
                    newSettings.pushEnabled = false;
                    saveNotifSettings(newSettings);
                } else {
                    showToast('📲 Push Aktif', 'Tarayıcı bildirimleri aktif edildi!', 'success');
                }
            }

            showToast('🔔 Bildirim Ayarları', 'Başarıyla kaydedildi!', 'success', 3000);

            saveNotifSettingsBtn.innerHTML = '<i class="fa-solid fa-check"></i> Kaydedildi';
            setTimeout(() => {
                saveNotifSettingsBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Bildirim Ayarlarını Kaydet';
            }, 2000);
        });
    }

    // ═══ Reset Today ═══
    const resetTodayBtn = document.getElementById('resetTodayBtn');
    if (resetTodayBtn) {
        resetTodayBtn.addEventListener('click', () => {
            if (confirm(`Şu an bulunduğunuz gün (${appState.lastAccessDate || 'Bugün'}) için tüm veriler silinecek. Emin misiniz?`)) {
                appState.consumedCalories = 0;
                appState.burnedCalories = 0;
                appState.consumedProtein = 0;
                appState.consumedCarbs = 0;
                appState.consumedFat = 0;
                appState.waterIntake = 0;
                appState.sleepHours = 0;
                appState.meals = [];
                
                if (appState.customVitamins) {
                    appState.customVitamins.forEach(v => v.checked = false);
                }
                
                if (appState.fitnessProgram) {
                    Object.keys(appState.fitnessProgram).forEach(dayKey => {
                        appState.fitnessProgram[dayKey].forEach(task => task.done = false);
                    });
                }
                
                saveActiveToHistory();
                saveState();
                
                showToast('🗑️ Gün Sıfırlandı', `${appState.lastAccessDate} için tüm veriler temizlendi.`, 'info', 4000);
                setTimeout(() => window.location.reload(), 500);
            }
        });
    }
}
