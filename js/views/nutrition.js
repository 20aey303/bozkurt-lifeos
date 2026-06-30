import { appState, saveState } from '../state.js';
import { callGeminiAPI } from '../api.js';
import { updateUI, resetBtn } from '../ui.js';
import { showToast } from '../notifications.js';

export function initNutrition() {
    const mealsContainer = document.getElementById('mealsContainer');
    const aiFoodBtn = document.getElementById('nutritionAiFoodBtn');
    const aiFoodInput = document.getElementById('nutritionAiFoodInput');

    function renderMeals() {
        if (!mealsContainer) return;
        mealsContainer.innerHTML = '';

        if (!appState.meals || appState.meals.length === 0) {
            mealsContainer.innerHTML = '<p class="text-center text-muted text-sm mt-sm">Bugün henüz bir öğün kaydetmedin.</p>';
            return;
        }

        appState.meals.forEach((meal, index) => {
            const card = document.createElement('div');
            card.className = 'meal-card';

            let itemsHtml = '';
            if (meal.items && meal.items.length > 0) {
                itemsHtml = `<ul class="meal-items">` +
                    meal.items.map(item => `
                        <li>
                            <span>${item.name}</span>
                            <span>${item.calories} kcal</span>
                        </li>
                    `).join('') + `</ul>`;
            } else {
                itemsHtml = `<p class="text-sm text-muted" style="margin: var(--space-sm) 0;">${meal.rawInput || meal.name}</p>`;
            }

            card.innerHTML = `
                <div class="meal-header">
                    <span class="meal-time">
                        <i class="fa-regular fa-clock"></i> ${meal.time}
                    </span>
                    <button class="btn-icon danger delete-meal-btn" data-index="${index}"><i class="fa-solid fa-trash"></i></button>
                </div>
                
                ${itemsHtml}

                <div class="meal-footer">
                    <span class="meal-macros">P: ${meal.protein}g, K: ${meal.carbs}g, Y: ${meal.fat}g</span>
                    <span class="meal-total">Toplam: ${meal.calories} kcal</span>
                </div>
            `;
            mealsContainer.appendChild(card);
        });

        const deleteBtns = mealsContainer.querySelectorAll('.delete-meal-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.getAttribute('data-index');
                const mealToDelete = appState.meals[idx];
                
                appState.consumedCalories = Math.max(0, appState.consumedCalories - mealToDelete.calories);
                appState.consumedProtein = Math.max(0, appState.consumedProtein - (parseInt(mealToDelete.protein) || 0));
                appState.consumedCarbs = Math.max(0, appState.consumedCarbs - (parseInt(mealToDelete.carbs) || 0));
                appState.consumedFat = Math.max(0, appState.consumedFat - (parseInt(mealToDelete.fat) || 0));
                
                appState.meals.splice(idx, 1);
                
                saveState();
                updateUI();
                renderMeals();
                showToast('🗑️ Öğün Silindi', 'Kalori ve makrolar güncellendi.', 'info', 2000);
            });
        });
    }

    if (aiFoodBtn && aiFoodInput) {
        aiFoodInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') aiFoodBtn.click();
        });

        aiFoodBtn.addEventListener('click', async () => {
            const query = aiFoodInput.value.trim();
            const apiKey = localStorage.getItem('geminiApiKey');

            if (!apiKey) {
                showToast('🔑 API Anahtarı Gerekli', 'Ayarlar menüsünden Gemini API anahtarınızı girin.', 'warning');
                document.querySelector('[data-target="view-settings"]').click();
                return;
            }

            if (query) {
                const originalIcon = aiFoodBtn.innerHTML;
                aiFoodBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                aiFoodBtn.style.opacity = '0.7';
                aiFoodBtn.disabled = true;

                try {
                    const result = await callGeminiAPI(query, apiKey);
                    
                    if (result && (result.calories !== undefined)) {
                        appState.consumedCalories += parseInt(result.calories);
                        appState.consumedProtein += parseInt(result.protein || 0);
                        appState.consumedCarbs += parseInt(result.carbs || 0);
                        appState.consumedFat += parseInt(result.fat || 0);
                        
                        if (!appState.meals) appState.meals = [];
                        appState.meals.push({
                            id: 'meal_' + Date.now(),
                            name: "Öğün",
                            rawInput: query,
                            items: result.items || [],
                            calories: result.calories,
                            protein: result.protein,
                            carbs: result.carbs,
                            fat: result.fat,
                            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                        });
                        
                        saveState();
                        updateUI();
                        renderMeals();

                        aiFoodBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
                        aiFoodBtn.style.background = 'var(--accent-green)';
                        aiFoodInput.value = '';
                        
                        showToast('🍽️ Öğün Eklendi', `${result.calories} kcal — P:${result.protein}g K:${result.carbs}g Y:${result.fat}g`, 'success', 4000);
                    } else {
                        showToast('⚠️ Analiz Başarısız', 'Yapay zeka gıdayı tam anlayamadı.', 'warning');
                        resetBtn(aiFoodBtn, originalIcon);
                    }
                } catch (error) {
                    showToast('❌ Hata', error.message, 'error', 6000);
                    resetBtn(aiFoodBtn, originalIcon);
                } finally {
                    setTimeout(() => resetBtn(aiFoodBtn, originalIcon), 2000);
                }
            }
        });
    }

    // Re-render when state updates
    window.addEventListener('stateUpdated', renderMeals);
    renderMeals();
}
