import { appState } from '../state.js';

export function initHistory() {
    const historyContainer = document.getElementById('historyContainer');
    if (!historyContainer) return;

    function renderHistory() {
        if (!appState.history || appState.history.length === 0) {
            historyContainer.innerHTML = '<p class="text-center text-muted mt-md">Henüz geçmiş bir kaydınız bulunmuyor. Her yeni günde, bir önceki günün verileri buraya arşivlenir.</p>';
            return;
        }

        historyContainer.innerHTML = '';

        appState.history.forEach((day) => {
            const card = document.createElement('div');
            card.className = 'card history-card';
            
            // Generate meal list HTML
            let mealsHTML = '<p class="text-sm text-muted">Yemek kaydedilmemiş.</p>';
            if (day.meals && day.meals.length > 0) {
                mealsHTML = `<ul class="todo-list">` + 
                    day.meals.map(m => `
                        <li class="flex-between text-sm mb-sm">
                            <span><i class="fa-solid fa-utensils text-muted" style="margin-right: 5px; opacity: 0.7;"></i> ${m.name}</span>
                            <strong class="color-orange">${m.calories} kcal</strong>
                        </li>
                    `).join('') + `</ul>`;
            }

            // Generate vitamins HTML
            let vitHTML = '<p class="text-sm text-muted">Vitamin seçilmemiş.</p>';
            if (day.vitamins && day.vitamins.length > 0) {
                const checkedVits = day.vitamins.filter(v => v.checked);
                if (checkedVits.length > 0) {
                    vitHTML = `<ul style="padding-left: 0; list-style: none;">` +
                        checkedVits.map(v => `<li class="text-sm mb-sm"><i class="fa-solid fa-check color-green" style="margin-right: 5px;"></i> ${v.name}</li>`).join('') + `</ul>`;
                }
            }

            card.innerHTML = `
                <div class="history-header">
                    <h3><i class="fa-regular fa-calendar-check"></i> ${day.date}</h3>
                    <span><i class="fa-solid fa-chevron-down chevron-icon"></i></span>
                </div>
                <div class="history-body">
                    <div class="history-stat-grid">
                        <div class="history-stat">
                            <div class="history-stat-label">Alınan Kalori</div>
                            <div class="history-stat-value color-orange">${day.consumedCalories || 0} kcal</div>
                        </div>
                        <div class="history-stat">
                            <div class="history-stat-label">Yakılan Kalori</div>
                            <div class="history-stat-value color-green">${day.burnedCalories || 0} kcal</div>
                        </div>
                        <div class="history-stat">
                            <div class="history-stat-label">Su (Litre)</div>
                            <div class="history-stat-value color-blue">${day.waterIntake || 0} L</div>
                        </div>
                        <div class="history-stat">
                            <div class="history-stat-label">O Günkü Kilo</div>
                            <div class="history-stat-value">${day.weight || '-'} kg</div>
                        </div>
                    </div>
                    
                    <div class="history-stat" style="margin-bottom: var(--space-md); padding: var(--space-md);">
                        <h4 class="text-sm text-muted text-center mb-sm"><i class="fa-solid fa-chart-pie"></i> Makrolar</h4>
                        <div style="display: flex; justify-content: space-around; font-size: 0.88rem;">
                            <div class="text-center"><span style="color: #FF5722;">Pro:</span> <strong>${day.macros?.protein || 0}g</strong></div>
                            <div class="text-center"><span style="color: #4CAF50;">Karb:</span> <strong>${day.macros?.carbs || 0}g</strong></div>
                            <div class="text-center"><span style="color: #FFC107;">Yağ:</span> <strong>${day.macros?.fat || 0}g</strong></div>
                        </div>
                    </div>

                    <h4 class="text-sm text-muted mb-sm"><i class="fa-solid fa-utensils"></i> Yenilen Öğünler</h4>
                    ${mealsHTML}
                    
                    <h4 class="text-sm text-muted mb-sm mt-md"><i class="fa-solid fa-pills"></i> Alınan Vitaminler</h4>
                    ${vitHTML}
                </div>
            `;
            
            historyContainer.appendChild(card);

            // Accordion click event
            const header = card.querySelector('.history-header');
            const body = card.querySelector('.history-body');
            const icon = card.querySelector('.chevron-icon');

            header.addEventListener('click', () => {
                const isHidden = body.style.display === 'none' || !body.style.display || body.style.display === '';
                body.style.display = isHidden ? 'block' : 'none';
                icon.classList.toggle('open', isHidden);
            });
        });
    }

    renderHistory();
}
