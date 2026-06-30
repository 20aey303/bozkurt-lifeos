import { appState, saveState, saveActiveToHistory } from '../state.js';
import { updateUI } from '../ui.js';

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
                apiKeyStatus.style.display = 'block';
                
                setTimeout(() => {
                    saveApiKeyBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Kaydet';
                    saveApiKeyBtn.style.background = 'rgba(255,255,255,0.1)';
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

            let tdee = bmr * appState.activityLevel; // Toplam Günlük Enerji Harcaması

            // Hedefe göre özel kalori modifikasyonu (Kullanıcının girdiği açık/fazla)
            tdee += appState.calorieAdjustment;

            appState.calorieGoal = Math.round(tdee);

            // Makro Hesaplamaları
            if(!appState.macroGoals) appState.macroGoals = {protein: 0, carbs: 0, fat: 0};
            
            // Protein: Kilo başına 2.2 gram (Özellikle Recomp/Kas için ideali)
            appState.macroGoals.protein = Math.round(w * 2.2);
            
            // Yağ: Kilo başına 1 gram
            appState.macroGoals.fat = Math.round(w * 1.0);
            
            // Karbonhidrat: Geriye kalan kaloriler
            const proteinCals = appState.macroGoals.protein * 4;
            const fatCals = appState.macroGoals.fat * 9;
            const remainingCals = appState.calorieGoal - (proteinCals + fatCals);
            appState.macroGoals.carbs = Math.max(0, Math.round(remainingCals / 4));

            saveState();
            updateUI(); // Dashboard'daki kalori hedefini anında günceller

            saveProfileBtn.innerHTML = '<i class="fa-solid fa-check"></i> Güncellendi (' + appState.calorieGoal + ' kcal)';
            saveProfileBtn.style.background = 'var(--accent-green)';
            
            setTimeout(() => {
                saveProfileBtn.innerHTML = '<i class="fa-solid fa-calculator"></i> Profili Kaydet & Kaloriyi Hesapla';
                saveProfileBtn.style.background = 'var(--accent-blue)';
            }, 3000);
        });
    }

    // --- Reset Today ---
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
                
                // Update history
                saveActiveToHistory();
                saveState();
                
                alert("Gün başarıyla sıfırlandı!");
                window.location.reload();
            }
        });
    }
}
