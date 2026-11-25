/**
 * LML-MED Defi-Game (Reanimations-EKG Trainer)
 * Procedurally generates randomized EKG rhythms with realistic morphology.
 */
document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('open-defi-game-btn');
    const closeBtn = document.getElementById('close-defi-game-btn');
    const gameSection = document.getElementById('defi-game-section');
    const startBtn = document.getElementById('defi-start-btn');
    const retryBtn = document.getElementById('defi-retry-btn');
    const shockBtn = document.getElementById('defi-shock-btn');
    const noShockBtn = document.getElementById('defi-noshock-btn');

    const startOverlay = document.getElementById('defi-start-overlay');
    const gameoverOverlay = document.getElementById('defi-gameover-overlay');
    const canvas = document.getElementById('defi-canvas');
    const pulseBadge = document.getElementById('defi-pulse-badge');
    const feedbackBanner = document.getElementById('defi-feedback');
    const timerBar = document.getElementById('defi-timer-bar');
    const timerText = document.getElementById('defi-timer-text');
    const scoreEl = document.getElementById('defi-score');
    const shocksEl = document.getElementById('defi-shocks');
    const roundLabelEl = document.getElementById('defi-round-label');

    if (!openBtn || !gameSection || !canvas) return;
    const ctx = canvas.getContext('2d');

    // ── Clinical Rhythm Catalog ──
    const RHYTHMS = [
        {
            id: 'vf_coarse',
            name: 'Kammerflimmern (grobschlägig)',
            pulseless: true,
            shockable: true,
            weight: 1.4,
            note: 'Grobschlägiges Kammerflimmern (VF) → Sofort defibrillieren, danach unmittelbar weiter drücken.'
        },
        {
            id: 'vf_fine',
            name: 'Kammerflimmern (feinschlägig)',
            pulseless: true,
            shockable: true,
            weight: 1.2,
            note: 'Feinschlägiges Kammerflimmern (VF) → Schockbar! Genau hinsehen, nicht mit Asystolie verwechseln.'
        },
        {
            id: 'vf_ultrafine',
            name: 'Kammerflimmern (ultrafein)',
            pulseless: true,
            shockable: true,
            weight: 1.1,
            note: 'Ultrafeines Kammerflimmern → Auch sehr feine Flimmerwellen sind schockbar (im Zweifel Kabel/Verstärkung prüfen).'
        },
        {
            id: 'vf_ultracoarse',
            name: 'Kammerflimmern (ultragrob)',
            pulseless: true,
            shockable: true,
            weight: 1.0,
            note: 'Ultragrobes Kammerflimmern → Sofortige Defibrillation indiziert.'
        },
        {
            id: 'pvt',
            name: 'Pulslose Ventrikuläre Tachykardie (pVT)',
            pulseless: true,
            shockable: true,
            weight: 1.4,
            note: 'pVT → Kreislaufstillstand mit schneller Kammererregung: defibrillieren, sofort weiter drücken, Amiodaron/Adrenalin nach Algorithmus.'
        },
        {
            id: 'tdp_pulseless',
            name: 'Torsades de pointes (pulslos)',
            pulseless: true,
            shockable: true,
            weight: 1.1,
            note: 'Pulslose Torsades de pointes → Defibrillieren + Magnesium; Amiodaron bei QT-Verlängerung meiden.'
        },
        {
            id: 'asystole',
            name: 'Asystolie',
            pulseless: true,
            shockable: false,
            weight: 1.2,
            note: 'Asystolie → Nicht schockbar! CPR fortführen, früh Adrenalin (1 mg), reversible Ursachen (4 Hs & HITS) suchen.'
        },
        {
            id: 'p_wave_asystole',
            name: 'P-Wellen-Asystolie',
            pulseless: true,
            shockable: false,
            weight: 1.0,
            note: 'P-Wellen-Asystolie → Nur P-Wellen ohne QRS-Antwort. Nicht schocken! Reanimation & Adrenalin (ggf. Pacing prüfen).'
        },
        {
            id: 'sr_pulse',
            name: 'Sinusrhythmus (mit Puls)',
            pulseless: false,
            shockable: false,
            weight: 1.1,
            note: 'Sinusrhythmus mit Puls → Kreislauf vorhanden (kein Arrest / ROSC). Niemals defibrillieren!'
        },
        {
            id: 'sr_pea',
            name: 'Sinusrhythmus ohne Puls (PEA)',
            pulseless: true,
            shockable: false,
            weight: 1.2,
            note: 'Organisierter Rhythmus ohne Puls = PEA → Nicht schockbar! Weiter reanimieren, Adrenalin & 4 Hs / HITS abklären.'
        },
        {
            id: 'vt_pulse',
            name: 'VT mit Puls',
            pulseless: false,
            shockable: false,
            weight: 1.1,
            note: 'VT mit Puls → Kein Kreislaufstillstand! Kein un­synchronisierter Reanimations-Schock (bei Instabilität synchronisierte Kardioversion).'
        },
        {
            id: 'tdp_pulse',
            name: 'Torsades de pointes (mit Puls)',
            pulseless: false,
            shockable: false,
            weight: 0.9,
            note: 'Torsades de pointes mit Puls → Kein Reanimations-Schock! Magnesium i.v. / Pacing; bei Instabilität synchronisierte Kardioversion.'
        },
        {
            id: 'svt_pulse',
            name: 'Supraventrikuläre Tachykardie (SVT)',
            pulseless: false,
            shockable: false,
            weight: 1.0,
            note: 'SVT mit Puls → Schmaler QRS-Komplex mit Puls. Nicht defibrillieren (Vagusmanöver / Adenosin / ggf. Kardioversion).'
        }
    ];

    // ── Procedural Parameters per Round ──
    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    function createRoundParams(rhythm) {
        const polarity = Math.random() < 0.5 ? 1 : -1;
        return {
            bpm: rhythm.id === 'svt_pulse' ? rand(165, 215)
                : (rhythm.id === 'pvt' || rhythm.id === 'vt_pulse') ? rand(150, 225)
                : (rhythm.id === 'sr_pulse' || rhythm.id === 'sr_pea') ? rand(58, 98)
                : rand(55, 82),
            polarity,
            morphSkew: rand(-0.45, 0.45),
            morphHarmonic: rand(0.12, 0.42),
            spindleFreq: rand(0.45, 0.85),
            vfFreqs: [rand(5.5, 8.2), rand(9.0, 12.8), rand(14.0, 19.5), rand(3.8, 5.2)],
            vfPhases: [rand(0, 6.28), rand(0, 6.28), rand(0, 6.28), rand(0, 6.28)],
            vfAmp: rhythm.id === 'vf_ultrafine' ? rand(0.065, 0.105)
                : rhythm.id === 'vf_fine' ? rand(0.16, 0.27)
                : rhythm.id === 'vf_coarse' ? rand(0.55, 0.88)
                : rand(0.92, 1.25),
            baselineDriftPhase: rand(0, 6.28)
        };
    }

    function gauss(u, center, width) {
        const z = (u - center) / width;
        return Math.exp(-z * z);
    }

    function sampleDefiWaveform(t, rhythm, p) {
        const drift = 0.015 * Math.sin(t * 0.9 + p.baselineDriftPhase);
        switch (rhythm.id) {
            case 'asystole':
                return drift * 0.4 + (Math.random() - 0.5) * 0.008;

            case 'p_wave_asystole': {
                const period = 60 / p.bpm;
                const u = (t % period) / period;
                return drift * 0.4 + 0.16 * gauss(u, 0.25, 0.032) + (Math.random() - 0.5) * 0.008;
            }

            case 'sr_pulse':
            case 'sr_pea': {
                const period = 60 / p.bpm;
                const u = (t % period) / period;
                let v = 0;
                v += 0.14 * gauss(u, 0.12, 0.024);
                v -= 0.11 * gauss(u, 0.225, 0.008);
                v += 0.95 * gauss(u, 0.25, 0.011);
                v -= 0.24 * gauss(u, 0.275, 0.01);
                v += 0.28 * gauss(u, 0.44, 0.042);
                return v + drift;
            }

            case 'svt_pulse': {
                const period = 60 / p.bpm;
                const u = (t % period) / period;
                let v = 0;
                v -= 0.1 * gauss(u, 0.22, 0.014);
                v += 0.92 * gauss(u, 0.26, 0.016); // sharp narrow QRS
                v -= 0.22 * gauss(u, 0.30, 0.016);
                v += 0.2 * gauss(u, 0.58, 0.07);   // merged T
                return v + drift;
            }

            case 'pvt':
            case 'vt_pulse': {
                const period = 60 / p.bpm;
                const u = (t % period) / period;
                const base = Math.sin(u * 2 * Math.PI)
                    + p.morphHarmonic * Math.sin(u * 4 * Math.PI + p.morphSkew)
                    + 0.12 * Math.cos(u * 6 * Math.PI);
                return p.polarity * 0.78 * base + drift;
            }

            case 'tdp_pulseless':
            case 'tdp_pulse': {
                const period = 60 / rand(185, 220);
                const fastFreq = 3.4;
                const spindle = 0.22 + 0.78 * Math.abs(Math.sin(t * Math.PI * p.spindleFreq));
                const axisShift = Math.sin(t * Math.PI * p.spindleFreq * 0.5);
                const wave = Math.sin(t * 2 * Math.PI * fastFreq + 0.5 * axisShift)
                    + 0.25 * Math.sin(t * 2 * Math.PI * fastFreq * 2);
                return spindle * 0.78 * wave + drift;
            }

            case 'vf_coarse':
            case 'vf_fine':
            case 'vf_ultrafine':
            case 'vf_ultracoarse': {
                const [f1, f2, f3, f4] = p.vfFreqs;
                const [ph1, ph2, ph3, ph4] = p.vfPhases;
                const raw =
                    0.42 * Math.sin(t * 2 * Math.PI * f1 + ph1) +
                    0.28 * Math.sin(t * 2 * Math.PI * f2 + ph2) +
                    0.18 * Math.sin(t * 2 * Math.PI * f3 + ph3) +
                    0.12 * Math.cos(t * 2 * Math.PI * f4 + ph4);
                const mod = 0.72 + 0.28 * Math.sin(t * 2.3 + ph1);
                return p.vfAmp * raw * mod;
            }
            default:
                return 0;
        }
    }

    // ── Game State ──
    let state = 'idle'; // idle | playing | transition | gameover
    let currentRhythm = null;
    let currentParams = null;
    let roundStartTime = 0;
    let roundCount = 0;
    let shockCount = 0;
    let shockTimes = [];
    let animId = null;
    let nonShockTimer = null;
    let transitionTimer = null;

    const NON_SHOCK_WINDOW_MS = 2700;

    function pickNextRhythm(prevId) {
        const pool = RHYTHMS.filter(r => r.id !== prevId);
        const totalW = pool.reduce((sum, r) => sum + r.weight, 0);
        let roll = Math.random() * totalW;
        for (const r of pool) {
            roll -= r.weight;
            if (roll <= 0) return r;
        }
        return pool[0];
    }

    function resizeDefiCanvas() {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(300, rect.width) * dpr;
        canvas.height = Math.max(180, rect.height) * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawDefiGrid(w, h) {
        ctx.fillStyle = '#040911';
        ctx.fillRect(0, 0, w, h);

        // Subtle medical EKG paper grid
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.08)';
        ctx.lineWidth = 1;
        const small = 16;
        for (let x = 0; x < w; x += small) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += small) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(34, 197, 94, 0.18)';
        const big = small * 5;
        for (let x = 0; x < w; x += big) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += big) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }

    // ── Continuous Scrolling Monitor Render ──
    let traceBuffer = [];
    let simT = 0;
    let lastFrame = 0;

    function renderLoop(now) {
        if (state !== 'playing' && state !== 'transition') return;
        const dt = Math.min(0.05, (now - lastFrame) / 1000);
        lastFrame = now;

        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        const midY = h * 0.52;
        const amp = h * 0.34;

        // Advance simulation at ~180 px/s equivalent
        const samplesPerFrame = Math.max(1, Math.round(dt * 180));
        const stepDt = dt / samplesPerFrame;
        for (let i = 0; i < samplesPerFrame; i++) {
            simT += stepDt;
            const val = sampleDefiWaveform(simT, currentRhythm, currentParams);
            traceBuffer.push(midY - val * amp);
        }
        const maxPts = Math.floor(w * 0.92);
        if (traceBuffer.length > maxPts) {
            traceBuffer = traceBuffer.slice(traceBuffer.length - maxPts);
        }

        drawDefiGrid(w, h);

        // Draw glowing green trace
        if (traceBuffer.length > 1) {
            ctx.save();
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2.4;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.shadowColor = 'rgba(34, 197, 94, 0.65)';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            for (let i = 0; i < traceBuffer.length; i++) {
                const x = i;
                const y = traceBuffer[i];
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Bright leading phosphor dot
            const lastX = traceBuffer.length - 1;
            const lastY = traceBuffer[lastX];
            ctx.fillStyle = '#bbf7d0';
            ctx.beginPath();
            ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Update live reaction / countdown UI
        if (state === 'playing') {
            const elapsedMs = performance.now() - roundStartTime;
            if (currentRhythm.shockable) {
                timerText.textContent = `Reaktionszeit: ${(elapsedMs / 1000).toFixed(2)} s`;
                timerBar.style.width = '100%';
                timerBar.className = 'defi-timer-bar shockable-bar';
            } else {
                const pct = Math.max(0, 100 - (elapsedMs / NON_SHOCK_WINDOW_MS) * 100);
                timerBar.style.width = `${pct}%`;
                timerBar.className = 'defi-timer-bar';
                timerText.textContent = `Nicht schocken… ${Math.max(0, (NON_SHOCK_WINDOW_MS - elapsedMs) / 1000).toFixed(1)} s`;
            }
        }

        animId = requestAnimationFrame(renderLoop);
    }

    function showFeedback(text, isGood) {
        feedbackBanner.textContent = text;
        feedbackBanner.className = `defi-feedback ${isGood ? 'good' : 'bad'}`;
    }

    function updateHud() {
        scoreEl.textContent = String(roundCount);
        shocksEl.textContent = String(shockCount);
        roundLabelEl.textContent = `Runde ${roundCount + 1}`;
    }

    function startNextRound() {
        clearTimeout(nonShockTimer);
        clearTimeout(transitionTimer);

        currentRhythm = pickNextRhythm(currentRhythm?.id);
        currentParams = createRoundParams(currentRhythm);
        state = 'playing';
        roundStartTime = performance.now();
        traceBuffer = [];
        feedbackBanner.className = 'defi-feedback hidden';

        // Red pulse status badge as requested
        pulseBadge.textContent = currentRhythm.pulseless ? 'PULSLOS' : 'MIT PULS';
        pulseBadge.className = 'defi-pulse-badge';

        updateHud();

        // Pre-fill 1.4 seconds of trace so the user can read the rhythm immediately
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        const prePts = Math.min(Math.floor(w * 0.45), 240);
        for (let i = 0; i < prePts; i++) {
            simT += 1 / 180;
            const val = sampleDefiWaveform(simT, currentRhythm, currentParams);
            traceBuffer.push(h * 0.52 - val * h * 0.34);
        }

        if (!currentRhythm.shockable) {
            nonShockTimer = setTimeout(() => {
                if (state !== 'playing') return;
                handleNonShockSurvived();
            }, NON_SHOCK_WINDOW_MS);
        }
    }

    function handleNonShockSurvived() {
        state = 'transition';
        roundCount += 1;
        showFeedback(`✅ Richtig nicht geschockt! (${currentRhythm.name})`, true);
        updateHud();
        transitionTimer = setTimeout(startNextRound, 950);
    }

    function triggerShock() {
        if (state !== 'playing') return;
        clearTimeout(nonShockTimer);

        const reactionMs = performance.now() - roundStartTime;

        if (currentRhythm.shockable) {
            state = 'transition';
            roundCount += 1;
            shockCount += 1;
            shockTimes.push(reactionMs);
            updateHud();
            showFeedback(
                `⚡ SCHOCK INDIZIERT! (${(reactionMs / 1000).toFixed(2)} s) – ${currentRhythm.name}`,
                true
            );
            transitionTimer = setTimeout(startNextRound, 1100);
        } else {
            endGame(
                `❌ UNNÖTIGER SCHOCK bei "${currentRhythm.name}"!`,
                currentRhythm.note
            );
        }
    }

    function skipNonShockable() {
        if (state !== 'playing') return;
        if (!currentRhythm.shockable) {
            clearTimeout(nonShockTimer);
            handleNonShockSurvived();
        } else {
            endGame(
                `❌ KEIN SCHOCK bei "${currentRhythm.name}" gedrückt!`,
                currentRhythm.note
            );
        }
    }

    function endGame(headline, explanation) {
        state = 'gameover';
        clearTimeout(nonShockTimer);
        clearTimeout(transitionTimer);
        cancelAnimationFrame(animId);

        const avgMs = shockTimes.length
            ? shockTimes.reduce((a, b) => a + b, 0) / shockTimes.length
            : null;
        const bestMs = shockTimes.length ? Math.min(...shockTimes) : null;

        // Save personal bests
        const prevBestStreak = Number(localStorage.getItem('lml_defi_best_streak') || 0);
        if (roundCount > prevBestStreak) {
            localStorage.setItem('lml_defi_best_streak', String(roundCount));
        }

        document.getElementById('defi-go-title').textContent = headline;
        document.getElementById('defi-go-note').textContent = explanation;
        document.getElementById('defi-stat-rounds').textContent = String(roundCount);
        document.getElementById('defi-stat-shocks').textContent = String(shockCount);
        document.getElementById('defi-stat-avg').textContent = avgMs !== null ? `${(avgMs / 1000).toFixed(2)} s` : '—';
        document.getElementById('defi-stat-best').textContent = bestMs !== null ? `${(bestMs / 1000).toFixed(2)} s` : '—';

        gameoverOverlay.classList.remove('hidden');
    }

    function startNewGame() {
        roundCount = 0;
        shockCount = 0;
        shockTimes = [];
        currentRhythm = null;
        simT = 0;
        startOverlay.classList.add('hidden');
        gameoverOverlay.classList.add('hidden');
        resizeDefiCanvas();
        startNextRound();
        lastFrame = performance.now();
        cancelAnimationFrame(animId);
        animId = requestAnimationFrame(renderLoop);
    }

    // ── Event Listeners ──
    openBtn.addEventListener('click', () => {
        gameSection.classList.remove('hidden');
        resizeDefiCanvas();
        drawDefiGrid(canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height);
        gameSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            state = 'idle';
            clearTimeout(nonShockTimer);
            clearTimeout(transitionTimer);
            cancelAnimationFrame(animId);
            gameSection.classList.add('hidden');
        });
    }

    startBtn.addEventListener('click', startNewGame);
    retryBtn.addEventListener('click', startNewGame);
    shockBtn.addEventListener('click', triggerShock);
    if (noShockBtn) noShockBtn.addEventListener('click', skipNonShockable);

    // Spacebar triggers Shock when game is active (prevent page scroll!)
    document.addEventListener('keydown', (e) => {
        if (gameSection.classList.contains('hidden')) return;
        const cmdOpen = document.getElementById('cmd-overlay')?.classList.contains('open');
        if (cmdOpen) return;

        if (e.code === 'Space') {
            e.preventDefault();
            if (state === 'playing') triggerShock();
            else if (state === 'idle' && !startOverlay.classList.contains('hidden')) startNewGame();
            else if (state === 'gameover') startNewGame();
        } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') {
            if (state === 'playing') skipNonShockable();
        }
    });

    window.addEventListener('resize', () => {
        if (!gameSection.classList.contains('hidden')) {
            resizeDefiCanvas();
        }
    });
});
