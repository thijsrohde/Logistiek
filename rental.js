/* ========================================================
   RENTAL.JS — Rental Equipment Module
   ======================================================== */

function renderRental() {
    const isAdmin = AppState.user.role === 'admin';
    const activeTab = AppState.activeRentalTab || 'active';
    
    // Filter by project
    let list = (activeTab === 'active' ? AppState.rentals : AppState.rentalHistory)
        .filter(r => r.projectId === AppState.activeProject);

    // Filter by date range (Overlap logic)
    AppState.rentalFilters = AppState.rentalFilters || { start: '', end: '' };
    const startDateFilter = AppState.rentalFilters.start;
    const endDateFilter = AppState.rentalFilters.end;
    const todayStr = new Date().toISOString().split('T')[0];

    if (startDateFilter || endDateFilter) {
        const sF = startDateFilter || '0000-01-01';
        const eF = endDateFilter || '9999-12-31';
        list = list.filter(r => {
            const iE = r.endDate || todayStr;
            return (r.startDate <= eF) && (sF <= iE);
        });
    }

    const totalSpent = list.reduce((sum, r) => sum + calculateRentalTotal(r.startDate, r.pricePerDay, r.endDate, startDateFilter, endDateFilter), 0);
    
    return `
    <header class="content-header">
        <div class="content-header-left">
            <h1 class="hub-title" style="margin: 0; font-size: 1.25rem;">${activeTab === 'active' ? 'Nu in Huur' : 'Huur Geschiedenis'}</h1>
            <span style="color: var(--text-muted); font-size: 0.82rem; margin-top:2px; display:inline-block;">Beheer huur periodes en calculaties</span>
        </div>
        <div class="content-header-right">
            <div class="filter-group-rental" style="display:flex; gap: 0.5rem; align-items:center;">
                <input type="date" id="filter-start-date" class="input-field input-xs" style="width:130px;" value="${startDateFilter || ''}" title="Filter vanaf">
                <input type="date" id="filter-end-date" class="input-field input-xs" style="width:130px;" value="${endDateFilter || ''}" title="Filter tot">
                ${startDateFilter || endDateFilter ? `
                    <button class="btn btn-ghost btn-header" id="btn-clear-rental-filters" style="border: 1px solid var(--border); color: var(--accent); white-space:nowrap; padding: 0 0.85rem;">
                        <span style="margin-right:0.5rem; display:flex;">${ICONS.repeat}</span> Wis filters
                    </button>
                ` : ''}
            </div>

            ${isAdmin && activeTab === 'active' ? `<button class="btn btn-primary btn-header" id="btn-add-rental">${ICONS.plus} Nieuwe Huur</button>` : ''}
        </div>
    </header>

    <div class="content-body">
        <div class="sidebar-tabs" style="display: flex; flex-direction: row; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem;">
            <button class="tab ${activeTab === 'active' ? 'tab-active' : ''}" id="btn-rental-active">
                <span class="tab-icon">${ICONS.truck}</span>
                <span class="tab-label">Nu in Huur</span>
            </button>
            <button class="tab ${activeTab === 'history' ? 'tab-active' : ''}" id="btn-rental-history">
                <span class="tab-icon">${ICONS.folder}</span>
                <span class="tab-label">Geschiedenis</span>
            </button>
        </div>

        ${list.length > 0 ? renderRentalTable(list, activeTab, totalSpent, startDateFilter, endDateFilter) : `
            <div class="empty-state-large">
                <span class="empty-state-icon">${activeTab === 'active' ? ICONS.truck : ICONS.folder}</span>
                <h3>${activeTab === 'active' ? 'Geen actieve huur' : 'Geen geschiedenis gevonden'}</h3>
                <p>Pas je filters aan of voeg nieuw materiaal toe.</p>
            </div>
        `}
    </div>
    <div id="modal-root"></div>
    <div id="lightbox-root"></div>
    <div id="context-menu-root"></div>`;
}

function renderRentalTable(list, activeTab, totalSum, filterStart, filterEnd) {
    const rows = list.map(r => {
        const total = calculateRentalTotal(r.startDate, r.pricePerDay, r.endDate, filterStart, filterEnd);
        return `
        <tr class="table-row rental-row" data-id="${r.id}">
            <td><strong>${esc(r.material)}</strong></td>
            <td>${esc(r.rentedFrom)}</td>
            <td><span class="date-tag">${esc(r.startDate)}</span></td>
            <td><span class="date-tag">${esc(r.endDate || '—')}</span></td>
            <td><span class="price-tag">€ ${parseFloat(r.pricePerDay).toFixed(2)}</span></td>
            <td>
                ${r.photo ? `<img src="${r.photo}" class="thumb thumb-circle" onclick="openLightbox('${r.photo}')">` : `<div class="thumb-placeholder thumb-circle">${ICONS.camera}</div>`}
            </td>
            <td><span class="price-tag price-total">€ ${total.toFixed(2)} ${r.endDate ? '<small>(Eind)</small>' : ''}</span></td>
        </tr>`;
    }).join('');

    return `
    <div class="table-wrapper">
        <table class="data-table">
            <thead>
                <tr>
                    <th>Materiaal</th>
                    <th>Verhuurder</th>
                    <th>Startdatum</th>
                    <th>Einddatum</th>
                    <th>Prijs / Dag</th>
                    <th>Foto</th>
                    <th>Totaalprijs</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
                <tr class="table-footer-row">
                    <td colspan="6" style="text-align:right; font-weight:700;">Totaal overzicht:</td>
                    <td class="price-tag price-total" style="font-size:1.1rem">€ ${totalSum.toFixed(2)}</td>
                </tr>
            </tfoot>
        </table>
    </div>`;
}

function calculateRentalTotal(startDate, pricePerDay, endDate = null, fStart = null, fEnd = null) {
    if (!startDate || !pricePerDay) return 0;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Intersection with filter range
    const iStart = fStart ? new Date(Math.max(start, new Date(fStart))) : start;
    const iEnd = fEnd ? new Date(Math.min(end, new Date(fEnd))) : end;

    if (iEnd < iStart) return 0;

    // Normalize to midnight
    iStart.setHours(0,0,0,0);
    iEnd.setHours(0,0,0,0);
    
    const diffTime = iEnd - iStart;
    const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    return diffDays * pricePerDay;
}

function bindRental() {
    const isAdmin = AppState.user.role === 'admin';

    // Top Right Back Buttons
    document.getElementById('btn-back-projects-rental')?.addEventListener('click', () => {
        AppState.activeProject = null;
        AppState.activeDiscipline = null;
        AppState.activeModule = null;
        saveAppState();
        renderApp();
    });

    document.getElementById('btn-logout-rental')?.addEventListener('click', () => {
        AppState.user = null;
        saveAppState();
        renderApp();
    });

    document.getElementById('btn-theme-rental')?.addEventListener('click', toggleTheme);

    document.getElementById('btn-back-hub-side')?.addEventListener('click', () => {
        AppState.activeModule = null;
        saveAppState();
        renderApp();
    });

    // Tab switcher
    document.getElementById('btn-rental-active').addEventListener('click', () => {
        AppState.activeRentalTab = 'active'; saveAppState(); renderApp();
    });
    document.getElementById('btn-rental-history').addEventListener('click', () => {
        AppState.activeRentalTab = 'history'; saveAppState(); renderApp();
    });

    // Date filters
    const filterStart = document.getElementById('filter-start-date');
    const filterEnd = document.getElementById('filter-end-date');
    if (filterStart) filterStart.addEventListener('change', (e) => {
        AppState.rentalFilters = AppState.rentalFilters || {};
        AppState.rentalFilters.start = e.target.value;
        saveAppState(); renderApp();
    });
    if (filterEnd) filterEnd.addEventListener('change', (e) => {
        AppState.rentalFilters = AppState.rentalFilters || {};
        AppState.rentalFilters.end = e.target.value;
        saveAppState(); renderApp();
    });

    document.getElementById('btn-clear-rental-filters')?.addEventListener('click', () => {
        AppState.rentalFilters = { start: '', end: '' };
        saveAppState(); renderApp();
    });

    // Admin specific bindings
    if (isAdmin) {
        const addBtn = document.getElementById('btn-add-rental');
        if (addBtn) addBtn.addEventListener('click', () => openRentalModal());

        document.querySelectorAll('.rental-row').forEach(row => {
            // Double click to edit
            row.addEventListener('dblclick', () => openRentalModal(row.dataset.id));

            // Right click menu
            row.addEventListener('contextmenu', e => {
                e.preventDefault();
                showRentalContextMenu(e.pageX, e.pageY, row.dataset.id);
            });
        });
    }

    // Close context menu on click
    document.addEventListener('click', closeContextMenu);
}

function showRentalContextMenu(x, y, id) {
    closeContextMenu();
    const item = AppState.rentals.find(r => r.id === id) || AppState.rentalHistory.find(r => r.id === id);
    if (!item) return;

    const isActive = AppState.rentals.some(r => r.id === id);
    const root = document.getElementById('context-menu-root');
    
    root.innerHTML = `
    <div class="context-menu" id="context-menu" style="left:${x}px; top:${y}px;">
        <button class="context-menu-item" id="ctx-edit-rental">${ICONS.edit} Bewerken</button>
        ${isActive ? `<button class="context-menu-item success" id="ctx-end-rental">${ICONS.logout} Beëindig Huur</button>` : ''}
        <button class="context-menu-item danger" id="ctx-delete-rental">${ICONS.trash} Verwijderen</button>
    </div>`;

    document.getElementById('ctx-edit-rental').addEventListener('click', () => openRentalModal(id));
    
    if (isActive) {
        document.getElementById('ctx-end-rental').addEventListener('click', () => {
            confirmEndRental(id);
        });
    }

    document.getElementById('ctx-delete-rental').addEventListener('click', () => {
        if (confirm('Weet je zeker dat je dit item wilt verwijderen?')) {
            AppState.rentals = AppState.rentals.filter(r => r.id !== id);
            AppState.rentalHistory = AppState.rentalHistory.filter(r => r.id !== id);
            saveAppState(); renderApp();
        }
    });

    // Prevent closing menu when clicking on it
    document.getElementById('context-menu').addEventListener('click', e => e.stopPropagation());
}

function confirmEndRental(id) {
    const item = AppState.rentals.find(r => r.id === id);
    const today = new Date().toISOString().split('T')[0];
    
    openModal('Huur Beëindigen', null, `
        <p>Je staat op het punt de huur voor <strong>${esc(item.material)}</strong> te beëindigen.</p>
        <div class="input-group" style="margin-top:1rem;">
            <label class="input-label">Einddatum</label>
            <input type="date" class="input-field" id="end-rental-date" value="${today}">
        </div>
    `, 'Bevestig Beëindiging', () => {
        const endDate = document.getElementById('end-rental-date').value;
        const idx = AppState.rentals.findIndex(r => r.id === id);
        if (idx > -1) {
            const finishedItem = { ...AppState.rentals[idx], endDate };
            AppState.rentalHistory.push(finishedItem);
            AppState.rentals.splice(idx, 1);
            saveAppState(); renderApp();
            showToast('Huur succesvol beëindigd.', 'success');
        }
        return true;
    });
}

function openRentalModal(id = null) {
    const isHistory = AppState.activeRentalTab === 'history';
    const item = id ? (AppState.rentals.find(r => r.id === id) || AppState.rentalHistory.find(r => r.id === id)) : null;
    const title = id ? 'Huur Item Aanpassen' : 'Nieuw Huur Item';
    
    openModal(title, null, `
        <div class="input-group">
            <label class="input-label">Materiaal (Required)</label>
            <input type="text" class="input-field" id="rent-material" value="${item ? esc(item.material) : ''}" placeholder="Bijv. Aggregaat, Hoogwerker...">
        </div>
        <div class="input-group">
            <label class="input-label">Verhuurder (Required)</label>
            <input type="text" class="input-field" id="rent-from" value="${item ? esc(item.rentedFrom) : ''}" placeholder="Bijv. Boels, Loxam...">
        </div>
        <div class="input-row">
            <div class="input-group">
                <label class="input-label">Startdatum</label>
                <input type="date" class="input-field" id="rent-start" value="${item ? item.startDate : new Date().toISOString().split('T')[0]}">
            </div>
            ${item && item.endDate ? `
            <div class="input-group">
                <label class="input-label">Einddatum</label>
                <input type="date" class="input-field" id="rent-end" value="${item.endDate}">
            </div>
            ` : ''}
            <div class="input-group">
                <label class="input-label">Prijs per dag (€)</label>
                <input type="number" class="input-field" id="rent-price" step="0.01" value="${item ? item.pricePerDay : ''}" placeholder="0.00">
            </div>
        </div>
        <div class="input-group">
            <label class="input-label">Foto</label>
            <div style="display:flex; gap:10px; align-items:center;">
                <button class="btn btn-secondary btn-sm" id="btn-upload-rent-photo">Kies Foto</button>
                <div id="rent-photo-preview" class="thumb-preview thumb-circle">
                    ${item && item.photo ? `<img src="${item.photo}" style="width:100%; height:100%; object-fit:cover;">` : ''}
                </div>
            </div>
        </div>
    `, 'Opslaan', () => {
        const material = document.getElementById('rent-material').value.trim();
        const from = document.getElementById('rent-from').value.trim();
        const start = document.getElementById('rent-start').value;
        const price = parseFloat(document.getElementById('rent-price').value);
        const end = document.getElementById('rent-end')?.value;

        if (!material || !from || isNaN(price)) {
            showToast('Vul alle verplichte velden in.', 'error');
            return false;
        }

        const photoImg = document.querySelector('#rent-photo-preview img');
        const photo = photoImg ? photoImg.src : null;

        if (id) {
            let targetList = AppState.rentals.some(r => r.id === id) ? AppState.rentals : AppState.rentalHistory;
            const idx = targetList.findIndex(r => r.id === id);
            targetList[idx] = { ...targetList[idx], material, rentedFrom: from, startDate: start, pricePerDay: price, photo, endDate: end || targetList[idx].endDate };
        } else {
            AppState.rentals.push({
                id: 'rent-' + Date.now(),
                projectId: AppState.activeProject,
                material, rentedFrom: from, startDate: start, pricePerDay: price, photo
            });
        }

        saveAppState(); renderApp();
        showToast('Huur item opgeslagen.', 'success');
        return true;
    });

    document.getElementById('btn-upload-rent-photo').addEventListener('click', () => {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'image/*';
        inp.onchange = () => {
            const f = inp.files[0];
            if (f) {
                const r = new FileReader();
                r.onload = ev => {
                    document.getElementById('rent-photo-preview').innerHTML = `<img src="${ev.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
                };
                r.readAsDataURL(f);
            }
        };
        inp.click();
    });
}
