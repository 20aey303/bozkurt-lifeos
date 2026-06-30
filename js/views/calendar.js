import { appState, saveState } from '../state.js';
import { showToast } from '../notifications.js';

export function initCalendar() {
    const calMonthDisplay = document.getElementById('calMonthDisplay');
    const calPrevMonth = document.getElementById('calPrevMonth');
    const calNextMonth = document.getElementById('calNextMonth');
    const calGrid = document.getElementById('calGrid');
    
    const calSelectedDateDisplay = document.getElementById('calSelectedDateDisplay');
    const calendarTaskInput = document.getElementById('calendarTaskInput');
    const calendarAddBtn = document.getElementById('calendarAddBtn');
    const calendarTaskList = document.getElementById('calendarTaskList');
    const calTypeSelect = document.getElementById('calTypeSelect');

    let currentViewDate = new Date();
    let selectedDate = new Date();

    if (!appState.calendar) appState.calendar = {};
    const dayNames = { "1": "Pazartesi", "2": "Salı", "3": "Çarşamba", "4": "Perşembe", "5": "Cuma", "6": "Cumartesi", "0": "Pazar" };

    function formatDateForKey(dateObj) {
        return dateObj.toLocaleDateString('tr-TR');
    }

    function renderMonthGrid() {
        if (!calGrid || !calMonthDisplay) return;

        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        calMonthDisplay.textContent = `${monthNames[currentViewDate.getMonth()]} ${currentViewDate.getFullYear()}`;

        calGrid.innerHTML = '';

        const year = currentViewDate.getFullYear();
        const month = currentViewDate.getMonth();

        const firstDay = new Date(year, month, 1).getDay();
        const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const todayKey = formatDateForKey(new Date());
        const selectedKey = formatDateForKey(selectedDate);

        // Empty cells
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyDiv = document.createElement('div');
            calGrid.appendChild(emptyDiv);
        }

        // Day cells
        for (let i = 1; i <= daysInMonth; i++) {
            const cellDate = new Date(year, month, i);
            const cellKey = formatDateForKey(cellDate);
            
            const cell = document.createElement('div');
            cell.className = 'cal-page-day';
            cell.textContent = i;

            // Today highlight
            if (cellKey === todayKey) {
                cell.classList.add('is-today');
            }
            
            // Selected highlight
            if (cellKey === selectedKey) {
                cell.classList.add('is-selected');
            }

            // Event indicators
            const dayTasks = appState.calendar[cellKey] || [];
            const dayOfWeek = cellDate.getDay().toString();
            const hasWorkout = appState.fitnessProgram && (appState.fitnessProgram[dayOfWeek] || appState.fitnessProgram[dayNames[dayOfWeek]]);

            const dotContainer = document.createElement('div');
            dotContainer.className = 'dot-container';
            dotContainer.style.cssText = 'position: absolute; bottom: 3px; left: 50%; transform: translateX(-50%); display: flex; gap: 2px;';
            cell.style.position = 'relative';

            if (hasWorkout) {
                const wDot = document.createElement('div');
                wDot.className = 'cal-dot';
                wDot.style.background = 'var(--accent-red)';
                dotContainer.appendChild(wDot);
            }

            if (dayTasks.length > 0) {
                const dot = document.createElement('div');
                dot.className = 'cal-dot';
                
                if (dayTasks[0].type === 'event') dot.style.background = 'var(--accent-orange)';
                else if (dayTasks[0].type === 'note') dot.style.background = 'var(--accent-green)';
                else dot.style.background = 'var(--accent-blue)';
                
                dotContainer.appendChild(dot);
            }

            if (dotContainer.children.length > 0) {
                cell.appendChild(dotContainer);
            }

            // Click to select
            cell.addEventListener('click', () => {
                selectedDate = new Date(year, month, i);
                renderMonthGrid();
                renderSelectedDateTasks();
            });

            calGrid.appendChild(cell);
        }
    }

    function renderSelectedDateTasks() {
        if (!calSelectedDateDisplay || !calendarTaskList) return;

        const dateKey = formatDateForKey(selectedDate);
        
        // Title
        const today = new Date();
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        
        if (dateKey === formatDateForKey(today)) {
            calSelectedDateDisplay.innerHTML = `<i class="fa-solid fa-list-check"></i> Seçili Gün: Bugün`;
        } else if (dateKey === formatDateForKey(tomorrow)) {
            calSelectedDateDisplay.innerHTML = `<i class="fa-solid fa-list-check"></i> Seçili Gün: Yarın`;
        } else if (dateKey === formatDateForKey(yesterday)) {
            calSelectedDateDisplay.innerHTML = `<i class="fa-solid fa-list-check"></i> Seçili Gün: Dün`;
        } else {
            calSelectedDateDisplay.innerHTML = `<i class="fa-solid fa-list-check"></i> ${selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`;
        }

        // Tasks
        const tasks = appState.calendar[dateKey] || [];
        
        // Workout
        const dayOfWeek = selectedDate.getDay().toString();
        const workoutRoutine = appState.fitnessProgram && (appState.fitnessProgram[dayOfWeek] || appState.fitnessProgram[dayNames[dayOfWeek]]);

        calendarTaskList.innerHTML = '';

        if (tasks.length === 0 && !workoutRoutine) {
            calendarTaskList.innerHTML = '<p class="text-center text-muted text-sm mt-md">Bu güne ait kayıt veya antrenman yok.</p>';
            return;
        }

        // Workout section
        if (workoutRoutine) {
            const wHeader = document.createElement('li');
            wHeader.className = 'mb-sm';
            wHeader.innerHTML = `<strong class="color-red text-sm"><i class="fa-solid fa-dumbbell"></i> Bugünkü Antrenman Programı</strong>`;
            calendarTaskList.appendChild(wHeader);

            workoutRoutine.forEach((task) => {
                const li = document.createElement('li');
                li.className = 'cal-task-item type-workout';
                
                li.innerHTML = `
                    <span>
                        <i class="fa-solid fa-fire color-red" style="margin-right: 8px; opacity: 0.7;"></i>
                        <span style="${task.done && dateKey === formatDateForKey(new Date()) ? 'text-decoration: line-through; opacity: 0.5;' : ''}">${task.name}</span>
                    </span>
                `;
                calendarTaskList.appendChild(li);
            });
            
            if (tasks.length > 0) {
                const divider = document.createElement('div');
                divider.className = 'divider';
                calendarTaskList.appendChild(divider);
            }
        }

        // Calendar tasks
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = `cal-task-item type-${task.type || 'task'}`;

            let icon = '<i class="fa-solid fa-check"></i>';
            if (task.type === 'event') icon = '<i class="fa-regular fa-clock color-orange"></i>';
            if (task.type === 'note') icon = '<i class="fa-solid fa-book color-green"></i>';

            li.innerHTML = `
                <label class="checkbox-container" style="flex: 1; margin-bottom: 0;">
                    <input type="checkbox" class="cal-checkbox" data-index="${index}" ${task.done ? 'checked' : ''} ${task.type === 'note' ? 'disabled style="display:none;"' : ''}>
                    <span class="checkmark" style="${task.type === 'note' ? 'display:none;' : ''}"></span>
                    <span class="todo-text" style="margin-left: ${task.type === 'note' ? '0' : ''}; ${task.done ? 'text-decoration: line-through; opacity: 0.5;' : ''}">
                        ${icon} <span style="margin-left: 6px;">${task.text}</span>
                    </span>
                </label>
                <button class="btn-icon danger cal-delete-btn" data-index="${index}"><i class="fa-solid fa-trash"></i></button>
            `;
            calendarTaskList.appendChild(li);
        });

        // Checkbox events
        calendarTaskList.querySelectorAll('.cal-checkbox').forEach(box => {
            box.addEventListener('change', (e) => {
                const idx = e.target.getAttribute('data-index');
                appState.calendar[dateKey][idx].done = e.target.checked;
                saveState();
                renderSelectedDateTasks();
            });
        });

        // Delete events
        calendarTaskList.querySelectorAll('.cal-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.getAttribute('data-index');
                appState.calendar[dateKey].splice(idx, 1);
                saveState();
                renderMonthGrid();
                renderSelectedDateTasks();
                showToast('🗑️ Silindi', 'Etkinlik kaldırıldı.', 'info', 2000);
            });
        });
    }

    // Month Navigation
    if (calPrevMonth) {
        calPrevMonth.addEventListener('click', () => {
            currentViewDate.setMonth(currentViewDate.getMonth() - 1);
            renderMonthGrid();
        });
    }

    if (calNextMonth) {
        calNextMonth.addEventListener('click', () => {
            currentViewDate.setMonth(currentViewDate.getMonth() + 1);
            renderMonthGrid();
        });
    }

    // Add Task/Event
    if (calendarAddBtn && calendarTaskInput) {
        calendarTaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') calendarAddBtn.click();
        });

        calendarAddBtn.addEventListener('click', () => {
            const text = calendarTaskInput.value.trim();
            const type = calTypeSelect ? calTypeSelect.value : 'task';
            
            if (!text) return;

            const dateKey = formatDateForKey(selectedDate);
            if (!appState.calendar[dateKey]) {
                appState.calendar[dateKey] = [];
            }

            appState.calendar[dateKey].push({
                id: Date.now(),
                text: text,
                type: type,
                done: false
            });

            calendarTaskInput.value = '';
            saveState();
            renderMonthGrid();
            renderSelectedDateTasks();
            showToast('📅 Eklendi', text, 'success', 2000);
        });
    }

    // Initial render
    renderMonthGrid();
    renderSelectedDateTasks();
}
