/* ========================================================
   POPUPS.JS — Modal System, Toasts & Lightbox
   ======================================================== */

// ── Modal System ───────────────────────────────────────
function openModal(title, subtitle, bodyHTML, confirmLabel, onConfirm, modalClass = '', extraFooterHTML = '') {
    closeModal();
    const el = document.getElementById('modal-root');
    el.innerHTML = `
    <div class="overlay" id="modal-overlay">
        <div class="modal ${modalClass}" role="dialog" aria-modal="true">
            <button class="modal-close" id="modal-close-btn" aria-label="Close">&times;</button>
            <h2 class="modal-title">${title}</h2>
            ${subtitle ? `<p class="modal-subtitle">${subtitle}</p>` : ''}
            <div class="modal-body">${bodyHTML}</div>
            <div class="modal-footer">
                ${extraFooterHTML}
                <button class="btn btn-ghost" id="modal-cancel-btn">Cancel</button>
                <button class="btn btn-primary" id="modal-confirm-btn">${confirmLabel || 'Confirm'}</button>
            </div>
        </div>
    </div>`;

    // Bind close/cancel
    document.getElementById('modal-close-btn').onclick = closeModal;
    document.getElementById('modal-cancel-btn').onclick = closeModal;
    document.getElementById('modal-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-overlay') closeModal();
    });

    // Bind confirm
    document.getElementById('modal-confirm-btn').onclick = async () => {
        const result = await onConfirm();
        if (result !== false) closeModal();
    };

    // Live validation colouring on inputs
    el.querySelectorAll('.input-field').forEach(inp => {
        const check = () => inp.classList.toggle('is-valid', inp.value.trim() !== '');
        inp.addEventListener('input', check);
        inp.addEventListener('change', check);
    });
}

function closeModal() {
    const el = document.getElementById('modal-root');
    if (el) el.innerHTML = '';
}

// ── Specific Modals ────────────────────────────────────────────
function openNewLiftModal(onSuccessCallback) {
    const body = `
        <div class="input-group">
            <label class="input-label">Commission Nr <span class="text-red">*</span></label>
            <input type="text" id="nl-comm" class="input-field" placeholder="Bijv. 11130354">
        </div>
        <div class="input-group" style="margin-top: 1rem;">
            <label class="input-label">Liftnaam / Asset Name <span class="text-red">*</span></label>
            <input type="text" id="nl-name" class="input-field" placeholder="Bijv. Liften algemeen">
        </div>
    `;

    openModal('Nieuwe Lift Aanmaken', 'Deze lift wordt centraal opgeslagen en direct aan het huidige project gekoppeld.', body, 'Opslaan', () => {
        const comm = document.getElementById('nl-comm').value.trim();
        const name = document.getElementById('nl-name').value.trim();

        if (!comm || !name) {
            showToast('Vul aub beide velden in', 'error');
            return false;
        }

        const newLift = addLift(comm, name);
        if (!newLift) {
            showToast('Dit commissienummer bestaat al in de globale database', 'error');
            return false;
        }

        showToast('Lift succesvol aangemaakt', 'success');
        if (onSuccessCallback) onSuccessCallback(newLift);
        return true;
    });
}

function openLiftDetailModal(planId) {
    const plan = AppState.planning.find(p => p.id === planId);
    if (!plan) return;
    const lift = AppState.lifts.find(l => l.id === plan.liftId);
    if (!lift) return;
    
    const phasesHTML = plan.phases && plan.phases.length > 0
        ? plan.phases.map((p, idx) => `
            <div style="padding: 0.75rem; background: var(--bg-body); margin-bottom: 0.5rem; border-radius: var(--radius); display: flex; justify-content: space-between; align-items: center;">
                <div><strong>${esc(p.phase)}</strong>: Wk ${p.startWeek} t/m Wk ${p.startWeek + p.durationWeeks - 1}</div>
                <div style="display: flex; gap: 0.25rem;">
                    <button class="btn-icon" style="color: var(--accent); padding: 4px;" onclick="editPhase('${planId}', ${idx})" title="Bewerk">✎</button>
                    <button class="btn-icon" style="color: var(--red); padding: 4px;" onclick="deletePhase('${planId}', ${idx})" title="Verwijder">✕</button>
                </div>
            </div>
        `).join('')
        : '<p style="color: var(--text-muted); font-size: 0.9rem;">Nog geen fasen gepland.</p>';

        let body = `
        <div style="display: flex; gap: 2rem; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border);">
            <div>
                <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Commissie Nr</div>
                <div style="font-size: 1.15rem; font-weight: 600; color: var(--accent);">${lift.commissionNumber}</div>
            </div>
            <div>
                <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Liftnaam</div>
                <div style="font-size: 1.15rem; font-weight: 600;">${lift.name}</div>
            </div>
        </div>

        <h3 style="margin-bottom: 0.75rem;">Huidige Planning</h3>
        <div style="margin-bottom: 1.5rem; max-height: 200px; overflow-y: auto;">
            ${phasesHTML}
        </div>

        <h3 id="add-phase-title" style="margin-bottom: 0.75rem;">Nieuwe Fase Toevoegen</h3>
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
            <select class="input-field" id="new-phase-name" style="flex: 2;">
                <option value="Engineering">Engineering</option>
                <option value="Montage">Montage</option>
                <option value="Testen">Testen</option>
            </select>
            <input type="number" id="new-phase-wk" class="input-field" placeholder="Start Wk" style="flex: 1;" min="1" max="53">
            <input type="number" id="new-phase-end-wk" class="input-field" placeholder="Eind Wk" style="flex: 1;" min="1" max="53">
            <button class="btn btn-secondary" id="btn-add-phase" onclick="addPhaseToPlan('${planId}')">Toevoegen</button>
        </div>

        <hr style="border: 0; border-top: 1px solid var(--border); margin: 2rem 0 1.5rem 0;">
        <button class="btn btn-outline" style="width: 100%; justify-content: center; border-color: var(--accent); color: var(--accent);" onclick="gotoLogisticsForLift('${lift.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; margin-right:8px;"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            Ga naar voorraadbeheer voor deze lift
        </button>
    `;

    const extraBtn = AppState.user.role === 'admin' 
        ? `<button class="btn btn-ghost btn-sm" style="color: var(--red); border: 1px solid var(--red-soft); margin-right: auto;" onclick="deleteGlobalLift('${lift.id}')">✕ Verwijder Asset</button>`
        : '';

    openModal('Lift Planning Details', '', body, 'Sluiten', () => { return true; }, 'modal-wide', extraBtn);
}

window.deleteGlobalLift = function(liftId) {
    const lift = AppState.lifts.find(l => l.id === liftId);
    if (!lift) return;
    if (!confirm(`Weet je zeker dat je asset "${lift.name}" wilt verwijderen? Dit wist ook direct de bijbehorende planning.`)) return;
    
    AppState.lifts = AppState.lifts.filter(l => l.id !== liftId);
    AppState.planning = AppState.planning.filter(p => p.liftId !== liftId);
    AppState.items.forEach(i => {
        if (i.liftId === liftId) i.liftId = null;
    });

    closeModal();
    saveAppState();
    renderApp();
};

// Global window functions for inline onclick in modals
window.deletePhase = function(planId, phaseIdx) {
    const plan = AppState.planning.find(p => p.id === planId);
    if (plan && plan.phases && plan.phases[phaseIdx]) {
        plan.phases.splice(phaseIdx, 1);
        saveAppState();
        renderApp(); // update timeline
        openLiftDetailModal(planId); // refresh modal
    }
};

window.editPhase = function(planId, phaseIdx) {
    const plan = AppState.planning.find(p => p.id === planId);
    if (!plan || !plan.phases || !plan.phases[phaseIdx]) return;
    
    const phaseObj = plan.phases[phaseIdx];
    
    document.getElementById('new-phase-name').value = phaseObj.phase;
    document.getElementById('new-phase-wk').value = phaseObj.startWeek;
    document.getElementById('new-phase-end-wk').value = phaseObj.startWeek + phaseObj.durationWeeks - 1;
    
    const btn = document.getElementById('btn-add-phase');
    btn.textContent = 'Opslaan';
    btn.onclick = () => saveEditedPhase(planId, phaseIdx);
    
    document.getElementById('add-phase-title').textContent = 'Fase Bewerken';
};

window.saveEditedPhase = function(planId, phaseIdx) {
    const plan = AppState.planning.find(p => p.id === planId);
    if (!plan || !plan.phases || !plan.phases[phaseIdx]) return;
    
    const name = document.getElementById('new-phase-name').value;
    const wk = parseInt(document.getElementById('new-phase-wk').value);
    const endWk = parseInt(document.getElementById('new-phase-end-wk').value);
    
    if (!wk || !endWk || endWk < wk) {
        showToast('Vul een geldige start- en eindweek in', 'error');
        return;
    }
    
    const dur = endWk - wk + 1;
    plan.phases[phaseIdx] = { phase: name, startWeek: wk, durationWeeks: dur };
    saveAppState();
    
    renderApp(); 
    showToast('Fase bijgewerkt', 'success');
    openLiftDetailModal(planId);
};

window.addPhaseToPlan = function(planId) {
    const plan = AppState.planning.find(p => p.id === planId);
    if (!plan) return;
    
    const name = document.getElementById('new-phase-name').value;
    const wk = parseInt(document.getElementById('new-phase-wk').value);
    const endWk = parseInt(document.getElementById('new-phase-end-wk').value);
    
    if (!wk || !endWk || endWk < wk) {
        showToast('Vul een geldige start- en eindweek in', 'error');
        return;
    }
    
    const dur = endWk - wk + 1;
    if (!plan.phases) plan.phases = [];
    plan.phases.push({ phase: name, startWeek: wk, durationWeeks: dur });
    saveAppState();
    
    renderApp(); 
    showToast('Fase toegevoegd', 'success');
    openLiftDetailModal(planId);
};

window.gotoLogisticsForLift = function(liftId) {
    closeModal();
    AppState.activeDiscipline = 'logistics';
    AppState.activeModule = 'stock'; 
    AppState.activeTab = 'supplier'; // Force navigation to the supplier tab
    const lift = AppState.lifts.find(l => l.id === liftId);
    if (lift) {
        AppState.searchQuery = lift.commissionNumber;
    }
    saveAppState();
    renderApp();
};

window.gotoTransportDetails = function(liftId, arrivalDate) {
    if (typeof closeModal === 'function') closeModal();
    AppState.activeDiscipline = 'logistics';
    AppState.activeModule = 'stock'; 
    AppState.activeTab = 'supplier'; 
    
    // Reset filters and set target transport date
    AppState.columnFilters = {
        'deliveryDate': { start: arrivalDate, end: arrivalDate }
    };
    
    // Also filter by this specific lift so other deliveries on the same truck don't clutter the view
    const lift = AppState.lifts.find(l => l.id === liftId);
    if (lift) {
        AppState.columnFilters['assetName'] = [lift.name];
    }

    AppState.searchQuery = ''; 
    saveAppState();
    renderApp();
};

// ── Toast ──────────────────────────────────────────────
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('toast-visible'));

    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ── Lightbox ───────────────────────────────────────────
function openLightbox(src) {
    const lb = document.getElementById('lightbox-root');
    lb.innerHTML = `
    <div class="lightbox" id="lightbox-overlay">
        <button class="lightbox-close">&times;</button>
        <img src="${src}" alt="Attachment preview">
    </div>`;
    lb.querySelector('.lightbox-close').onclick = closeLightbox;
    lb.querySelector('#lightbox-overlay').addEventListener('click', e => {
        if (e.target.id === 'lightbox-overlay') closeLightbox();
    });
}

function closeLightbox() {
    document.getElementById('lightbox-root').innerHTML = '';
}
