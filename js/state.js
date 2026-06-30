import { db } from './firebase.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export let appState = {
    lastAccessDate: new Date().toLocaleDateString('tr-TR'),
    consumedCalories: 0,
    consumedProtein: 0,
    consumedCarbs: 0,
    consumedFat: 0,
    burnedCalories: 0,
    calorieGoal: 2000,
    macroGoals: { protein: 150, carbs: 200, fat: 60 },
    weight: 99.5,
    targetWeight: 85.0,
    waterIntake: 0,
    meals: [], // Bugüne ait yenen yemekler listesi
    customVitamins: [
        { id: "vit_1", name: "D Vitamini (Kahvaltı Sonrası)", checked: false },
        { id: "vit_2", name: "Omega 3 (Tok Karnına)", checked: false }
    ],
    weightHistory: [], // Grafik için kaba kilo geçmişi
    history: [], // Tüm detaylı gün arşivi
    calendar: {}, // Tarih bazlı ajanda kayıtları
    fitnessProgram: null, // AI tarafından oluşturulan haftalık program { "1": [...], "3": [...] }
    
    // Profil Ayarları
    name: 'Kullanıcı',
    age: 25,
    height: 180,
    gender: 'male', // 'male' veya 'female'
    activityLevel: 1.2, // 1.2, 1.375, 1.55, 1.725
    goal: 'lose', // 'lose', 'maintain', 'gain'
    waterGoal: 3000,
    calorieAdjustment: -500, // Varsayılan olarak 500 kcal açık
    sleepHours: 0
};

export async function loadState() {
    const savedState = localStorage.getItem('lifeOsState');
    if (savedState) {
        appState = { ...appState, ...JSON.parse(savedState) };
    }
    
    try {
        const docRef = doc(db, "users", "my_life_os");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            appState = { ...appState, ...docSnap.data() };
            localStorage.setItem('lifeOsState', JSON.stringify(appState));
        }
    } catch(e) {
        console.error("Firebase yükleme hatası:", e);
    }

    if (!appState.lastAccessDate) {
        appState.lastAccessDate = new Date().toLocaleDateString('tr-TR');
        saveState();
    }
}

export function saveState() {
    localStorage.setItem('lifeOsState', JSON.stringify(appState));
    window.dispatchEvent(new Event('stateUpdated'));
    
    try {
        const docRef = doc(db, "users", "my_life_os");
        return setDoc(docRef, appState).catch(e => console.error("Firebase yazma hatası:", e));
    } catch (e) {
        console.error("Firebase senkronizasyon hatası:", e);
        return Promise.resolve();
    }
}

export function endDay() {
    let nextDateStr;
    const parts = appState.lastAccessDate.split('.');
    
    if(parts.length === 3) {
        const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        d.setDate(d.getDate() + 1);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        nextDateStr = `${dd}.${mm}.${yyyy}`;
    } else {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        nextDateStr = `${dd}.${mm}.${yyyy}`;
    }

    // switchDate already calls saveActiveToHistory() and sets up the new date
    return switchDate(nextDateStr);
}

export function saveActiveToHistory() {
    if(!appState.history) appState.history = [];
    
    const archive = {
        date: appState.lastAccessDate,
        weight: appState.weight,
        waterIntake: appState.waterIntake,
        sleepHours: appState.sleepHours || 0,
        consumedCalories: appState.consumedCalories,
        burnedCalories: appState.burnedCalories,
        macros: {
            protein: appState.consumedProtein,
            carbs: appState.consumedCarbs,
            fat: appState.consumedFat
        },
        meals: [...(appState.meals || [])],
        vitamins: appState.customVitamins ? appState.customVitamins.map(v => ({...v})) : []
    };

    const existingIndex = appState.history.findIndex(h => h.date === appState.lastAccessDate);
    if (existingIndex >= 0) {
        appState.history[existingIndex] = archive;
    } else {
        appState.history.unshift(archive);
    }
}

export async function switchDate(newDateStr) {
    // 1. Önce şu anki aktif veriyi kendi tarihine (lastAccessDate) kaydet
    saveActiveToHistory();

    // 2. Yeni tarihi ayarla
    appState.lastAccessDate = newDateStr;

    // 3. Yeni tarihin verilerini geçmişten bul
    const existing = appState.history.find(h => h.date === newDateStr);

    if (existing) {
        appState.waterIntake = existing.waterIntake || 0;
        appState.sleepHours = existing.sleepHours || 0;
        appState.consumedCalories = existing.consumedCalories || 0;
        appState.burnedCalories = existing.burnedCalories || 0;
        appState.consumedProtein = existing.macros?.protein || 0;
        appState.consumedCarbs = existing.macros?.carbs || 0;
        appState.consumedFat = existing.macros?.fat || 0;
        appState.meals = existing.meals ? [...existing.meals] : [];
        
        if (existing.vitamins) {
            appState.customVitamins = existing.vitamins.map(v => ({...v}));
        } else {
            if(appState.customVitamins) appState.customVitamins.forEach(v => v.checked = false);
        }

        // Daima geçmişe veya yeni güne giderken o günün tiklerini tazelemek için checkboxları sıfırlıyoruz.
        // Burned calories zaten history'den geldiği için kalori kaybolmuyor, sadece arayüzde o gün spora sıfırdan başlanmış gibi oluyor.
        if (appState.fitnessProgram) {
            Object.keys(appState.fitnessProgram).forEach(dayKey => {
                appState.fitnessProgram[dayKey].forEach(task => task.done = false);
            });
        }

        return saveState();
    } else {
        // Yoksa sıfırla
        appState.waterIntake = 0;
        appState.sleepHours = 0;
        appState.consumedCalories = 0;
        appState.burnedCalories = 0;
        appState.consumedProtein = 0;
        appState.consumedCarbs = 0;
        appState.consumedFat = 0;
        appState.meals = [];
        if (appState.customVitamins) {
            appState.customVitamins.forEach(v => v.checked = false);
        }

        // Fitness checkboxlarını da sıfırla
        if (appState.fitnessProgram) {
            Object.keys(appState.fitnessProgram).forEach(dayKey => {
                appState.fitnessProgram[dayKey].forEach(task => task.done = false);
            });
        }
        
        return saveState();
    }

    console.log("Tarih değiştirildi:", newDateStr);

    // Uyarı göster (Eğer geçmiş bir tarih seçildiyse)
    const parts = newDateStr.split('.');
    if(parts.length === 3) {
        const selected = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        const today = new Date();
        today.setHours(0,0,0,0);
        selected.setHours(0,0,0,0);
        if (selected < today) {
            alert(`Dikkat: Şu an geçmiş bir tarihi (${newDateStr}) görüntülüyor veya düzenliyorsunuz! Girdiğiniz veriler bu güne eklenecektir.`);
        }
    }
}
