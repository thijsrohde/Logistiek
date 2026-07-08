/* ========================================================
   HUB.JS — Project Module Selection (Tiles)
   ======================================================== */

function renderHub() {
    const isModuleHub = !!AppState.activeDiscipline;
    
    let title = AppState.activeProject;
    let subtitle = "Selecteer een discipline om mee te werken";
    let gridHTML = '';
    let backBtnHTML = '';

    if (!isModuleHub) {
        // Discipline Selection
        const disciplines = [
            { id: 'finance',   name: 'Finance',                  icon: ICONS.activity, desc: 'Financieel overzicht en budget beheer.' },
            { id: 'eng',       name: 'Engineering',              icon: ICONS.ruler,    desc: 'Engineering documentatie en technische schema\'s.' },
            { id: 'prep',      name: 'Werkvoorbereiding',        icon: ICONS.settings, desc: 'Planning, voorbereiding en technische details.' },
            { id: 'logistics', name: 'Logistiek',                icon: ICONS.truck,    desc: 'Voorraad beheer, huur materiaal en logistieke stromen.' },
            { id: 'exec',      name: 'Uitvoering',               icon: ICONS.edit,     desc: 'Uitvoering op de bouwplaats en dagelijkse logs.' },
            { id: 'admin',     name: 'Administratie',            icon: ICONS.fileText, desc: 'Project administratie en documentatie.' }
        ];

        gridHTML = disciplines.map(d => `
            <div class="hub-tile" data-discipline="${d.id}">
                <div class="hub-tile-icon">${d.icon}</div>
                <div class="hub-tile-info">
                    <h3>${d.name}</h3>
                    <p>${d.desc}</p>
                </div>
            </div>
        `).join('');
    } else {
        // Module Selection (Currently only for Logistics)
        subtitle = "Selecteer een module om mee te werken";
        
        if (AppState.activeDiscipline === 'logistics') {
            const modules = [
                { id: 'stock',  name: 'Voorraad beheer', icon: ICONS.package, desc: 'Beheer bestellingen, leveranciers en on-site materiaal.' },
                { id: 'rental', name: 'Huur materiaal', icon: ICONS.truck,   desc: 'Volg gehuurd materiaal, kosten en huurperiodes.' }
            ];

            gridHTML = modules.map(m => `
                <div class="hub-tile" data-module="${m.id}">
                    <div class="hub-tile-icon">${m.icon}</div>
                    <div class="hub-tile-info">
                        <h3>${m.name}</h3>
                        <p>${m.desc}</p>
                    </div>
                </div>
            `).join('');
        } else {
            gridHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: var(--bg-surface); border-radius: var(--radius); border: 1px dashed var(--border);">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">${ICONS.lock}</div>
                    <h3 style="margin-bottom: 0.5rem;">Geen modules beschikbaar</h3>
                    <p style="color: var(--text-muted);">Er zijn nog geen modules geconfigureerd voor deze discipline.</p>
                </div>
            `;
        }

        backBtnHTML = `<button class="btn btn-ghost btn-sm" id="btn-back-disciplines" style="margin-right: 0.5rem;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; margin-right:4px;"><polyline points="15 18 9 12 15 6"></polyline></svg> Disciplines</button>`;
    }

    return `
    <div class="hub-page">
        <header class="content-header">
            <div class="content-header-left">
                <h1 class="hub-title" style="margin:0; font-size: 1.25rem;">${esc(title)}</h1>
                <span style="color: var(--text-muted); font-size: 0.82rem;">${subtitle}</span>
            </div>
            <div class="content-header-right">
                ${!isModuleHub ? `<button class="btn btn-primary btn-header" id="btn-new-lift">${ICONS.plus} Asset toevoegen</button>` : ''}
            </div>
        </header>

        ${!isModuleHub ? renderTimeline() : ''}

        <div class="hub-grid ${!isModuleHub ? 'hub-grid-disciplines' : ''}" style="${isModuleHub ? 'padding-top: 3rem;' : ''}">
            ${gridHTML}
        </div>
    </div>
    
    <div id="modal-root"></div>
    <div id="lightbox-root"></div>`;
}

// ── Timeline Component ───────────────────────────────────────
const PHASE_COLORS = {
    'Engineering': 'var(--accent)',
    'Montage': 'var(--green)',
    'Testen': 'var(--text-muted)'
};

function renderTimeline() {
    const currentWeek = getISOWeekNumber(new Date());
    const startWeek = currentWeek - 2; // Show 2 weeks in past
    const weekCount = 14;              // Total visible weeks
    const weeks = Array.from({length: weekCount}, (_, i) => startWeek + i);

    const projectPlans = AppState.planning.filter(p => p.projectId === AppState.activeProject);
    const liftRows = projectPlans.map(plan => {
        const lift = AppState.lifts.find(l => l.id === plan.liftId);
        return { plan, lift };
    }).filter(row => row.lift);

    // If no lifts planned yet, show empty state or just headers
    if (liftRows.length === 0) {
        return `
        <div class="tl-container">
            <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                <div style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.5;">${ICONS.calendar}</div>
                <h3>Geen planning aanwezig</h3>
                <p>Voeg een nieuwe lift toe om de tijdlijn te bekijken.</p>
            </div>
        </div>`;
    }

    // Legend (No emojis)
    const legendHTML = Object.entries(PHASE_COLORS).map(([phase, color]) => {
        return `<span class="badge" style="background: ${color}20; color: ${color}; align-items: center; gap: 8px; padding: 6px 14px; font-weight: 600; border: 1px solid ${color}30;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></div> ${phase}
         </span>`;
    }).join('') + `
        <span class="badge" style="background: #1e293b10; color: #1e293b; align-items: center; gap: 8px; padding: 6px 14px; font-weight: 600; border: 1px dashed #1e293b40;">
            <div style="width: 8px; height: 8px; border-radius: 2px; background: #1e293b;"></div> Transport
        </span>
    `;

    // Headers
    let colsHTML = `<div class="tl-cell tl-header-corner">Lifts</div>`;
    let gridLinesHTML = '';
    weeks.forEach(w => {
        const isCurrent = w === currentWeek;
        colsHTML += `<div class="tl-cell tl-header-week ${isCurrent ? 'current-week' : ''}">Wk ${w}</div>`;
        // Vertical dashed lines + background highlight for current week
        gridLinesHTML += `<div class="tl-grid-line" style="${isCurrent ? 'background: rgba(239, 68, 68, 0.04); border-right: 2px solid rgba(239, 68, 68, 0.15);' : ''}"></div>`;
    });

    // Rows
    let rowsHTML = '';
    liftRows.forEach(({plan, lift}) => {
        let allBars = plan.phases ? [...plan.phases].map((p, idx) => ({ ...p, originalIdx: idx, isTransport: false })) : [];
        
        // Add transports dynamically based on approved call-offs
        if (typeof AppState !== 'undefined' && AppState.items) {
            const transportItems = AppState.items.filter(i => 
                i.projectId === AppState.activeProject && 
                i.liftId === lift.id && 
                i.callOffStatus === 'approved' && 
                i.deliveryDate
            );
            
            const transports = {};
            transportItems.forEach(i => {
                if(!transports[i.deliveryDate]) transports[i.deliveryDate] = [];
                transports[i.deliveryDate].push(i);
            });
            
            Object.keys(transports).forEach(dateStr => {
                const wk = typeof getISOWeekNumber === 'function' ? getISOWeekNumber(new Date(dateStr)) : 1;
                allBars.push({
                    phase: 'Transport',
                    startWeek: wk,
                    durationWeeks: 1, 
                    isTransport: true,
                    deliveryDate: dateStr
                });
            });
        }
        
        // Calculate stacking lanes for overlaps
        allBars.sort((a, b) => a.startWeek - b.startWeek);
        const lanes = [];
        allBars.forEach(bar => {
            let placed = false;
            for(let i=0; i<lanes.length; i++) {
                const lastInLane = lanes[i][lanes[i].length - 1];
                const lastEnd = lastInLane.startWeek + lastInLane.durationWeeks;
                if(bar.startWeek >= lastEnd) {
                    lanes[i].push(bar);
                    bar.lane = i;
                    placed = true;
                    break;
                }
            }
            if(!placed) {
                lanes.push([bar]);
                bar.lane = lanes.length - 1;
            }
        });
        
        const laneHeight = 72; // Height per lane — enough for commission + name text + button
        const barHeight = 26;  // Must match CSS .tl-bar height
        const rowHeight = Math.max(1, lanes.length) * laneHeight;
        
        // Row Header — always shows commission number + lift name + button
        let rowHeader = `
        <div class="tl-cell tl-row-header" style="height: ${rowHeight}px; padding: 6px 10px; border-bottom: 1px solid var(--border); box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; gap: 4px;">
            <div class="tl-comm">${esc(lift.commissionNumber)}</div>
            <div class="tl-name tl-lift-name" data-plan-id="${plan.id}" title="${esc(lift.name)}" style="font-size: 0.9rem;">${esc(lift.name)}</div>
            <button class="btn btn-primary btn-xs btn-add-fase" data-plan-id="${plan.id}" style="padding: 3px 8px; font-size: 0.7rem; align-self: flex-start; margin-top: auto;" title="Voeg planning toe">+ Fase</button>
        </div>`;

        let trackHTML = `<div class="tl-track-cell" style="grid-column: 2 / span ${weekCount}; height: ${rowHeight}px; border-bottom: 1px solid var(--border); box-sizing: border-box;">
            <div class="tl-grid-lines" style="grid-template-columns: repeat(${weekCount}, 1fr); height: 100%;">
                ${gridLinesHTML}
            </div>`;

        allBars.forEach((bar) => {
            const startCol = bar.startWeek - startWeek;
            if (startCol + bar.durationWeeks >= 0 && startCol < weekCount) {
               const clampedStart = Math.max(0, startCol);
               const clampedEnd = Math.min(weekCount, startCol + bar.durationWeeks);
               const leftPct = (clampedStart / weekCount) * 100;
               const widthPct = ((clampedEnd - clampedStart) / weekCount) * 100;
               const color = bar.isTransport ? '#1e293b' : (PHASE_COLORS[bar.phase] || 'var(--accent)');
               // Center bar vertically within its lane
               const topPx = bar.lane * laneHeight + Math.floor((laneHeight - barHeight) / 2);
               
               if(bar.isTransport) {
                   trackHTML += `<div class="tl-bar" 
                                style="left: ${leftPct + 0.3}%; width: ${Math.max(0.5, widthPct - 0.6)}%; background-color: ${color}; top: ${topPx}px; border: 1.5px dashed rgba(255,255,255,0.4); border-radius: 6px;"
                                onclick="if(typeof gotoTransportDetails === 'function') gotoTransportDetails('${lift.id}', '${bar.deliveryDate}')" title="Delivery: ${bar.deliveryDate}">
                                ${bar.deliveryDate}
                            </div>`;
               } else {
                   trackHTML += `<div class="tl-bar" 
                                style="left: ${leftPct + 0.3}%; width: ${Math.max(0.5, widthPct - 0.6)}%; background-color: ${color}; top: ${topPx}px; border-radius: 6px; box-shadow: 0 2px 6px -1px rgba(0,0,0,0.15);"
                                data-plan-id="${plan.id}" data-phase="${bar.phase}" data-phase-idx="${bar.originalIdx}">
                                ${esc(bar.phase)}
                            </div>`;
               }
            }
        });

        // Current week marker
        if (currentWeek >= startWeek && currentWeek < startWeek + weekCount) {
             const markerLeft = ((currentWeek - startWeek) / weekCount) * 100 + (50 / weekCount);
             trackHTML += `<div class="tl-today-line" style="left: ${markerLeft}%;"></div>`;
        }

        trackHTML += `</div>`;
        rowsHTML += `<div class="tl-row" style="display: contents;">${rowHeader}${trackHTML}</div>`;
    });

    return `
    <div class="tl-container">
        <div class="tl-legend">${legendHTML}</div>
        <div class="tl-scroll-area" style="max-height: 420px; overflow-y: auto; overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius);">
            <div class="tl-grid" style="grid-template-columns: 240px repeat(${weekCount}, minmax(72px, 1fr)); border: none; border-radius: 0; min-width: 900px;">
                <div class="tl-row" style="display: contents;">${colsHTML}</div>
                ${rowsHTML}
            </div>
        </div>
    </div>`;
}

function bindHub() {
    // Discipline clicks
    document.querySelectorAll('.hub-tile[data-discipline]').forEach(tile => {
        tile.addEventListener('click', () => {
            AppState.activeDiscipline = tile.dataset.discipline;
            saveAppState(); renderApp();
        });
    });

    // Module clicks
    document.querySelectorAll('.hub-tile[data-module]').forEach(tile => {
        tile.addEventListener('click', () => {
            AppState.activeModule = tile.dataset.module;
            saveAppState(); renderApp();
        });
    });

    const backDiscBtn = document.getElementById('btn-back-disciplines');
    if (backDiscBtn) {
        backDiscBtn.addEventListener('click', () => {
            AppState.activeDiscipline = null;
            saveAppState(); renderApp();
        });
    }
    const backProjBtn = document.getElementById('btn-back-projects');
    if (backProjBtn) {
        backProjBtn.addEventListener('click', () => {
            AppState.activeProject = null;
            AppState.activeDiscipline = null; // Clear discipline too
            saveAppState(); renderApp();
        });
    }

    document.getElementById('btn-logout-hub')?.addEventListener('click', () => {
        AppState.user = null; AppState.activeProject = null; AppState.activeDiscipline = null;
        saveAppState(); renderApp();
    });

    document.getElementById('btn-theme-hub')?.addEventListener('click', toggleTheme);

    const btnNewLift = document.getElementById('btn-new-lift');
    if (btnNewLift) {
        btnNewLift.addEventListener('click', () => {
            openNewLiftModal((newLift) => {
                renderApp();
            });
        });
    }

    if (document.querySelector('.hub-grid-disciplines')) {
        // If we are in disciplines mode (not module hub), timeline is visible
        bindTimeline();
    }
}

// ── Timeline Interactivity ───────────────────────────────────
function bindTimeline() {
    // 1. Lift Detail Clicks
    document.querySelectorAll('.tl-lift-name, .tl-bar, .btn-add-fase').forEach(el => {
        el.addEventListener('click', (e) => {
            if (window.isDragging) return; // Prevent click if dragging just finished
            const planId = e.currentTarget.dataset.planId;
            // Ensure this function exists in popups.js
            if (typeof openLiftDetailModal === 'function') openLiftDetailModal(planId);
        });
    });

    // 2. Drag to shift bars (Week adjustments)
    let isDown = false;
    let startX = 0;
    let originalLeft = 0;
    let activeBar = null;

    const bars = document.querySelectorAll('.tl-bar');
    if (!bars.length) return;

    // Context Menu for bars
    bars.forEach(bar => {
        bar.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const planId = bar.dataset.planId;
            const phaseIdx = bar.dataset.phaseIdx;
            
            // Remove any existing context menus
            const existing = document.getElementById('tl-context-menu');
            if(existing) existing.remove();
            
            const menu = document.createElement('div');
            menu.id = 'tl-context-menu';
            menu.style.position = 'absolute';
            menu.style.left = e.pageX + 'px';
            menu.style.top = e.pageY + 'px';
            menu.style.background = 'var(--bg-surface)';
            menu.style.border = '1px solid var(--border)';
            menu.style.borderRadius = 'var(--radius-sm)';
            menu.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            menu.style.zIndex = '1000';
            menu.style.display = 'flex';
            menu.style.flexDirection = 'column';
            menu.style.minWidth = '140px';
            menu.style.overflow = 'hidden';
            
            menu.innerHTML = `
                <button class="btn btn-ghost" onclick="document.getElementById('tl-context-menu').remove(); openLiftDetailModal('${planId}'); setTimeout(() => { if(typeof editPhase === 'function') editPhase('${planId}', ${phaseIdx}); }, 20);" style="justify-content: flex-start; border-radius: 0; width: 100%; border: none;">✎ Bewerk</button>
                <button class="btn btn-ghost" onclick="document.getElementById('tl-context-menu').remove(); if(typeof deletePhase === 'function') deletePhase('${planId}', ${phaseIdx});" style="justify-content: flex-start; border-radius: 0; width: 100%; border: none; color: var(--red);">✕ Verwijder</button>
            `;
            
            document.body.appendChild(menu);
            
            // Close on click outside
            const closeMenu = (ev) => {
                if(!menu.contains(ev.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            setTimeout(() => document.addEventListener('click', closeMenu), 0);
        });
    });

    // Use document-level events for smooth dragging
    const onMouseMove = (e) => {
        if (!isDown || !activeBar) return;
        const dx = e.pageX - startX;
        if (Math.abs(dx) > 5) window.isDragging = true;
        
        const trackWidth = activeBar.parentElement.offsetWidth;
        const dxPct = (dx / trackWidth) * 100;
        
        let newLeft = originalLeft + dxPct;
        if (newLeft < 0) newLeft = 0;
        activeBar.style.left = newLeft + '%';
    };

    const onMouseUp = (e) => {
        if (!isDown) return;
        isDown = false;
        
        if (activeBar && window.isDragging) {
            activeBar.style.transition = ''; // restore CSS transition
            activeBar.style.zIndex = '';
            
            // Snap to nearest week (14 visible weeks)
            const weekCount = 14; 
            const weekPct = 100 / weekCount;
            
            let finalLeft = parseFloat(activeBar.style.left);
            let nearestWeekIdx = Math.round(finalLeft / weekPct);
            
            // Clamp strictly within grid
            if (nearestWeekIdx < 0) nearestWeekIdx = 0;
            if (nearestWeekIdx > weekCount - 1) nearestWeekIdx = weekCount - 1;
            
            const snappedLeft = nearestWeekIdx * weekPct;
            activeBar.style.left = snappedLeft + '%';

            // Save to State
            const planId = activeBar.dataset.planId;
            const phaseName = activeBar.dataset.phase;
            const plan = AppState.planning.find(p => p.id === planId);
            
            if (plan) {
                const phaseObj = plan.phases.find(ph => ph.phase === phaseName);
                if (phaseObj) {
                    const currentWeek = getISOWeekNumber(new Date());
                    const startWeek = currentWeek - 2;
                    phaseObj.startWeek = startWeek + nearestWeekIdx;
                    saveAppState();
                    setTimeout(renderApp, 200); // Re-render strictly
                }
            }
        }
        
        setTimeout(() => { window.isDragging = false; }, 50);
        activeBar = null;
        
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    // Attach local mousedown
    bars.forEach(bar => {
        bar.addEventListener('mousedown', (e) => {
            isDown = true;
            window.isDragging = false;
            activeBar = bar;
            startX = e.pageX;
            originalLeft = parseFloat(bar.style.left);
            bar.style.transition = 'none';
            bar.style.zIndex = '50';
            
            // Re-attach global handlers specifically for this drag
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    });
}
