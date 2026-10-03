/* ============================================================
   router.js — Filtros, navegação, mapa e render principal
   Depende de: config.js, state.js, helpers.js, todos os views/*
   ============================================================ */

/* ============================================================
   FILTROS
============================================================ */
function popularFiltros(){
    const ft = document.getElementById('filterTipo');
    const fs = document.getElementById('filterStatus');
    const fr = document.getElementById('filterResp');
    const fa = document.getElementById('filterArea');
    const fc = document.getElementById('filterComplexidade');

    if(ft) ft.innerHTML = '<option value="">Tipo: todos</option>' +
        (data.config.tipos || []).map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.label)}</option>`).join('');
    if(fs) fs.innerHTML = '<option value="">Status: todos</option>' +
        (data.config.status || []).map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.label)}</option>`).join('');
    if(fr) fr.innerHTML = '<option value="">Resp: todos</option>' +
        (data.config.responsaveis || []).map(r => `<option value="${escapeHtml(r.label)}">${escapeHtml(r.label)}</option>`).join('');
    if(fa) fa.innerHTML = '<option value="">Área: todas</option>' +
        (data.config.areas || []).map(a => `<option value="${escapeHtml(a.label)}">${escapeHtml(a.label)}</option>`).join('');
    if(fc) fc.innerHTML = '<option value="">Complexidade: todas</option>' +
        COMPLEXIDADES.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.label)}</option>`).join('');

    if(ft) ft.value = filtros.tipo;
    if(fs) fs.value = filtros.status;
    if(fr) fr.value = filtros.responsavel;
    if(fa) fa.value = filtros.area;
    if(fc) fc.value = filtros.complexidade;
}

function aplicarFiltros(){
    filtros.tipo         = document.getElementById('filterTipo').value;
    filtros.status       = document.getElementById('filterStatus').value;
    filtros.responsavel  = document.getElementById('filterResp').value;
    filtros.area         = document.getElementById('filterArea').value;
    filtros.complexidade = document.getElementById('filterComplexidade').value;
    render();
}

function limparFiltros(){
    filtros = { tipo:'', status:'', responsavel:'', area:'', complexidade:'' };
    popularFiltros();
    render();
}

function passaFiltro(ev){
    if(filtros.tipo         && ev.tipo         !== filtros.tipo)         return false;
    if(filtros.status       && ev.status       !== filtros.status)       return false;
    if(filtros.responsavel  && ev.responsavel  !== filtros.responsavel)  return false;
    if(filtros.area         && ev.area         !== filtros.area)         return false;
    if(filtros.complexidade && (ev.complexidade || '') !== filtros.complexidade) return false;
    return true;
}

function temFiltroAtivo(){
    return filtros.tipo || filtros.status || filtros.responsavel || filtros.area || filtros.complexidade;
}

/* ============================================================
   NAVEGAÇÃO DE DATA
============================================================ */
function navPrev(){
    const y = currentDate.getFullYear(), m = currentDate.getMonth(), d = currentDate.getDate();
    if(view === 'mes' || view === 'lista')  currentDate = new Date(y, m - 1, 1);
    else if(view === 'semana')              currentDate = new Date(y, m, d - 7);
    else if(view === 'dia')                 currentDate = new Date(y, m, d - 1);
    sincronizarSelects();
    render();
}

function navNext(){
    const y = currentDate.getFullYear(), m = currentDate.getMonth(), d = currentDate.getDate();
    if(view === 'mes' || view === 'lista')  currentDate = new Date(y, m + 1, 1);
    else if(view === 'semana')              currentDate = new Date(y, m, d + 7);
    else if(view === 'dia')                 currentDate = new Date(y, m, d + 1);
    sincronizarSelects();
    render();
}

function irHoje(){
    currentDate = new Date();
    sincronizarSelects();
    render();
}

function sincronizarSelects(){
    const sm = document.getElementById('selectMes');
    const sa = document.getElementById('selectAno');
    if(sm) sm.value = currentDate.getMonth();
    if(sa) sa.value = currentDate.getFullYear();
}

function initSelects(){
    const sm = document.getElementById('selectMes');
    const sa = document.getElementById('selectAno');
    if(!sm || !sa) return;

    sm.innerHTML = MESES_CURTOS.map((m, i) => `<option value="${i}">${m}</option>`).join('');

    const y = new Date().getFullYear();
    const anos = [];
    for(let i = y - 3; i <= y + 5; i++) anos.push(i);
    sa.innerHTML = anos.map(a => `<option value="${a}">${a}</option>`).join('');

    sm.addEventListener('change', () => {
        currentDate = new Date(currentDate.getFullYear(), Number(sm.value), 1);
        render();
    });
    sa.addEventListener('change', () => {
        currentDate = new Date(Number(sa.value), currentDate.getMonth(), 1);
        render();
    });
}

function setView(v){
    view = v;
    localStorage.setItem(VIEW_KEY, v);
    render();
}

function navDiaPrev(){
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1);
    sincronizarSelects();
    render();
}

function navDiaNext(){
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
    sincronizarSelects();
    render();
}

function irParaDia(key){
    currentDate = parseDateKey(key);
    sincronizarSelects();
    render();
}

/* ============================================================
   MAPA DE EVENTOS POR DIA
   Usado pelas views Mês, Semana e Dia
============================================================ */
function construirMapa(){
    const mapa = {};
    const evs = data.eventos
        .filter(passaFiltro)
        .filter(ev => ev.dataInicio)
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || a.id - b.id);

    evs.forEach(ev => {
        const ini = ev.dataInicio;
        const fim = ev.dataFim || ini;
        if(!ini || !fim) return;

        let cur = ini;
        while(cur <= fim){
            if(!mapa[cur]) mapa[cur] = [];
            const position = ini === fim ? 'single'
                           : cur === ini ? 'start'
                           : cur === fim ? 'end'
                           : 'middle';
            mapa[cur].push({ ev, position });
            cur = addDays(cur, 1);
        }
    });
    return mapa;
}

/* ============================================================
   RENDER PRINCIPAL
============================================================ */
function render(){
    document.body.dataset.view = view;

    /* Barra de filtros escondida em registros e plano */
    const filtersBar = document.getElementById('filtersBar');
    if(filtersBar){
        filtersBar.style.display =
            (view === 'registros' || view === 'plano') ? 'none' : '';
    }

    /* Barra de busca do Change Log */
    const buscaBar = document.getElementById('registroBuscaBar');
    if(buscaBar){
        const mostrar = view === 'registros';
        if(mostrar && buscaBar.style.display === 'none') registroBuscaConfigurarCampo();
        buscaBar.style.display = mostrar ? '' : 'none';
    }

    aplicarTamanhoView();
    fecharPopDia();
    marcarSemana();

    const c = document.getElementById('viewContainer');

    /* Dispatch por view */
    if(view === 'mes')            c.innerHTML = renderMes();
    else if(view === 'semana')    c.innerHTML = renderSemana();
    else if(view === 'dia')       c.innerHTML = renderDia();
    else if(view === 'inbox')     c.innerHTML = renderInbox();
    else if(view === 'quadro')    c.innerHTML = renderQuadro();
    else if(view === 'notas')     { renderNotas();     return; }
    else if(view === 'registros') { renderRegistros(); return; }
    else if(view === 'reunioes')  { renderReunioes();  return; }
    else if(view === 'plano')     { renderPlano();     return; }
    else                          c.innerHTML = renderQuadro();

    renderLegend();
    atualizarContadorFiltro();
    atualizarBadgeInbox();
}

/* ============================================================
   CONTADORES / BADGES
============================================================ */
function atualizarBadgeInbox(){
    const badge = document.getElementById('inboxBadge');
    if(!badge) return;
    const total = data.eventos.filter(ev => !ev.dataInicio).length;
    if(total > 0){
        badge.textContent = total;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

function atualizarContadorFiltro(){
    const el = document.getElementById('filterCount');
    if(!el) return;
    if(!temFiltroAtivo()){ el.textContent = ''; return; }
    const total    = data.eventos.length;
    const visiveis = data.eventos.filter(passaFiltro).length;
    el.textContent = `${visiveis}/${total}`;
}