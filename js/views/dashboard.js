import { callGeminiAPI } from '../api.js';
import { appState, saveState, endDay } from '../state.js';
import { resetBtn, updateUI } from '../ui.js';

export function initDashboard() {
    const aiFoodBtn = document.getElementById('aiFoodBtn');
    const aiFoodInput = document.getElementById('aiFoodInput');
    const endDayBtn = document.getElementById('endDayBtn');

    if (endDayBtn) {
        endDayBtn.addEventListener('click', async () => {
            if (confirm("Günü bitirip tüm verileri arşive kaldırmak istediğinize emin misiniz?")) {
                await endDay();
                alert("Gün başarıyla sonlandırıldı. Yeni bir güne geçildi!");
                setTimeout(() => location.reload(), 100);
            }
        });
    }

    if(aiFoodBtn && aiFoodInput) {
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

                        alert(`✅ Başarıyla Eklendi!\n\nYapay Zeka Analizi:\nKalori: ${result.calories} kcal\nProtein: ${result.protein}g\nKarbonhidrat: ${result.carbs}g\nYağ: ${result.fat}g\n\nGünlük hedefe işlendi.`);
                        
                        aiFoodBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
                        aiFoodBtn.style.background = 'var(--accent-green)';
                        aiFoodBtn.style.color = 'white';
                        aiFoodInput.value = '';
                    } else {
                        alert("Yapay zeka gıdayı tam anlayamadı veya eksik veri döndü.");
                        resetBtn(aiFoodBtn, originalIcon);
                    }
                } catch (error) {
                    console.error("API Hatası Detayı:", error);
                    alert("Hata: " + error.message + "\nLütfen konsolu kontrol edin.");
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

    // --- Chart Initialization ---
    const ctx = document.getElementById('progressChart');
    if(ctx) {
        if(!appState.weightHistory || appState.weightHistory.length === 0) {
            // Mock initial data if empty
            appState.weightHistory = [
                { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR'), weight: appState.weight + 1.2 },
                { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR'), weight: appState.weight + 0.8 },
                { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR'), weight: appState.weight + 0.5 },
                { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR'), weight: appState.weight + 0.1 },
                { date: new Date().toLocaleDateString('tr-TR'), weight: appState.weight }
            ];
            saveState();
        }

        const labels = appState.weightHistory.map(entry => entry.date);
        const data = appState.weightHistory.map(entry => entry.weight);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Kilo İlerlemesi (kg)',
                    data: data,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#2196F3',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#B3B3B3' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#B3B3B3' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#B3B3B3', font: { family: 'Inter' } } }
                }
            }
        });
    }
}
