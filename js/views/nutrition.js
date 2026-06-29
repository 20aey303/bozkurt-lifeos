import { appState, saveState } from '../state.js';
import { callGeminiAPI } from '../api.js';
import { updateUI, resetBtn } from '../ui.js';

export function initNutrition() {
    const mealsContainer = document.getElementById('mealsContainer');
    const aiFoodBtn = document.getElementById('nutritionAiFoodBtn');
    const aiFoodInput = document.getElementById('nutritionAiFoodInput');

    function renderMeals() {
        if (!mealsContainer) return;
        mealsContainer.innerHTML = '';

        if (!appState.meals || appState.meals.length === 0) {
            mealsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 10px;">Bugün henüz bir öğün kaydetmedin.</p>';
            return;
        }

        appState.meals.forEach((meal, index) => {
            const card = document.createElement('div');
            card.style.background = 'rgba(255,255,255,0.05)';
            card.style.borderRadius = '10px';
            card.style.padding = '12px 15px';
            card.style.marginBottom = '10px';
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';

            let itemsHtml = '';
            if (meal.items && meal.items.length > 0) {
                itemsHtml = `<ul style="margin-top: 10px; margin-bottom: 10px; padding-left: 0; list-style: none; font-size: 0.85rem; color: var(--text-secondary); border-left: 2px solid var(--accent-orange); padding-left: 10px;">` +
                    meal.items.map(item => `
                        <li style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span>${item.name}</span>
                            <span>${item.calories} kcal</span>
                        </li>
                    `).join('') + `</ul>`;
            } else {
                itemsHtml = `<p style="margin: 10px 0; font-size: 0.85rem; color: var(--text-secondary);">${meal.rawInput || meal.name}</p>`;
            }

            card.innerHTML = `
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <h4 style="margin: 0; font-size: 0.95rem; color: var(--text-primary);">
                            <i class="fa-regular fa-clock" style="margin-right:5px; color: var(--accent-orange);"></i> ${meal.time}
                        </h4>
                        <button class="delete-meal-btn" data-index="${index}" style="background: none; border: none; color: var(--accent-red); cursor: pointer; padding: 5px;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    
                    ${itemsHtml}

                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
                        <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">
                            P: ${meal.protein}g, K: ${meal.carbs}g, Y: ${meal.fat}g
                        </p>
                        <strong style="color: var(--accent-orange); font-size: 1.1rem;">Toplam: ${meal.calories} kcal</strong>
                    </div>
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
            });
        });
    }

    if(aiFoodBtn && aiFoodInput) {
        aiFoodInput.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') {
                aiFoodBtn.click();
            }
        });

        aiFoodBtn.addEventListener('click', async () => {
            const query = aiFoodInput.value.trim();
            const apiKey = localStorage.getItem('geminiApiKey');

            if (!apiKey) {
                alert("Lütfen önce Ayarlar menüsünden Gemini API anahtarınızı girin!");
                document.querySelector('[data-target="view-settings"]').click();
                return;
            }

            if(query) {
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
                        
                        if(!appState.meals) appState.meals = [];
                        appState.meals.push({
                            id: 'meal_' + Date.now(),
                            name: "Öğün",
                            rawInput: query,
                            items: result.items || [],
                            calories: result.calories,
                            protein: result.protein,
                            carbs: result.carbs,
                            fat: result.fat,
                            time: new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})
                        });
                        
                        saveState();
                        updateUI();
                        renderMeals();

                        aiFoodBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
                        aiFoodBtn.style.background = 'var(--accent-green)';
                        aiFoodBtn.style.color = 'white';
                        aiFoodInput.value = '';
                    } else {
                        alert("Yapay zeka gıdayı tam anlayamadı.");
                        resetBtn(aiFoodBtn, originalIcon);
                    }
                } catch (error) {
                    alert("Hata: " + error.message);
                    resetBtn(aiFoodBtn, originalIcon);
                } finally {
                    setTimeout(() => resetBtn(aiFoodBtn, originalIcon), 2000);
                }
            }
        });
        
        aiFoodInput.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') {
                aiFoodBtn.click();
            }
        });
    }

    // Dashboard'dan (başka sekmeden) öğün eklendiğinde listenin anında güncellenmesi için
    window.addEventListener('stateUpdated', renderMeals);

    renderMeals();
}
