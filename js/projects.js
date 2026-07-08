/* ========================================================
   PROJECTS.JS — Full-Page Home with Right-Click Delete
   ======================================================== */

function renderProjects() {
    const projCards = AppState.projects.map(p => {
        const count = AppState.items.filter(i => i.projectId === p).length;
        return `
        <div class="home-project-card" data-project="${esc(p)}">
            <div class="home-project-icon">${ICONS.folder}</div>
            <div class="home-project-info">
                <span class="home-project-name">${esc(p)}</span>
                <span class="home-project-meta">${count} item${count !== 1 ? 's' : ''}</span>
            </div>
            <span class="home-project-arrow">${ICONS.chevronRight}</span>
        </div>`;
    }).join('');

    return `
    <div class="home-page">
        <header class="home-header">
            <div class="home-header-left">
                <div class="brand-icon-sm"><img src="assets/valknut-alpha.png" alt="Valknut"></div>
                <span class="brand-text">Rohde Projects</span>
            </div>
            <div class="home-header-right">
                <button class="btn-theme-toggle" id="btn-theme-home" title="Toggle theme">${AppState.theme === 'dark' ? ICONS.sun : ICONS.moon}</button>
                <div class="header-user-badge">
                    <span class="dot"></span>
                    ${AppState.user.username}
                </div>
                <button class="btn btn-danger btn-sm" id="btn-logout-proj">Logout</button>
            </div>
        </header>

        <div class="home-hero">
            <div class="home-hero-content">
                <h1 class="home-title">Welcome back, <span class="home-accent">${esc(AppState.user.username)}</span></h1>
                <p class="home-subtitle">Select a project to continue or create a new one</p>
            </div>
        </div>

        <div class="home-body">
            <div class="home-section-header">
                <h2>Projects</h2>
                <span class="home-section-count">${AppState.projects.length} total</span>
            </div>

            ${AppState.projects.length > 0 ? `
                <div class="home-projects-grid" id="project-list">
                    ${projCards}
                    <div class="home-project-card home-project-create" id="btn-show-create">
                        <div class="home-project-icon home-create-icon">${ICONS.plus}</div>
                        <div class="home-project-info">
                            <span class="home-project-name">New Project</span>
                            <span class="home-project-meta">Create a new project</span>
                        </div>
                    </div>
                </div>
            ` : `
                <div class="home-empty">
                    <div class="home-empty-icon">${ICONS.folder}</div>
                    <h3>No projects yet</h3>
                    <p>Get started by creating your first project</p>
                </div>
            `}

            <div class="home-create-form ${AppState.projects.length === 0 ? '' : 'hidden'}" id="create-form-wrapper">
                <form id="new-project-form" class="home-create-row">
                    <input type="text" id="new-proj-name" class="input-field" placeholder="Enter project name…" autofocus>
                    <button type="submit" class="btn btn-primary">Create Project</button>
                    ${AppState.projects.length > 0 ? `<button type="button" class="btn btn-ghost" id="btn-cancel-create">Cancel</button>` : ''}
                </form>
            </div>
        </div>
    </div>

    <div id="modal-root"></div>
    <div id="context-menu-root"></div>`;
}

function bindProjects() {
    const isAdmin = AppState.user.role === 'admin';

    // Click existing project → open
    document.querySelectorAll('.home-project-card:not(.home-project-create)').forEach(card => {
        card.addEventListener('click', () => {
            AppState.activeProject = card.dataset.project;
            AppState.activeModule = null;
            AppState.activeTab = 'ordered';
            AppState.searchQuery = '';
            AppState.columnFilters = {};
            saveAppState(); renderApp();
        });

        // Right-click → context menu (Main user only)
        if (isAdmin) {
            card.addEventListener('contextmenu', e => {
                e.preventDefault();
                showProjectContextMenu(e.pageX, e.pageY, card.dataset.project);
            });
        }
    });

    // Show create form
    const showBtn = document.getElementById('btn-show-create');
    if (showBtn) {
        showBtn.addEventListener('click', () => {
            document.getElementById('create-form-wrapper').classList.remove('hidden');
            document.getElementById('new-proj-name').focus();
        });
    }

    // Cancel create
    const cancelBtn = document.getElementById('btn-cancel-create');
    if (cancelBtn) cancelBtn.addEventListener('click', () => document.getElementById('create-form-wrapper').classList.add('hidden'));

    // Create project
    document.getElementById('new-project-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('new-proj-name').value.trim();
        if (!name) return;
        if (!AppState.projects.includes(name)) AppState.projects.push(name);
        AppState.activeProject = name;
        AppState.activeModule = null;
        AppState.activeTab = 'ordered';
        AppState.searchQuery = '';
        AppState.columnFilters = {};
        saveAppState(); renderApp();
    });

    document.getElementById('btn-logout-proj').addEventListener('click', () => {
        AppState.user = null; saveAppState(); renderApp();
    });

    document.getElementById('btn-theme-home').addEventListener('click', toggleTheme);

    // Close context menu on click anywhere
    document.addEventListener('click', closeContextMenu);
}

// ── Context Menu ───────────────────────────────────────
function showProjectContextMenu(x, y, projectName) {
    closeContextMenu();
    const root = document.getElementById('context-menu-root');
    root.innerHTML = `
    <div class="context-menu" id="context-menu" style="left:${x}px; top:${y}px;">
        <button class="context-menu-item danger" id="ctx-delete">
            ${ICONS.trash} Delete project
        </button>
    </div>`;

    document.getElementById('ctx-delete').addEventListener('click', e => {
        e.stopPropagation();
        closeContextMenu();
        confirmDeleteProject(projectName);
    });
}

function closeContextMenu() {
    const root = document.getElementById('context-menu-root');
    if (root) root.innerHTML = '';
}

function confirmDeleteProject(projectName) {
    openModal('Delete Project', null, `
        <div class="warning-text">
            <div class="warning-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <h3>Are you sure?</h3>
            <p>You are about to permanently delete <strong>"${esc(projectName)}"</strong> and all its items.</p>
            <p style="margin-top:0.5rem;color:var(--red);font-weight:600;">This action cannot be undone.</p>
        </div>
    `, 'Delete permanently', () => {
        // Remove all items for this project
        AppState.items = AppState.items.filter(i => i.projectId !== projectName);
        // Remove project
        AppState.projects = AppState.projects.filter(p => p !== projectName);
        // Clear active if it was the deleted one
        if (AppState.activeProject === projectName) {
            AppState.activeProject = null;
        }
        saveAppState(); renderApp();
        showToast(`Project "${projectName}" deleted.`, 'success');
        return true;
    });

    // Make the confirm button look dangerous
    setTimeout(() => {
        const btn = document.getElementById('modal-confirm-btn');
        if (btn) {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-danger');
            btn.style.background = 'var(--red)';
            btn.style.color = '#fff';
            btn.style.border = 'none';
        }
    }, 50);
}
