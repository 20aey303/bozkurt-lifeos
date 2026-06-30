import fs from 'fs';

// Mock state
let appState = {
    lastAccessDate: '29.06.2026',
    weight: 100.5,
    history: [],
    fitnessProgram: {
        "1": [{name: "Bench", done: true}],
        "2": [{name: "Squat", done: false}]
    },
    burnedCalories: 100
};

function getTodayDayStr() {
    if (appState.lastAccessDate) {
        const parts = appState.lastAccessDate.split('.');
        if(parts.length === 3) {
            const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            return d.getDay().toString();
        }
    }
    return new Date().getDay().toString();
}

function saveActiveToHistory() {
    if(!appState.history) appState.history = [];
    
    const archive = {
        date: appState.lastAccessDate,
        weight: appState.weight,
        burnedCalories: appState.burnedCalories
    };
    
    const existingIndex = appState.history.findIndex(h => h.date === appState.lastAccessDate);
    if(existingIndex >= 0) {
        appState.history[existingIndex] = archive;
    } else {
        appState.history.unshift(archive);
    }
}

function switchDate(newDateStr) {
    saveActiveToHistory();
    appState.lastAccessDate = newDateStr;

    const existing = appState.history.find(h => h.date === newDateStr);

    if (existing) {
        appState.burnedCalories = existing.burnedCalories || 0;
    } else {
        appState.burnedCalories = 0;
    }

    if (appState.fitnessProgram) {
        Object.keys(appState.fitnessProgram).forEach(dayKey => {
            appState.fitnessProgram[dayKey].forEach(task => task.done = false);
        });
    }
}

console.log("INITIAL STATE:");
console.log("Date:", appState.lastAccessDate);
console.log("Weight:", appState.weight);
console.log("Burned:", appState.burnedCalories);
console.log("Fitness Mon:", appState.fitnessProgram["1"][0].done);
console.log("Fitness Tue:", appState.fitnessProgram["2"][0].done);

// Move to Tuesday
switchDate("30.06.2026");

console.log("\nAFTER SWITCHING TO TUESDAY:");
console.log("Date:", appState.lastAccessDate);
console.log("Weight:", appState.weight);
console.log("Burned:", appState.burnedCalories);
console.log("Fitness Mon:", appState.fitnessProgram["1"][0].done);
console.log("Fitness Tue:", appState.fitnessProgram["2"][0].done);

// recalcCalories runs on Tuesday
function recalcCalories() {
    let total = 0;
    const todayDay = getTodayDayStr();
    const todayProgram = appState.fitnessProgram[todayDay];
    
    if (todayProgram) {
        todayProgram.forEach(task => {
            if (task.done) {
                total += 50;
            }
        });
    }
    appState.burnedCalories = total;
}

recalcCalories();

console.log("\nAFTER RECALC ON TUESDAY:");
console.log("Burned:", appState.burnedCalories);
