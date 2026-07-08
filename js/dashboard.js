/* ========================================================
   DASHBOARD.JS — Dashboard Layout, Tabs, Inline Filters & Table
   ======================================================== */

// Transient state for bulk actions
window._selectedItems = [];
window._lastOpenFilter = null; // Track which filter panel is currently open

function renderDashboard() {
    const isAdmin = AppState.user.role === 'admin';
    const tabs = [
        { key: 'ordered',  label: 'Ordered',   icon: ICONS.package },
        { key: 'supplier', label: 'Supplier',  icon: ICONS.truck },
        { key: 'onsite',   label: 'On-Site',   icon: ICONS.mapPin }
    ];

    const visibleTabs = tabs; // Expose all tabs to everyone
    if (!visibleTabs.find(t => t.key === AppState.activeTab)) {
        AppState.activeTab = visibleTabs[0].key;
    }

    const tabsHTML = visibleTabs.map(t => `
        <button class="tab ${AppState.activeTab === t.key ? 'tab-active' : ''}" data-tab="${t.key}">
            <span class="tab-icon">${t.icon}</span>
            <span class="tab-label">${t.label}</span>
            <span class="tab-count">${countItems(t.key)}</span>
        </button>
    `).join('');

    const columns = getColumnsForTab(AppState.activeTab);
    const allItems = getBaseItems();
    const filteredItems = applyColumnFilters(allItems, columns);
    const searchedItems = applySearch(filteredItems);

    const activeFilterCount = Object.values(AppState.columnFilters || {}).filter(f => {
        if (!f) return false;
        if (Array.isArray(f)) return f.length > 0;
        return (f.start || f.end); 
    }).length;
 
    const hasActiveFilters = AppState.searchQuery || activeFilterCount > 0;
 
    return `
    <header class="content-header">
        <div class="content-header-left">
            <h1 class="hub-title" style="margin:0; font-size: 1.25rem;">${esc(getTabLabel(AppState.activeTab))}</h1>
            <span style="color: var(--text-muted); font-size: 0.82rem; margin-top:2px; display:inline-block;">Selecteer items om te beheren</span>
        </div>
        <div class="content-header-right">
            <div class="search-bar" style="margin-right: 0.5rem;">
                <span class="search-icon">${ICONS.search}</span>
                <input type="text" id="search-input" class="search-input" placeholder="Search items..." value="${esc(AppState.searchQuery || '')}">
            </div>
            ${hasActiveFilters ? `<button class="btn btn-ghost btn-header" id="search-clear" style="border: 1px solid var(--border); color: var(--accent); white-space:nowrap; padding: 0 0.85rem;"><span style="margin-right:0.5rem; display:flex;">${ICONS.repeat}</span> Wis filters</button>` : ''}
            ${isAdmin ? `<button class="btn btn-primary btn-header" id="btn-add-item">${ICONS.plus} New Item</button>` : ''}
        </div>
    </header>

    <div class="content-body">
        <div class="sidebar-tabs" style="display: flex; flex-direction: row; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem;">
            ${tabsHTML}
        </div>
        ${renderTable(searchedItems, columns, allItems)}
        ${_renderBulkActionBar()}
    </div>
    <div id="modal-root"></div>
    <div id="lightbox-root"></div>`;
}

// ── Data helpers ────────────────────────────────────────
function countItems(status) {
    return AppState.items.filter(i => i.projectId === AppState.activeProject && i.status === status).length;
}

function getMyNotifications() {
    return (AppState.notifications || []).filter(n => n.forRole === AppState.user.role || !n.forRole);
}

function getBaseItems() {
    return AppState.items.filter(i => i.projectId === AppState.activeProject && i.status === AppState.activeTab);
}

function applyColumnFilters(items, columns) {
    const filters = AppState.columnFilters || {};
    return items.filter(item => {
        for (const col of columns) {
            const filterVal = filters[col.key];
            if (!filterVal || (Array.isArray(filterVal) && filterVal.length === 0)) continue;

            if (col.type === 'date') {
                const itemDate = item[col.key] ? new Date(item[col.key]) : null;
                const { start, end } = filterVal;
                if (start) {
                    const startDate = new Date(start);
                    if (!itemDate || itemDate < startDate) return false;
                }
                if (end) {
                    const endDate = new Date(end);
                    if (!itemDate || itemDate > endDate) return false;
                }
            } else {
                const val = (item[col.key] || '').toString();
                if (!filterVal.includes(val)) return false;
            }
        }
        return true;
    });
}

function applySearch(items) {
    const q = (AppState.searchQuery || '').toLowerCase();
    if (!q) return items;
    return items.filter(i =>
        (i.commissionNumber || '').toLowerCase().includes(q)
        || (i.assetName || '').toLowerCase().includes(q)
        || (i.productName || '').toLowerCase().includes(q)
        || (i.location || '').toLowerCase().includes(q)
    );
}

function getTabLabel(key) {
    const labels = { ordered: 'Ordered (Besteld)', supplier: 'Supplier (Leveranciers)', onsite: 'On-Site' };
    return labels[key] || key;
}

// ── Empty State ────────────────────────────────────────
function renderEmptyState() {
    const isAdmin = AppState.user.role === 'admin';
    const hasFilters = Object.values(AppState.columnFilters || {}).some(arr => arr && arr.length > 0);
    return `
    <div class="empty-state-large">
        <span class="empty-state-icon">${ICONS.package}</span>
        <h3>No items found</h3>
        <p>${AppState.searchQuery || hasFilters
            ? 'Try adjusting your search or filters.'
            : (isAdmin ? 'Click "New Item" to add your first item.' : 'No items in this list currently.')}</p>
        ${hasFilters ? `<button class="btn btn-ghost btn-sm" id="btn-clear-all-filters" style="margin-top:1rem">Clear all filters</button>` : ''}
    </div>`;
}

// ── Table with inline column filters ───────────────────
function renderTable(items, columns, allItems) {
    const isAdmin = AppState.user.role === 'admin';

    const headerCells = columns.map(c => {
        // Contextual Filtering: calculate unique values based on *other* active filters
        // but ignoring the filter on this column itself (otherwise we couldn't select multiple).
        const otherFiltersApplied = allItems.filter(item => {
            // Apply all other column filters
            for (const otherCol of columns) {
                if (otherCol.key === c.key) continue;
                const filterVal = (AppState.columnFilters || {})[otherCol.key];
                if (!filterVal || (Array.isArray(filterVal) && filterVal.length === 0)) continue;

                if (otherCol.type === 'date') {
                    const itemDate = item[otherCol.key] ? new Date(item[otherCol.key]) : null;
                    const { start, end } = filterVal;
                    if (start && (!itemDate || itemDate < new Date(start))) return false;
                    if (end && (!itemDate || itemDate > new Date(end))) return false;
                } else {
                    if (!filterVal.includes((item[otherCol.key] || '').toString())) return false;
                }
            }
            // Also apply search query
            const q = (AppState.searchQuery || '').toLowerCase();
            if (q) {
                const searchMatch = (item.commissionNumber || '').toLowerCase().includes(q)
                    || (item.assetName || '').toLowerCase().includes(q)
                    || (item.productName || '').toLowerCase().includes(q)
                    || (item.location || '').toLowerCase().includes(q);
                if (!searchMatch) return false;
            }
            return true;
        });

        const uniqueVals = [...new Set(otherFiltersApplied.map(i => (i[c.key] || '').toString()).filter(v => v))].sort();
        const selected = (AppState.columnFilters || {})[c.key] || [];
        const isActive = selected.length > 0;
        const hasOptions = uniqueVals.length > 0;

        let filterHTML = '';
        if (c.type === 'date') {
            const currentFilter = (AppState.columnFilters || {})[c.key] || { start: '', end: '' };
            filterHTML = `
                <button class="th-filter-btn ${currentFilter.start || currentFilter.end ? 'active' : ''}" data-col="${c.key}" title="Filter ${c.label}">${ICONS.filter}</button>
                <div class="filter-panel hidden" id="filter-panel-${c.key}" style="min-width: 200px; padding: 1rem;">
                    <div class="filter-panel-header" style="margin-bottom: 0.75rem;">
                        <span class="filter-panel-title">Datum Range</span>
                        <button class="filter-clear-btn" data-col="${c.key}">Clear</button>
                    </div>
                    <div class="filter-date-range">
                        <div class="input-group" style="margin-bottom: 0.75rem;">
                            <label class="input-label" style="font-size: 0.7rem;">Van</label>
                            <input type="date" class="input-field input-xs date-filter-start" data-col="${c.key}" id="date-start-${c.key}" value="${currentFilter.start || ''}">
                        </div>
                        <div class="input-group" style="margin-bottom: 0.75rem;">
                            <label class="input-label" style="font-size: 0.7rem;">Tot</label>
                            <input type="date" class="input-field input-xs date-filter-end" data-col="${c.key}" id="date-end-${c.key}" value="${currentFilter.end || ''}">
                        </div>
                        <div class="filter-date-apply-row">
                            <button class="btn btn-primary btn-sm date-filter-apply" data-col="${c.key}">Pas toe</button>
                        </div>
                    </div>
                </div>
            `;
        } else if (hasOptions) {
            const optionsHTML = uniqueVals.map(v => {
                const checked = selected.includes(v) ? 'checked' : '';
                return `<label class="filter-option">
                    <input type="checkbox" class="filter-checkbox" data-col="${c.key}" data-val="${esc(v)}" ${checked}>
                    <span>${esc(v)}</span>
                </label>`;
            }).join('');

            filterHTML = `
                <button class="th-filter-btn ${isActive ? 'active' : ''}" data-col="${c.key}" title="Filter ${c.label}">${ICONS.filter}</button>
                <div class="filter-panel hidden" id="filter-panel-${c.key}">
                    <div class="filter-panel-header">
                        <span class="filter-panel-title">Filter</span>
                        <button class="filter-clear-btn" data-col="${c.key}">Clear</button>
                    </div>
                    <div class="filter-options">${optionsHTML}</div>
                </div>
            `;
        }

        return `<th class="th-filterable"><div class="th-content"><span>${c.label}</span>${filterHTML}</div></th>`;
    }).join('');

    const allChecked = items.length > 0 && items.every(i => window._selectedItems.includes(i.id));

    let rows = '';
    if (items.length === 0) {
        rows = `
        <tr>
            <td colspan="${columns.length + 3}" style="background:transparent; border:none; padding:0;">
                ${renderEmptyState()}
            </td>
        </tr>`;
    } else {
        rows = items.map(item => {
            const isSelected = window._selectedItems.includes(item.id);
            const cells = columns.map(c => `<td>${renderCellValue(item, c)}</td>`).join('');
            return `
            <tr class="table-row ${isSelected ? 'row-selected' : ''}" data-id="${item.id}">
                <td class="checkbox-cell">
                    <input type="checkbox" class="bulk-checkbox row-select-cb" data-id="${item.id}" ${isSelected ? 'checked' : ''}>
                </td>
                ${cells}
                <td class="td-attachments">${renderAttachmentCell(item, isAdmin)}</td>
                <td class="td-actions">${renderRowActions(item, AppState.activeTab, isAdmin)}</td>
            </tr>`;
        }).join('');
    }

    return `
    <div class="table-wrapper">
        <table class="data-table">
            <thead>
                <tr>
                    <th class="checkbox-cell">
                        <input type="checkbox" class="bulk-checkbox" id="select-all-cb" ${allChecked ? 'checked' : ''}>
                    </th>
                    ${headerCells}
                    <th>Photos</th>
                    <th class="th-actions">Actions</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </div>`;
}

function _renderBulkActionBar() {
    if (window._selectedItems.length === 0) return '';
    const isAdmin = AppState.user.role === 'admin';
    const tab = AppState.activeTab;

    let btns = '';
    if (tab === 'supplier') {
        if (isAdmin) {
            btns += `<button class="btn btn-success btn-sm" onclick="bulkProcessArrival()">Bulk Arrived (On-Site)</button>`;
            btns += `<button class="btn btn-primary btn-sm" onclick="bulkApproveCallOff()">Bulk Approve</button>`;
        } else {
            btns += `<button class="btn btn-primary btn-sm" onclick="bulkRequestCallOff()">Bulk Afroepen</button>`;
        }
    } else if (tab === 'ordered' && isAdmin) {
        btns += `<button class="btn btn-primary btn-sm" onclick="bulkMoveToSupplier()">Bulk to Supplier</button>`;
    } else if (tab === 'onsite') {
        btns += `<button class="btn btn-primary btn-sm" onclick="bulkProcessReturn(window._selectedItems)">Bulk Retour</button>`;
    }

    if (isAdmin) {
        btns += `<button class="btn btn-ghost btn-sm" onclick="bulkDeleteItems()" style="color: var(--red); border: 1px solid var(--red-soft); margin-left: 0.5rem;">✕ Verwijder</button>`;
    }

    return `
    <div class="bulk-action-bar">
        <div class="bulk-info">${window._selectedItems.length} geselecteerd</div>
        <div class="bulk-btns">
            ${btns}
            <button class="btn btn-ghost btn-sm" onclick="clearSelection()">Annuleer</button>
        </div>
    </div>`;
}

window.clearSelection = function() {
    window._selectedItems = [];
    renderApp();
}

window.bulkDeleteItems = function() {
    if (!confirm(`Weet je zeker dat je ${window._selectedItems.length} items wilt verwijderen uit de actieve voorraad?`)) return;
    AppState.items = AppState.items.filter(i => !window._selectedItems.includes(i.id));
    window._selectedItems = [];
    saveAppState();
    renderApp();
}

window.deleteSingleDashItem = function(id) {
    if (!confirm('Weet je zeker dat je dit item wilt verwijderen?')) return;
    AppState.items = AppState.items.filter(i => i.id !== id);
    if (window._selectedItems.includes(id)) {
        window._selectedItems = window._selectedItems.filter(x => x !== id);
    }
    saveAppState();
    renderApp();
}

function getColumnsForTab(tab) {
    if (tab === 'ordered') {
        return [
            { key: 'commissionNumber', label: 'Commission Nr' },
            { key: 'assetName',        label: 'Asset Name' },
            { key: 'productName',      label: 'Product Name' },
            { key: 'deliveryAddress',  label: 'Delivery Address' },
            { key: 'deliveryDate',     label: 'Delivery Date', type: 'date' }
        ];
    } else if (tab === 'supplier') {
        return [
            { key: 'commissionNumber', label: 'Commission Nr' },
            { key: 'assetName',        label: 'Asset Name' },
            { key: 'productName',      label: 'Product Name' },
            { key: 'deliveryAddress',  label: 'Delivery Address' },
            { key: 'deliveryDate',     label: 'Lever/Retourdatum', type: 'date' },
            { key: 'returnNumber',     label: 'Retournummer' }
        ];
    } else { // onsite
        return [
            { key: 'commissionNumber', label: 'Commission Nr' },
            { key: 'assetName',        label: 'Asset Name' },
            { key: 'productName',      label: 'Product Name' },
            { key: 'roomLocation',     label: 'Room/Location' },
            { key: 'confirmedDate',    label: 'Confirmed Date', type: 'date' }
        ];
    }
}

function renderCellValue(item, col) {
    const val = item[col.key] || '';
    if (!val) return `<span class="cell-empty">—</span>`;
    return esc(val);
}

function renderAttachmentCell(item, isAdmin) {
    const thumbs = (item.attachments || []).map((a, i) =>
        `<img class="thumb" src="${a}" data-src="${a}" alt="Photo ${i+1}" onclick="openLightbox(this.dataset.src)">`
    ).join('');
    const uploadBtn = isAdmin ? `<button class="btn-add-photo" data-id="${item.id}" title="Add photo">${ICONS.camera}</button>` : '';
    return `<div class="thumb-row">${thumbs}${uploadBtn}</div>`;
}

function renderRowActions(item, tab, isAdmin) {
    let btns = '';
    if (tab === 'ordered' && isAdmin) {
        btns += `<button class="btn btn-primary btn-xs btn-move" data-id="${item.id}" data-to="supplier">Supplier →</button>`;
    } else if (tab === 'supplier') {
        if (item.callOffStatus === 'requested') {
            if (isAdmin) {
                btns += `<button class="btn btn-primary btn-xs btn-action" onclick="approveCallOff('${item.id}')">Approve & Set Date</button>`;
            } else {
                btns += `<span class="badge badge-red">Pending Approval</span>`;
            }
        } else if (item.callOffStatus === 'approved') {
            if (isAdmin) {
                btns += `<button class="btn btn-warning btn-xs btn-action" onclick="changeArrivalDate('${item.id}')">Wijzig Datum</button>`;
                btns += `<button class="btn btn-success btn-xs btn-action" onclick="processArrival('${item.id}')">Process Arrival</button>`;
            } else {
                btns += `<span class="badge badge-green">Approved (${item.arrivalDate || '—'})</span>`;
            }
        } else {
            // No request yet
            if (isAdmin) {
                btns += `<button class="btn btn-success btn-xs btn-move" data-id="${item.id}" data-to="onsite">On-Site →</button>`;
            } else {
                btns += `<button class="btn btn-primary btn-xs btn-action" onclick="requestCallOff('${item.id}')">Afroepen</button>`;
            }
        }
    } else if (tab === 'onsite' && isAdmin) {
        btns += `<button class="btn btn-ghost btn-xs btn-move" data-id="${item.id}" data-to="supplier">← Return</button>`;
    }
    
    return `<div class="action-btns">${btns}</div>`;
}

// ── Dashboard Bindings ─────────────────────────────────
function bindDashboard() {
    document.getElementById('btn-logout-dash')?.addEventListener('click', () => {
        AppState.user = null; AppState.activeProject = null; AppState.activeDiscipline = null; saveAppState(); renderApp();
    });
    // Selection
    const selectAllCb = document.getElementById('select-all-cb');
    if (selectAllCb) {
        selectAllCb.addEventListener('change', () => {
            const columns = getColumnsForTab(AppState.activeTab);
            const allItems = getBaseItems();
            const filtered = applySearch(applyColumnFilters(allItems, columns));
            if (selectAllCb.checked) {
                window._selectedItems = [...new Set([...window._selectedItems, ...filtered.map(i => i.id)])];
            } else {
                const idsToRemove = filtered.map(i => i.id);
                window._selectedItems = window._selectedItems.filter(id => !idsToRemove.includes(id));
            }
            renderApp();
        });
    }

    document.querySelectorAll('.row-select-cb').forEach(cb => {
        cb.addEventListener('change', (e) => {
            e.stopPropagation();
            const id = cb.dataset.id;
            if (cb.checked) {
                if (!window._selectedItems.includes(id)) window._selectedItems.push(id);
            } else {
                window._selectedItems = window._selectedItems.filter(x => x !== id);
            }
            renderApp();
        });
        cb.addEventListener('click', e => e.stopPropagation()); // Prevents double-click or row clicks
    });

    // Tabs
    document.querySelectorAll('.tab').forEach(t => {
        t.addEventListener('click', () => {
            AppState.activeTab = t.dataset.tab;
            AppState.searchQuery = '';
            AppState.columnFilters = {};
            saveAppState(); renderApp();
        });
    });

    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let debounce;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                AppState.searchQuery = searchInput.value;
                saveAppState(); renderApp();
            }, 250);
        });
        const len = searchInput.value.length;
        searchInput.focus();
        searchInput.setSelectionRange(len, len);
    }
    const clearBtn = document.getElementById('search-clear');
    if (clearBtn) clearBtn.addEventListener('click', () => { 
        AppState.searchQuery = ''; 
        AppState.columnFilters = {};
        saveAppState(); renderApp(); 
    });

    const addBtn = document.getElementById('btn-add-item');
    if (addBtn) addBtn.addEventListener('click', () => openAddItemModal());

    const notifBtn = document.getElementById('btn-notif');
    if (notifBtn) notifBtn.addEventListener('click', showNotifications);

    document.querySelectorAll('.btn-move').forEach(b =>
        b.addEventListener('click', (e) => { e.stopPropagation(); moveItem(b.dataset.id, b.dataset.to); })
    );
    document.querySelectorAll('.btn-add-photo').forEach(b =>
        b.addEventListener('click', (e) => { e.stopPropagation(); uploadPhoto(b.dataset.id); })
    );
    
    // Row clicks and Context Menu
    document.querySelectorAll('.table-row').forEach(row => {
        row.addEventListener('dblclick', () => {
            if (AppState.user.role === 'admin') {
                if (typeof openEditItemModal === 'function') openEditItemModal(row.dataset.id);
            }
        });

        row.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const itemId = row.dataset.id;
            document.getElementById('dash-context-menu')?.remove();
            
            const menu = document.createElement('div');
            menu.id = 'dash-context-menu';
            menu.style.position = 'absolute';
            menu.style.left = e.pageX + 'px';
            menu.style.top = e.pageY + 'px';
            menu.style.background = 'var(--bg-card)';
            menu.style.boxShadow = 'var(--shadow-lg)';
            menu.style.borderRadius = 'var(--radius)';
            menu.style.padding = '5px 0';
            menu.style.zIndex = '9999';
            menu.style.border = '1px solid var(--border)';
            menu.style.display = 'flex';
            menu.style.flexDirection = 'column';
            menu.style.width = '140px';

            const adminOptions = AppState.user.role === 'admin' ? `
                <button class="btn btn-ghost" onclick="document.getElementById('dash-context-menu').remove(); if(typeof openEditItemModal === 'function') openEditItemModal('${itemId}');" style="justify-content:flex-start; border-radius:0; width:100%; border:none;">✎ Bewerk</button>
                <button class="btn btn-ghost" onclick="document.getElementById('dash-context-menu').remove(); deleteSingleDashItem('${itemId}');" style="justify-content:flex-start; border-radius:0; width:100%; border:none; color:var(--red);">✕ Verwijder</button>
            ` : `<div style="padding: 0.5rem; font-size: 0.8rem; color: var(--text-muted); text-align: center;">Admin only</div>`;

            menu.innerHTML = adminOptions;
            document.body.appendChild(menu);
        });
    });

    document.addEventListener('click', () => {
        document.getElementById('dash-context-menu')?.remove();
    });

    if (AppState.user.role === 'side') {
        checkForPopupNotifications();
    }

    const clearAllBtn = document.getElementById('btn-clear-all-filters');
    if (clearAllBtn) clearAllBtn.addEventListener('click', () => {
        AppState.columnFilters = {}; saveAppState(); renderApp();
    });

    const clearAllHeaderBtn = document.getElementById('btn-clear-all-filters-header');
    if (clearAllHeaderBtn) clearAllHeaderBtn.addEventListener('click', () => {
        AppState.columnFilters = {}; saveAppState(); renderApp();
    });

    // ── Inline Column Filters ──────────────────────────
    document.querySelectorAll('.th-filter-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const col = btn.dataset.col;
            const panel = document.getElementById(`filter-panel-${col}`);
            document.querySelectorAll('.filter-panel').forEach(p => {
                if (p.id !== `filter-panel-${col}`) p.classList.add('hidden');
            });
            panel.classList.toggle('hidden');
            
            // Store open state for re-render
            if (!panel.classList.contains('hidden')) {
                window._lastOpenFilter = col;
            } else {
                window._lastOpenFilter = null;
            }
        });
    });

    document.querySelectorAll('.filter-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const col = cb.dataset.col;
            const val = cb.dataset.val;
            if (!AppState.columnFilters[col]) AppState.columnFilters[col] = [];
            if (cb.checked) {
                if (!AppState.columnFilters[col].includes(val)) AppState.columnFilters[col].push(val);
            } else {
                AppState.columnFilters[col] = AppState.columnFilters[col].filter(v => v !== val);
            }
            saveAppState(); renderApp();
        });
    });

    document.querySelectorAll('.filter-clear-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const col = btn.dataset.col;
            // Check if it's a date col to reset appropriately
            const isDate = document.querySelector(`.date-filter-start[data-col="${col}"]`) !== null;
            AppState.columnFilters[col] = isDate ? { start: '', end: '' } : [];
            saveAppState(); renderApp();
        });
    });

    // Date Range Apply Binding
    document.querySelectorAll('.date-filter-apply').forEach(btn => {
        btn.addEventListener('click', () => {
            const col = btn.dataset.col;
            const startInput = document.getElementById(`date-start-${col}`);
            const endInput = document.getElementById(`date-end-${col}`);
            
            if (startInput && endInput) {
                AppState.columnFilters[col] = { 
                    start: startInput.value, 
                    end: endInput.value 
                };
                window._lastOpenFilter = null; // Clear to close panel on re-render
                saveAppState(); renderApp();
            }
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.filter-panel').forEach(p => p.classList.add('hidden'));
    });
    document.querySelectorAll('.th-filterable').forEach(th => {
        th.addEventListener('click', e => e.stopPropagation());
    });

    // Restore last open filter panel
    if (window._lastOpenFilter) {
        const panel = document.getElementById(`filter-panel-${window._lastOpenFilter}`);
        if (panel) panel.classList.remove('hidden');
    }
}

function checkForPopupNotifications() {
    if (AppState.user.role !== 'side') return;
    
    const newDateChanges = AppState.notifications.filter(n => n.type === 'dateChange' && !n.popupShown);
    const newArrivals = AppState.notifications.filter(n => n.type === 'arrival' && !n.popupShown);
    const newApprovals = AppState.notifications.filter(n => n.type === 'callOffResult' && !n.popupShown);
    
    if (!newDateChanges.length && !newArrivals.length && !newApprovals.length) return;
    
    let contentHtml = '';
    
    // Call-Off Approvals (Requested vs Approved)
    if (newApprovals.length > 0) {
        let rows = newApprovals.map(n => {
            const isChanged = n.requestedDate !== n.approvedDate;
            return `
            <tr>
                <td><strong>${esc(n.productName)}</strong></td>
                <td><span class="${isChanged ? 'date-old' : ''}">${esc(n.requestedDate || '-')}</span></td>
                <td><span class="date-new">${esc(n.approvedDate)}</span></td>
            </tr>`;
        }).join('');
        
        contentHtml += `
            <p><strong>Afroep Goedgekeurd:</strong></p>
            <table class="popup-table" style="margin-bottom: 1.5rem;">
                <thead>
                    <tr><th>Materiaal</th><th>Verzocht</th><th>Bevestigd</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    // Date Changes Table
    if (newDateChanges.length > 0) {
        let rows = newDateChanges.map(n => `
            <tr>
                <td><strong>${esc(n.productName || 'Onbekend')}</strong></td>
                <td><span class="date-old">${esc(n.oldDate || '-')}</span></td>
                <td><span class="date-new">${esc(n.newDate)}</span></td>
            </tr>
        `).join('');
        
        contentHtml += `
            <p><strong>Leverdatum gewijzigd:</strong></p>
            <table class="popup-table" style="margin-bottom: 1.5rem;">
                <thead>
                    <tr><th>Materiaal</th><th>Oude Datum</th><th>Nieuwe Datum</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
    
    // Arrivals Table
    if (newArrivals.length > 0) {
        let rows = newArrivals.map(n => `
            <tr>
                <td><strong>${esc(n.productName || 'Onbekend')}</strong></td>
                <td>${esc(n.location)}</td>
                <td><span class="date-new">${esc(n.confirmedDate)}</span></td>
            </tr>
        `).join('');
        
        contentHtml += `
            <p><strong>Nieuw op locatie (On-Site):</strong></p>
            <table class="popup-table">
                <thead>
                    <tr><th>Materiaal</th><th>Locatie</th><th>Datum</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
    
    openModal('Status Updates', null, `
        <div class="popup-alert">
            <div class="popup-icon">${ICONS.bell}</div>
            ${contentHtml}
        </div>
    `, 'Begrepen', () => {
        [...newDateChanges, ...newArrivals, ...newApprovals].forEach(n => n.popupShown = true);
        saveAppState();
    });
}
