import { appState } from '../state.js';

export function initHistory() {
    const historyContainer = document.getElementById('historyContainer');
    if(!historyContainer) return;

    function renderHistory() {
        if (!appState.history || appState.history.length === 0) {
            historyContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 20px;">Henüz geçmiş bir kaydınız bulunmuyor. Her yeni günde, bir önceki günün verileri buraya arşivlenir.</p>';
            return;
        }

        historyContainer.innerHTML = '';

        appState.history.forEach((day, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.marginBottom = '15px';
            card.style.padding = '10px 15px';
            
            // Generate meal list HTML
            let mealsHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">Yemek kaydedilmemiş.</p>';
            if (day.meals && day.meals.length > 0) {
                mealsHTML = `<ul class="todo-list" style="margin-top: 5px;">` + 
                    day.meals.map(m => `
                        <li style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 8px;">
                            <span><i class="fa-solid fa-utensils" style="margin-right:5px; opacity:0.7;"></i> ${m.name}</span>
                            <strong style="color: var(--accent-orange);">${m.calories} kcal</strong>
                        </li>
                    `).join('') + `</ul>`;
            }

            // Generate vitamins HTML
            let vitHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">Vitamin seçilmemiş.</p>';
            if (day.vitamins && day.vitamins.length > 0) {
                const checkedVits = day.vitamins.filter(v => v.checked);
                if(checkedVits.length > 0) {
                    vitHTML = `<ul style="padding-left: 5px; font-size: 0.9rem; margin-top: 5px; color: var(--text-primary); list-style:none;">` +
                        checkedVits.map(v => `<li style="margin-bottom: 5px;"><i class="fa-solid fa-check" style="color:var(--accent-green); margin-right:5px;"></i> ${v.name}</li>`).join('') + `</ul>`;
                }
            }

            card.innerHTML = `
                <div class="history-header" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                    <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);"><i class="fa-regular fa-calendar-check" style="color: var(--accent-green); margin-right: 5px;"></i> ${day.date}</h3>
                    <span><i class="fa-solid fa-chevron-down chevron-icon"></i></span>
                </div>
                <div class="history-body" style="display: none; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; text-align: center;">
                            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Alınan Kalori</p>
                            <strong style="color: var(--accent-orange); font-size: 1.2rem;">${day.consumedCalories} kcal</strong>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; text-align: center;">
                            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 5px;">Su (Litre)</p>
                            <strong style="color: var(--accent-blue); font-size: 1.2rem;">${day.waterIntake} L</strong>
                        </div>
                    </div>
                    
                    <h4 style="margin-bottom: 5px; font-size: 0.95rem; color: var(--text-secondary);">O Günkü Kilo</h4>
                    <p style="font-size: 1.1rem; margin-bottom: 15px;"><strong>${day.weight} kg</strong></p>

                    <h4 style="margin-bottom: 5px; font-size: 0.95rem; color: var(--text-secondary);">Yenilen Öğünler</h4>
                    ${mealsHTML}
                    
                    <h4 style="margin-bottom: 5px; margin-top: 15px; font-size: 0.95rem; color: var(--text-secondary);">Alınan Vitaminler</h4>
                    ${vitHTML}
                </div>
            `;
            
            historyContainer.appendChild(card);

            // Accordion click event
            const header = card.querySelector('.history-header');
            const body = card.querySelector('.history-body');
            const icon = card.querySelector('.chevron-icon');

            header.addEventListener('click', () => {
                const isHidden = body.style.display === 'none';
                body.style.display = isHidden ? 'block' : 'none';
                icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
                icon.style.transition = 'transform 0.3s ease';
            });
        });
    }

    renderHistory();
}
