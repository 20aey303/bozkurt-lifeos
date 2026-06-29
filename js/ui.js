import { appState, switchDate } from './state.js';

export function updateUI() {
    const currentWeightUI = document.getElementById('currentWeightUI');
    const targetWeightUI = document.getElementById('targetWeightUI');
    const consumedCaloriesUI = document.getElementById('consumedCaloriesUI');
    const remainingCaloriesUI = document.getElementById('remainingCaloriesUI');
    const greetingText = document.getElementById('greetingText');

    if(greetingText) greetingText.textContent = `Günaydın, ${appState.name || 'Kullanıcı'}`;

    if(currentWeightUI) currentWeightUI.textContent = `${appState.weight} kg`;
    if(targetWeightUI) targetWeightUI.textContent = appState.targetWeight || 75;
    
    // Net Calories = Consumed - Burned
    const netCalories = appState.consumedCalories - (appState.burnedCalories || 0);
    const remaining = Math.max(0, appState.calorieGoal - netCalories);
    
    if(consumedCaloriesUI) consumedCaloriesUI.textContent = `${appState.consumedCalories} kcal`;
    if(remainingCaloriesUI) remainingCaloriesUI.textContent = remaining;

    // Macros
    if (appState.macroGoals) {
        const uiProtein = document.getElementById('uiProtein');
        const uiProteinGoal = document.getElementById('uiProteinGoal');
        const barProtein = document.getElementById('barProtein');

        if (uiProtein) uiProtein.textContent = appState.consumedProtein;
        if (uiProteinGoal) uiProteinGoal.textContent = appState.macroGoals.protein;
        if (barProtein) barProtein.style.width = Math.min(100, (appState.consumedProtein / Math.max(1, appState.macroGoals.protein)) * 100) + '%';

        const uiCarbs = document.getElementById('uiCarbs');
        const uiCarbsGoal = document.getElementById('uiCarbsGoal');
        const barCarbs = document.getElementById('barCarbs');

        if (uiCarbs) uiCarbs.textContent = appState.consumedCarbs;
        if (uiCarbsGoal) uiCarbsGoal.textContent = appState.macroGoals.carbs;
        if (barCarbs) barCarbs.style.width = Math.min(100, (appState.consumedCarbs / Math.max(1, appState.macroGoals.carbs)) * 100) + '%';

        const uiFat = document.getElementById('uiFat');
        const uiFatGoal = document.getElementById('uiFatGoal');
        const barFat = document.getElementById('barFat');

        if (uiFat) uiFat.textContent = appState.consumedFat;
        if (uiFatGoal) uiFatGoal.textContent = appState.macroGoals.fat;
        if (barFat) barFat.style.width = Math.min(100, (appState.consumedFat / Math.max(1, appState.macroGoals.fat)) * 100) + '%';
    }
}

export function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            navItems.forEach(nav => nav.classList.remove('active'));
            views.forEach(view => view.classList.remove('active'));

            item.classList.add('active');
            
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    const dateSelector = document.getElementById('dateSelector');
    const dateDisplayBtn = document.getElementById('dateDisplayBtn');
    const dateTextUI = document.getElementById('dateTextUI');

    if (dateSelector && dateTextUI) {
        // Init value to appState.lastAccessDate (DD.MM.YYYY to YYYY-MM-DD)
        let yyyymmdd = appState.lastAccessDate;
        const parts = appState.lastAccessDate.split('.');
        if (parts.length === 3) {
            yyyymmdd = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        
        dateSelector.value = yyyymmdd;
        
        // Beautiful Date Display
        const dObj = new Date(yyyymmdd);
        if(!isNaN(dObj)) {
            dateTextUI.textContent = dObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
        } else {
            dateTextUI.textContent = appState.lastAccessDate;
        }

        // --- Custom Calendar Logic ---
        let calCurrentYear, calCurrentMonth;

        function renderCalendar(year, month) {
            const calDays = document.getElementById('calDays');
            const calMonthYear = document.getElementById('calMonthYear');
            
            if(!calDays || !calMonthYear) return;

            calDays.innerHTML = '';
            
            const firstDay = new Date(year, month, 1);
            let startingDay = firstDay.getDay() - 1; // 0=Monday, 6=Sunday
            if (startingDay < 0) startingDay = 6; 
            
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const monthName = new Date(year, month, 1).toLocaleDateString('tr-TR', { month: 'long' });
            calMonthYear.textContent = `${monthName} ${year}`;
            
            for(let i = 0; i < startingDay; i++) {
                const empty = document.createElement('div');
                calDays.appendChild(empty);
            }
            
            for(let i = 1; i <= daysInMonth; i++) {
                const dayBtn = document.createElement('div');
                dayBtn.textContent = i;
                dayBtn.style.padding = '8px 0';
                dayBtn.style.cursor = 'pointer';
                dayBtn.style.borderRadius = '8px';
                dayBtn.style.transition = '0.2s';
                
                if(!isNaN(dObj) && year === dObj.getFullYear() && month === dObj.getMonth() && i === dObj.getDate()) {
                    dayBtn.style.background = 'var(--accent-blue)';
                    dayBtn.style.color = '#000';
                    dayBtn.style.fontWeight = 'bold';
                } else {
                    dayBtn.style.color = 'white';
                    dayBtn.onmouseover = () => dayBtn.style.background = 'rgba(255,255,255,0.15)';
                    dayBtn.onmouseout = () => dayBtn.style.background = 'transparent';
                }
                
                dayBtn.onclick = () => {
                    document.getElementById('calendarModal').style.display = 'none';
                    const dd = String(i).padStart(2, '0');
                    const mm = String(month + 1).padStart(2, '0');
                    const yyyy = year;
                    switchDate(`${dd}.${mm}.${yyyy}`);
                    location.reload();
                };
                
                calDays.appendChild(dayBtn);
            }
        }

        if (dateDisplayBtn) {
            dateDisplayBtn.addEventListener('click', () => {
                const calModal = document.getElementById('calendarModal');
                if(!calModal) return;

                if(!isNaN(dObj)) {
                    calCurrentYear = dObj.getFullYear();
                    calCurrentMonth = dObj.getMonth();
                } else {
                    const today = new Date();
                    calCurrentYear = today.getFullYear();
                    calCurrentMonth = today.getMonth();
                }
                
                renderCalendar(calCurrentYear, calCurrentMonth);
                calModal.style.display = 'flex';
            });
            
            const calCloseBtn = document.getElementById('calCloseBtn');
            if(calCloseBtn) {
                calCloseBtn.addEventListener('click', () => {
                    document.getElementById('calendarModal').style.display = 'none';
                });
            }
            
            const calPrevBtn = document.getElementById('calPrevBtn');
            if(calPrevBtn) {
                calPrevBtn.addEventListener('click', () => {
                    calCurrentMonth--;
                    if(calCurrentMonth < 0) { calCurrentMonth = 11; calCurrentYear--; }
                    renderCalendar(calCurrentYear, calCurrentMonth);
                });
            }
            
            const calNextBtn = document.getElementById('calNextBtn');
            if(calNextBtn) {
                calNextBtn.addEventListener('click', () => {
                    calCurrentMonth++;
                    if(calCurrentMonth > 11) { calCurrentMonth = 0; calCurrentYear++; }
                    renderCalendar(calCurrentYear, calCurrentMonth);
                });
            }
        }
    }
}

export function resetBtn(btn, originalIcon) {
    btn.innerHTML = originalIcon;
    btn.style.background = '';
    btn.style.color = '';
    btn.style.opacity = '1';
    btn.disabled = false;
}
