import { appState, saveState } from '../state.js';
import { updateUI } from '../ui.js';
import { callGeminiAPI } from '../api.js';

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

    const dayNames = { "1": "Pazartesi", "2": "Salı", "3": "Çarşamba", "4": "Perşembe", "5": "Cuma", "6": "Cumartesi", "0": "Pazar" };

    function recalcCalories() {
        let total = 0;
        const todayDay = new Date().getDay().toString();
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
        updateUI(); // Dashboard update
        
        if(burnedCaloriesTotalUI) {
            burnedCaloriesTotalUI.textContent = appState.burnedCalories;
        }
    }

    function renderRoutine() {
        if (!appState.fitnessProgram) {
            if (fitnessSetupCard) fitnessSetupCard.style.display = 'block';
            if (fitnessRoutineCard) fitnessRoutineCard.style.display = 'none';
            return;
        }

        if (fitnessSetupCard) fitnessSetupCard.style.display = 'none';
        if (fitnessRoutineCard) fitnessRoutineCard.style.display = 'block';

        const todayDay = new Date().getDay().toString(); // 0-6
        const todayProgram = appState.fitnessProgram[todayDay] || appState.fitnessProgram[dayNames[todayDay]];

        if (!todayProgram) {
            if (fitTodayTitle) {
                fitTodayTitle.textContent = 'Bugün: Dinlenme Günü 🛋️';
                fitTodayTitle.style.color = 'var(--text-secondary)';
            }
            if (fitWorkoutList) fitWorkoutList.innerHTML = '<p style="text-align:center; font-size: 0.9rem; color: var(--text-secondary);">Kasların bugün dinleniyor. Sadece aktif kalmaya çalış (yürüyüş vs.).</p>';
        } else {
            if (fitTodayTitle) {
                fitTodayTitle.textContent = `Bugün: Antrenman Günü 🔥`;
                fitTodayTitle.style.color = 'var(--accent-orange)';
            }
            
            if (fitWorkoutList) {
                fitWorkoutList.innerHTML = '';
                todayProgram.forEach((task, index) => {
                    const li = document.createElement('li');
                    li.style.display = 'flex';
                    li.style.justifyContent = 'space-between';
                    li.style.alignItems = 'center';
                    li.style.marginBottom = '5px';
                    
                    li.innerHTML = `
                        <label class="checkbox-container" style="flex: 1; margin-bottom: 0;">
                            <input type="checkbox" class="fit-checkbox" data-index="${index}" ${task.done ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            <span class="todo-text" style="${task.done ? 'text-decoration: line-through; opacity: 0.5;' : ''}">${task.name}</span>
                        </label>
                        <button class="fit-delete-btn" data-index="${index}" style="background: none; border: none; color: var(--accent-red); cursor: pointer; padding: 5px;"><i class="fa-solid fa-trash"></i></button>
                    `;
                    fitWorkoutList.appendChild(li);
                });

                // Bind checkbox events
                document.querySelectorAll('.fit-checkbox').forEach(box => {
                    box.addEventListener('change', (e) => {
                        const idx = e.target.getAttribute('data-index');
                        const isChecked = e.target.checked;
                        
                        if(appState.fitnessProgram[todayDay]) {
                            appState.fitnessProgram[todayDay][idx].done = isChecked;
                        } else if(appState.fitnessProgram[dayNames[todayDay]]) {
                            appState.fitnessProgram[dayNames[todayDay]][idx].done = isChecked;
                        }

                        recalcCalories();
                        renderRoutine();
                    });
                });

                // Bind delete events
                document.querySelectorAll('.fit-delete-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const idx = e.currentTarget.getAttribute('data-index');
                        if (confirm("Bu egzersizi silmek istediğine emin misin?")) {
                            if(appState.fitnessProgram[todayDay]) {
                                appState.fitnessProgram[todayDay].splice(idx, 1);
                            } else if(appState.fitnessProgram[dayNames[todayDay]]) {
                                appState.fitnessProgram[dayNames[todayDay]].splice(idx, 1);
                            }
                            recalcCalories();
                            renderRoutine();
                        }
                    });
                });
            }
        }
        recalcCalories();
    }

    // 1. AI Program Oluşturma (Setup)
    if (generateWorkoutBtn) {
        generateWorkoutBtn.addEventListener('click', async () => {
            const originalIcon = generateWorkoutBtn.innerHTML;
            generateWorkoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Yapay Zeka Programlıyor...';
            
            const selectedCheckboxes = document.querySelectorAll('.fit-day-checkbox:checked');
            const uniqueDays = Array.from(selectedCheckboxes).map(cb => cb.value);
            
            if (uniqueDays.length === 0) {
                alert("Lütfen spora gideceğiniz günleri seçin.");
                generateWorkoutBtn.innerHTML = originalIcon;
                return;
            }

            try {
                const dayStr = uniqueDays.map(d => dayNames[d]).join(', ');
                const instruction = `Kullanıcı Bilgileri: Yaş ${appState.age}, Boy ${appState.height}cm, Kilo ${appState.weight}kg, Cinsiyet: ${appState.gender}.
                Hedef: ${appState.goal === 'recomp' ? 'Kas Yapmak' : (appState.goal === 'lose' ? 'Kilo Vermek' : 'Kilo Almak')}.
                Kullanıcı haftada ${uniqueDays.length} gün spor yapacak: ${dayStr}.
                Lütfen bu kullanıcıya ${uniqueDays.length} günlük detaylı (hareket, set ve tekrar) bir spor programı yaz ve SADECE JSON objesi olarak dön.
                Format tam olarak şöyle olmalı (Örnek 2 gün için, anahtarlar günlerin rakam karşılığı olmalıdır. 1=Pzt, 2=Sal, 3=Çar, 4=Per, 5=Cum, 6=Cmt, 0=Paz):
                {
                  "${uniqueDays[0]}": [ {"name": "Bench Press 3x10", "done": false}, {"name": "Dumbbell Fly 3x12", "done": false} ],
                  "${uniqueDays[1] || 'X'}": [ {"name": "Squat 3x10", "done": false} ]
                }
                Senin JSON anahtarların tam olarak seçilen şu RAKAMLAR olmalı: ${uniqueDays.join(', ')}.
                Baska HICBIR metin, markdown backtick ( \`\`\` ) dondurme. Sadece saf JSON.`;
                
                const apiKey = localStorage.getItem('geminiApiKey');
                
                if (!apiKey) {
                    alert('Lütfen ayarlardan API anahtarınızı girin.');
                    generateWorkoutBtn.innerHTML = originalIcon;
                    return;
                }

                // Call the robust API function from api.js
                const programJson = await callGeminiAPI("Hemen spor programımı oluştur.", apiKey, instruction);
                
                appState.fitnessProgram = programJson;
                saveState();
                renderRoutine();
                
            } catch (err) {
                console.error("AI Error:", err);
                alert("HATA: " + err.message);
            }

            generateWorkoutBtn.innerHTML = originalIcon;
        });
    }

    // 2. Reset Program
    if (resetWorkoutBtn) {
        resetWorkoutBtn.addEventListener('click', () => {
            if(confirm("Mevcut programın silinip yeni bir program kurulumuna geçilecek. Emin misin?")) {
                appState.fitnessProgram = null;
                saveState();
                renderRoutine();
            }
        });
    }

    // 3. Ekstra Egzersiz ve Kalori
    if(fitnessAiBtn && fitnessAiInput) {
        
        // Enter tuşu desteği
        fitnessAiInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                fitnessAiBtn.click();
            }
        });

        fitnessAiBtn.addEventListener('click', async () => {
            const query = fitnessAiInput.value.trim();
            if(!query) return;

            const originalIcon = fitnessAiBtn.innerHTML;
            fitnessAiBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            
            try {
                const instruction = `Kullanıcının kilosu: ${appState.weight} kg, Cinsiyeti: ${appState.gender}, Yaşı: ${appState.age}. Girdiği spor aktivitesinin/egzersizin tahmini kaç kalori yaktığını GERÇEKÇİ bir şekilde hesapla. SADECE JSON formatında dön. Örnek: {"burned": 45}. Başka hiçbir kelime kullanma.`;
                const apiKey = localStorage.getItem('geminiApiKey');
                
                if (!apiKey) {
                    alert('Lütfen API anahtarınızı girin.');
                    fitnessAiBtn.innerHTML = originalIcon;
                    return;
                }

                const resultJson = await callGeminiAPI(query, apiKey, instruction);
                
                // Model 'calories' olarak da dönebilir
                const burnedVal = resultJson.burned || resultJson.calories;

                if(burnedVal) {
                    // Ekstra hareketi bugünün listesine ekle
                    const todayDay = new Date().getDay().toString();
                    if (!appState.fitnessProgram) appState.fitnessProgram = {};
                    
                    // Gün listesini bul veya oluştur
                    let dayList = appState.fitnessProgram[todayDay] || appState.fitnessProgram[dayNames[todayDay]];
                    if (!dayList) {
                        appState.fitnessProgram[todayDay] = [];
                        dayList = appState.fitnessProgram[todayDay];
                    }
                    
                    dayList.push({
                        name: `Ekstra: ${query} (${burnedVal} kcal)`,
                        done: true // otomatik tikli gelir
                    });

                    // TAKVİME ENTEGRE ET!
                    const dateKey = new Date().toLocaleDateString('tr-TR');
                    if (!appState.calendar) appState.calendar = {};
                    if (!appState.calendar[dateKey]) appState.calendar[dateKey] = [];
                    
                    appState.calendar[dateKey].push({
                        id: Date.now(),
                        text: `💪 Spor: ${query} (${burnedVal} kcal yaktın)`,
                        type: 'event', // Turuncu nokta
                        done: true
                    });

                    saveState();
                    recalcCalories(); // Calls saveState and updateUI implicitly
                    renderRoutine();
                    
                    fitnessAiInput.value = '';
                } else {
                    alert("Yapay Zeka kaloriyi hesaplayamadı (Bilinmeyen veri döndü).");
                }
            } catch (err) {
                console.error("AI Error:", err);
                alert("Kalori hesaplanamadı: " + err.message);
            }
            
            fitnessAiBtn.innerHTML = originalIcon;
        });
    }

    // Initial Render
    renderRoutine();
}
