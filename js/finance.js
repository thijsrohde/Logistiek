/* ========================================================
   FINANCE.JS — Inimperium Financial Forecasting Module
   ======================================================== */

// ── Sample seed data helper ──────────────────────────────
function _seedFinanceIfEmpty() {
    // Seed article groups template (copied from lifts when empty for the project)
    if (!AppState.financePrognoses) AppState.financePrognoses = [];
    if (!AppState.financeInvoices) AppState.financeInvoices = [];
    if (AppState.financeFrozen === undefined) AppState.financeFrozen = false;
    if (AppState.financeShowHistory === undefined) AppState.financeShowHistory = false;

    const existingPrognosis = AppState.financePrognoses.find(p => p.projectId === AppState.activeProject);
    if (!existingPrognosis) {
        // Build prognoses per lift/asset
        const lifts = (AppState.lifts || []).filter(l => l.projectId === AppState.activeProject);
        const prognosisEntries = lifts.map(lift => ({
            id: uid(),
            projectId: AppState.activeProject,
            assetId: lift.id,
            assetName: lift.name,
            commissionNumber: lift.commissionNumber || '',
            period: 9,
            frozen: false,
            notes: '',
            groups: [
                {
                    id: uid(), name: 'Arbeid', type: 'Manuren',
                    items: [
                        { id: uid(), name: 'Engineer',    type: 'Manuren', voorcalc: { qty: 8,  cost: 400 },  werkelijk: { qty: 8,  cost: 400 },  bestelling: { qty: 0, cost: 0 }, teVerwachten: { qty: 0, cost: 0 }, prognose: '', remark: '' },
                        { id: uid(), name: 'Projectleider',type:'Manuren', voorcalc: { qty: 10, cost: 600 },  werkelijk: { qty: 10, cost: 600 },  bestelling: { qty: 0, cost: 0 }, teVerwachten: { qty: 0, cost: 0 }, prognose: '', remark: '' },
                        { id: uid(), name: 'Fabriek',     type: 'Manuren', voorcalc: { qty: 24, cost: 1200 }, werkelijk: { qty: 25, cost: 1250 }, bestelling: { qty: 0, cost: 0 }, teVerwachten: { qty: 0, cost: 0 }, prognose: '', remark: '' },
                        { id: uid(), name: 'Assemblage',  type: 'Manuren', voorcalc: { qty: 8,  cost: 400 },  werkelijk: { qty: 8,  cost: 400 },  bestelling: { qty: 0, cost: 0 }, teVerwachten: { qty: 0, cost: 0 }, prognose: '', remark: '' },
                        { id: uid(), name: 'Montage',     type: 'Manuren', voorcalc: { qty: 112,cost: 5600 }, werkelijk: { qty: 60, cost: 3000 }, bestelling: { qty: 0, cost: 0 }, teVerwachten: { qty: 55,cost: 2750 },prognose: '', remark: 'Nog afronden' },
                    ]
                },
                {
                    id: uid(), name: 'Materiaal', type: 'Bestellingen',
                    items: [
                        { id: uid(), name: 'Ovens',       type: 'Bestellingen', voorcalc: { qty: 1, cost: 2000 }, werkelijk: { qty: 1, cost: 1900 }, bestelling: { qty: 0, cost: 0 }, teVerwachten: { qty: 0, cost: 0 }, prognose: '', remark: '' },
                        { id: uid(), name: 'Ketting',     type: 'Bestellingen', voorcalc: { qty: 1, cost: 1600 }, werkelijk: { qty: 1, cost: 2400 }, bestelling: { qty: 0, cost: 0 }, teVerwachten: { qty: 0, cost: 0 }, prognose: '', remark: '' },
                        { id: uid(), name: 'Fornuis',     type: 'Bestellingen', voorcalc: { qty: 1, cost: 4500 }, werkelijk: { qty: 1, cost: 4000 }, bestelling: { qty: 0, cost: 0 }, teVerwachten: { qty: 0, cost: 0 }, prognose: '', remark: '' },
                        { id: uid(), name: 'Aflegkop',    type: 'Bestellingen', voorcalc: { qty: 1, cost: 6200 }, werkelijk: { qty: 1, cost: 6700 }, bestelling: { qty: 2, cost: 3000 }, teVerwachten: { qty: 0, cost: 0 }, prognose: '', remark: '' },
                        { id: uid(), name: 'Aandrijfketen',type:'Bestellingen', voorcalc: { qty: 1, cost: 4400 }, werkelijk: { qty: 1, cost: 4000 }, bestelling: { qty: 0, cost: 0 }, teVerwachten: { qty: 0, cost: 0 }, prognose: '', remark: '' },
                    ]
                },
                {
                    id: uid(), name: 'Voorraad', type: 'Magazijn',
                    items: [
                        { id: uid(), name: 'Plaatwerk',   type: 'Magazijn', voorcalc: { qty: 1, cost: 9500 }, werkelijk: { qty: 1, cost: 9350 }, bestelling: { qty: 0, cost: 0 }, teVerwachten: { qty: 1, cost: 350 }, prognose: '', remark: 'Planken nog leveren' },
                        { id: uid(), name: 'Staal',       type: 'Magazijn', voorcalc: { qty: 1, cost: 800 },  werkelijk: { qty: 1, cost: 400 },  bestelling: { qty: 0, cost: 0 }, teVerwachten: { qty: 0, cost: 0 }, prognose: '', remark: '' },
                        { id: uid(), name: 'Leidingwerk', type: 'Magazijn', voorcalc: { qty: 1, cost: 700 },  werkelijk: { qty: 1, cost: 600 },  bestelling: { qty: 0, cost: 0 }, teVerwachten: { qty: 0, cost: 0 }, prognose: '', remark: '' },
                        { id: uid(), name: 'Bouten & moeren', type: 'Magazijn', voorcalc: { qty: 1, cost: 250 }, werkelijk: { qty: 1, cost: 200 }, bestelling: { qty: 0, cost: 0 }, teVerwachten: { qty: 0, cost: 0 }, prognose: '', remark: '' },
                        { id: uid(), name: 'Beslag',      type: 'Magazijn', voorcalc: { qty: 1, cost: 500 },  werkelijk: { qty: 1, cost: 500 },  bestelling: { qty: 0, cost: 0 }, teVerwachten: { qty: 0, cost: 0 }, prognose: '', remark: '' },
                    ]
                }
            ]
        }));

        AppState.financePrognoses.push(...prognosisEntries);

        // Seed invoices
        if (AppState.financeInvoices.filter(i => i.projectId === AppState.activeProject).length === 0) {
            AppState.financeInvoices.push(
                { id: uid(), projectId: AppState.activeProject, desc: 'Voorschot 30%',   amount: 36000, plannedDate: '2026-02-01', invoiced: true,  paid: true,  meerwerk: false },
                { id: uid(), projectId: AppState.activeProject, desc: 'Termijn 2 — 30%', amount: 36000, plannedDate: '2026-04-01', invoiced: true,  paid: false, meerwerk: false },
                { id: uid(), projectId: AppState.activeProject, desc: 'Eindtermijn 40%', amount: 48000, plannedDate: '2026-06-01', invoiced: false, paid: false, meerwerk: false },
                { id: uid(), projectId: AppState.activeProject, desc: 'Meerwerk — Extra rails', amount: 4500, plannedDate: '2026-05-01', invoiced: false, paid: false, meerwerk: true }
            );
        }
        saveAppState();
    }
}

// ── Calculations ─────────────────────────────────────────
function _calcGroupTotals(group) {
    let voorcalcCost = 0, werkelijkCost = 0, bestellingCost = 0, teVerwachtenCost = 0;
    (group.items || []).forEach(item => {
        voorcalcCost    += (item.voorcalc?.cost     || 0);
        werkelijkCost   += (item.werkelijk?.cost    || 0);
        bestellingCost  += (item.bestelling?.cost   || 0);
        teVerwachtenCost+= (item.teVerwachten?.cost || 0);
        // Add prognose override if present
        if (item.prognose !== '' && !isNaN(parseFloat(item.prognose))) {
            const rate = item.voorcalc.qty > 0 ? item.voorcalc.cost / item.voorcalc.qty : 0;
            teVerwachtenCost += parseFloat(item.prognose) * rate;
        }
    });
    const totaal = werkelijkCost + bestellingCost + teVerwachtenCost;
    const verschil = voorcalcCost - totaal;
    return { voorcalcCost, werkelijkCost, bestellingCost, teVerwachtenCost, totaal, verschil };
}

function _calcPrognosisTotals(prognosis) {
    let voorcalcTotal = 0, totaal = 0;
    (prognosis.groups || []).forEach(g => {
        const t = _calcGroupTotals(g);
        voorcalcTotal += t.voorcalcCost;
        totaal += t.totaal;
    });
    // Assume verkoop = voorcalcTotal + 15% margin (placeholder — in real app comes from sales data)
    const verkoop = voorcalcTotal * 1.15;
    const begroot = verkoop - voorcalcTotal;
    const verwacht = verkoop - totaal;
    return { voorcalcTotal, totaal, verkoop, begroot, verwacht, verschil: verwacht - begroot };
}

function fmt(n) { return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n || 0); }

// ── MAIN RENDER ───────────────────────────────────────────
function renderFinance() {
    _seedFinanceIfEmpty();
    const tab = AppState.financeActiveTab || 'overview';
    if (tab === 'detail' && AppState.financeActiveAsset) return _renderFinanceDetail();
    if (tab === 'invoicing') return _renderFinanceInvoicing();
    return _renderFinanceOverview();
}

// ── VIEW 1: OVERVIEW ─────────────────────────────────────
function _renderFinanceOverview() {
    const prognoses = (AppState.financePrognoses || []).filter(p => p.projectId === AppState.activeProject);
    const frozen = AppState.financeFrozen;
    const isAdmin = AppState.user.role === 'admin';

    // Project totals
    let totalVoorcalc = 0, totalVerwacht = 0;
    prognoses.forEach(p => {
        const t = _calcPrognosisTotals(p);
        totalVoorcalc += t.voorcalcTotal;
        totalVerwacht += t.totaal;
    });
    const totalVerkoop = totalVoorcalc * 1.15;
    const begrootResultaat = totalVerkoop - totalVoorcalc;
    const verwachtResultaat = totalVerkoop - totalVerwacht;
    const verschil = verwachtResultaat - begrootResultaat;

    const kpiCards = `
    <div class="finance-kpi-grid">
        <div class="finance-kpi-card finance-kpi-dark">
            <div class="finance-kpi-label">BEGROOT RESULTAAT</div>
            <div class="finance-kpi-amount">${fmt(begrootResultaat)}</div>
            <div class="finance-kpi-sub">Verkoop: ${fmt(totalVerkoop)}</div>
            <div class="finance-kpi-sub">Begrote kosten: ${fmt(totalVoorcalc)}</div>
        </div>
        <div class="finance-kpi-card finance-kpi-dark">
            <div class="finance-kpi-label">VERWACHT RESULTAAT</div>
            <div class="finance-kpi-amount">${fmt(verwachtResultaat)}</div>
            <div class="finance-kpi-sub">Verkoop: ${fmt(totalVerkoop)}</div>
            <div class="finance-kpi-sub">Verwachte kosten: ${fmt(totalVerwacht)}</div>
        </div>
        <div class="finance-kpi-card ${verschil >= 0 ? 'finance-kpi-success' : 'finance-kpi-danger'}">
            <div class="finance-kpi-label">VERSCHIL</div>
            <div class="finance-kpi-amount">${fmt(verschil)}</div>
            <div class="finance-kpi-sub">Begroot resultaat: ${fmt(begrootResultaat)}</div>
            <div class="finance-kpi-sub">Verwacht resultaat: ${fmt(verwachtResultaat)}</div>
        </div>
    </div>`;

    const tableRows = prognoses.map(p => {
        const t = _calcPrognosisTotals(p);
        const changed = Math.abs(t.verschil) > 0;
        return `
        <tr class="finance-table-row ${changed ? 'finance-changed-row' : ''}" data-asset-id="${p.assetId}" style="cursor:pointer;">
            <td>${esc(p.assetName)}</td>
            <td><span class="finance-mono">${esc(p.commissionNumber)}</span></td>
            <td>${fmt(t.voorcalcTotal)}</td>
            <td class="${t.totaal > t.voorcalcTotal ? 'finance-overrun' : ''}">${fmt(t.totaal)}</td>
            <td>${fmt(t.werkelijkCost)}</td>
            <td class="${t.verschil < 0 ? 'finance-overrun' : 'finance-ok'}">${fmt(t.verschil)}</td>
        </tr>`;
    }).join('');

    // Chart bars (simplified CSS bars, 8 periods)
    const periods = [1,2,3,4,5,6,7,8,9];
    const barsExpected = periods.map((p,i) => {
        const h = Math.round(20 + Math.random() * 60);
        const hA = Math.round(h * 0.7 + Math.random() * 20);
        return `<div class="finance-chart-col">
            <div class="finance-chart-bars">
                <div class="finance-bar finance-bar-budget" style="height:${h}px;" title="Begroot"></div>
                <div class="finance-bar finance-bar-actual" style="height:${hA}px;" title="Werkelijk"></div>
            </div>
            <div class="finance-chart-label">${p}</div>
        </div>`;
    }).join('');

    // Invoices total
    const invoices = (AppState.financeInvoices || []).filter(i => i.projectId === AppState.activeProject);
    const nogTeFactureren = invoices.filter(i => !i.invoiced).reduce((s, i) => s + i.amount, 0);

    // Notes
    const prog = prognoses[0] || {};
    const notes = AppState.financeNotes || '';

    return `
    <header class="content-header">
        <div class="content-header-left">
            <h1 class="hub-title" style="margin:0; font-size:1.25rem;">Inimperium — Financieel Overzicht</h1>
            <span style="color: var(--text-muted); font-size:0.82rem; margin-top:2px; display:inline-block;">${esc(AppState.activeProject)} · Periode 9 · Nog te factureren: ${fmt(nogTeFactureren)}</span>
        </div>
        <div class="content-header-right">
            <button class="tab ${AppState.financeActiveTab === 'overview' || !AppState.financeActiveTab ? 'tab-active' : ''}" id="btn-fin-overview">Overzicht</button>
            <button class="tab ${AppState.financeActiveTab === 'invoicing' ? 'tab-active' : ''}" id="btn-fin-invoicing">Facturatie</button>
            ${isAdmin && !frozen ? `<button class="btn btn-primary btn-header" id="btn-fin-freeze" style="background:var(--accent-hover);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;margin-right:6px;"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/></svg>
                Bevriezen
            </button>` : ''}
            ${frozen ? `<span class="finance-frozen-badge">BEVROREN</span>` : ''}
        </div>
    </header>

    <div class="content-body" style="overflow-y:auto;">
        ${kpiCards}

        <div class="finance-section">
            <table class="finance-table" style="width:100%;">
                <thead>
                    <tr>
                        <th>Projectnaam</th>
                        <th>Projectnummer</th>
                        <th>Begrote Kosten</th>
                        <th>Verwachte Kosten</th>
                        <th>Gerealiseerde Kosten</th>
                        <th>Verwacht Verschil</th>
                    </tr>
                </thead>
                <tbody>${tableRows || '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">Geen assets gevonden. Voeg eerst assets toe in de Hub.</td></tr>'}</tbody>
            </table>
        </div>

        <div class="finance-charts-row">
            <div class="finance-chart-card" style="flex:1.5;">
                <div class="finance-chart-header">
                    Verwacht resultaat
                    <span class="finance-chart-legend"><span class="finance-legend-dot finance-bar-budget"></span>Begroot <span class="finance-legend-dot finance-bar-actual"></span>Verwacht</span>
                </div>
                <div class="finance-chart-body">${barsExpected}</div>
            </div>
            <div class="finance-chart-card" style="flex:1;">
                <div class="finance-chart-header">Opmerkingen</div>
                <textarea id="finance-notes" class="finance-notes-area" placeholder="Voer hier uw opmerkingen in die van toepassing zijn op het totale project..." ${frozen ? 'readonly' : ''}>${esc(notes)}</textarea>
            </div>
        </div>
    </div>`;
}

// ── VIEW 2: DETAIL (asset-level forecasting) ──────────────
function _renderFinanceDetail() {
    const prognosis = (AppState.financePrognoses || []).find(
        p => p.projectId === AppState.activeProject && p.assetId === AppState.financeActiveAsset
    );
    if (!prognosis) return `<div class="content-body"><p style="color:var(--text-muted);padding:2rem;">Asset niet gevonden.</p></div>`;

    const isAdmin = AppState.user.role === 'admin';
    const frozen = prognosis.frozen || AppState.financeFrozen;
    const showHist = AppState.financeShowHistory;
    const t = _calcPrognosisTotals(prognosis);

    const kpiCards = `
    <div class="finance-kpi-grid">
        <div class="finance-kpi-card finance-kpi-dark">
            <div class="finance-kpi-label">BEGROOT RESULTAAT</div>
            <div class="finance-kpi-amount">${fmt(t.begroot)}</div>
        </div>
        <div class="finance-kpi-card finance-kpi-dark">
            <div class="finance-kpi-label">VERWACHT RESULTAAT</div>
            <div class="finance-kpi-amount">${fmt(t.verwacht)}</div>
        </div>
        <div class="finance-kpi-card ${t.verschil >= 0 ? 'finance-kpi-success' : 'finance-kpi-danger'}">
            <div class="finance-kpi-label">VERSCHIL</div>
            <div class="finance-kpi-amount">${fmt(t.verschil)}</div>
        </div>
    </div>`;

    const groupsHTML = prognosis.groups.map(group => {
        const gt = _calcGroupTotals(group);
        const groupExpanded = (AppState.financeExpandedGroups || []).includes(group.id);
        const chevron = groupExpanded
            ? '<polyline points="18 15 12 9 6 15"></polyline>'
            : '<polyline points="6 9 12 15 18 9"></polyline>';

        const itemRows = groupExpanded ? group.items.map(item => {
            const changed = (item.teVerwachten?.cost > 0 || (item.prognose !== '' && !isNaN(parseFloat(item.prognose))));
            const progVal = item.prognose !== '' ? item.prognose : '';
            const rate = item.voorcalc.qty > 0 ? item.voorcalc.cost / item.voorcalc.qty : 0;
            const prognoseEffect = progVal !== '' && !isNaN(parseFloat(progVal)) ? parseFloat(progVal) * rate : 0;
            const teVerwTotal = (item.teVerwachten?.cost || 0) + prognoseEffect;
            const itemTotaal = (item.werkelijk?.cost || 0) + (item.bestelling?.cost || 0) + teVerwTotal;
            const itemVerschil = (item.voorcalc?.cost || 0) - itemTotaal;

            // History mock (previous period was 1 period earlier, costs were 10% less)
            const histRow = showHist ? `
            <tr class="finance-history-row">
                <td></td>
                <td><span style="font-size:0.7rem;opacity:0.7;">Vorige periode</span></td>
                <td>${item.voorcalc?.qty || 0}</td><td>${fmt((item.voorcalc?.cost || 0) * 0.95)}</td>
                <td>${item.werkelijk?.qty || 0}</td><td>${fmt((item.werkelijk?.cost || 0) * 0.9)}</td>
                <td>0</td><td>${fmt(0)}</td>
                <td>0</td><td>${fmt(0)}</td>
                <td class="finance-changed">${fmt((item.voorcalc?.cost || 0) * 0.05)}</td>
                <td></td>
            </tr>` : '';

            return `
            <tr class="finance-item-row ${changed ? 'finance-changed-row' : ''}" data-item-id="${item.id}" data-group-id="${group.id}">
                <td></td>
                <td><span style="padding-left:1rem;">${esc(item.name)}</span></td>
                <td>${item.voorcalc?.qty || 0}</td>
                <td>${fmt(item.voorcalc?.cost || 0)}</td>
                <td class="finance-clickable-cost" data-item-id="${item.id}" data-group-id="${group.id}" title="Klik voor details">${item.werkelijk?.qty || 0}</td>
                <td class="finance-clickable-cost" data-item-id="${item.id}" data-group-id="${group.id}">${fmt(item.werkelijk?.cost || 0)}</td>
                <td>${item.bestelling?.qty || 0}</td>
                <td>${fmt(item.bestelling?.cost || 0)}</td>
                <td>
                    ${!frozen ? `<input type="number" class="finance-prognose-input" data-item-id="${item.id}" data-group-id="${group.id}" data-prognosis-id="${prognosis.id}" value="${progVal}" placeholder="0" min="0" style="width:65px;">` : `<span>${progVal || 0}</span>`}
                </td>
                <td class="${changed ? 'finance-changed' : ''}">${fmt(teVerwTotal)}</td>
                <td class="${itemVerschil < 0 ? 'finance-overrun' : itemVerschil > 0 ? 'finance-ok' : ''}">${fmt(itemVerschil)}</td>
                <td>
                    ${!frozen ? `<button class="btn btn-ghost btn-xs finance-remark-btn" data-item-id="${item.id}" data-group-id="${group.id}" data-prognosis-id="${prognosis.id}" title="${esc(item.remark || 'Voeg opmerking toe')}">···</button>` : `<span style="font-size:0.78rem;color:var(--text-muted);">${esc(item.remark)}</span>`}
                </td>
            </tr>
            ${histRow}`;
        }).join('') : '';

        return `
        <tr class="finance-group-row" data-group-toggle="${group.id}">
            <td style="width:2rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px;">${chevron}</svg>
            </td>
            <td><strong>${esc(group.name)}</strong></td>
            <td colspan="2" style="color:var(--text-muted);font-size:0.8rem;">${esc(group.type)}</td>
            <td>${fmt(gt.werkelijkCost)}</td>
            <td></td>
            <td>${fmt(gt.bestellingCost)}</td>
            <td></td>
            <td></td>
            <td class="${gt.teVerwachtenCost > 0 ? 'finance-changed' : ''}">${fmt(gt.teVerwachtenCost)}</td>
            <td class="${gt.verschil < 0 ? 'finance-overrun' : gt.verschil > 0 ? 'finance-ok' : ''}">${fmt(gt.verschil)}</td>
            <td></td>
        </tr>
        ${itemRows}`;
    }).join('');

    return `
    <header class="content-header">
        <div class="content-header-left">
            <button class="btn btn-ghost btn-header" id="btn-fin-back" style="border:1px solid var(--border);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;margin-right:4px;"><polyline points="15 18 9 12 15 6"></polyline></svg>
                Overzicht
            </button>
            <h1 class="hub-title" style="margin:0; font-size:1.25rem;">${esc(prognosis.assetName)}</h1>
            <span style="color:var(--text-muted);font-size:0.82rem;">${esc(prognosis.commissionNumber)}</span>
        </div>
        <div class="content-header-right">
            <button class="tab ${AppState.financeActiveTab === 'overview' ? 'tab-active' : ''}" id="btn-fin-overview">Overzicht</button>
            <button class="tab ${AppState.financeActiveTab === 'invoicing' ? 'tab-active' : ''}" id="btn-fin-invoicing">Facturatie</button>
            <label class="finance-toggle-label">
                <input type="checkbox" id="fin-show-history" ${showHist ? 'checked' : ''}>
                Toon Historie
            </label>
            ${isAdmin && !frozen ? `<button class="btn btn-primary btn-header" id="btn-fin-freeze-asset" data-prognosis-id="${prognosis.id}" style="background:var(--accent-hover);">Bevriezen</button>` : ''}
            ${frozen ? `<span class="finance-frozen-badge">BEVROREN</span>` : ''}
        </div>
    </header>

    <div class="content-body" style="overflow-y:auto;">
        ${kpiCards}

        <div class="finance-section">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem;">
                <h2 style="margin:0; font-size:1rem; font-weight:600;">${esc(prognosis.assetName)} ${esc(prognosis.commissionNumber)}</h2>
            </div>
            <div class="table-wrapper" style="overflow-x:auto;">
                <table class="finance-table" style="width:100%; min-width:900px;">
                    <thead>
                        <tr>
                            <th style="width:2rem;"></th>
                            <th>Omschrijving</th>
                            <th colspan="2">Voorcalculatie</th>
                            <th colspan="2">Werkelijke Kosten</th>
                            <th colspan="2">Bestellingen</th>
                            <th>Prognose</th>
                            <th>Te Verwachten</th>
                            <th>Verschil</th>
                            <th>Opmerking</th>
                        </tr>
                        <tr class="finance-subheader">
                            <th></th><th></th>
                            <th>Aantal</th><th>Kosten</th>
                            <th>Aantal</th><th>Kosten</th>
                            <th>Aantal</th><th>Kosten</th>
                            <th></th><th></th><th></th><th></th>
                        </tr>
                    </thead>
                    <tbody>${groupsHTML}</tbody>
                    <tfoot>
                        <tr class="finance-total-row">
                            <td colspan="2"><strong>Totaal</strong></td>
                            <td colspan="2">${fmt(t.voorcalcTotal)}</td>
                            <td colspan="2">${fmt(t.werkelijkCost)}</td>
                            <td colspan="2">${fmt(t.bestellingCost)}</td>
                            <td></td>
                            <td>${fmt(t.teVerwachtenCost)}</td>
                            <td class="${t.verschil < 0 ? 'finance-overrun' : 'finance-ok'}">${fmt(t.verschil)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>

    <div id="finance-cost-popup" class="finance-detail-popup hidden"></div>`;
}

// ── VIEW 3: INVOICING ─────────────────────────────────────
function _renderFinanceInvoicing() {
    const isAdmin = AppState.user.role === 'admin';
    const invoices = (AppState.financeInvoices || []).filter(i => i.projectId === AppState.activeProject);
    const totalInvoiced = invoices.filter(i => i.invoiced).reduce((s, i) => s + i.amount, 0);
    const totalPaid = invoices.filter(i => i.paid).reduce((s, i) => s + i.amount, 0);
    const totalPending = invoices.filter(i => !i.invoiced).reduce((s, i) => s + i.amount, 0);
    const totalAmount = invoices.reduce((s, i) => s + i.amount, 0);

    const rows = invoices.map(inv => `
    <tr class="finance-table-row ${inv.meerwerk ? 'finance-meerwerk-row' : ''}">
        <td>${esc(inv.desc)} ${inv.meerwerk ? '<span class="finance-meerwerk-badge">Meerwerk</span>' : ''}</td>
        <td>${fmt(inv.amount)}</td>
        <td><input type="date" class="input-field input-xs fin-invoice-date" data-inv-id="${inv.id}" value="${esc(inv.plannedDate || '')}" ${!isAdmin ? 'readonly' : ''}></td>
        <td>
            <label class="finance-toggle-label" style="gap:0.4rem;">
                <input type="checkbox" class="fin-invoice-invoiced" data-inv-id="${inv.id}" ${inv.invoiced ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''}>
                ${inv.invoiced ? '<span style="color:var(--accent)">Ja</span>' : '<span style="color:var(--text-muted)">Nee</span>'}
            </label>
        </td>
        <td>
            <label class="finance-toggle-label" style="gap:0.4rem;">
                <input type="checkbox" class="fin-invoice-paid" data-inv-id="${inv.id}" ${inv.paid ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''}>
                ${inv.paid ? '<span style="color:var(--green,#10b981)">Betaald</span>' : '<span style="color:var(--text-muted)">Openstaand</span>'}
            </label>
        </td>
        ${isAdmin ? `<td><button class="btn btn-ghost btn-xs finance-del-invoice" data-inv-id="${inv.id}" style="color:var(--red,#ef4444);">${ICONS.trash}</button></td>` : '<td></td>'}
    </tr>`).join('');

    // Liquidity bars
    const liqBars = invoices.map((inv, i) => {
        const pct = totalAmount > 0 ? (inv.amount / totalAmount) * 100 : 0;
        const color = inv.paid ? 'var(--accent)' : inv.invoiced ? 'var(--accent-hover)' : 'var(--border)';
        return `<div class="finance-liq-bar-wrap" title="${esc(inv.desc)}: ${fmt(inv.amount)}">
            <div class="finance-liq-bar" style="height:${Math.round(pct * 1.5)}px; background:${color};"></div>
            <div class="finance-chart-label" style="font-size:0.65rem;">${(inv.plannedDate || '').slice(5)}</div>
        </div>`;
    }).join('');

    return `
    <header class="content-header">
        <div class="content-header-left">
            <h1 class="hub-title" style="margin:0; font-size:1.25rem;">Facturatie</h1>
            <span style="color:var(--text-muted);font-size:0.82rem;">${esc(AppState.activeProject)}</span>
        </div>
        <div class="content-header-right">
            <button class="tab" id="btn-fin-overview">Overzicht</button>
            <button class="tab tab-active" id="btn-fin-invoicing">Facturatie</button>
            ${isAdmin ? `<button class="btn btn-primary btn-header" id="btn-fin-add-invoice">${ICONS.plus} Factuur toevoegen</button>` : ''}
        </div>
    </header>

    <div class="content-body" style="overflow-y:auto;">
        <div class="finance-kpi-grid" style="grid-template-columns:repeat(3,1fr);">
            <div class="finance-kpi-card finance-kpi-dark">
                <div class="finance-kpi-label">TOTAAL GEFACTUREERD</div>
                <div class="finance-kpi-amount">${fmt(totalInvoiced)}</div>
            </div>
            <div class="finance-kpi-card finance-kpi-dark">
                <div class="finance-kpi-label">TOTAAL ONTVANGEN</div>
                <div class="finance-kpi-amount" style="color:var(--accent);">${fmt(totalPaid)}</div>
            </div>
            <div class="finance-kpi-card ${totalPending > 0 ? 'finance-kpi-danger' : 'finance-kpi-success'}">
                <div class="finance-kpi-label">NOG TE FACTUREREN</div>
                <div class="finance-kpi-amount">${fmt(totalPending)}</div>
            </div>
        </div>

        <div class="finance-section">
            <div class="table-wrapper">
                <table class="finance-table" style="width:100%;">
                    <thead>
                        <tr>
                            <th>Omschrijving</th>
                            <th>Bedrag</th>
                            <th>Geplande Factuurdatum</th>
                            <th>Gefactureerd</th>
                            <th>Betaald</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">Nog geen facturen.</td></tr>'}</tbody>
                    <tfoot>
                        <tr class="finance-total-row">
                            <td><strong>Totaal</strong></td>
                            <td>${fmt(totalAmount)}</td>
                            <td colspan="4"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <div class="finance-chart-card" style="margin-top:1.5rem;">
            <div class="finance-chart-header">
                Liquiditeitsoverzicht
                <span class="finance-chart-legend">
                    <span class="finance-legend-dot" style="background:var(--accent);display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;"></span>Betaald
                    <span class="finance-legend-dot" style="background:var(--accent-hover);display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;margin-left:8px;"></span>Gefactureerd
                    <span class="finance-legend-dot" style="background:var(--border);display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;margin-left:8px;"></span>Gepland
                </span>
            </div>
            <div class="finance-chart-body" style="align-items:flex-end; min-height:100px;">${liqBars}</div>
        </div>
    </div>`;
}

// ── BIND ─────────────────────────────────────────────────
function bindFinance() {
    const tab = AppState.financeActiveTab || 'overview';

    // Tab navigation
    document.getElementById('btn-fin-overview')?.addEventListener('click', () => {
        AppState.financeActiveTab = 'overview';
        AppState.financeActiveAsset = null;
        saveAppState(); renderApp();
    });
    document.getElementById('btn-fin-invoicing')?.addEventListener('click', () => {
        AppState.financeActiveTab = 'invoicing';
        AppState.financeActiveAsset = null;
        saveAppState(); renderApp();
    });
    document.getElementById('btn-fin-back')?.addEventListener('click', () => {
        AppState.financeActiveTab = 'overview';
        AppState.financeActiveAsset = null;
        saveAppState(); renderApp();
    });

    // Freeze project
    document.getElementById('btn-fin-freeze')?.addEventListener('click', () => {
        if (confirm('Weet je zeker dat je de prognose wilt bevriezen? Dit kan niet ongedaan worden gemaakt.')) {
            AppState.financeFrozen = true;
            saveAppState(); renderApp();
        }
    });

    // Freeze asset
    document.getElementById('btn-fin-freeze-asset')?.addEventListener('click', (e) => {
        const pId = e.currentTarget.dataset.prognosisId;
        if (confirm('Weet je zeker dat je deze asset-prognose wilt bevriezen?')) {
            const p = (AppState.financePrognoses || []).find(x => x.id === pId);
            if (p) p.frozen = true;
            saveAppState(); renderApp();
        }
    });

    // History toggle
    document.getElementById('fin-show-history')?.addEventListener('change', (e) => {
        AppState.financeShowHistory = e.target.checked;
        saveAppState(); renderApp();
    });

    // Notes autosave
    document.getElementById('finance-notes')?.addEventListener('input', (e) => {
        AppState.financeNotes = e.target.value;
        saveAppState();
    });

    // Click on asset row → go to detail
    document.querySelectorAll('.finance-table-row[data-asset-id]').forEach(row => {
        row.addEventListener('click', () => {
            AppState.financeActiveAsset = row.dataset.assetId;
            AppState.financeActiveTab = 'detail';
            saveAppState(); renderApp();
        });
    });

    // Group expand/collapse
    document.querySelectorAll('[data-group-toggle]').forEach(row => {
        row.addEventListener('click', () => {
            const gId = row.dataset.groupToggle;
            const expanded = AppState.financeExpandedGroups || [];
            if (expanded.includes(gId)) {
                AppState.financeExpandedGroups = expanded.filter(x => x !== gId);
            } else {
                AppState.financeExpandedGroups = [...expanded, gId];
            }
            saveAppState(); renderApp();
        });
    });

    // Prognose inline editing
    document.querySelectorAll('.finance-prognose-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const { itemId, groupId, prognosisId } = e.target.dataset;
            const prognosis = (AppState.financePrognoses || []).find(p => p.id === prognosisId);
            if (!prognosis) return;
            const group = prognosis.groups.find(g => g.id === groupId);
            if (!group) return;
            const item = group.items.find(i => i.id === itemId);
            if (!item) return;
            item.prognose = e.target.value;
            saveAppState(); renderApp();
        });
        // Prevent row click from bubbling up
        input.addEventListener('click', e => e.stopPropagation());
    });

    // Remark buttons (three-dot)
    document.querySelectorAll('.finance-remark-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const { itemId, groupId, prognosisId } = btn.dataset;
            const prognosis = (AppState.financePrognoses || []).find(p => p.id === prognosisId);
            if (!prognosis) return;
            const group = prognosis.groups.find(g => g.id === groupId);
            const item = group?.items.find(i => i.id === itemId);
            if (!item) return;
            const remark = prompt('Opmerking:', item.remark || '');
            if (remark !== null) {
                item.remark = remark;
                saveAppState(); renderApp();
            }
        });
    });

    // Cost cell drilldown popup
    document.querySelectorAll('.finance-clickable-cost').forEach(cell => {
        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            const popup = document.getElementById('finance-cost-popup');
            if (!popup) return;
            // Mock cost detail data
            popup.innerHTML = `
            <div class="finance-popup-header">
                Kostenoverzicht
                <button id="fin-popup-close" style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);">×</button>
            </div>
            <table class="finance-table" style="width:100%;">
                <thead><tr><th>Datum</th><th>Medewerker</th><th>Activiteit</th><th>Aantal</th></tr></thead>
                <tbody>
                    <tr><td>02-03-2026</td><td>Erik Boom</td><td>Inkopen</td><td>1</td></tr>
                    <tr><td>12-03-2026</td><td>Erik Boom</td><td>Bestellen</td><td>2</td></tr>
                    <tr><td>15-03-2026</td><td>Erik Boom</td><td>Documentatie</td><td>1</td></tr>
                    <tr><td>04-05-2026</td><td>Erik Boom</td><td>Au Buit</td><td>1</td></tr>
                </tbody>
            </table>`;
            popup.classList.remove('hidden');
            popup.style.left = (e.pageX - 20) + 'px';
            popup.style.top  = (e.pageY - 20) + 'px';
            document.getElementById('fin-popup-close')?.addEventListener('click', () => {
                popup.classList.add('hidden');
            });
        });
    });

    // Close popup on outside click
    document.addEventListener('click', () => {
        document.getElementById('finance-cost-popup')?.classList.add('hidden');
    }, { once: true });

    // Invoicing: date change
    document.querySelectorAll('.fin-invoice-date').forEach(el => {
        el.addEventListener('change', (e) => {
            const inv = (AppState.financeInvoices || []).find(i => i.id === e.target.dataset.invId);
            if (inv) { inv.plannedDate = e.target.value; saveAppState(); }
        });
    });

    // Invoicing: invoiced toggle
    document.querySelectorAll('.fin-invoice-invoiced').forEach(el => {
        el.addEventListener('change', (e) => {
            const inv = (AppState.financeInvoices || []).find(i => i.id === e.target.dataset.invId);
            if (inv) { inv.invoiced = e.target.checked; saveAppState(); renderApp(); }
        });
    });

    // Invoicing: paid toggle
    document.querySelectorAll('.fin-invoice-paid').forEach(el => {
        el.addEventListener('change', (e) => {
            const inv = (AppState.financeInvoices || []).find(i => i.id === e.target.dataset.invId);
            if (inv) { inv.paid = e.target.checked; saveAppState(); renderApp(); }
        });
    });

    // Delete invoice
    document.querySelectorAll('.finance-del-invoice').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!confirm('Factuur verwijderen?')) return;
            AppState.financeInvoices = (AppState.financeInvoices || []).filter(i => i.id !== btn.dataset.invId);
            saveAppState(); renderApp();
        });
    });

    // Add invoice
    document.getElementById('btn-fin-add-invoice')?.addEventListener('click', () => {
        const desc = prompt('Omschrijving factuur:');
        if (!desc) return;
        const amtStr = prompt('Bedrag (€):');
        const amount = parseFloat(amtStr);
        if (isNaN(amount)) { alert('Ongeldig bedrag.'); return; }
        const meerwerk = confirm('Is dit meerwerk?');
        AppState.financeInvoices = AppState.financeInvoices || [];
        AppState.financeInvoices.push({
            id: uid(),
            projectId: AppState.activeProject,
            desc, amount, plannedDate: new Date().toISOString().split('T')[0],
            invoiced: false, paid: false, meerwerk
        });
        saveAppState(); renderApp();
    });
}
