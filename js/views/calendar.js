import { appState, saveState } from '../state.js';

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

    let currentViewDate = new Date(); // Hangi ay/yılı görüntülediğimiz
    let selectedDate = new Date(); // Hangi günün görevlerini listelediğimiz

    if (!appState.calendar) appState.calendar = {};
    const dayNames = { "1": "Pazartesi", "2": "Salı", "3": "Çarşamba", "4": "Perşembe", "5": "Cuma", "6": "Cumartesi", "0": "Pazar" };

    function formatDateForKey(dateObj) {
        return dateObj.toLocaleDateString('tr-TR');
    }

    function renderMonthGrid() {
        if (!calGrid || !calMonthDisplay) return;

        // Ay ve Yıl Başlığı
        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        calMonthDisplay.textContent = `${monthNames[currentViewDate.getMonth()]} ${currentViewDate.getFullYear()}`;

        calGrid.innerHTML = '';

        const year = currentViewDate.getFullYear();
        const month = currentViewDate.getMonth();

        const firstDay = new Date(year, month, 1).getDay(); // 0 (Pazar) - 6 (Cumartesi)
        // Pazartesi'yi 0 yapmak için kaydırma
        const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const todayKey = formatDateForKey(new Date());
        const selectedKey = formatDateForKey(selectedDate);

        // Boş kutular (ayın ilk gününe kadar)
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyDiv = document.createElement('div');
            calGrid.appendChild(emptyDiv);
        }

        // Ayın günleri
        for (let i = 1; i <= daysInMonth; i++) {
            const cellDate = new Date(year, month, i);
            const cellKey = formatDateForKey(cellDate);
            
            const cell = document.createElement('div');
            cell.style.padding = '10px 0';
            cell.style.textAlign = 'center';
            cell.style.borderRadius = '8px';
            cell.style.cursor = 'pointer';
            cell.style.position = 'relative';
            cell.textContent = i;

            // Bugünü vurgula
            if (cellKey === todayKey) {
                cell.style.background = 'rgba(255, 255, 255, 0.1)';
                cell.style.fontWeight = 'bold';
            }
            
            // Seçili günü vurgula
            if (cellKey === selectedKey) {
                cell.style.border = '1px solid var(--accent-blue)';
            } else {
                cell.style.border = '1px solid transparent';
            }

            // Etkinlik var mı?
            const dayTasks = appState.calendar[cellKey] || [];
            
            // Antrenman var mı?
            const dayOfWeek = cellDate.getDay().toString();
            const hasWorkout = appState.fitnessProgram && (appState.fitnessProgram[dayOfWeek] || appState.fitnessProgram[dayNames[dayOfWeek]]);

            const dotContainer = document.createElement('div');
            dotContainer.style.position = 'absolute';
            dotContainer.style.bottom = '3px';
            dotContainer.style.left = '50%';
            dotContainer.style.transform = 'translateX(-50%)';
            dotContainer.style.display = 'flex';
            dotContainer.style.gap = '2px';

            if (hasWorkout) {
                const wDot = document.createElement('div');
                wDot.style.width = '4px';
                wDot.style.height = '4px';
                wDot.style.borderRadius = '50%';
                wDot.style.background = 'var(--accent-red)';
                dotContainer.appendChild(wDot);
            }

            if (dayTasks.length > 0) {
                const dot = document.createElement('div');
                dot.style.width = '4px';
                dot.style.height = '4px';
                dot.style.borderRadius = '50%';
                
                // İlk etkinliğin türüne göre renk
                if(dayTasks[0].type === 'event') dot.style.background = 'var(--accent-orange)';
                else if(dayTasks[0].type === 'note') dot.style.background = 'var(--accent-green)';
                else dot.style.background = 'var(--accent-blue)';
                
                dotContainer.appendChild(dot);
            }

            if (dotContainer.children.length > 0) {
                cell.appendChild(dotContainer);
            }

            // Tıklama ile günü seçme
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
        
        // Başlık
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

        // Görevler
        const tasks = appState.calendar[dateKey] || [];
        
        // Antrenman
        const dayOfWeek = selectedDate.getDay().toString();
        const workoutRoutine = appState.fitnessProgram && (appState.fitnessProgram[dayOfWeek] || appState.fitnessProgram[dayNames[dayOfWeek]]);

        calendarTaskList.innerHTML = '';

        if (tasks.length === 0 && !workoutRoutine) {
            calendarTaskList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 15px; font-size: 0.9rem;">Bu güne ait kayıt veya antrenman yok.</p>';
            return;
        }

        // Eğer antrenman varsa onu da listeye ekle
        if (workoutRoutine) {
            const wHeader = document.createElement('li');
            wHeader.style.background = 'transparent';
            wHeader.style.padding = '5px 0';
            wHeader.style.color = 'var(--accent-red)';
            wHeader.style.fontWeight = 'bold';
            wHeader.style.border = 'none';
            wHeader.innerHTML = `<i class="fa-solid fa-dumbbell"></i> Bugünkü Antrenman Programı`;
            calendarTaskList.appendChild(wHeader);

            workoutRoutine.forEach((task) => {
                const li = document.createElement('li');
                li.style.display = 'flex';
                li.style.alignItems = 'center';
                li.style.marginBottom = '8px';
                li.style.background = 'rgba(255,255,255,0.02)';
                li.style.padding = '10px 12px';
                li.style.borderRadius = '12px';
                li.style.borderLeft = '3px solid var(--accent-red)';
                
                // Sadece göstermelik, tıklanma işlevi fitness sekmesinde kalmalı
                li.innerHTML = `
                    <i class="fa-solid fa-fire" style="color: var(--accent-red); margin-right: 10px; opacity: 0.7;"></i>
                    <span style="${task.done && dateKey === formatDateForKey(new Date()) ? 'text-decoration: line-through; opacity: 0.5;' : ''}">${task.name}</span>
                `;
                calendarTaskList.appendChild(li);
            });
            
            // Ayırıcı
            if (tasks.length > 0) {
                const divider = document.createElement('div');
                divider.style.height = '1px';
                divider.style.background = 'rgba(255,255,255,0.1)';
                divider.style.margin = '15px 0';
                calendarTaskList.appendChild(divider);
            }
        }

        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.style.marginBottom = '10px';
            li.style.background = 'rgba(255,255,255,0.02)';
            li.style.padding = '12px';
            li.style.borderRadius = '12px';
            li.style.borderLeft = '3px solid var(--accent-blue)';

            let icon = '<i class="fa-solid fa-check"></i>';
            if (task.type === 'event') {
                icon = '<i class="fa-regular fa-clock" style="color: var(--accent-orange)"></i>';
                li.style.borderLeft = '3px solid var(--accent-orange)';
            }
            if (task.type === 'note') {
                icon = '<i class="fa-solid fa-book" style="color: var(--accent-green)"></i>';
                li.style.borderLeft = '3px solid var(--accent-green)';
            }

            li.innerHTML = `
                <label class="checkbox-container" style="flex: 1; margin-bottom: 0;">
                    <input type="checkbox" class="cal-checkbox" data-index="${index}" ${task.done ? 'checked' : ''} ${task.type === 'note' ? 'disabled style="display:none;"' : ''}>
                    <span class="checkmark" style="${task.type === 'note' ? 'display:none;' : ''}"></span>
                    <span class="todo-text" style="margin-left: ${task.type === 'note' ? '0' : '35px'}; ${task.done ? 'text-decoration: line-through; opacity: 0.5;' : ''}">
                        ${icon} <span style="margin-left: 8px;">${task.text}</span>
                    </span>
                </label>
                <button class="cal-delete-btn" data-index="${index}" style="background: none; border: none; color: var(--accent-red); cursor: pointer; padding: 5px;"><i class="fa-solid fa-trash"></i></button>
            `;
            calendarTaskList.appendChild(li);
        });

        // Checkbox olayları
        document.querySelectorAll('.cal-checkbox').forEach(box => {
            box.addEventListener('change', (e) => {
                const idx = e.target.getAttribute('data-index');
                appState.calendar[dateKey][idx].done = e.target.checked;
                saveState();
                renderSelectedDateTasks();
            });
        });

        // Silme olayları
        document.querySelectorAll('.cal-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.getAttribute('data-index');
                appState.calendar[dateKey].splice(idx, 1);
                saveState();
                renderMonthGrid(); // Noktalar değişmiş olabilir
                renderSelectedDateTasks();
            });
        });
    }

    // Ay Değiştirme (Önceki/Sonraki)
    if(calPrevMonth) {
        calPrevMonth.addEventListener('click', () => {
            currentViewDate.setMonth(currentViewDate.getMonth() - 1);
            renderMonthGrid();
        });
    }

    if(calNextMonth) {
        calNextMonth.addEventListener('click', () => {
            currentViewDate.setMonth(currentViewDate.getMonth() + 1);
            renderMonthGrid();
        });
    }

    // Yeni Görev/Etkinlik Ekleme
    if(calendarAddBtn && calendarTaskInput) {
        
        calendarTaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                calendarAddBtn.click();
            }
        });

        calendarAddBtn.addEventListener('click', () => {
            const text = calendarTaskInput.value.trim();
            const type = calTypeSelect ? calTypeSelect.value : 'task';
            
            if(!text) return;

            const dateKey = formatDateForKey(selectedDate);
            if(!appState.calendar[dateKey]) {
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
            renderMonthGrid(); // Nokta eklensin diye grid'i de yenile
            renderSelectedDateTasks();
        });
    }

    // Initial render
    renderMonthGrid();
    renderSelectedDateTasks();
}
