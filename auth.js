/* ========================================================
   AUTH.JS — Login View (Wide Logo)
   ======================================================== */

function renderLogin() {
    const logoSrc = AppState.theme === 'dark' ? 'assets/logo-wide-darkmode-alpha.png' : 'assets/logo-wide-alpha.png';
    return `
    <div class="login-page">
        <div class="login-card">
            <img src="${logoSrc}" alt="Rohde Projects" class="login-logo-img" id="login-logo-img">
            <h2 class="modal-title">Sign In</h2>
            <p class="modal-subtitle">Enter your credentials to continue</p>
            <form id="login-form" autocomplete="off">
                    <div class="input-group">
                        <label class="input-label" for="login-user">Username</label>
                        <div class="input-with-icon">
                            <span class="input-icon">${ICONS.user}</span>
                            <input type="text" id="login-user" class="input-field" placeholder="Enter your username">
                        </div>
                    </div>
                    <div class="input-group">
                        <label class="input-label" for="login-pass">Password</label>
                        <div class="input-with-icon">
                            <span class="input-icon">${ICONS.lock}</span>
                            <input type="password" id="login-pass" class="input-field" placeholder="Enter your password">
                        </div>
                    </div>
                    <div id="login-error" class="form-error hidden"></div>
                    <button type="submit" class="btn btn-primary btn-full btn-lg">Sign In</button>
                </form>
            </div>
            <div class="login-theme-toggle">
                <button class="btn-theme-toggle" id="btn-theme-login" title="Toggle theme">${AppState.theme === 'dark' ? ICONS.sun : ICONS.moon}</button>
            </div>
    </div>`;
}

function bindLogin() {
    document.getElementById('login-form').addEventListener('submit', e => {
        e.preventDefault();
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value;
        const err = document.getElementById('login-error');

        if (u === 'Main' && p === 'Schindler') {
            AppState.user = { username: 'Main', role: 'admin' };
        } else if (u === 'Uitvoerder' && p === 'Schindler') {
            AppState.user = { username: 'Uitvoerder', role: 'side' };
        } else {
            err.textContent = 'Invalid username or password. Please try again.';
            err.classList.remove('hidden');
            document.getElementById('login-pass').value = '';
            return;
        }
        saveAppState();
        renderApp();
    });

    const themeBtn = document.getElementById('btn-theme-login');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            toggleTheme();
            const logoEl = document.getElementById('login-logo-img');
            if (logoEl) logoEl.src = AppState.theme === 'dark' ? 'assets/logo-wide-darkmode-alpha.png' : 'assets/logo-wide-alpha.png';
        });
    }
}
