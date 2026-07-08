/* ========================================================
   APP.JS — Main Entry Point, Routing & Utilities
   ======================================================== */

const ICONS = {
    truck:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>',
    package:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
    mapPin:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
    bell:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
    plus:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
    search:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
    edit:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
    camera:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>',
    folder:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
    chevronRight:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>',
    user:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    lock:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
    logout:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
    sun:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
    moon:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
    filter:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>',
    trash:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
    repeat:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>',
    grid:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
    activity:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
    settings:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    fileText:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
    ruler:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12L12 22 2 12 12 2l10 10z"></path><path d="M7 12h10"></path><path d="M12 7v10"></path></svg>',
    euro:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h12M4 14h12M19.5 4.5l-15 15M4.5 4.5l15 15"/><circle cx="12" cy="12" r="9"/></svg>',
};

function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

function renderApp() {
    const app = document.getElementById('app');
    
    if (!AppState.user) { 
        app.innerHTML = renderLogin(); 
        bindLogin(); 
        return; 
    }
    
    if (!AppState.activeProject) { 
        app.innerHTML = renderProjects(); 
        bindProjects(); 
        return; 
    }

    // Wrap main content in global layout with sidebar
    app.innerHTML = `
        <div class="app-layout ${AppState.sidebarCollapsed ? 'collapsed' : ''}" id="app-wrapper">
            ${renderSidebar()}
            <main class="main-content" id="main-content-area">
                <!-- Content will be injected here -->
            </main>
        </div>
    `;

    const mainContent = document.getElementById('main-content-area');
    
    if (AppState.activeDiscipline === 'finance') {
        mainContent.innerHTML = renderFinance();
        bindFinance();
    } else if (!AppState.activeDiscipline || !AppState.activeModule) {
        mainContent.innerHTML = renderHub();
        bindHub();
    } else if (AppState.activeModule === 'stock') {
        mainContent.innerHTML = renderDashboard();
        bindDashboard();
    } else if (AppState.activeModule === 'rental') {
        mainContent.innerHTML = renderRental();
        bindRental();
    }

    bindSidebar();
}

function renderSidebar() {
    const isAdmin = AppState.user.role === 'admin';
    const disciplines = [
        { id: 'finance',   name: 'Finance',                  icon: ICONS.activity },
        { id: 'eng',       name: 'Engineering',              icon: ICONS.ruler    },
        { id: 'prep',      name: 'Werkvoorbereiding',        icon: ICONS.settings },
        { id: 'logistics', name: 'Logistiek',                icon: ICONS.truck    },
        { id: 'exec',      name: 'Uitvoering',               icon: ICONS.edit     },
        { id: 'admin',     name: 'Administratie',            icon: ICONS.fileText }
    ];

    const currentDisc = AppState.activeDiscipline;
    const currentMod = AppState.activeModule;

    const discHTML = disciplines.map(d => {
        const isActive = currentDisc === d.id;
        let subMenu = '';
        
        // Show sub-modules for Logistics
        if (d.id === 'logistics' && (isActive || AppState.activeModule)) {
            const modules = [
                { id: 'stock',  name: 'Voorraad', icon: ICONS.package },
                { id: 'rental', name: 'Huur',     icon: ICONS.truck   }
            ];
            subMenu = `
                <div class="sidebar-submenu" style="${AppState.sidebarCollapsed ? 'display:none' : ''}">
                    ${modules.map(m => `
                        <button class="tab sub-tab ${currentMod === m.id ? 'tab-active' : ''}" data-mod-nav="${m.id}">
                            <span class="tab-icon">${m.icon}</span>
                            <span class="tab-label">${m.name}</span>
                        </button>
                    `).join('')}
                </div>
            `;
        }

        // Show sub-modules for Finance → Inimperium
        if (d.id === 'finance' && isActive) {
            subMenu = `
                <div class="sidebar-submenu" style="${AppState.sidebarCollapsed ? 'display:none' : ''}">
                    <button class="tab sub-tab tab-active" style="pointer-events:none; opacity:0.85;">
                        <span class="tab-icon">${ICONS.activity}</span>
                        <span class="tab-label">Inimperium</span>
                    </button>
                </div>
            `;
        }

        return `
            <div class="sidebar-item-group">
                <button class="tab disc-tab ${isActive && !currentMod ? 'tab-active' : ''}" data-disc-nav="${d.id}">
                    <span class="tab-icon">${d.icon}</span>
                    <span class="tab-label">${d.name}</span>
                </button>
                ${subMenu}
            </div>
        `;
    }).join('');

    const collapsed = AppState.sidebarCollapsed;
    return `
    <aside class="sidebar ${collapsed ? 'collapsed' : ''}" id="global-sidebar">
        <div class="sidebar-brand" id="btn-home-projects" style="cursor: pointer; transition: opacity var(--dur) var(--ease);" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'" title="Terug naar projecten overzicht">
            <div class="brand-icon-sm"><img src="assets/valknut-alpha.png" alt="Valknut"></div>
            <span class="brand-text">Rohde Projects</span>
            <button class="sidebar-toggle-btn" id="btn-sidebar-toggle" title="${collapsed ? 'Uitklappen' : 'Inklappen'}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px; height:16px; display:block;">
                    ${collapsed
                        ? '<polyline points="9 18 15 12 9 6"></polyline>'
                        : '<polyline points="15 18 9 12 15 6"></polyline>'
                    }
                </svg>
            </button>
        </div>

        <!-- Project section: hidden when collapsed, but a small hub icon is shown instead -->
        <div class="sidebar-section">
            <div class="sidebar-section-label">Project</div>
            <div class="sidebar-project" title="${esc(AppState.activeProject)}">
                <span class="project-name">${esc(AppState.activeProject)}</span>
                <button class="btn btn-ghost btn-xs btn-header-icon" id="btn-go-hub" title="Naar hub van dit project">${ICONS.grid}</button>
            </div>
        </div>

        <!-- Hub icon shown ONLY when collapsed (replaces hidden project section) -->
        ${collapsed ? `
        <div class="sidebar-section" style="padding-top: 0.5rem; padding-bottom: 0;">
            <button class="btn btn-ghost disc-tab" id="btn-go-hub-collapsed" title="${esc(AppState.activeProject)} — Hub" style="justify-content: center; padding: 0.65rem 0; width: 100%;">
                ${ICONS.grid}
            </button>
        </div>` : ''}

        <div class="sidebar-section" style="flex: 1;">
            <div class="sidebar-section-label">Disciplines</div>
            <nav class="sidebar-tabs">${discHTML}</nav>
        </div>

        <div class="sidebar-footer">
            <div class="sidebar-user">
                <div class="user-avatar">${AppState.user.username.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                    <span class="user-name">${AppState.user.username}</span>
                    <span class="user-role">${isAdmin ? 'Admin' : 'Uitvoerder'}</span>
                </div>
            </div>
            <div class="sidebar-actions">
                <button class="btn btn-ghost btn-sm btn-header-icon" id="btn-theme-global" title="Toggle theme">${AppState.theme === 'dark' ? ICONS.sun : ICONS.moon}</button>
                <button class="btn btn-ghost btn-sm" id="btn-logout-global" style="flex:1">${ICONS.logout} <span class="tab-label">Logout</span></button>
            </div>
        </div>
    </aside>`;
}

function bindSidebar() {
    // Sidebar Toggle
    document.getElementById('btn-sidebar-toggle')?.addEventListener('click', () => {
        AppState.sidebarCollapsed = !AppState.sidebarCollapsed;
        saveAppState();
        renderApp();
    });

    // Hub navigation (go to hub of current project, NOT project list)
    const goToHub = () => {
        AppState.activeDiscipline = null;
        AppState.activeModule = null;
        saveAppState();
        renderApp();
    };
    document.getElementById('btn-go-hub')?.addEventListener('click', goToHub);
    document.getElementById('btn-go-hub-collapsed')?.addEventListener('click', goToHub);

    // Theme Toggle
    document.getElementById('btn-theme-global')?.addEventListener('click', toggleTheme);

    // Logout
    document.getElementById('btn-logout-global')?.addEventListener('click', () => {
        AppState.user = null;
        saveAppState();
        renderApp();
    });

    // Discipline Navigation
    document.querySelectorAll('[data-disc-nav]').forEach(btn => {
        btn.addEventListener('click', () => {
            AppState.activeDiscipline = btn.dataset.discNav;
            AppState.activeModule = null; // Clear module when switching discipline
            saveAppState();
            renderApp();
        });
    });

    // Global Home (Go to Projects List)
    document.getElementById('btn-home-projects')?.addEventListener('click', (e) => {
        // Prevent toggle button inside it from triggering home navigation
        if (e.target.closest('#btn-sidebar-toggle')) return;
        AppState.activeProject = null;
        AppState.activeDiscipline = null;
        AppState.activeModule = null;
        saveAppState();
        renderApp();
    });

    // Module Navigation
    document.querySelectorAll('[data-mod-nav]').forEach(btn => {
        btn.addEventListener('click', () => {
            AppState.activeModule = btn.dataset.modNav;
            saveAppState();
            renderApp();
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadAppState();
    renderApp();
});
