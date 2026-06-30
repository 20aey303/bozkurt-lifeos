import { appState, switchDate } from './state.js';
import { calculateStreak } from './notifications.js';

export function updateUI() {
    const currentWeightUI = document.getElementById('currentWeightUI');
    const targetWeightUI = document.getElementById('targetWeightUI');
    const consumedCaloriesBigUI = document.getElementById('consumedCaloriesBigUI');
    const targetCaloriesBigUI = document.getElementById('targetCaloriesBigUI');
    const remainingCaloriesBigUI = document.getElementById('remainingCaloriesBigUI');
    const burnedCaloriesBigUI = document.getElementById('burnedCaloriesBigUI');
    const calorieDeficitUI = document.getElementById('calorieDeficitUI');
    const calorieProgressBar = document.getElementById('calorieProgressBar');
    
    const greetingText = document.getElementById('greetingText');

    // Greeting based on time of day
    if (greetingText) {
        const hour = new Date().getHours();
        let greeting = 'Merhaba';
        if (hour < 12) greeting = 'Günaydın';
        else if (hour < 18) greeting = 'İyi günler';
        else greeting = 'İyi akşamlar';
        greetingText.textContent = `${greeting}, ${appState.name || 'Kullanıcı'}`;
    }

    if (currentWeightUI) currentWeightUI.textContent = `${appState.weight} kg`;
    if (targetWeightUI) targetWeightUI.textContent = appState.targetWeight || 75;
    
    // Net Calories = Consumed - Burned
    const burned = appState.burnedCalories || 0;
    const netCalories = appState.consumedCalories - burned;
    const remaining = Math.max(0, appState.calorieGoal - netCalories);
    const deficit = appState.calorieGoal - netCalories;
    
    if (consumedCaloriesBigUI) consumedCaloriesBigUI.textContent = appState.consumedCalories;
    if (targetCaloriesBigUI) targetCaloriesBigUI.textContent = appState.calorieGoal;
    if (remainingCaloriesBigUI) remainingCaloriesBigUI.textContent = `${remaining} kcal`;
    if (burnedCaloriesBigUI) burnedCaloriesBigUI.textContent = `${burned} kcal`;
    if (calorieDeficitUI) {
        if (deficit >= 0) {
            calorieDeficitUI.textContent = `${deficit} kcal (Açık)`;
            calorieDeficitUI.style.color = 'var(--accent-green)';
        } else {
            calorieDeficitUI.textContent = `${Math.abs(deficit)} kcal (Fazla)`;
            calorieDeficitUI.style.color = 'var(--accent-red)';
        }
    }
    
    if (calorieProgressBar) {
        const percent = Math.min(100, (appState.consumedCalories / Math.max(1, appState.calorieGoal)) * 100);
        calorieProgressBar.style.width = `${percent}%`;
        if (percent > 100) {
            calorieProgressBar.style.background = 'var(--accent-red)';
        } else {
            calorieProgressBar.style.background = '';
        }
    }

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

    // ═══ NEW WIDGETS ═══

    // Streak Widget
    updateStreakWidget();

    // Water circular progress
    updateWaterWidget();

    // Sleep widget
    updateSleepWidget();

    // BMI widget
    updateBMIWidget();
}

// ═══ Streak Widget ═══
function updateStreakWidget() {
    const streakCard = document.getElementById('streakCard');
    const streakCount = document.getElementById('streakCount');
    const streakLabel = document.getElementById('streakLabel');
    
    if (!streakCard) return;
    
    const streak = calculateStreak();
    
    if (streak > 0) {
        streakCard.style.display = 'flex';
        if (streakCount) streakCount.textContent = streak;
        if (streakLabel) {
            if (streak === 1) streakLabel.textContent = 'gün veri girdin — serini başlat!';
            else if (streak < 7) streakLabel.textContent = `gün üst üste — devam et!`;
            else if (streak < 30) streakLabel.textContent = `gün üst üste — harikasın! 💪`;
            else streakLabel.textContent = `gün üst üste — efsane! 🏆`;
        }
    } else {
        streakCard.style.display = 'none';
    }
}

// ═══ Water Circular Progress ═══
function updateWaterWidget() {
    const fill = document.getElementById('waterCircleFill');
    const value = document.getElementById('widgetWaterValue');
    
    if (!fill || !value) return;
    
    const goalLitres = (appState.waterGoal || 3000) / 1000;
    const current = appState.waterIntake || 0;
    const percent = Math.min(100, (current / goalLitres) * 100);
    
    // SVG circle math: circumference = 2 * PI * r = 2 * 3.14159 * 15.5 ≈ 97.4
    const circumference = 97.4;
    const offset = circumference - (percent / 100) * circumference;
    fill.style.strokeDashoffset = offset;
    
    value.textContent = `${current.toFixed(1)}L`;
}

// ═══ Sleep Widget ═══
function updateSleepWidget() {
    const fill = document.getElementById('sleepCircleFill');
    const value = document.getElementById('widgetSleepValue');
    
    if (!fill || !value) return;
    
    const sleep = appState.sleepHours || 0;
    const ideal = 8; // 8 hours ideal
    const percent = Math.min(100, (sleep / ideal) * 100);
    
    const circumference = 97.4;
    const offset = circumference - (percent / 100) * circumference;
    fill.style.strokeDashoffset = offset;
    
    value.textContent = `${sleep}s`;
}

// ═══ BMI Widget ═══
function updateBMIWidget() {
    const fill = document.getElementById('bmiCircleFill');
    const value = document.getElementById('widgetBMIValue');
    
    if (!fill || !value) return;
    
    const heightM = (appState.height || 180) / 100;
    const weight = appState.weight || 80;
    const bmi = weight / (heightM * heightM);
    
    value.textContent = bmi.toFixed(1);
    
    // BMI scale: 15-40 mapped to 0-100%
    const percent = Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100));
    
    const circumference = 97.4;
    const offset = circumference - (percent / 100) * circumference;
    fill.style.strokeDashoffset = offset;
    
    // Color based on BMI
    if (bmi < 18.5) fill.setAttribute('stroke', 'var(--accent-blue)');
    else if (bmi < 25) fill.setAttribute('stroke', 'var(--accent-green)');
    else if (bmi < 30) fill.setAttribute('stroke', 'var(--accent-orange)');
    else fill.setAttribute('stroke', 'var(--accent-red)');
}

// ═══ Navigation ═══
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
            const targetView = document.getElementById(targetId);
            if (targetView) targetView.classList.add('active');
        });
    });

    const dateDisplayBtn = document.getElementById('dateDisplayBtn');
    const dateTextUI = document.getElementById('dateTextUI');

    if (dateDisplayBtn && dateTextUI) {
        // Init date display
        let yyyymmdd = appState.lastAccessDate;
        const parts = appState.lastAccessDate.split('.');
        if (parts.length === 3) {
            yyyymmdd = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        
        // Beautiful Date Display
        const dObj = new Date(yyyymmdd);
        if (!isNaN(dObj)) {
            dateTextUI.textContent = dObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
        } else {
            dateTextUI.textContent = appState.lastAccessDate;
        }

        // --- Custom Calendar Modal Logic ---
        let calCurrentYear, calCurrentMonth;

        function renderCalendar(year, month) {
            const calDays = document.getElementById('calDays');
            const calMonthYear = document.getElementById('calMonthYear');
            
            if (!calDays || !calMonthYear) return;

            calDays.innerHTML = '';
            
            const firstDay = new Date(year, month, 1);
            let startingDay = firstDay.getDay() - 1;
            if (startingDay < 0) startingDay = 6; 
            
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const monthName = new Date(year, month, 1).toLocaleDateString('tr-TR', { month: 'long' });
            calMonthYear.textContent = `${monthName} ${year}`;
            
            for (let i = 0; i < startingDay; i++) {
                const empty = document.createElement('div');
                calDays.appendChild(empty);
            }
            
            for (let i = 1; i <= daysInMonth; i++) {
                const dayBtn = document.createElement('div');
                dayBtn.textContent = i;
                dayBtn.className = 'cal-day';
                
                if (!isNaN(dObj) && year === dObj.getFullYear() && month === dObj.getMonth() && i === dObj.getDate()) {
                    dayBtn.classList.add('selected');
                }
                
                // Check if today
                const today = new Date();
                if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
                    dayBtn.classList.add('today');
                }
                
                dayBtn.onclick = async () => {
                    document.getElementById('calendarModal').style.display = 'none';
                    const dd = String(i).padStart(2, '0');
                    const mm = String(month + 1).padStart(2, '0');
                    const yyyy = year;
                    await switchDate(`${dd}.${mm}.${yyyy}`);
                    setTimeout(() => location.reload(), 100);
                };
                
                calDays.appendChild(dayBtn);
            }
        }

        dateDisplayBtn.addEventListener('click', () => {
            const calModal = document.getElementById('calendarModal');
            if (!calModal) return;

            if (!isNaN(dObj)) {
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
        if (calCloseBtn) {
            calCloseBtn.addEventListener('click', () => {
                document.getElementById('calendarModal').style.display = 'none';
            });
        }
        
        const calPrevBtn = document.getElementById('calPrevBtn');
        if (calPrevBtn) {
            calPrevBtn.addEventListener('click', () => {
                calCurrentMonth--;
                if (calCurrentMonth < 0) { calCurrentMonth = 11; calCurrentYear--; }
                renderCalendar(calCurrentYear, calCurrentMonth);
            });
        }
        
        const calNextBtn = document.getElementById('calNextBtn');
        if (calNextBtn) {
            calNextBtn.addEventListener('click', () => {
                calCurrentMonth++;
                if (calCurrentMonth > 11) { calCurrentMonth = 0; calCurrentYear++; }
                renderCalendar(calCurrentYear, calCurrentMonth);
            });
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
