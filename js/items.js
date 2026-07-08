/* ========================================================
   ITEMS.JS — Item CRUD, Edit Modal with Photos, Move Logic
   ======================================================== */

// Store temp photos for add/edit modal
let _tempPhotos = [];

// ── Add Item ───────────────────────────────────────────
function openAddItemModal() {
    _tempPhotos = [];
    const tab = AppState.activeTab;
    const fieldsHTML = getColumnsForTab(tab).map(c => {
        if (c.key === 'commissionNumber' || c.key === 'assetName') {
            return `
            <div class="input-group autosuggest-group" style="position: relative;">
                <label class="input-label">${c.label}</label>
                <input type="text" class="input-field autosuggest-input" 
                       data-key="${c.key}" id="as-${c.key}" autocomplete="off"
                       placeholder="Enter ${c.label.toLowerCase()}…">
                <div class="dropdown-menu autosuggest-dropdown hidden" id="dropdown-${c.key}" style="position:absolute; top:calc(100% + 4px); left:0; right:0; max-height:200px; overflow-y:auto; z-index:100; background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-sm); box-shadow:var(--shadow-md);"></div>
            </div>`;
        }
        return `
        <div class="input-group">
            <label class="input-label">${c.label}</label>
            ${c.type === 'mounted' ? `
                <select class="input-field" data-key="${c.key}">
                    <option value="">— Select —</option>
                    <option value="ja">Ja</option>
                    <option value="nee">Nee</option>
                </select>
            ` : `
                <input type="${c.type === 'date' ? 'date' : 'text'}" class="input-field" data-key="${c.key}" placeholder="Enter ${c.label.toLowerCase()}…">
            `}
        </div>`;
    }).join('');

    const photoHTML = `
        <div class="input-group">
            <label class="input-label">Photos (max 4)</label>
            <div class="photo-upload-zone" id="photo-drop-zone">
                <label class="photo-upload-label">
                    ${ICONS.camera}
                    <span>Click to select photos</span>
                    <input type="file" id="modal-photo-input" accept="image/*" multiple>
                </label>
            </div>
            <div class="photo-previews" id="photo-previews"></div>
        </div>
    `;

    openModal('Add New Item', 'Fill in all fields and optionally attach photos.', fieldsHTML + photoHTML, 'Add Item', async () => {
        const root = document.querySelector('#modal-root .modal-body');
        const inputs = root.querySelectorAll('.input-field');
        const item = createBlankItem();
        let hasEmpty = false;

        inputs.forEach(inp => {
            const val = inp.value.trim();
            if (!val) hasEmpty = true;
            item[inp.dataset.key] = val;
        });

        if (hasEmpty) {
            showToast('All fields are required.', 'error');
            return false;
        }

        item.status = tab;
        
        // Zet de data:image/jpeg;base64,... strings om naar het vereiste JSON formaat
        item.attachments = _tempPhotos.map(dataUrl => {
            const parts = dataUrl.split(',');
            const mimeType = parts[0].match(/:(.*?);/)[1];
            const base64 = parts[1];
            return { base64, mimeType };
        });

        if (window.currentFormLiftId) {
            item.liftId = window.currentFormLiftId;
        }
        
        // ── SYNC MET CLOUD: addStockItem ──
        const submitBtn = document.getElementById('modal-confirm-btn');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Syncing...'; submitBtn.disabled = true;

        // Exact de payload structuur die de backend verwacht
        const cloudPayload = {
            id: item.id,
            targetTab: tab === 'ordered' ? 'Ordered' : tab === 'supplier' ? 'Supplier' : 'On-Site',
            commissionNumber: item.commissionNumber || "",
            assetName: item.assetName || "",
            productName: item.productName || "",
            deliveryAddress: item.deliveryAddress || "",
            deliveryDate: item.deliveryDate || "",
            attachments: item.attachments  // Array van { base64, mimeType }
        };

        const response = await syncMetCloud("addStockItem", cloudPayload);
        
        if (response && response.status === "success") {
            showToast('\u2705 Item opgeslagen in Google Sheets!', 'success');
        } else {
            showToast('Item lokaal opgeslagen (cloud offline)', 'info');
        }

        submitBtn.innerText = originalText; submitBtn.disabled = false;
        // ────────────────────────────────

        // Sla lokaal op (zonder base64 foto's, die zijn al in de cloud)
        item.attachments = item.attachments.map(a => ({ placeholder: true, mimeType: a.mimeType }));
        AppState.items.push(item);
        _tempPhotos = [];
        window.currentFormLiftId = null;
        saveAppState(); renderApp();
        return true;
    });

    bindAutoSuggest();

    // Bind photo input
    setTimeout(() => {
        const photoInput = document.getElementById('modal-photo-input');
        if (photoInput) {
            photoInput.addEventListener('change', () => {
                handlePhotoSelection(photoInput.files);
            });
        }
    }, 100);
}

// ── Edit Item ──────────────────────────────────────────
function openEditItemModal(id) {
    const item = AppState.items.find(i => i.id === id);
    if (!item) return;

    _tempPhotos = [...(item.attachments || [])];

    const tab = item.status;
    const fieldsHTML = getColumnsForTab(tab).map(c => {
        const val = item[c.key] || '';
        const validClass = val.trim() ? 'is-valid' : '';
        
        if (c.key === 'commissionNumber' || c.key === 'assetName') {
            return `
            <div class="input-group autosuggest-group" style="position: relative;">
                <label class="input-label">${c.label}</label>
                <input type="text" class="input-field autosuggest-input ${validClass}" 
                       data-key="${c.key}" id="as-${c.key}" autocomplete="off"
                       placeholder="Enter ${c.label.toLowerCase()}…" value="${esc(val)}">
                <div class="dropdown-menu autosuggest-dropdown hidden" id="dropdown-${c.key}" style="position:absolute; top:calc(100% + 4px); left:0; right:0; max-height:200px; overflow-y:auto; z-index:100; background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-sm); box-shadow:var(--shadow-md);"></div>
            </div>`;
        }

        if (c.type === 'mounted') {
            return `
            <div class="input-group">
                <label class="input-label">${c.label}</label>
                <select class="input-field ${validClass}" data-key="${c.key}">
                    <option value="">— Select —</option>
                    <option value="ja" ${val === 'ja' ? 'selected' : ''}>Ja</option>
                    <option value="nee" ${val === 'nee' ? 'selected' : ''}>Nee</option>
                </select>
            </div>`;
        }
        return `
        <div class="input-group">
            <label class="input-label">${c.label}</label>
            <input type="${c.type === 'date' ? 'date' : 'text'}" class="input-field ${validClass}" data-key="${c.key}" value="${esc(val)}">
        </div>`;
    }).join('');

    const photoHTML = `
        <div class="input-group">
            <label class="input-label">Photos (max 4)</label>
            <div class="photo-upload-zone" id="photo-drop-zone">
                <label class="photo-upload-label">
                    ${ICONS.camera}
                    <span>Click to add more photos</span>
                    <input type="file" id="modal-photo-input" accept="image/*" multiple>
                </label>
            </div>
            <div class="photo-previews" id="photo-previews">${renderTempPhotosPreviews()}</div>
        </div>
    `;

    openModal('Edit Item', 'Update fields and manage photos.', fieldsHTML + photoHTML, 'Save Changes', () => {
        const root = document.querySelector('#modal-root .modal-body');
        const inputs = root.querySelectorAll('.input-field');
        let hasEmpty = false;

        inputs.forEach(inp => {
            const val = inp.value.trim();
            if (!val) hasEmpty = true;
            item[inp.dataset.key] = val;
        });

        if (hasEmpty) {
            showToast('All fields must be filled.', 'error');
            return false;
        }

        item.attachments = [..._tempPhotos];
        if (window.currentFormLiftId) {
            item.liftId = window.currentFormLiftId;
        }
        
        _tempPhotos = [];
        window.currentFormLiftId = null;
        saveAppState(); renderApp();
        showToast('Item updated successfully!', 'success');
        return true;
    });

    if (item.liftId) {
        window.currentFormLiftId = item.liftId;
    }
    bindAutoSuggest();

    // Bind photo input
    setTimeout(() => {
        const photoInput = document.getElementById('modal-photo-input');
        if (photoInput) {
            photoInput.addEventListener('change', () => {
                handlePhotoSelection(photoInput.files);
            });
        }
        bindPhotoRemoveButtons();
    }, 100);
}

// ── Photo helpers ──────────────────────────────────────
function handlePhotoSelection(files) {
    const remaining = 4 - _tempPhotos.length;
    if (remaining <= 0) {
        showToast('Maximum 4 photos allowed.', 'error');
        return;
    }
    const toProcess = Array.from(files).slice(0, remaining);

    let processed = 0;
    toProcess.forEach(f => {
        const r = new FileReader();
        r.onload = ev => {
            _tempPhotos.push(ev.target.result);
            processed++;
            if (processed === toProcess.length) {
                updatePhotoPreview();
            }
        };
        r.readAsDataURL(f);
    });

    if (files.length > remaining) {
        showToast(`Only ${remaining} more photo${remaining > 1 ? 's' : ''} allowed, extra files were ignored.`, 'info');
    }
}

function updatePhotoPreview() {
    const container = document.getElementById('photo-previews');
    if (container) {
        container.innerHTML = renderTempPhotosPreviews();
        bindPhotoRemoveButtons();
    }
}

function renderTempPhotosPreviews() {
    return _tempPhotos.map((src, i) => `
        <div class="photo-preview-item">
            <img class="photo-preview-thumb" src="${src}" alt="Photo ${i+1}">
            <button class="photo-remove-btn" data-idx="${i}" title="Remove">&times;</button>
        </div>
    `).join('');
}

function bindPhotoRemoveButtons() {
    document.querySelectorAll('.photo-remove-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.idx);
            _tempPhotos.splice(idx, 1);
            updatePhotoPreview();
        });
    });
}

// ── Helpers voor tab namen ─────────────────────────────
function getApiTabName(tabKey) {
    if (tabKey === 'ordered') return 'Ordered';
    if (tabKey === 'supplier') return 'Supplier';
    if (tabKey === 'onsite') return 'On-Site';
    return tabKey;
}

// ── Move Logic ─────────────────────────────────────────
function moveItem(id, to) {
    const item = AppState.items.find(i => i.id === id);
    if (!item) return;
    const from = item.status;

    if (from === 'ordered' && to === 'supplier') {
        openModal('Move to Supplier', 'Enter the delivery date.', `
            <div class="input-group">
                <label class="input-label">Delivery Date (Required)</label>
                <input type="date" class="input-field" data-key="deliveryDate">
            </div>
        `, 'Confirm Move', async () => {
            const d = document.querySelector('#modal-root .input-field[data-key="deliveryDate"]').value;
            if (!d) { showToast('Delivery date is required.', 'error'); return false; }
            
            const submitBtn = document.getElementById('modal-confirm-btn');
            const orig = submitBtn.innerText; submitBtn.innerText = 'Syncing...'; submitBtn.disabled = true;

            // Exact het format dat de backend vereist voor moveItem
            const cloudPayload = {
                id: item.id,
                sourceTab: "Ordered",
                targetTab: "Supplier",
                newData: {
                    commissionNumber: item.commissionNumber || "",
                    assetName: item.assetName || "",
                    productName: item.productName || item.name || "",
                    leverRetourDatum: d
                }
            };
            const response = await syncMetCloud("moveItem", cloudPayload);
            if (response && response.status === "success") {
                showToast('\u2705 Item verplaatst in Google Sheets!', 'success');
            } else {
                showToast('Lokaal verplaatst (cloud offline)', 'info');
            }
            submitBtn.innerText = orig; submitBtn.disabled = false;

            item.deliveryDate = d;
            item.status = 'supplier';
            saveAppState(); renderApp();
            return true;
        });
    }

    else if (from === 'supplier' && to === 'onsite') {
        openModal('Move to On-Site', 'Voer de ruimte en datum van aankomst in.', `
            <div class="input-group">
                <label class="input-label">Ruimte/Locatie (Required)</label>
                <input type="text" class="input-field" data-key="roomLocation" placeholder="Bijv. Opslag A, Ruimte 102...">
            </div>
            <div class="input-group">
                <label class="input-label">Bevestigde Datum (Required)</label>
                <input type="date" class="input-field" data-key="confirmedDate" value="${new Date().toISOString().split('T')[0]}">
            </div>
        `, 'Confirm Move', async () => {
            const root = document.querySelector('#modal-root .modal-body');
            const room = root.querySelector('[data-key="roomLocation"]').value.trim();
            const conf = root.querySelector('[data-key="confirmedDate"]').value;
            if (!room || !conf) { showToast('Beide velden zijn verplicht.', 'error'); return false; }
            
            const submitBtn = document.getElementById('modal-confirm-btn');
            const orig = submitBtn.innerText; submitBtn.innerText = 'Syncing...'; submitBtn.disabled = true;

            // Exact het format dat de backend vereist voor moveItem
            const cloudPayload = {
                id: item.id,
                sourceTab: "Supplier",
                targetTab: "On-Site",
                newData: {
                    commissionNumber: item.commissionNumber || "",
                    assetName: item.assetName || "",
                    productName: item.productName || item.name || "",
                    leverRetourDatum: item.deliveryDate || conf
                }
            };
            const response = await syncMetCloud("moveItem", cloudPayload);
            if (response && response.status === "success") {
                showToast('Item verplaatst in cloud!', 'success');
            } else {
                showToast('Lokaal verplaatst (Offline)', 'info');
            }
            submitBtn.innerText = orig; submitBtn.disabled = false;

            item.roomLocation = room;
            item.confirmedDate = conf;
            item.status = 'onsite';
            item.callOffStatus = null;
            item.arrivalDate = null;
            
            saveAppState(); renderApp();
            return true;
        });
    }

    else if (from === 'onsite' && to === 'supplier') {
        openModal('Return to Supplier', 'Enter return details and upload a photo.', `
            <div class="input-group">
                <label class="input-label">Retour datum (Required)</label>
                <input type="date" class="input-field" data-key="returnDate">
            </div>
            <div class="input-group">
                <label class="input-label">Retour nummer (Required)</label>
                <input type="text" class="input-field" data-key="returnNumber" placeholder="Enter return number">
            </div>
            <div class="input-group">
                <label class="input-label">Photo (Required)</label>
                <input type="file" class="input-field" id="return-photo-input" accept="image/*">
            </div>
        `, 'Confirm Return', async () => {
            const root = document.querySelector('#modal-root .modal-body');
            const rd = root.querySelector('[data-key="returnDate"]').value;
            const rn = root.querySelector('[data-key="returnNumber"]').value.trim();
            const fi = document.getElementById('return-photo-input');
            if (!rd || !rn || !fi.files.length) {
                showToast('All fields and a photo are required.', 'error');
                return false;
            }
            
            const submitBtn = document.getElementById('modal-confirm-btn');
            const orig = submitBtn.innerText; submitBtn.innerText = 'Syncing...'; submitBtn.disabled = true;

            // Exact het format dat de backend vereist voor moveItem
            const cloudPayload = {
                id: item.id,
                sourceTab: "On-Site",
                targetTab: "Supplier",
                newData: {
                    commissionNumber: item.commissionNumber || "",
                    assetName: item.assetName || "",
                    productName: item.productName || item.name || "",
                    leverRetourDatum: rd
                }
            };
            const response = await syncMetCloud("moveItem", cloudPayload);
            if (response && response.status === "success") {
                showToast('\u2705 Item geretourneerd in Google Sheets!', 'success');
            } else {
                showToast('Lokaal geretourneerd (cloud offline)', 'info');
            }
            submitBtn.innerText = orig; submitBtn.disabled = false;

            const reader = new FileReader();
            reader.onload = ev => {
                item.attachments.push({ placeholder: true, mimeType: 'image/jpeg' });
                item.returnDate = rd;
                item.returnNumber = rn;
                item.status = 'supplier';
                saveAppState(); renderApp();
            };
            reader.readAsDataURL(fi.files[0]);
            return true;
        });
    }
}

// ── Refined Multi-Step Call Off Flow ──────────────────
window.requestCallOff = function(id) {
    const item = AppState.items.find(i => i.id === id);
    if (!item) return;
    
    openModal('Afroep Aanvragen', 'Wanneer zou je het materiaal willen ontvangen?', `
        <div class="input-group">
            <label class="input-label">Gewenste Leverdatum (Required)</label>
            <input type="date" class="input-field" id="req-calloff-date" value="${new Date().toISOString().split('T')[0]}">
        </div>
    `, 'Aanvragen', async () => {
        const reqDate = document.getElementById('req-calloff-date').value;
        if (!reqDate) { showToast('Datum is verplicht.', 'error'); return false; }

        const submitBtn = document.getElementById('modal-confirm-btn');
        const orig = submitBtn.innerText; submitBtn.innerText = 'Syncing...'; submitBtn.disabled = true;

        // Exact het format dat de backend vereist voor moveItem (item blijft in Supplier tab)
        const cloudPayload = {
            id: item.id,
            sourceTab: "Supplier",
            targetTab: "Supplier",
            newData: {
                commissionNumber: item.commissionNumber || "",
                assetName: item.assetName || "",
                productName: item.productName || item.name || "",
                leverRetourDatum: reqDate
            }
        };

        const response = await syncMetCloud("moveItem", cloudPayload);
        if (response && response.status === "success") {
            showToast('\u2705 Afroep opgeslagen in Google Sheets!', 'success');
        } else {
            showToast('Lokaal afgeroepen (cloud offline)', 'info');
        }
        submitBtn.innerText = orig; submitBtn.disabled = false;

        item.callOffStatus = 'requested';
        item.requestedDate = reqDate;
        
        const title = item.productName || item.assetName || item.commissionNumber || '(unnamed item)';
        AppState.notifications.push({
            forRole: 'admin',
            message: `Uitvoerder heeft afroep aangevraagd voor: ${esc(title)} (Gewenst: ${reqDate})`,
            time: new Date().toLocaleString()
        });
        
        saveAppState(); renderApp();
        return true;
    });
};

window.approveCallOff = function(id) {
    const item = AppState.items.find(i => i.id === id);
    if (!item) return;
    
    openModal('Approve & Set Date', 'Wanneer wordt het materiaal verwacht?', `
        <div class="input-group">
            <label class="input-label">Bevestigde Leverdatum (Required)</label>
            <input type="date" class="input-field" data-key="arrivalDate" value="${item.requestedDate || ''}">
        </div>
    `, 'Approve', () => {
        const root = document.querySelector('#modal-root .modal-body');
        const dat = root.querySelector('[data-key="arrivalDate"]').value;
        if (!dat) { showToast('Leverdatum is verplicht.', 'error'); return false; }
        
        const requestedDate = item.requestedDate;
        item.callOffStatus = 'approved';
        item.arrivalDate = dat;
        
        const title = item.productName || item.assetName || item.commissionNumber || '(unnamed item)';
        
        // Notification logic: Always notify, but mark as "result" for popup
        AppState.notifications.push({
            id: Date.now(),
            itemId: item.id,
            productName: title,
            requestedDate: requestedDate,
            approvedDate: dat,
            type: 'callOffResult',
            forRole: 'side',
            time: new Date().toLocaleString(),
            popupShown: false
        });
        
        saveAppState(); renderApp();
        showToast('Afroep goedgekeurd!', 'success');
        return true;
    });
};

window.processArrival = function(id) {
    const item = AppState.items.find(i => i.id === id);
    if (!item) return;
    
    openModal('Process Arrival', 'Materiaal is binnen. Waar ligt het?', `
        <div class="input-group">
            <label class="input-label">Ruimte/Locatie (Required)</label>
            <input type="text" class="input-field" data-key="roomLocation" placeholder="Bijv. Opslag A, Ruimte 102...">
        </div>
        <div class="input-group">
            <label class="input-label">Bevestigde Datum (Required)</label>
            <input type="date" class="input-field" data-key="confirmedDate" value="${new Date().toISOString().split('T')[0]}">
        </div>
    `, 'Bevestig Aankomst', () => {
        const root = document.querySelector('#modal-root .modal-body');
        const room = root.querySelector('[data-key="roomLocation"]').value.trim();
        const conf = root.querySelector('[data-key="confirmedDate"]').value;
        
        if (!room || !conf) { showToast('Beide velden zijn verplicht.', 'error'); return false; }
        
        // Move to onsite
        item.status = 'onsite';
        item.roomLocation = room;
        item.confirmedDate = conf;
        
        // Clear workflow flags
        item.callOffStatus = null;
        item.arrivalDate = null;
        item.requestedDate = null;
        
        AppState.notifications.push({
            id: Date.now(),
            itemId: item.id,
            productName: item.productName || item.assetName || '(unnamed item)',
            location: room,
            confirmedDate: conf,
            type: 'arrival',
            forRole: 'side',
            time: new Date().toLocaleString(),
            popupShown: false
        });
        
        saveAppState(); renderApp();
        showToast('Materiaal verwerkt naar On-Site.', 'success');
        return true;
    });
};

window.changeArrivalDate = function(id) {
    const item = AppState.items.find(i => i.id === id);
    if (!item) return;
    
    openModal('Wijzig Leverdatum', 'Selecteer een nieuwe verwachte leverdatum.', `
        <div class="input-group">
            <label class="input-label">Nieuwe Leverdatum (Required)</label>
            <input type="date" class="input-field" data-key="arrivalDate" value="${item.arrivalDate || ''}">
        </div>
    `, 'Update Datum', () => {
        const root = document.querySelector('#modal-root .modal-body');
        const dat = root.querySelector('[data-key="arrivalDate"]').value;
        if (!dat) { showToast('Leverdatum is verplicht.', 'error'); return false; }
        
        const oldDate = item.arrivalDate;
        item.arrivalDate = dat;
        
        const title = item.productName || item.assetName || item.commissionNumber || '(unnamed item)';
            AppState.notifications.push({
                id: Date.now(),
                itemId: item.id,
                productName: item.productName,
                oldDate: oldDate,
                newDate: dat,
                type: 'dateChange',
                forRole: 'side',
                time: new Date().toLocaleString(),
                popupShown: false
            });
            saveAppState();
            renderApp();
        showToast('Leverdatum bijgewerkt en uitvoerder op de hoogte gebracht.', 'success');
        return true;
    });
};

// ── Notifications ──────────────────────────────────────
function showNotifications() {
    const myNotifs = getMyNotifications();
    if (!myNotifs.length) {
        openModal('Notifications', null, '<p class="text-muted">No new notifications.</p>', 'Close', () => true);
        return;
    }
    const list = myNotifs.map(n => `
        <div class="notif-item">
            <span class="notif-dot"></span>
            <div>
                <div class="notif-text">${n.message || `<strong>Update:</strong> ${esc(n.productName)}`}</div>
                <div class="notif-time">${n.time}</div>
            </div>
        </div>
    `).join('');
    openModal('Notifications', `${myNotifs.length} new message(s)`, `<div class="notif-list">${list}</div>`, 'Clear All', () => {
        // Clear only the current user's notifications
        AppState.notifications = (AppState.notifications || []).filter(n => n.forRole && n.forRole !== AppState.user.role);
        saveAppState(); renderApp();
        showToast('Notifications cleared.', 'success');
        return true;
    });
}

// ── Photo Upload (inline table button) ─────────────────
function uploadPhoto(itemId) {
    const item = AppState.items.find(i => i.id === itemId);
    if ((item.attachments || []).length >= 4) {
        showToast('Maximum 4 photos per item.', 'error');
        return;
    }
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
    inp.onchange = () => {
        const remaining = 4 - (item.attachments || []).length;
        Array.from(inp.files).slice(0, remaining).forEach(f => {
            const r = new FileReader();
            r.onload = ev => { item.attachments.push(ev.target.result); saveAppState(); renderApp(); };
            r.readAsDataURL(f);
        });
        showToast('Photo(s) added.', 'success');
    };
    inp.click();
}

// ── Helpers ────────────────────────────────────────────
// ── Bulk Actions ──────────────────────────────────────
window.bulkRequestCallOff = function() {
    const selected = AppState.items.filter(i => _selectedItems.includes(i.id) && i.status === 'supplier' && !i.callOffStatus);
    if (!selected.length) { showToast('Niks geselecteerd dat afgeroepen kan worden.', 'error'); return; }

    openModal('Bulk Afroep Aanvragen', `Geselecteerd: ${selected.length} items. Wanneer wil je dit ontvangen?`, `
        <div class="input-group">
            <label class="input-label">Gewenste Leverdatum</label>
            <input type="date" class="input-field" id="bulk-req-date" value="${new Date().toISOString().split('T')[0]}">
        </div>
    `, 'Bulk Aanvragen', async () => {
        const reqDate = document.getElementById('bulk-req-date').value;
        if (!reqDate) { showToast('Datum is verplicht.', 'error'); return false; }

        // ── SYNC MET CLOUD (Items Afroepen) ──
        const submitBtn = document.getElementById('modal-confirm-btn');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Syncing...';
        submitBtn.disabled = true;

        // Stuur per item een moveItem request met exact de vereiste structuur
        for (const item of selected) {
            const cloudPayload = {
                id: item.id,
                sourceTab: "Supplier",
                targetTab: "Supplier",
                newData: {
                    commissionNumber: item.commissionNumber || "",
                    assetName: item.assetName || "",
                    productName: item.productName || item.name || "",
                    leverRetourDatum: reqDate
                }
            };
            await syncMetCloud("moveItem", cloudPayload);
        }
        
        showToast('Items succesvol afgeroepen in de cloud!', 'success');

        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
        // ────────────────────────────────

        selected.forEach(item => {
            item.callOffStatus = 'requested';
            item.requestedDate = reqDate;
            
            AppState.notifications.push({
                forRole: 'admin',
                message: `Bulk afroep aangevraagd voor: ${esc(item.productName || 'item')} (Gewenst: ${reqDate})`,
                time: new Date().toLocaleString()
            });
        });

        _selectedItems = [];
        saveAppState(); renderApp();
        return true;
    });
};

window.bulkApproveCallOff = function() {
    const selected = AppState.items.filter(i => _selectedItems.includes(i.id) && i.callOffStatus === 'requested');
    if (!selected.length) { showToast('Geen aanvragen geselecteerd.', 'error'); return; }

    openModal('Bulk Goedkeuren', `Geselecteerd: ${selected.length} aanvragen. Wanneer worden deze verwacht?`, `
        <div class="input-group">
            <label class="input-label">Bevestigde Leverdatum</label>
            <input type="date" class="input-field" id="bulk-appr-date" value="${selected[0].requestedDate || ''}">
        </div>
    `, 'Bulk Goedkeuren', () => {
        const dat = document.getElementById('bulk-appr-date').value;
        if (!dat) { showToast('Leverdatum is verplicht.', 'error'); return false; }

        selected.forEach(item => {
            const requestedDate = item.requestedDate;
            item.callOffStatus = 'approved';
            item.deliveryDate = dat;
            
            AppState.notifications.push({
                id: Date.now() + Math.random(),
                itemId: item.id,
                productName: item.productName || 'item',
                requestedDate: requestedDate,
                approvedDate: dat,
                type: 'callOffResult',
                forRole: 'side',
                time: new Date().toLocaleString(),
                popupShown: false
            });
        });

        _selectedItems = [];
        saveAppState(); renderApp();
        showToast(`${selected.length} items goedgekeurd!`, 'success');
        return true;
    });
};

window.bulkProcessArrival = function() {
    const selected = AppState.items.filter(i => _selectedItems.includes(i.id) && i.status === 'supplier' && i.callOffStatus === 'approved');
    if (!selected.length) { showToast('Selecteer goedgekeurde items die binnen zijn.', 'error'); return; }

    openModal('Bulk Verwerken naar On-Site', `${selected.length} items binnen. Waar liggen deze?`, `
        <div class="input-group">
            <label class="input-label">Ruimte/Locatie</label>
            <input type="text" class="input-field" id="bulk-room" placeholder="Bijv. Opslag A...">
        </div>
        <div class="input-group">
            <label class="input-label">Bevestigde Datum</label>
            <input type="date" class="input-field" id="bulk-conf-date" value="${new Date().toISOString().split('T')[0]}">
        </div>
    `, 'Bulk Bevestigen', () => {
        const room = document.getElementById('bulk-room').value.trim();
        const conf = document.getElementById('bulk-conf-date').value;
        if (!room || !conf) { showToast('Beide velden zijn verplicht.', 'error'); return false; }

        selected.forEach(item => {
            item.status = 'onsite';
            item.roomLocation = room;
            item.confirmedDate = conf;
            item.callOffStatus = null;
            item.arrivalDate = null;
            item.requestedDate = null;

            AppState.notifications.push({
                id: Date.now() + Math.random(),
                itemId: item.id,
                productName: item.productName || 'item',
                location: room,
                confirmedDate: conf,
                type: 'arrival',
                forRole: 'side',
                time: new Date().toLocaleString(),
                popupShown: false
            });
        });

        _selectedItems = [];
        saveAppState(); renderApp();
        showToast(`${selected.length} items verwerkt naar On-Site.`, 'success');
        return true;
    });
};

window.bulkMoveToSupplier = function() {
    const selected = AppState.items.filter(i => _selectedItems.includes(i.id) && i.status === 'ordered');
    if (!selected.length) { showToast('Selecteer bestelde items.', 'error'); return; }

    openModal('Bulk Verplaatsen naar Supplier', `${selected.length} items naar Supplier verplaatsen?`, `
        <div class="input-group">
            <label class="input-label">Verwachte Leverdatum</label>
            <input type="date" class="input-field" id="bulk-supplier-date" value="${new Date().toISOString().split('T')[0]}">
        </div>
    `, 'Bevestig Bulk Move', () => {
        const dat = document.getElementById('bulk-supplier-date').value;
        if (!dat) { showToast('Datum is verplicht.', 'error'); return false; }

        selected.forEach(item => {
            item.status = 'supplier';
            item.deliveryDate = dat;
        });

        _selectedItems = [];
        saveAppState(); renderApp();
        showToast(`${selected.length} items naar Supplier verplaatst.`, 'success');
        return true;
    });
};

function createBlankItem() {
    return {
        id: uid(), projectId: AppState.activeProject, status: '',
        commissionNumber: '', assetName: '', productName: '',
        deliveryAddress: '', deliveryDate: '', returnDate: '',
        returnNumber: '', roomLocation: '', confirmedDate: '', attachments: []
    };
}

function bulkProcessReturn(itemIds) {
    const selectedItems = AppState.items.filter(i => itemIds.includes(i.id));
    const today = new Date().toISOString().split('T')[0];
    
    let itemCards = selectedItems.map(item => `
        <div class="bulk-return-card" data-id="${item.id}">
            <div class="bulk-return-card-header">
                <div class="bulk-return-card-info">
                    <h4>${esc(item.productName)}</h4>
                    <span>${esc(item.assetName)} — ${esc(item.commissionNumber || item.commissionNr || '') || 'Geen comm nr'}</span>
                </div>
                <div class="badge badge-green">On-Site</div>
            </div>
            <div class="bulk-return-card-body">
                <div class="input-group" style="margin:0">
                    <label class="input-label">Retour Nummer</label>
                    <input type="text" class="input-field bulk-rn" placeholder="Bijv. RET-12345" data-id="${item.id}">
                </div>
                <div class="bulk-return-card-photo">
                    <div class="input-group" style="margin:0; flex:1">
                        <label class="input-label">Foto Upload</label>
                        <input type="file" class="bulk-photo-input" id="bulk-photo-${item.id}" accept="image/*" style="display:none">
                        <button class="btn btn-ghost btn-sm btn-full" onclick="document.getElementById('bulk-photo-${item.id}').click()">${ICONS.camera} Kies Foto</button>
                    </div>
                    <div id="bulk-preview-${item.id}" class="thumb-preview thumb-circle" style="width:48px; height:48px; overflow:hidden; border:1px dashed var(--border); display:flex; align-items:center; justify-content:center;">
                        <span style="font-size:1.5rem; opacity:0.2">+</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    const bodyHTML = `
        <div class="input-group" style="margin-bottom: 1.5rem; background: var(--bg-surface); padding: 1.25rem; border-radius: var(--radius); border: 1px solid var(--border);">
            <label class="input-label">Algemene Retour Datum</label>
            <input type="date" class="input-field" id="bulk-return-date" value="${today}">
            <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">Deze datum wordt voor alle geselecteerde materialen gebruikt.</p>
        </div>
        <div class="bulk-return-items" style="max-height: 55vh; overflow-y: auto; padding-right: 8px;">
            ${itemCards}
        </div>
    `;

    openModal('Bulk Retourneren', null, bodyHTML, 'Bevestig Bulk Retour', async () => {
        const rd = document.getElementById('bulk-return-date').value;
        const cards = document.querySelectorAll('.bulk-return-card');
        const updates = [];
        let hasError = false;

        for (const card of cards) {
            const id = card.dataset.id;
            const rnInp = card.querySelector('.bulk-rn');
            const fileInp = document.getElementById(`bulk-photo-${id}`);
            const preview = document.getElementById(`bulk-preview-${id}`);
            
            // Clear previous errors
            rnInp.classList.remove('is-invalid');
            preview.classList.remove('is-invalid');

            const rn = rnInp.value.trim();
            if (!rn) {
                rnInp.classList.add('is-invalid');
                hasError = true;
            }
            if (!fileInp.files.length) {
                preview.classList.add('is-invalid');
                hasError = true;
            }
            
            if (!hasError) updates.push({ id, rn, file: fileInp.files[0] });
        }

        if (hasError) {
            showToast('Vul alle velden in en upload een foto voor elk item.', 'error');
            return false;
        }

        if (!rd) {
            document.getElementById('bulk-return-date').classList.add('is-invalid');
            showToast('Selecteer een retour datum.', 'error');
            return false;
        }

        showToast('Verwerken... Een moment geduld.', 'info');
        try {
            const results = await Promise.all(updates.map(u => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = ev => resolve({ ...u, photoData: ev.target.result });
                    reader.onerror = reject;
                    reader.readAsDataURL(u.file);
                });
            }));

            results.forEach(res => {
                const item = AppState.items.find(i => i.id === res.id);
                if (item) {
                    item.attachments.push(res.photoData);
                    item.returnNumber = res.rn;
                    item.returnDate = rd;
                    item.status = 'supplier'; 
                }
            });

            saveAppState();
            if (typeof window.clearSelection === 'function') {
                window.clearSelection();
            } else {
                renderApp();
            }
            showToast(`Bulk retour voltooid voor ${results.length} items.`, 'success');
            return true;
        } catch (err) {
            showToast('Fout bij het verwerken van foto\'s.', 'error');
            return false;
        }
    }, 'modal-wide');

    // Bind preview listeners
    setTimeout(() => {
        selectedItems.forEach(item => {
            const fileInp = document.getElementById(`bulk-photo-${item.id}`);
            if (fileInp) {
                fileInp.addEventListener('change', () => {
                    if (fileInp.files[0]) {
                        const reader = new FileReader();
                        reader.onload = ev => {
                            const prev = document.getElementById(`bulk-preview-${item.id}`);
                            if (prev) {
                                prev.innerHTML = `<img src="${ev.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
                                prev.style.borderStyle = 'solid';
                            }
                        };
                        reader.readAsDataURL(fileInp.files[0]);
                    }
                });
            }
        });
    }, 100);
}

// ── Auto-suggest Dropdown Logic ──────────────────────────────
function bindAutoSuggest() {
    const inputComm = document.getElementById('as-commissionNumber');
    const inputName = document.getElementById('as-assetName');
    const ddComm = document.getElementById('dropdown-commissionNumber');
    const ddName = document.getElementById('dropdown-assetName');
    
    if(!inputComm || !inputName) return;

    function renderDropdown(dd, query, onSelect) {
        if (!query.trim()) {
            dd.classList.add('hidden');
            return;
        }
        
        const q = query.toLowerCase();
        const matches = AppState.lifts.filter(l => 
            l.commissionNumber.toLowerCase().includes(q) || 
            l.name.toLowerCase().includes(q)
        );
        
        if (matches.length === 0) {
            dd.innerHTML = `<div class="p-2 text-center" style="color: var(--text-muted); font-size: 0.85rem; padding: 0.75rem;">Geen liften gevonden in globale database.</div>`;
        } else {
            dd.innerHTML = matches.map(l => 
                `<div class="autosuggest-item" data-id="${l.id}" data-comm="${esc(l.commissionNumber)}" data-name="${esc(l.name)}" 
                      style="padding: 0.75rem 1rem; cursor: pointer; border-bottom: 1px solid var(--border); transition: background 0.2s;">
                    <strong style="color: var(--accent);">${esc(l.commissionNumber)}</strong> &nbsp;—&nbsp; ${esc(l.name)}
                </div>`
            ).join('');
            
            dd.querySelectorAll('.autosuggest-item').forEach(item => {
                // Hover effect
                item.addEventListener('mouseenter', () => item.style.backgroundColor = 'var(--bg-hover)');
                item.addEventListener('mouseleave', () => item.style.backgroundColor = 'transparent');
                
                // mousedown fires before input blur, so we can capture the selection
                item.addEventListener('mousedown', (e) => { 
                    e.preventDefault(); 
                    onSelect(item.dataset);
                });
            });
        }
        dd.classList.remove('hidden');
    }

    function onSelectLift(data) {
        inputComm.value = data.comm;
        inputName.value = data.name;
        window.currentFormLiftId = data.id;
        
        // Trigger validation UI
        inputComm.classList.add('is-valid');
        inputName.classList.add('is-valid');
        
        ddComm.classList.add('hidden');    
        ddName.classList.add('hidden');    
    }

    function checkSyncOnBlur() {
        // Small delay to allow mousedown to win the race if clicking a dropdown item
        setTimeout(() => {
            const commVal = inputComm.value.trim();
            const nameVal = inputName.value.trim();
            
            if (commVal) {
                const match = AppState.lifts.find(l => l.commissionNumber === commVal);
                if (match) {
                    inputName.value = match.name;
                    window.currentFormLiftId = match.id;
                    inputName.classList.add('is-valid');
                }
            } else if (nameVal) {
                const match = AppState.lifts.find(l => l.name.toLowerCase() === nameVal.toLowerCase());
                if (match) {
                    inputComm.value = match.commissionNumber;
                    window.currentFormLiftId = match.id;
                    inputComm.classList.add('is-valid');
                }
            }
            ddComm.classList.add('hidden');
            ddName.classList.add('hidden');
        }, 150); 
    }

    // Bind Commission Number Events
    inputComm.addEventListener('input', (e) => {
        window.currentFormLiftId = null; 
        renderDropdown(ddComm, e.target.value, onSelectLift);
    });
    inputComm.addEventListener('focus', (e) => renderDropdown(ddComm, e.target.value, onSelectLift));
    inputComm.addEventListener('blur', checkSyncOnBlur);

    // Bind Asset Name Events
    inputName.addEventListener('input', (e) => {
        window.currentFormLiftId = null;
        renderDropdown(ddName, e.target.value, onSelectLift);
    });
    inputName.addEventListener('focus', (e) => renderDropdown(ddName, e.target.value, onSelectLift));
    inputName.addEventListener('blur', checkSyncOnBlur);
}
