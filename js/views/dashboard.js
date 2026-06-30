import { callGeminiAPI } from '../api.js';
import { appState, saveState, endDay } from '../state.js';
import { resetBtn, updateUI } from '../ui.js';
import { showToast } from '../notifications.js';

let weightChart = null;
let calorieTrendChart = null;

export function initDashboard() {
    const endDayBtn = document.getElementById('endDayBtn');

    if (endDayBtn) {
        endDayBtn.addEventListener('click', async () => {
            if (confirm("Günü bitirip tüm verileri arşive kaldırmak istediğinize emin misiniz?")) {
                await endDay();
                showToast('🌙 Gün Kapatıldı', 'Veriler arşivlendi, yeni güne geçildi!', 'success');
                setTimeout(() => location.reload(), 500);
            }
        });
    }

    // ═══ Weight Chart ═══
    initWeightChart();
    
    // ═══ Calorie Trend Chart ═══
    initCalorieTrendChart();

    // ═══ Period Selectors ═══
    initPeriodSelectors();
}

function initWeightChart() {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;

    if (!appState.weightHistory || appState.weightHistory.length === 0) {
        appState.weightHistory = [
            { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR'), weight: appState.weight + 1.2 },
            { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR'), weight: appState.weight + 0.8 },
            { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR'), weight: appState.weight + 0.5 },
            { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR'), weight: appState.weight + 0.1 },
            { date: new Date().toLocaleDateString('tr-TR'), weight: appState.weight }
        ];
        saveState();
    }

    const data = getWeightData(7);
    
    weightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Kilo (kg)',
                    data: data.values,
                    borderColor: '#66fcf1',
                    backgroundColor: createGradient(ctx, 'rgba(102, 252, 241, 0.15)', 'rgba(102, 252, 241, 0)'),
                    borderWidth: 2.5,
                    pointBackgroundColor: '#66fcf1',
                    pointBorderColor: '#06080d',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Hedef',
                    data: data.labels.map(() => appState.targetWeight || 85),
                    borderColor: 'rgba(255, 126, 103, 0.4)',
                    borderWidth: 1.5,
                    borderDash: [6, 4],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: getChartOptions('kg')
    });
}

function initCalorieTrendChart() {
    const ctx = document.getElementById('calorieTrendChart');
    if (!ctx) return;

    const data = getCalorieData(7);

    calorieTrendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Alınan',
                    data: data.consumed,
                    backgroundColor: 'rgba(255, 126, 103, 0.6)',
                    borderColor: 'rgba(255, 126, 103, 0.8)',
                    borderWidth: 1,
                    borderRadius: 6,
                    barThickness: 12
                },
                {
                    label: 'Yakılan',
                    data: data.burned,
                    backgroundColor: 'rgba(76, 175, 80, 0.6)',
                    borderColor: 'rgba(76, 175, 80, 0.8)',
                    borderWidth: 1,
                    borderRadius: 6,
                    barThickness: 12
                }
            ]
        },
        options: {
            ...getChartOptions('kcal'),
            plugins: {
                ...getChartOptions('kcal').plugins,
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#8b919e',
                        font: { family: 'Inter', size: 11 },
                        boxWidth: 12,
                        boxHeight: 12,
                        borderRadius: 3,
                        useBorderRadius: true,
                        padding: 15
                    }
                }
            }
        }
    });
}

function initPeriodSelectors() {
    // Weight chart period
    const weightPeriod = document.getElementById('weightChartPeriod');
    if (weightPeriod) {
        weightPeriod.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                weightPeriod.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const period = parseInt(btn.dataset.period);
                updateWeightChart(period);
            });
        });
    }

    // Calorie chart period
    const caloriePeriod = document.getElementById('calorieChartPeriod');
    if (caloriePeriod) {
        caloriePeriod.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                caloriePeriod.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const period = parseInt(btn.dataset.period);
                updateCalorieTrendChart(period);
            });
        });
    }
}

// ═══ Chart Data Helpers ═══

function getWeightData(days) {
    const history = appState.weightHistory || [];
    const sliced = history.slice(-days);
    return {
        labels: sliced.map(e => formatShortDate(e.date)),
        values: sliced.map(e => e.weight)
    };
}

function getCalorieData(days) {
    const history = appState.history || [];
    const sorted = [...history].sort((a, b) => {
        const dateA = parseTRDate(a.date);
        const dateB = parseTRDate(b.date);
        return dateA - dateB;
    });
    const sliced = sorted.slice(-days);
    
    return {
        labels: sliced.map(e => formatShortDate(e.date)),
        consumed: sliced.map(e => e.consumedCalories || 0),
        burned: sliced.map(e => e.burnedCalories || 0)
    };
}

function updateWeightChart(days) {
    if (!weightChart) return;
    const data = getWeightData(days);
    weightChart.data.labels = data.labels;
    weightChart.data.datasets[0].data = data.values;
    weightChart.data.datasets[1].data = data.labels.map(() => appState.targetWeight || 85);
    weightChart.update('active');
}

function updateCalorieTrendChart(days) {
    if (!calorieTrendChart) return;
    const data = getCalorieData(days);
    calorieTrendChart.data.labels = data.labels;
    calorieTrendChart.data.datasets[0].data = data.consumed;
    calorieTrendChart.data.datasets[1].data = data.burned;
    calorieTrendChart.update('active');
}

// ═══ Utilities ═══

function createGradient(ctx, colorStart, colorEnd) {
    const canvas = ctx.getContext ? ctx : ctx.canvas;
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
}

function getChartOptions(unit) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false },
                ticks: { 
                    color: '#8b919e', 
                    font: { family: 'Inter', size: 11 },
                    callback: (val) => `${val}${unit === 'kcal' ? '' : ''}`
                },
                border: { display: false }
            },
            x: {
                grid: { display: false },
                ticks: { 
                    color: '#8b919e', 
                    font: { family: 'Inter', size: 10 },
                    maxRotation: 0
                },
                border: { display: false }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 18, 25, 0.95)',
                titleFont: { family: 'Inter', weight: '600' },
                bodyFont: { family: 'Inter' },
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                displayColors: false
            }
        }
    };
}

function formatShortDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('.');
    if (parts.length === 3) {
        const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    }
    return dateStr;
}

function parseTRDate(dateStr) {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('.');
    if (parts.length !== 3) return new Date(0);
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}
