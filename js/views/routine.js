import { appState, saveState } from '../state.js';
import { updateUI } from '../ui.js';
import { showToast } from '../notifications.js';

export function initRoutine() {
    // --- 1. Water Intake ---
    const waterInput = document.getElementById('waterInput');
    const saveWaterBtn = document.getElementById('saveWaterBtn');
    const waterTotalUI = document.getElementById('waterTotalUI');
    const waterProgressBar = document.getElementById('waterProgressBar');
    const resetWaterBtn = document.getElementById('resetWaterBtn');

    function updateWaterUI() {
        const goalLitres = (appState.waterGoal || 3000) / 1000;
        if (waterTotalUI) {
            waterTotalUI.innerHTML = `${appState.waterIntake.toFixed(1)} / ${goalLitres.toFixed(1)} Litre`;
        }
        if (waterProgressBar) {
            const percentage = Math.min((appState.waterIntake / goalLitres) * 100, 100);
            waterProgressBar.style.width = `${percentage}%`;
        }
    }

    if (saveWaterBtn && waterInput) {
        saveWaterBtn.addEventListener('click', () => {
            const amount = parseFloat(waterInput.value);
            if (!isNaN(amount) && amount > 0) {
                appState.waterIntake += amount;
                saveState();
                updateWaterUI();
                updateUI();
                waterInput.value = '';
                showToast('💧 Su Eklendi', `+${amount}L — Toplam: ${appState.waterIntake.toFixed(1)}L`, 'success', 2000);
            }
        });

        waterInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveWaterBtn.click();
        });
    }

    if (resetWaterBtn) {
        resetWaterBtn.addEventListener('click', () => {
            appState.waterIntake = 0;
            saveState();
            updateWaterUI();
            updateUI();
            showToast('💧 Su Sıfırlandı', 'Su tüketimi sıfırlandı.', 'info', 2000);
        });
    }

    // --- 2. Morning Weight ---
    const morningWeightInput = document.getElementById('morningWeightInput');
    const saveWeightBtn = document.getElementById('saveWeightBtn');

    if (saveWeightBtn && morningWeightInput) {
        saveWeightBtn.addEventListener('click', () => {
            const w = parseFloat(morningWeightInput.value);
            if (!isNaN(w) && w > 0) {
                appState.weight = w;
                
                // Add to history for chart
                const today = appState.lastAccessDate || new Date().toLocaleDateString('tr-TR');
                if (!appState.weightHistory) appState.weightHistory = [];
                const lastEntry = appState.weightHistory[appState.weightHistory.length - 1];
                if (lastEntry && lastEntry.date === today) {
                    lastEntry.weight = w;
                } else {
                    appState.weightHistory.push({ date: today, weight: w });
                }

                saveState();
                updateUI();
                
                saveWeightBtn.innerHTML = '<i class="fa-solid fa-check"></i> Kaydedildi';
                saveWeightBtn.style.background = 'var(--accent-green)';
                showToast('⚖️ Kilo Kaydedildi', `${w} kg olarak güncellendi.`, 'success', 3000);
                
                setTimeout(() => {
                    saveWeightBtn.innerHTML = '<i class="fa-solid fa-check"></i> Kaydet';
                    saveWeightBtn.style.background = '';
                    morningWeightInput.value = '';
                    window.location.reload();
                }, 1000);
            }
        });

        morningWeightInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveWeightBtn.click();
        });
    }

    // --- 2.5 Sleep Tracking ---
    const routineSleepInput = document.getElementById('routineSleepInput');
    const routineSleepBtn = document.getElementById('routineSleepBtn');
    const routineSleepValue = document.getElementById('routineSleepValue');

    function updateSleepUI() {
        if (routineSleepValue) {
            routineSleepValue.textContent = appState.sleepHours || 0;
        }
    }

    if (routineSleepBtn && routineSleepInput) {
        routineSleepInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') routineSleepBtn.click();
        });

        routineSleepBtn.addEventListener('click', () => {
            const hours = parseFloat(routineSleepInput.value);
            if (!isNaN(hours) && hours > 0) {
                appState.sleepHours = hours;
                saveState();
                updateSleepUI();
                updateUI();
                
                routineSleepBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
                routineSleepBtn.style.background = 'var(--accent-green)';
                showToast('😴 Uyku Kaydedildi', `${hours} saat olarak güncellendi.`, 'success', 2000);
                
                setTimeout(() => {
                    routineSleepBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Ekle';
                    routineSleepBtn.style.background = '';
                    routineSleepInput.value = '';
                }, 1500);
            }
        });
    }

    // --- 3. Custom Vitamins ---
    const vitaminList = document.getElementById('vitaminList');
    const newVitaminInput = document.getElementById('newVitaminInput');
    const addVitaminBtn = document.getElementById('addVitaminBtn');

    function renderVitamins() {
        if (!vitaminList) return;
        vitaminList.innerHTML = '';
        if (!appState.customVitamins) appState.customVitamins = [];
        
        appState.customVitamins.forEach((vit, index) => {
            const li = document.createElement('li');
            li.className = 'workout-item';
            li.innerHTML = `
                <label class="checkbox-container" style="flex: 1; margin-bottom: 0;">
                    <input type="checkbox" id="${vit.id}" ${vit.checked ? 'checked' : ''}>
                    <span class="checkmark"></span>
                    <span class="todo-text">${vit.name}</span>
                </label>
                <button class="btn-icon danger delete-btn"><i class="fa-solid fa-trash"></i></button>
            `;
            vitaminList.appendChild(li);

            // Checkbox event
            li.querySelector('input').addEventListener('change', (e) => {
                appState.customVitamins[index].checked = e.target.checked;
                saveState();
                if (e.target.checked) {
                    showToast('💊 Vitamin Alındı', vit.name, 'success', 2000);
                }
            });

            // Delete event
            li.querySelector('.delete-btn').addEventListener('click', () => {
                appState.customVitamins.splice(index, 1);
                saveState();
                renderVitamins();
                showToast('🗑️ Vitamin Silindi', vit.name, 'info', 2000);
            });
        });
    }

    if (addVitaminBtn && newVitaminInput) {
        addVitaminBtn.addEventListener('click', () => {
            const name = newVitaminInput.value.trim();
            if (name) {
                if (!appState.customVitamins) appState.customVitamins = [];
                appState.customVitamins.push({
                    id: 'vit_' + Date.now(),
                    name: name,
                    checked: false
                });
                saveState();
                renderVitamins();
                newVitaminInput.value = '';
                showToast('💊 Vitamin Eklendi', name, 'success', 2000);
            }
        });

        newVitaminInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addVitaminBtn.click();
        });
    }

    // Initialize UI on load
    updateWaterUI();
    updateSleepUI();
    renderVitamins();

    // Re-render when state updates
    window.addEventListener('stateUpdated', () => {
        updateWaterUI();
    });
}
