import { appState, saveState } from '../state.js';
import { updateUI } from '../ui.js';
import { callGeminiAPI } from '../api.js';
import { showToast } from '../notifications.js';

export function initFitness() {
    const fitnessSetupCard = document.getElementById('fitnessSetupCard');
    const fitnessRoutineCard = document.getElementById('fitnessRoutineCard');
    
    const generateWorkoutBtn = document.getElementById('generateWorkoutBtn');
    const resetWorkoutBtn = document.getElementById('resetWorkoutBtn');
    
    const fitTodayTitle = document.getElementById('fitTodayTitle');
    const fitWorkoutList = document.getElementById('fitWorkoutList');
    
    const fitnessAiInput = document.getElementById('fitnessAiInput');
    const fitnessAiBtn = document.getElementById('fitnessAiBtn');
    const burnedCaloriesTotalUI = document.getElementById('burnedCaloriesTotalUI');

    // Manual Entry Elements
    const manualFitDaySelect1 = document.getElementById('manualFitDaySelect1');
    const manualFitInput1 = document.getElementById('manualFitInput1');
    const manualFitAddBtn1 = document.getElementById('manualFitAddBtn1');
    
    const manualFitDaySelect2 = document.getElementById('manualFitDaySelect2');
    const manualFitInput2 = document.getElementById('manualFitInput2');
    const manualFitAddBtn2 = document.getElementById('manualFitAddBtn2');

    // Timer Elements
    const timerDisplay = document.getElementById('timerDisplay');
    const timerStartBtn = document.getElementById('timerStartBtn');
    const timerStopBtn = document.getElementById('timerStopBtn');

    // Completion Elements
    const workoutCompletionText = document.getElementById('workoutCompletionText');
    const workoutCompletionBar = document.getElementById('workoutCompletionBar');

    const dayNames = { "1": "Pazartesi", "2": "Salı", "3": "Çarşamba", "4": "Perşembe", "5": "Cuma", "6": "Cumartesi", "0": "Pazar" };
    const dayNamesShort = { "1": "Pzt", "2": "Sal", "3": "Çar", "4": "Per", "5": "Cum", "6": "Cmt", "0": "Paz" };

    // ═══ Timer Logic ═══
    let timerInterval = null;
    let timerSeconds = 0;
    let timerRunning = false;

    function updateTimerDisplay() {
        if (!timerDisplay) return;
        const mins = Math.floor(timerSeconds / 60);
        const secs = timerSeconds % 60;
        timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    if (timerStartBtn) {
        timerStartBtn.addEventListener('click', () => {
            if (timerRunning) return;
            timerRunning = true;
            timerStartBtn.style.opacity = '0.5';
            timerInterval = setInterval(() => {
                timerSeconds++;
                updateTimerDisplay();
            }, 1000);
            showToast('⏱️ Antrenman Başladı', 'Süre sayılıyor...', 'info', 2000);
        });
    }

    if (timerStopBtn) {
        timerStopBtn.addEventListener('click', () => {
            if (!timerRunning) return;
            clearInterval(timerInterval);
            timerRunning = false;
            if (timerStartBtn) timerStartBtn.style.opacity = '1';
            const mins = Math.floor(timerSeconds / 60);
            showToast('⏱️ Antrenman Bitti', `Toplam süre: ${mins} dakika`, 'success', 4000);
            timerSeconds = 0;
            updateTimerDisplay();
        });
    }

    // ═══ Helper Functions ═══

    function getTodayDayStr() {
        if (appState.lastAccessDate) {
            const parts = appState.lastAccessDate.split('.');
            if (parts.length === 3) {
                const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                return d.getDay().toString();
            }
        }
        return new Date().getDay().toString();
    }

    function recalcCalories() {
        let total = 0;
        const todayDay = getTodayDayStr();
        const todayProgram = appState.fitnessProgram[todayDay] || appState.fitnessProgram[dayNames[todayDay]];
        
        if (todayProgram) {
            todayProgram.forEach(task => {
                if (task.done) {
                    if (task.name.startsWith("Ekstra:")) {
                        const match = task.name.match(/\((\d+)\s*kcal\)/i);
                        if (match && match[1]) {
                            total += parseInt(match[1]);
                        }
                    } else {
                        total += 50;
                    }
                }
            });
        }
        appState.burnedCalories = total;
        saveState();
        updateUI();
        
        if (burnedCaloriesTotalUI) {
            burnedCaloriesTotalUI.textContent = appState.burnedCalories;
        }
    }

    function updateCompletionBar() {
        const todayDay = getTodayDayStr();
        const todayProgram = appState.fitnessProgram && (appState.fitnessProgram[todayDay] || appState.fitnessProgram[dayNames[todayDay]]);
        
        if (!todayProgram || todayProgram.length === 0) {
            if (workoutCompletionText) workoutCompletionText.textContent = '—';
            if (workoutCompletionBar) workoutCompletionBar.style.width = '0%';
            return;
        }

        const total = todayProgram.length;
        const done = todayProgram.filter(t => t.done).length;
        const percent = Math.round((done / total) * 100);

        if (workoutCompletionText) workoutCompletionText.textContent = `${percent}%`;
        if (workoutCompletionBar) workoutCompletionBar.style.width = `${percent}%`;

        // All done notification
        if (percent === 100 && total > 0) {
            const key = `workout_done_${appState.lastAccessDate}`;
            if (!sessionStorage.getItem(key)) {
                sessionStorage.setItem(key, '1');
                showToast('💪 Antrenman Tamamlandı!', 'Bugünkü tüm egzersizlerini bitirdin!', 'success', 5000);
            }
        }
    }

    // ═══ Weekly Tabs ═══

    function renderWeeklyTabs() {
        const tabsContainer = document.getElementById('weeklyTabs');
        if (!tabsContainer || !appState.fitnessProgram) return;

        tabsContainer.innerHTML = '';
        const todayDay = getTodayDayStr();
        const allDays = ["1", "2", "3", "4", "5", "6", "0"];

        allDays.forEach(dayKey => {
            const hasProgram = appState.fitnessProgram[dayKey] || appState.fitnessProgram[dayNames[dayKey]];
            if (!hasProgram) return;

            const tab = document.createElement('button');
            tab.className = `weekly-tab${dayKey === todayDay ? ' active' : ''}`;
            
            const program = hasProgram;
            const done = program.filter(t => t.done).length;
            const total = program.length;
            
            tab.innerHTML = `${dayNamesShort[dayKey]} <span class="text-xs text-muted">${done}/${total}</span>`;
            
            tab.addEventListener('click', () => {
                tabsContainer.querySelectorAll('.weekly-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderDayWorkout(dayKey);
            });

            tabsContainer.appendChild(tab);
        });
    }

    function renderDayWorkout(dayKey) {
        if (!fitWorkoutList || !appState.fitnessProgram) return;

        const program = appState.fitnessProgram[dayKey] || appState.fitnessProgram[dayNames[dayKey]];
        const todayDay = getTodayDayStr();
        const isToday = dayKey === todayDay;

        if (fitTodayTitle) {
            if (!program) {
                fitTodayTitle.textContent = `${dayNamesShort[dayKey]}: Dinlenme Günü 🛋️`;
                fitTodayTitle.style.color = 'var(--text-secondary)';
            } else {
                fitTodayTitle.textContent = `${isToday ? 'Bugün' : dayNamesShort[dayKey]}: Antrenman Günü 🔥`;
                fitTodayTitle.style.color = 'var(--accent-orange)';
            }
        }

        if (!program) {
            fitWorkoutList.innerHTML = '<p class="text-center text-sm text-muted">Kasların bugün dinleniyor. Sadece aktif kalmaya çalış (yürüyüş vs.).</p>';
            return;
        }

        fitWorkoutList.innerHTML = '';
        program.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = 'workout-item';
            
            li.innerHTML = `
                <label class="checkbox-container" style="flex: 1; margin-bottom: 0;">
                    <input type="checkbox" class="fit-checkbox" data-day="${dayKey}" data-index="${index}" ${task.done ? 'checked' : ''} ${!isToday ? 'disabled' : ''}>
                    <span class="checkmark"></span>
                    <span class="todo-text" style="${task.done ? 'text-decoration: line-through; opacity: 0.5;' : ''}">${task.name}</span>
                </label>
                <button class="btn-icon danger fit-delete-btn" data-day="${dayKey}" data-index="${index}"><i class="fa-solid fa-trash"></i></button>
            `;
            fitWorkoutList.appendChild(li);
        });

        // Bind checkbox events
        fitWorkoutList.querySelectorAll('.fit-checkbox').forEach(box => {
            box.addEventListener('change', (e) => {
                const day = e.target.getAttribute('data-day');
                const idx = e.target.getAttribute('data-index');
                const isChecked = e.target.checked;
                
                if (appState.fitnessProgram[day]) {
                    appState.fitnessProgram[day][idx].done = isChecked;
                } else if (appState.fitnessProgram[dayNames[day]]) {
                    appState.fitnessProgram[dayNames[day]][idx].done = isChecked;
                }

                recalcCalories();
                updateCompletionBar();
                renderWeeklyTabs();
                renderDayWorkout(day);
            });
        });

        // Bind delete events
        fitWorkoutList.querySelectorAll('.fit-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const day = e.currentTarget.getAttribute('data-day');
                const idx = e.currentTarget.getAttribute('data-index');
                if (confirm("Bu egzersizi silmek istediğine emin misin?")) {
                    let deletedItem = null;
                    if (appState.fitnessProgram[day]) {
                        deletedItem = appState.fitnessProgram[day].splice(idx, 1)[0];
                    } else if (appState.fitnessProgram[dayNames[day]]) {
                        deletedItem = appState.fitnessProgram[dayNames[day]].splice(idx, 1)[0];
                    }

                    // Takvimden de sil
                    if (deletedItem && deletedItem.name.startsWith("Ekstra:")) {
                        const dateKey = appState.lastAccessDate || new Date().toLocaleDateString('tr-TR');
                        if (appState.calendar && appState.calendar[dateKey]) {
                            const baseName = deletedItem.name.replace("Ekstra: ", "").replace(/\s*\(\d+\s*kcal\)$/i, "").trim();
                            appState.calendar[dateKey] = appState.calendar[dateKey].filter(calItem => {
                                return !(calItem.text.includes("💪 Spor:") && calItem.text.includes(baseName));
                            });
                        }
                    }

                    recalcCalories();
                    updateCompletionBar();
                    renderWeeklyTabs();
                    renderDayWorkout(day);
                    showToast('🗑️ Silindi', 'Egzersiz programdan kaldırıldı.', 'info', 2000);
                }
            });
        });
    }

    function renderRoutine() {
        if (!appState.fitnessProgram) {
            if (fitnessSetupCard) fitnessSetupCard.style.display = 'block';
            if (fitnessRoutineCard) fitnessRoutineCard.style.display = 'none';
            return;
        }

        if (fitnessSetupCard) fitnessSetupCard.style.display = 'none';
        if (fitnessRoutineCard) fitnessRoutineCard.style.display = 'block';

        renderWeeklyTabs();
        renderDayWorkout(getTodayDayStr());
        updateCompletionBar();
    }

    // ═══ AI Program Generation ═══
    if (generateWorkoutBtn) {
        generateWorkoutBtn.addEventListener('click', async () => {
            const originalIcon = generateWorkoutBtn.innerHTML;
            generateWorkoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Yapay Zeka Programlıyor...';
            
            const selectedCheckboxes = document.querySelectorAll('.fit-day-checkbox:checked');
            const uniqueDays = Array.from(selectedCheckboxes).map(cb => cb.value);
            
            if (uniqueDays.length === 0) {
                showToast('⚠️ Gün Seçilmedi', 'Lütfen spora gideceğiniz günleri seçin.', 'warning');
                generateWorkoutBtn.innerHTML = originalIcon;
                return;
            }

            try {
                const dayStr = uniqueDays.map(d => dayNames[d]).join(', ');
                const instruction = `Kullanıcı Bilgileri: Yaş ${appState.age}, Boy ${appState.height}cm, Kilo ${appState.weight}kg, Cinsiyet: ${appState.gender}.
                Hedef: ${appState.goal === 'recomp' ? 'Kas Yapmak' : (appState.goal === 'lose' ? 'Kilo Vermek' : 'Kilo Almak')}.
                Kullanıcı haftada ${uniqueDays.length} gün spor yapacak: ${dayStr}.
                Lütfen bu kullanıcıya ${uniqueDays.length} günlük detaylı (hareket, set ve tekrar) bir spor programı yaz ve SADECE JSON objesi olarak dön.
                Format tam olarak şöyle olmalı (anahtarlar günlerin rakam karşılığı olmalıdır. 1=Pzt, 2=Sal, 3=Çar, 4=Per, 5=Cum, 6=Cmt, 0=Paz):
                {
                  "${uniqueDays[0]}": [ {"name": "Bench Press 3x10", "done": false}, {"name": "Dumbbell Fly 3x12", "done": false} ],
                  "${uniqueDays[1] || 'X'}": [ {"name": "Squat 3x10", "done": false} ]
                }
                Senin JSON anahtarların tam olarak seçilen şu RAKAMLAR olmalı: ${uniqueDays.join(', ')}.
                Baska HICBIR metin, markdown backtick ( \`\`\` ) dondurme. Sadece saf JSON.`;
                
                const apiKey = localStorage.getItem('geminiApiKey');
                
                if (!apiKey) {
                    showToast('🔑 API Anahtarı Gerekli', 'Lütfen ayarlardan API anahtarınızı girin.', 'warning');
                    generateWorkoutBtn.innerHTML = originalIcon;
                    return;
                }

                const programJson = await callGeminiAPI("Hemen spor programımı oluştur.", apiKey, instruction);
                
                appState.fitnessProgram = programJson;
                saveState();
                renderRoutine();
                showToast('💪 Program Hazır!', 'AI antrenman programın oluşturuldu.', 'success');
                
            } catch (err) {
                console.error("AI Error:", err);
                showToast('❌ Hata', err.message, 'error', 6000);
            }

            generateWorkoutBtn.innerHTML = originalIcon;
        });
    }

    // ═══ Reset Program ═══
    if (resetWorkoutBtn) {
        resetWorkoutBtn.addEventListener('click', () => {
            if (confirm("Mevcut programın silinip yeni bir program kurulumuna geçilecek. Emin misin?")) {
                appState.fitnessProgram = null;
                saveState();
                renderRoutine();
                showToast('🔄 Program Sıfırlandı', 'Yeni program oluşturabilirsiniz.', 'info');
            }
        });
    }

    // ═══ Extra Exercise (AI Calorie) ═══
    if (fitnessAiBtn && fitnessAiInput) {
        fitnessAiInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') fitnessAiBtn.click();
        });

        fitnessAiBtn.addEventListener('click', async () => {
            const query = fitnessAiInput.value.trim();
            if (!query) return;

            const originalIcon = fitnessAiBtn.innerHTML;
            fitnessAiBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            
            try {
                const instruction = `Kullanıcının kilosu: ${appState.weight} kg, Cinsiyeti: ${appState.gender}, Yaşı: ${appState.age}. Girdiği spor aktivitesinin/egzersizin tahmini kaç kalori yaktığını GERÇEKÇİ bir şekilde hesapla. SADECE JSON formatında dön. Örnek: {"burned": 45}. Başka hiçbir kelime kullanma.`;
                const apiKey = localStorage.getItem('geminiApiKey');
                
                if (!apiKey) {
                    showToast('🔑 API Anahtarı Gerekli', 'Lütfen ayarlardan API anahtarınızı girin.', 'warning');
                    fitnessAiBtn.innerHTML = originalIcon;
                    return;
                }

                const resultJson = await callGeminiAPI(query, apiKey, instruction);
                const burnedVal = resultJson.burned || resultJson.calories;

                if (burnedVal) {
                    const todayDay = getTodayDayStr();
                    if (!appState.fitnessProgram) appState.fitnessProgram = {};
                    
                    let dayList = appState.fitnessProgram[todayDay] || appState.fitnessProgram[dayNames[todayDay]];
                    if (!dayList) {
                        appState.fitnessProgram[todayDay] = [];
                        dayList = appState.fitnessProgram[todayDay];
                    }
                    
                    dayList.push({
                        name: `Ekstra: ${query} (${burnedVal} kcal)`,
                        done: true
                    });

                    // Takvime entegre et
                    const dateKey = appState.lastAccessDate || new Date().toLocaleDateString('tr-TR');
                    if (!appState.calendar) appState.calendar = {};
                    if (!appState.calendar[dateKey]) appState.calendar[dateKey] = [];
                    
                    appState.calendar[dateKey].push({
                        id: Date.now(),
                        text: `💪 Spor: ${query} (${burnedVal} kcal yaktın)`,
                        type: 'event',
                        done: true
                    });

                    saveState();
                    recalcCalories();
                    renderRoutine();
                    
                    fitnessAiInput.value = '';
                    showToast('🔥 Ekstra Aktivite', `${query} — ${burnedVal} kcal yakıldı!`, 'fire', 4000);
                } else {
                    showToast('⚠️ Hesaplanamadı', 'Yapay Zeka kaloriyi hesaplayamadı.', 'warning');
                }
            } catch (err) {
                console.error("AI Error:", err);
                showToast('❌ Hata', err.message, 'error');
            }
            
            fitnessAiBtn.innerHTML = originalIcon;
        });
    }

    // ═══ Manual Program Entry ═══
    function handleManualAdd(daySelect, inputElement) {
        const selectedDay = daySelect.value;
        const exerciseText = inputElement.value.trim();
        
        if (!exerciseText) {
            showToast('⚠️ Boş Giriş', 'Lütfen bir egzersiz yazın.', 'warning');
            return;
        }

        if (!appState.fitnessProgram) {
            appState.fitnessProgram = {};
        }

        let dayList = appState.fitnessProgram[selectedDay] || appState.fitnessProgram[dayNames[selectedDay]];
        if (!dayList) {
            appState.fitnessProgram[selectedDay] = [];
            dayList = appState.fitnessProgram[selectedDay];
        }

        dayList.push({
            name: exerciseText,
            done: false
        });

        saveState();
        inputElement.value = '';
        renderRoutine();
        showToast('✅ Eklendi', `${exerciseText} programa eklendi.`, 'success', 2000);
    }

    if (manualFitAddBtn1) {
        manualFitAddBtn1.addEventListener('click', () => handleManualAdd(manualFitDaySelect1, manualFitInput1));
        manualFitInput1.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleManualAdd(manualFitDaySelect1, manualFitInput1);
        });
    }

    if (manualFitAddBtn2) {
        manualFitAddBtn2.addEventListener('click', () => handleManualAdd(manualFitDaySelect2, manualFitInput2));
        manualFitInput2.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleManualAdd(manualFitDaySelect2, manualFitInput2);
        });
    }

    // Initial Render
    renderRoutine();
}
