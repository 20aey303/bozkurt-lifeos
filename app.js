import { loadState } from './js/state.js';
import { initNavigation, updateUI } from './js/ui.js';
import { initDashboard } from './js/views/dashboard.js';
import { initSettings } from './js/views/settings.js';
import { initRoutine } from './js/views/routine.js';
import { initHistory } from './js/views/history.js';
import { initNutrition } from './js/views/nutrition.js';
import { initFitness } from './js/views/fitness.js';
import { initCalendar } from './js/views/calendar.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load Application State
    await loadState();

    // 2. Initialize UI (DOM updates based on state)
    updateUI();

    // 3. Initialize Navigation
    initNavigation();

    // 4. Initialize Views
    initDashboard();
    initSettings();
    initRoutine();
    initHistory();
    initNutrition();
    initFitness();
    initCalendar();
    
    console.log("LifeOS Başlatıldı - Tüm modüller yüklendi.");
});
