import { appState, saveState } from '../state.js';
import { updateUI } from '../ui.js';

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
                waterInput.value = '';
            }
        });
    }

    if (resetWaterBtn) {
        resetWaterBtn.addEventListener('click', () => {
            appState.waterIntake = 0;
            saveState();
            updateWaterUI();
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
                const today = new Date().toLocaleDateString('tr-TR');
                if(!appState.weightHistory) appState.weightHistory = [];
                const lastEntry = appState.weightHistory[appState.weightHistory.length - 1];
                if(lastEntry && lastEntry.date === today) {
                    lastEntry.weight = w;
                } else {
                    appState.weightHistory.push({ date: today, weight: w });
                }

                saveState();
                updateUI();
                
                saveWeightBtn.innerHTML = '<i class="fa-solid fa-check"></i> Kaydedildi';
                saveWeightBtn.style.background = 'var(--accent-green)';
                setTimeout(() => {
                    saveWeightBtn.innerHTML = '<i class="fa-solid fa-check"></i> Kaydet';
                    saveWeightBtn.style.background = '';
                    morningWeightInput.value = '';
                    // Reload window to update chart
                    window.location.reload();
                }, 1000);
            }
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
            if (e.key === 'Enter') {
                routineSleepBtn.click();
            }
        });

        routineSleepBtn.addEventListener('click', () => {
            const hours = parseFloat(routineSleepInput.value);
            if (!isNaN(hours) && hours > 0) {
                appState.sleepHours = hours;
                saveState();
                updateSleepUI();
                
                routineSleepBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
                routineSleepBtn.style.background = 'var(--accent-green)';
                
                setTimeout(() => {
                    routineSleepBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Ekle';
                    routineSleepBtn.style.background = 'var(--accent-blue)';
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
        if(!vitaminList) return;
        vitaminList.innerHTML = '';
        if(!appState.customVitamins) appState.customVitamins = [];
        
        appState.customVitamins.forEach((vit, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <label class="checkbox-container">
                    <input type="checkbox" id="${vit.id}" ${vit.checked ? 'checked' : ''}>
                    <span class="checkmark"></span>
                    <span class="todo-text">${vit.name}</span>
                </label>
                <button class="delete-btn" style="background: none; border: none; color: var(--accent-red); cursor: pointer; padding: 5px;"><i class="fa-solid fa-trash"></i></button>
            `;
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            vitaminList.appendChild(li);

            // Checkbox event
            li.querySelector('input').addEventListener('change', (e) => {
                appState.customVitamins[index].checked = e.target.checked;
                saveState();
            });

            // Delete event
            li.querySelector('.delete-btn').addEventListener('click', () => {
                appState.customVitamins.splice(index, 1);
                saveState();
                renderVitamins();
            });
        });
    }

    if(addVitaminBtn && newVitaminInput) {
        addVitaminBtn.addEventListener('click', () => {
            const name = newVitaminInput.value.trim();
            if(name) {
                if(!appState.customVitamins) appState.customVitamins = [];
                appState.customVitamins.push({
                    id: 'vit_' + Date.now(),
                    name: name,
                    checked: false
                });
                saveState();
                renderVitamins();
                newVitaminInput.value = '';
            }
        });
    }

    // Initialize UI on load
    updateWaterUI();
    updateSleepUI();
    renderVitamins();

    // Re-render when state updates (e.g. settings saved)
    window.addEventListener('stateUpdated', () => {
        updateWaterUI();
    });
}
