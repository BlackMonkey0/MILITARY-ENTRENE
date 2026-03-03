/**
 * MILITARY_OS - CORE LOGIC v2.5 "BATTLE-READY"
 * Arquitectura: Reactive State-Driven Engine with Bio-Feedback
 */

const State = {
    user: {
        name: "DIEGO",
        rank: "RECLUTA",
        weight: 56,
        height: 170,
        age: 26,
        baseCalories: 2800,
        targets: { p: 112, ch: 395, f: 60 },
        currentMode: 'NORMAL' 
    },
    daily: {
        reps: 0,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        water: 0, // Nueva métrica
        history: [],
        nutritionHistory: [],   // store daily totals for chart
        weightHistory: [],
        lastUpdate: new Date().toLocaleDateString(),
        missionGoal: 150, // Objetivo de la misión diaria
        isMissionComplete: false
    },
    tempOCR: null,
    bodyStats: {
        weight: null,
        bmi: null,
        fat: null,
        water: null,
        muscle: null,
        bone: null
    }
};

// No backend API is used in the static-only version of the project.
// All network-related code has been removed or disabled.
const API = { enabled: false }; // placeholder

const IAMilitary = {
    messages: {
        NORMAL: ["Sigue así, soldado.", "Registro completado.", "Mantén el ritmo."],
        ESTRICTO: ["La disciplina es libertad.", "No negocies con tu mente.", "Objetivo a la vista."],
        MILITAR_AGRESIVO: ["¡EL DOLOR ES TEMPORAL!", "¡UN CADÁVER HACE MÁS REPS QUE TÚ!", "¡SANGRE Y SUDOR!"]
    },
    
    getFeedback() {
        const msgs = this.messages[State.user.currentMode];
        return msgs[Math.floor(Math.random() * msgs.length)];
    },

    processExercise(qty) {
        let finalQty = qty;
        let bonusMsg = "REPETICIONES ACEPTADAS.";
        if (State.user.currentMode === 'MILITAR_AGRESIVO') {
            const extra = Math.ceil(qty * 0.25);
            finalQty += extra;
            bonusMsg = `IA TÁCTICA FORZÓ +${extra} REPS.`;
        }
        return { actual: finalQty, msg: bonusMsg };
    },

    analyzeNutrition() {
        if (State.daily.calories > State.user.baseCalories) return "OBJETIVO CALÓRICO ALCANZADO. INICIANDO ANABOLISMO.";
        if (State.daily.protein < State.user.targets.p * 0.5) return "ADVERTENCIA: INGESTA PROTEICA INSUFICIENTE.";
        return "PROCESANDO NUTRIENTES... MANTEN EL SUPERÁVIT.";
    }
};

// --- NAVEGACIÓN DE PÁGINAS ---
function switchPage(pageId, elem) {
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if (elem) elem.classList.add('active');
    if (pageId === 'progress') {
        renderChart();
        renderNutritionChart();
        renderBodyChart();
    }
    updateUI();
}

// --- NUEVAS FUNCIONES DE INTERACCIÓN ---

function drinkWater() {
    State.daily.water += 250;
    logToConsole(`HIDRATACIÓN: +250ML REGISTRADOS. TOTAL: ${State.daily.water}ML`);
    saveToDisk();
    renderUI();
    // sin backend en modo estático
}

function updateBodyStats() {
    const w = parseFloat(document.getElementById('input-weight').value) || null;
    const bmi = parseFloat(document.getElementById('input-bmi').value) || null;
    const fat = parseFloat(document.getElementById('input-fat').value) || null;
    const water = parseFloat(document.getElementById('input-water').value) || null;
    const muscle = parseFloat(document.getElementById('input-muscle').value) || null;
    const bone = parseFloat(document.getElementById('input-bone').value) || null;
    State.bodyStats = { weight: w, bmi, fat, water, muscle, bone };
    // push into history arrays
    const today = new Date().toLocaleDateString();
    if (w !== null) State.daily.weightHistory.push({ date: today, value: w });
    saveToDisk();
    renderBodyChart();
    logToConsole('Estado físico actualizado.');
    // sin backend en modo estático
}

function saveSettings() {
    const cal = parseInt(document.getElementById('input-goal-cal').value) || State.user.baseCalories;
    const p = parseInt(document.getElementById('input-goal-prot').value) || State.user.targets.p;
    const ch = parseInt(document.getElementById('input-goal-ch').value) || State.user.targets.ch;
    const f = parseInt(document.getElementById('input-goal-fat').value) || State.user.targets.f;
    const mission = parseInt(document.getElementById('input-mission-goal').value) || State.daily.missionGoal;
    State.user.baseCalories = cal;
    State.user.targets = { p, ch, f };
    State.daily.missionGoal = mission;
    saveToDisk();
    updateUI();
    logToConsole('Objetivos actualizados.');
}

function downloadData() {
    const dataStr = JSON.stringify(State, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'military_os_data.json';
    a.click();
    URL.revokeObjectURL(url);
}



function checkMissionStatus() {
    if (!State.daily.isMissionComplete && State.daily.reps >= State.daily.missionGoal) {
        State.daily.isMissionComplete = true;
        logToConsole("¡MISIÓN DIARIA COMPLETADA! RANGO INCREMENTADO.");
        document.getElementById('mission-card').style.borderColor = "var(--mil-green)";
        // Efecto visual de parpadeo
        document.body.style.animation = "scanline 0.2s 3";
    }
}

// --- CORE FUNCTIONS ---

function registerExercise() {
    const type = document.getElementById('ex-type').value;
    const inputQty = parseInt(document.getElementById('ex-qty').value);
    if (isNaN(inputQty) || inputQty <= 0) return;

    const result = IAMilitary.processExercise(inputQty);
    State.daily.reps += result.actual;
    
    const entry = {
        id: Date.now(),
        type: type,
        qty: result.actual,
        time: new Date().toLocaleTimeString().slice(0, 5)
    };
    State.daily.history.push(entry);
    
    logToConsole(result.msg);
    logToConsole(`IA: "${IAMilitary.getFeedback()}"`);
    
    checkMissionStatus();
    saveToDisk();
    renderUI();

    // sin backend en modo estático
}

function addFood() {
    if (!State.tempOCR) return logToConsole("ERROR: ESCANEE ALIMENTO PRIMERO.");
    
    const added = { cal: State.tempOCR.cal, p: State.tempOCR.p, ch: State.tempOCR.ch, f: State.tempOCR.f };
    State.daily.calories += added.cal;
    State.daily.protein += added.p;
    State.daily.carbs += added.ch;
    State.daily.fats += added.f;
    // push snapshot for nutrition chart
    State.daily.nutritionHistory.push({
        date: new Date().toLocaleDateString(),
        calories: State.daily.calories,
        protein: State.daily.protein,
        carbs: State.daily.carbs,
        fats: State.daily.fats
    });
    
    logToConsole(`INGESTA: +${added.cal} KCAL. ${IAMilitary.analyzeNutrition()}`);
    State.tempOCR = null;
    
    saveToDisk();
    renderUI();

    // sin backend en modo estático
}

// --- MOTOR DE RENDERIZADO (REDISEÑADO) ---

function renderUI() {    // 0. Nav / header info
    const navRank = document.getElementById('nav-rank');
    if(navRank) navRank.innerText = calculateRank();
    document.getElementById('user-weight').innerText = State.user.weight + 'KG';
    document.getElementById('user-height').innerText = State.user.height + 'CM';
    document.getElementById('user-cal').innerText = State.user.baseCalories + ' KCAL';


    // populate body stat inputs and summary if present
    if (State.bodyStats) {
        const summary = document.getElementById('body-summary');
        if(summary) {
            summary.textContent = `Peso:${State.bodyStats.weight||'-'} | BMI:${State.bodyStats.bmi||'-'} | Grasa:${State.bodyStats.fat||'-'}%`;
        }
        ['weight','bmi','fat','water','muscle','bone'].forEach(key=>{
            const inp=document.getElementById('input-'+key);
            if(inp && State.bodyStats[key] !== null) inp.value = State.bodyStats[key];
        });
    }
    // populate goal inputs
    const goalCal = document.getElementById('input-goal-cal');
    if(goalCal) goalCal.value = State.user.baseCalories;
    const goalProt = document.getElementById('input-goal-prot');
    if(goalProt) goalProt.value = State.user.targets.p;
    const goalCh = document.getElementById('input-goal-ch');
    if(goalCh) goalCh.value = State.user.targets.ch;
    const goalFat = document.getElementById('input-goal-fat');
    if(goalFat) goalFat.value = State.user.targets.f;
    const goalMission = document.getElementById('input-mission-goal');
    if(goalMission) goalMission.value = State.daily.missionGoal;
    // 1. Stats Numéricos
    const updates = {
        'dash-reps': State.daily.reps,
        'dash-cal': State.daily.calories,
        'dash-prot': State.daily.protein,
        'dash-ch': State.daily.carbs,
        'dash-water': State.daily.water + "ML",
        'dash-rank': calculateRank()
    };

    for (let id in updates) {
        const el = document.getElementById(id);
        if (el) el.innerText = updates[id];
    }

    // 2. Biometría (Barras dinámicas)
    // Glucógeno: Sube con carbs, baja con reps
    const glycoPerc = Math.min(Math.max(20 + (State.daily.carbs / 4) - (State.daily.reps / 2), 10), 100);
    const glycoBar = document.getElementById('glyco-bar');
    if (glycoBar) glycoBar.style.width = glycoPerc + "%";

    // Hidratación: 3000ml objetivo
    const hydroPerc = Math.min((State.daily.water / 3000) * 100, 100);
    const hydroBar = document.getElementById('hydro-bar');
    if (hydroBar) hydroBar.style.width = hydroPerc + "%";

    // 3. Misión Diaria
    const missionStatus = document.getElementById('mission-status');
    if (missionStatus) {
        missionStatus.innerText = State.daily.isMissionComplete ? 
            "OPERACIÓN COMPLETADA" : 
            `PROGRESO: ${State.daily.reps} / ${State.daily.missionGoal} REPS`;
    }

    // 4. Barras de Macros
    updateProgressBar('cal-bar', State.daily.calories, State.user.baseCalories);
    updateProgressBar('prot-bar', State.daily.protein, State.user.targets.p);

    // 5. Historial
    const list = document.getElementById('training-list');
    if (list) {
        list.innerHTML = State.daily.history.slice(-4).reverse()
            .map(h => `<div class="ia-log-entry log-entry-white">${h.time} | ${h.type} x${h.qty}</div>`)
            .join('');
    }
    // render ancillary charts when viewing progress
    if(document.getElementById('progress').classList.contains('active')) {
        renderNutritionChart();
        renderBodyChart();
    }
}

// --- GRÁFICOS ADICIONALES ---
function renderChart() {
    const ctx = document.getElementById('repsChart').getContext('2d');
    if (State.repChart) State.repChart.destroy();
    const labels = State.daily.history.map(h=>h.time);
    const data = State.daily.history.map(h=>h.qty);
    State.repChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length? labels : ['LU','MA','MI','JU','VI','SA','DO'],
            datasets: [{
                label: 'REPETICIONES',
                data: data.length? data : [15,20,30,25,40,10,5],
                borderColor: '#4ade80',
                backgroundColor: 'rgba(74, 222, 128, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            scales: { y: { beginAtZero: true, grid: { color: '#1a1a1a' } }, x: { grid: { display: false } } },
            plugins: { legend: { display: false } }
        }
    });
}

function renderNutritionChart() {
    const ctx = document.getElementById('nutritionChart');
    if(!ctx) return;
    const ctx2 = ctx.getContext('2d');
    if (State.nutChart) State.nutChart.destroy();
    const hist = State.daily.nutritionHistory;
    const labels = hist.map(h=>h.date);
    const calories = hist.map(h=>h.calories);
    const proteins = hist.map(h=>h.protein);
    const carbs = hist.map(h=>h.carbs);
    const fats = hist.map(h=>h.fats);
    State.nutChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Calorías totales',
                    data: calories,
                    backgroundColor: 'rgba(240, 86, 86,0.6)'
                },
                {
                    label: 'Proteína (g)',
                    data: proteins,
                    backgroundColor: 'rgba(59, 130, 246,0.6)'
                },
                {
                    label: 'Carbs (g)',
                    data: carbs,
                    backgroundColor: 'rgba(245, 158, 11,0.6)'
                },
                {
                    label: 'Grasas (g)',
                    data: fats,
                    backgroundColor: 'rgba(239, 68, 68,0.6)'
                }
            ]
        },
        options: { scales:{y:{beginAtZero:true}} }
    });
}

function renderBodyChart() {
    const ctx = document.getElementById('bodyChart');
    if(!ctx) return;
    const ctx2 = ctx.getContext('2d');
    if (State.bodyChart) State.bodyChart.destroy();
    const stats = State.bodyStats;
    const labels = ['Peso','BMI','Grasa','Agua','Masa musc','Masa ósea'];
    const data = [stats.weight, stats.bmi, stats.fat, stats.water, stats.muscle, stats.bone];
    State.bodyChart = new Chart(ctx2, {
        type: 'radar',
        data: { labels, datasets:[{ label:'Estado físico', data, backgroundColor:'rgba(30,144,255,0.2)', borderColor:'#1e90ff' }] },
        options: { scales:{r:{beginAtZero:true}} }
    });
}

function calculateRank() {
    const totalScore = State.daily.reps + (State.daily.calories / 100);
    if (totalScore > 1000) return "COMANDANTE";
    if (totalScore > 500) return "SARGENTO";
    if (totalScore > 200) return "SOLDADO";
    return "RECLUTA";
}

function updateProgressBar(id, current, target) {
    const el = document.getElementById(id);
    if (el) {
        const perc = Math.min((current / target) * 100, 100);
        el.style.width = perc + "%";
    }
}

// --- PERSISTENCIA ---

function saveToDisk() {
    localStorage.setItem('MILITARY_OS_DATA', JSON.stringify(State));
}

function loadFromDisk() {
    const saved = localStorage.getItem('MILITARY_OS_DATA');
    if (saved) {
        const parsed = JSON.parse(saved);
        // ensure new structures exist
        parsed.daily = parsed.daily || {};
        parsed.daily.nutritionHistory = parsed.daily.nutritionHistory || [];
        parsed.daily.weightHistory = parsed.daily.weightHistory || [];
        parsed.bodyStats = parsed.bodyStats || { weight:null,bmi:null,fat:null,water:null,muscle:null,bone:null };
        if (parsed.daily.lastUpdate !== new Date().toLocaleDateString()) {
            // Reset diario manteniendo configuración de usuario
            parsed.daily = { ...State.daily, lastUpdate: new Date().toLocaleDateString() };
        }
        Object.assign(State, parsed);
    }
}

function logToConsole(msg) {
    const log = document.getElementById('ia-log');
    if (log) {
        const div = document.createElement('div');
        div.className = 'ia-log-entry';
        div.innerHTML = `> [${new Date().toLocaleTimeString().slice(0, 8)}] ${msg}`;
        log.prepend(div);
        if (log.childNodes.length > 15) log.lastChild.remove();
    }
}


// ARRANQUE
window.addEventListener('load', () => {
    loadFromDisk();
    renderUI();
    logToConsole("SISTEMA MILITARY_OS v2.5 ONLINE.");
});
