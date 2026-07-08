/* ========================================================
   STATE.JS — State Management & Persistence
   ======================================================== */

// ── Cloud API ─────────────────────────────────────────────────────
const API_URL = "https://script.google.com/macros/s/AKfycbzOTTaCbaw4TzeT7QlZF3nmjG4OPWeDE8bV2AkrRaP3WwSq-GqQdYihbhJzB8hAeCMk/exec";

/**
 * Stuur een actie naar de Google Apps Script API.
 * Het JSON-pakket ziet er altijd zo uit:
 * { "action": "...", "payload": { ... } }
 */
async function syncMetCloud(action, payload) {
    const body = JSON.stringify({ action: action, payload: payload });
    console.log(`[Cloud] Verstuur actie='${action}' payload:`, payload);
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' }, // GAS accepteert text/plain voor simple CORS requests
            body: body
        });
        const result = await response.json();
        console.log(`[Cloud] Resultaat voor actie='${action}':`, result);
        return result;
    } catch (error) {
        console.error(`[Cloud] Fout bij actie='${action}':`, error);
        return null; // Offline fallback — lokale staat blijft behouden
    }
}


const AppState = {
    user: null,           // { username, role: 'admin'|'side' }
    activeProject: null,  // string project name
    activeDiscipline: null, // null | 'finance' | 'eng' | 'prep' | 'logistics' | 'exec'
    activeModule: null,   // null | 'stock' | 'rental'
    activeTab: 'ordered', // current sub-tab within a module
    activeRentalTab: 'active', // 'active' | 'history'
    projects: [],         // string[]
    items: [],            // Item[] (Stock items)
    rentals: [],          // RentalItem[] (Active rentals)
    rentalHistory: [],    // RentalItem[] (Finished rentals)
    lifts: [],            // Lift[] (Global lift database)
    planning: [],         // PlanningItem[] (Timeline planning)
    notifications: [],    // Notification[]
    searchQuery: '',      // current search filter
    theme: 'dark',        // 'dark' | 'light'
    columnFilters: {},    // { columnKey: [selectedValue1, selectedValue2, ...] }
    rentalFilters: { start: '', end: '' }, // { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
    // Finance module state
    financeActiveTab: 'overview',  // 'overview' | 'detail' | 'invoicing'
    financeActiveAsset: null,      // assetId for detail view
    financePrognoses: [],          // per-asset prognosis entries
    financeInvoices: [],           // project invoices
    financeFrozen: false,          // project-wide freeze
    financeShowHistory: false,     // toggle history bar in detail view
    financeExpandedGroups: [],     // expanded article group IDs
    financeNotes: '',              // project-level notes
    sidebarCollapsed: false
};

function loadAppState() {
    try {
        const raw = localStorage.getItem('logistics_v2');
        if (raw) {
            const saved = JSON.parse(raw);
            // Clean up any old base64 photo data that may be clogging localStorage
            if (saved.items) {
                saved.items = saved.items.map(item => ({
                    ...item,
                    attachments: (item.attachments || []).map(att => {
                        if (typeof att === 'string' && att.startsWith('data:')) {
                            return { placeholder: true, mimeType: att.split(';')[0].split(':')[1] };
                        }
                        if (att && att.base64) {
                            return { placeholder: true, mimeType: att.mimeType || 'image/jpeg' };
                        }
                        return att;
                    })
                }));
            }
            Object.assign(AppState, saved);
            // Re-save immediately to free up the space from old base64 data
            localStorage.setItem('logistics_v2', JSON.stringify(saved));
        }
    } catch (e) {
        console.warn('State corrupt of te groot, beginnen zonder opgeslagen data.', e);
        localStorage.removeItem('logistics_v2');
    }
    applyTheme();
}

function saveAppState() {
    try {
        // Strip base64 photo data before saving to localStorage to prevent QuotaExceededError.
        // Photos are stored in Google Drive (cloud). We only keep a flag locally.
        const stateCopy = JSON.parse(JSON.stringify(AppState));
        stateCopy.items = (stateCopy.items || []).map(item => ({
            ...item,
            attachments: (item.attachments || []).map(att => {
                // If it's a base64 data URL or base64 object, replace with a lightweight placeholder
                if (typeof att === 'string' && att.startsWith('data:')) {
                    return { placeholder: true, mimeType: att.split(';')[0].split(':')[1] };
                }
                if (att && att.base64) {
                    return { placeholder: true, mimeType: att.mimeType || 'image/jpeg' };
                }
                return att; // Already a placeholder or URL — keep as-is
            })
        }));
        localStorage.setItem('logistics_v2', JSON.stringify(stateCopy));
    } catch (e) {
        console.error('Fout bij opslaan van state (localStorage vol?):', e);
        // Last resort: try saving without items array at all
        try {
            const minimal = JSON.parse(JSON.stringify(AppState));
            minimal.items = [];
            localStorage.setItem('logistics_v2', JSON.stringify(minimal));
        } catch (e2) { /* nothing we can do */ }
    }
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

function getISOWeekNumber(d) {
    const date = new Date(d.getTime());
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    return Math.ceil((((date - yearStart) / 86400000) + 1)/7);
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', AppState.theme);
}

function toggleTheme() {
    AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveAppState();
    renderApp();
}

// ── Lifts & Planning Helpers ─────────────────────────────────────
function addLift(commissionNumber, name) {
    // Check if it already exists to prevent duplicates
    if (AppState.lifts.some(l => l.commissionNumber === commissionNumber)) {
        return false;
    }
    const newLift = {
        id: 'lift_' + uid(),
        commissionNumber: commissionNumber.trim(),
        name: name.trim(),
        createdAt: new Date().toISOString()
    };
    AppState.lifts.push(newLift);
    
    // Auto-create a default planning row for this lift in the current project
    if (AppState.activeProject) {
        AppState.planning.push({
            id: 'plan_' + uid(),
            liftId: newLift.id,
            projectId: AppState.activeProject,
            phases: [] // array of { phase, startWeek, durationWeeks }
        });
    }
    
    saveAppState();
    return newLift;
}
