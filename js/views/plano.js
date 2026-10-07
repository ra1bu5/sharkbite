/* ============================================================
   views/plano.js — Plano de Ação (demandas + ações)
   Depende de: config.js, state.js, helpers.js, views/shared.js
   ============================================================ */

/* ============================================================
   CONSTANTES
============================================================ */
const PLANO_TIPOS = ['Painel','Análise','SQL/Query','Rotina admin','Reunião','Outro'];
const PLANO_PORTES = [
    { id:'P', label:'P', desc:'até 1 dia' },
    { id:'M', label:'M', desc:'até 1 semana' },
    { id:'G', label:'G', desc:'mais de 1 semana' }
];
const PLANO_PRIORIDADES = [
    { id:'Alta',  cor:'#e53935' },
    { id:'Média', cor:'#f5a623' },
    { id:'Baixa', cor:'#4caf50' }
];
const PLANO_STATUS = [
    { id:'Backlog',      cor:'#9e9e9e' },
    { id:'Em análise',   cor:'#f5a623' },
    { id:'Em andamento', cor:'#2196f3' },
    { id:'Aguardando',   cor:'#9c27b0' },
    { id:'Validação',    cor:'#0f9fb0' },
    { id:'Concluído',    cor:'#1a9c4a' }
];
const PLANO_ETAPAS       = ['Entendimento','Fontes','SQL / extração','Tratamento e modelagem','Construção','Validação','Entrega e treinamento','Pós-entrega'];
const PLANO_ACAO_STATUS  = ['A fazer','Fazendo','Feito','Bloqueada'];
const PLANO_ACAO_COR     = { 'A fazer':'#9e9e9e', 'Fazendo':'#2196f3', 'Feito':'#1a9c4a', 'Bloqueada':'#e53935' };

/* ============================================================
   HELPERS
============================================================ */
function planoCorPrioridade(p){
    const x = PLANO_PRIORIDADES.find(y => y.id === p);
    return x ? x.cor : '#888';
}
function planoCorStatus(s){
    const x = PLANO_STATUS.find(y => y.id === s);
    return x ? x.cor : '#888';
}
function planoBadge(cor, label, title){
    return `<span class="badge" style="${badgeStyle(cor)}" title="${escapeHtml(title || label)}">${escapeHtml(label)}</span>`;
}
function planoPct(dem){
    const acoes = Array.isArray(dem.acoes) ? dem.acoes : [];
    if(!acoes.length) return dem.status === 'Concluído' ? 100 : 0;
    const feitas = acoes.filter(a => a.status === 'Feito').length;
    return Math.round((feitas / acoes.length) * 100);
}
function planoDemandaAtiva(){
    return data.plano.find(d => d.id === planoDemandaAtivaId) || null;
}
function planoProximoCodigo(){
    let max = 0;
    data.plano.forEach(d => {
        const m = String(d.codigo || '').match(/^D-(\d+)$/);
        if(m) max = Math.max(max, Number(m[1]));
    });
    return 'D-' + String(max + 1).padStart(3, '0');
}
function planoDemandasFiltradas(){
    return data.plano.filter(d => {
        if(planoFiltros.status      && d.status      !== planoFiltros.status)      return false;
        if(planoFiltros.prioridade  && d.prioridade  !== planoFiltros.prioridade)  return false;
        if(planoFiltros.porte       && d.porte       !== planoFiltros.porte)       return false;
        if(planoFiltros.tipo        && d.tipo        !== planoFiltros.tipo)        return false;
        if(planoFiltros.responsavel && d.responsavel !== planoFiltros.responsavel) return false;
        return true;
    }).sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || a.id - b.id);
}

/* ============================================================
   RENDER — LISTA DE DEMANDAS
============================================================ */
function renderPlano(){
    const c = document.getElementById('viewContainer');
    const lista = planoDemandasFiltradas();
    const total = data.plano.length;

    const optStatus = '<option value="">Status: todos</option>' + PLANO_STATUS.map(s =>
        `<option value="${escapeHtml(s.id)}" ${planoFiltros.status === s.id ? 'selected' : ''}>${escapeHtml(s.id)}</option>`).join('');
    const optPrio = '<option value="">Prioridade: todas</option>' + PLANO_PRIORIDADES.map(p =>
        `<option value="${escapeHtml(p.id)}" ${planoFiltros.prioridade === p.id ? 'selected' : ''}>${escapeHtml(p.id)}</option>`).join('');
    const optPorte = '<option value="">Porte: todos</option>' + PLANO_PORTES.map(p =>
        `<option value="${escapeHtml(p.id)}" ${planoFiltros.porte === p.id ? 'selected' : ''}>${escapeHtml(p.id)}</option>`).join('');
    const optTipo = '<option value="">Tipo: todos</option>' + PLANO_TIPOS.map(t =>
        `<option value="${escapeHtml(t)}" ${planoFiltros.tipo === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('');
    const optResp = '<option value="">Resp: todos</option>' + (data.config.responsaveis || []).map(r =>
        `<option value="${escapeHtml(r.label)}" ${planoFiltros.responsavel === r.label ? 'selected' : ''}>${escapeHtml(r.label)}</option>`).join('');

    const linhas = lista.length === 0
        ? `<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:30px;font-style:italic;">
               ${total === 0 ? 'Nenhuma demanda ainda. Clique em "+ Nova demanda" para começar.' : 'Nenhuma demanda corresponde aos filtros.'}
           </td></tr>`
        : lista.map(d => {
            const pct    = planoPct(d);
            const nAcoes = (d.acoes || []).length;
            const prazoFmt = d.prazo ? fmtBR(d.prazo) : '—';
            return `<tr data-id="${d.id}" onclick="abrirDetalheDemanda(${d.id})">
                <td class="plano-id">${escapeHtml(d.codigo || '—')}</td>
                <td class="plano-demanda">${escapeHtml(d.demanda || 'Sem título')}</td>
                <td>${escapeHtml(d.tipo || '—')}</td>
                <td>${d.responsavel
                    ? `<span class="badge badge-resp" style="${badgeStyle(getRespCor(d.responsavel))}">@${escapeHtml(d.responsavel)}</span>`
                    : '—'}</td>
                <td style="text-align:center;">${planoBadge(d.porte === 'P' ? '#22a06b' : d.porte === 'G' ? '#f07a1a' : '#2196f3', d.porte || '—', 'Porte')}</td>
                <td style="text-align:center;">${d.prioridade ? planoBadge(planoCorPrioridade(d.prioridade), d.prioridade, 'Prioridade') : '—'}</td>
                <td>${d.status ? planoBadge(planoCorStatus(d.status), d.status, 'Status') : '—'}</td>
                <td style="text-align:center;white-space:nowrap;">${prazoFmt}</td>
                <td style="text-align:center;">
                    <div class="plano-pct-mini" title="${pct}% concluído${nAcoes ? ' · ' + nAcoes + ' ação(ões)' : ''}">
                        <div class="plano-pct-bar"><span style="width:${pct}%"></span></div>
                        <small>${pct}%</small>
                    </div>
                </td>
            </tr>`;
        }).join('');

    c.innerHTML = `
        <div class="plano-view">
            <div class="plano-topbar">
                <button class="btn btn-primary" onclick="novaDemanda()">${ic('plus', 14)} Nova demanda</button>
                <div class="plano-filtros">
                    <select onchange="planoSetFiltro('status', this.value)">${optStatus}</select>
                    <select onchange="planoSetFiltro('prioridade', this.value)">${optPrio}</select>
                    <select onchange="planoSetFiltro('porte', this.value)">${optPorte}</select>
                    <select onchange="planoSetFiltro('tipo', this.value)">${optTipo}</select>
                    <select onchange="planoSetFiltro('responsavel', this.value)">${optResp}</select>
                    <button class="btn btn-mini" style="background:var(--filter-text);color:var(--filter-bg);"
                            onclick="planoLimparFiltros()">Limpar</button>
                    <span class="plano-count">${lista.length} de ${total}</span>
                </div>
            </div>
            <div class="plano-tabela-wrap">
                <table class="plano-tabela">
                    <thead>
                        <tr>
                            <th style="width:70px;">ID</th>
                            <th>Demanda</th>
                            <th style="width:110px;">Tipo</th>
                            <th style="width:140px;">Responsável</th>
                            <th style="width:60px;text-align:center;">Porte</th>
                            <th style="width:90px;text-align:center;">Prioridade</th>
                            <th style="width:130px;">Status</th>
                            <th style="width:90px;text-align:center;">Prazo</th>
                            <th style="width:110px;text-align:center;">% Concl.</th>
                        </tr>
                    </thead>
                    <tbody>${linhas}</tbody>
                </table>
            </div>
        </div>
    `;
}

function planoSetFiltro(k, v){ planoFiltros[k] = v; renderPlano(); }
function planoLimparFiltros(){
    planoFiltros = { status:'', prioridade:'', porte:'', tipo:'', responsavel:'' };
    renderPlano();
}

/* ============================================================
   CRIAÇÃO / ABERTURA DO MODAL
============================================================ */
function novaDemanda(){
    const id = Date.now();
    const nova = {
        id,
        codigo: planoProximoCodigo(),
        demanda: '',
        tipo: '',
        solicitante: '',
        responsavel: '',
        porte: 'M',
        prioridade: 'Média',
        status: 'Backlog',
        dataEntrada: dateKeyFromDate(new Date()),
        prazo: '',
        proximoPasso: '',
        bloqueio: '',
        link: '',
        ordem: id,
        acoes: []
    };
    data.plano.push(nova);
    marcarAlterado();
    abrirDetalheDemanda(id, true);
}

function abrirDetalheDemanda(id, focoTitulo){
    planoDemandaAtivaId = id;
    const d = planoDemandaAtiva();
    if(!d) return;
    planoAcoesAbertas.clear();

    document.getElementById('planoFormCodigo').textContent = d.codigo || '—';
    document.getElementById('planoFormDemanda').value = d.demanda || '';
    document.getElementById('planoFormSolicitante').value = d.solicitante || '';
    document.getElementById('planoFormDataEntrada').value = d.dataEntrada || '';
    document.getElementById('planoFormPrazo').value = d.prazo || '';
    document.getElementById('planoFormProximoPasso').value = d.proximoPasso || '';
    document.getElementById('planoFormBloqueio').value = d.bloqueio || '';
    document.getElementById('planoFormLink').value = d.link || '';
    planoLinkInput(document.getElementById('planoFormLink'));

    preencherSelect('planoFormTipo',        PLANO_TIPOS, d.tipo || '');
    preencherSelect('planoFormPorte',       PLANO_PORTES.map(p => ({ value: p.id, label: p.label + ' — ' + p.desc })), d.porte || 'M');
    preencherSelect('planoFormPrioridade',  PLANO_PRIORIDADES.map(p => ({ value: p.id, label: p.id })), d.prioridade || 'Média');
    preencherSelect('planoFormStatus',      PLANO_STATUS.map(s => ({ value: s.id, label: s.id })), d.status || 'Backlog');
    preencherSelect('planoFormResponsavel', ['', ...(data.config.responsaveis || []).map(r => r.label)], d.responsavel || '');

    renderPlanoAcoesModal();
    planoAtualizarPctModal();

    document.getElementById('modalDemanda').classList.add('active');
    if(focoTitulo) setTimeout(() => document.getElementById('planoFormDemanda').focus(), 80);
}

function fecharDetalheDemanda(){
    const d = planoDemandaAtiva();

    /* Se criou uma demanda vazia (sem título e sem ações), remove */
    if(d && !d.demanda && !(d.acoes || []).length){
        data.plano = data.plano.filter(x => x.id !== d.id);
        marcarAlterado();
    }

    planoDemandaAtivaId = null;
    document.getElementById('modalDemanda').classList.remove('active');
    if(view === 'plano') renderPlano();
}

function planoAtualizarPctModal(){
    const d = planoDemandaAtiva();
    if(!d) return;
    const pct = planoPct(d);
    const el  = document.getElementById('planoFormPct');
    const bar = document.getElementById('planoFormPctBar');
    if(el)  el.textContent = pct + '%';
    if(bar) bar.style.width = pct + '%';
}

/* ============================================================
   AÇÕES — RESUMO E DETALHE EXPANSÍVEL
============================================================ */
function planoResumoHtml(a, aberta){
    const resp  = a.responsavel
        ? `<span class="badge badge-resp" style="${badgeStyle(getRespCor(a.responsavel))}">@${escapeHtml(a.responsavel)}</span>`
        : '';
    const prazo = a.prazo ? `${ic('calendar', 12)}${fmtBR(a.prazo)}` : '';
    const horas = (a.esforcoEstimado || a.esforcoReal)
        ? `${a.esforcoReal || 0}/${a.esforcoEstimado || 0} h`
        : '';

    return `
        <span class="plano-acao-handle"
              title="Arraste para reordenar"
              onclick="event.stopPropagation()"
        <span class="plano-acao-seta">${aberta ? '▾' : '▸'}</span>
        ${planoBadge(PLANO_ACAO_COR[a.status] || '#888', a.status || 'A fazer', 'Status')}
        <span class="plano-acao-titulo ${a.acao ? '' : 'vazio'}">${escapeHtml(a.acao || 'Nova ação (clique para preencher)')}</span>
        <span class="plano-acao-etapa">${escapeHtml(a.etapa || '')}</span>
        <span class="plano-acao-resp">${resp}</span>
        <span class="plano-acao-meta">${prazo}</span>
        <span class="plano-acao-meta">${horas}</span>
        <button type="button" class="btn-mini del" title="Excluir ação"
                onclick="event.stopPropagation(); planoExcluirAcao(${a.id})">${ic('x', 13)}</button>
    `;
}

/* ============================================================
   AUTO-RESIZE + PREVIEW DE LINKS NOS CAMPOS DE AÇÃO
============================================================ */

/* Auto-altura: o textarea cresce conforme o conteúdo */
function planoInputAutoResize(el){
    if(!el) return;
    el.style.height = 'auto';
    el.style.height = (el.scrollHeight) + 'px';
}

/* Handler do campo "Observações": auto-resize + preview linkificado */
function planoObsInput(el){
    planoInputAutoResize(el);

    const preview = document.getElementById('planoObsPreview-' + el.dataset.acaoId);
    if(!preview) return;

    const txt = el.value || '';
    const temLink = /(?:https?:\/\/|www\.)[^\s<>"')]+/i.test(txt);

    if(!temLink){
        preview.hidden = true;
        preview.innerHTML = '';
        return;
    }

    preview.hidden = false;
    /* linkifyText() já vive em links.js e escapa o HTML antes de criar os <a> */
    preview.innerHTML = linkifyText(txt).replace(/\n/g, '<br>');
}

/* Handler do campo "Link" (demanda): auto-resize + preview linkificado */
function planoLinkInput(el){
    planoInputAutoResize(el);

    const preview = document.getElementById('planoLinkPreview');
    if(!preview) return;

    const txt = el.value || '';
    const temLink = /(?:https?:\/\/|www\.)[^\s<>"')]+/i.test(txt);

    if(!temLink){
        preview.hidden = true;
        preview.innerHTML = '';
        return;
    }

    preview.hidden = false;
    preview.innerHTML = linkifyText(txt).replace(/\n/g, '<br>');
}

/* Roda depois de cada re-render do modal: ajusta altura + reconstrói previews */
function planoAutoResizeTodos(){
    document.querySelectorAll('#planoAcoesBody .plano-input-auto').forEach(el => {
        planoInputAutoResize(el);
        if(el.id && el.id.startsWith('planoObs-')) planoObsInput(el);
    });
}

/* ============================================================
   DRAG-AND-DROP DAS AÇÕES (só pela alça ⋮⋮)
============================================================ */
function planoAcoesBindDrag(){
    const root = document.getElementById('planoAcoesBody');
    if(!root || root.dataset.dragBound) return;
    root.dataset.dragBound = '1';

    let arrastando = null;
    const linhaDe = e => e.target.closest && e.target.closest('.plano-acao-card');

    /* Só a alça inicia o arraste */
    root.addEventListener('mousedown', e => {
        const h = e.target.closest && e.target.closest('.plano-acao-handle');
        if(h) h.closest('.plano-acao-card').draggable = true;
    });
    document.addEventListener('mouseup', () => {
        if(!arrastando){
            root.querySelectorAll('.plano-acao-card[draggable="true"]')
                .forEach(r => { r.draggable = false; });
        }
    });

    root.addEventListener('dragstart', e => {
        const row = linhaDe(e);
        if(!row || e.target !== row) return;
        arrastando = row;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'plano-acao');
        setTimeout(() => row.classList.add('dragging-acao'), 0);
    });

    root.addEventListener('dragover', e => {
        if(!arrastando) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const ref = [...root.querySelectorAll('.plano-acao-card')]
            .filter(r => r !== arrastando)
            .find(r => {
                const b = r.getBoundingClientRect();
                return e.clientY < b.top + b.height / 2;
            });
        if(ref){
            if(arrastando.nextElementSibling !== ref) root.insertBefore(arrastando, ref);
        } else if(root.lastElementChild !== arrastando){
            root.appendChild(arrastando);
        }
    });

    root.addEventListener('drop', e => { if(arrastando) e.preventDefault(); });

    root.addEventListener('dragend', () => {
        if(!arrastando) return;
        const r = arrastando;
        arrastando = null;
        r.draggable = false;
        r.classList.remove('dragging-acao');

        const d = planoDemandaAtiva();
        if(!d) return;

        /* Lê a nova ordem do DOM e persiste */
        const ids = [...root.querySelectorAll('.plano-acao-card')]
            .map(el => Number(el.dataset.acaoId));
        ids.forEach((id, idx) => {
            const a = d.acoes.find(x => x.id === id);
            if(a) a.ordem = (idx + 1) * 10;
        });
        /* Reordena o array interno para que o próximo render saia certo */
        d.acoes.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        marcarAlterado({ imediato: getAutosaveConfig().dragImediato });
    });
}

function renderPlanoAcoesModal(){
    const root = document.getElementById('planoAcoesBody');
    if(!root) return;
    const d = planoDemandaAtiva();
    if(!d) return;

    if(!d.acoes.length){
        root.innerHTML = `<div class="plano-acoes-vazio">Nenhuma ação ainda. Clique em <b>+ Ação</b> para detalhar o plano.</div>`;
        return;
    }

    const resps = data.config.responsaveis || [];

    root.innerHTML = d.acoes.map(a => {
        const aberta = planoAcoesAbertas.has(a.id);
        const detalhe = !aberta ? '' : `
            <div class="plano-acao-detalhe">
                <div class="plano-acao-grid">
                    <label class="c12">Ação
                        <textarea class="plano-input plano-input-auto plano-acao-nome"
                                  rows="1"
                                  placeholder="Verbo + objeto, ex.: Mapear tabelas de origem"
                                  oninput="planoInputAutoResize(this)"
                                  onchange="planoAcaoSet(${a.id}, 'acao', this.value)">${escapeHtml(a.acao || '')}</textarea>
                    </label>
                    <label class="c4">Etapa
                        <select class="plano-input" onchange="planoAcaoSet(${a.id}, 'etapa', this.value)">
                            <option value="">—</option>
                            ${PLANO_ETAPAS.map(e => `<option value="${escapeHtml(e)}" ${a.etapa === e ? 'selected' : ''}>${escapeHtml(e)}</option>`).join('')}
                        </select>
                    </label>
                    <label class="c4">Responsável
                        <select class="plano-input" onchange="planoAcaoSet(${a.id}, 'responsavel', this.value)">
                            <option value="">—</option>
                            ${resps.map(r => `<option value="${escapeHtml(r.label)}" ${a.responsavel === r.label ? 'selected' : ''}>${escapeHtml(r.label)}</option>`).join('')}
                        </select>
                    </label>
                    <label class="c4">Status
                        <select class="plano-input" onchange="planoAcaoSet(${a.id}, 'status', this.value)">
                            ${PLANO_ACAO_STATUS.map(s => `<option value="${escapeHtml(s)}" ${a.status === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
                        </select>
                    </label>
                    <label class="c3">Início
                        <input type="date" class="plano-input" value="${escapeHtml(a.inicio || '')}"
                               onchange="planoAcaoSet(${a.id}, 'inicio', this.value)">
                    </label>
                    <label class="c3">Prazo
                        <input type="date" class="plano-input" value="${escapeHtml(a.prazo || '')}"
                               onchange="planoAcaoSet(${a.id}, 'prazo', this.value)">
                    </label>
                    <label class="c3">Estimado (h)
                        <input type="number" step="0.5" min="0" class="plano-input"
                               value="${escapeHtml(String(a.esforcoEstimado || 0))}"
                               onchange="planoAcaoSet(${a.id}, 'esforcoEstimado', this.value)">
                    </label>
                    <label class="c3">Real (h)
                        <input type="number" step="0.5" min="0" class="plano-input"
                               value="${escapeHtml(String(a.esforcoReal || 0))}"
                               onchange="planoAcaoSet(${a.id}, 'esforcoReal', this.value)">
                    </label>
                    <label class="c12">Observações
                        <textarea class="plano-input plano-input-auto"
                                  id="planoObs-${a.id}"
                                  data-acao-id="${a.id}"
                                  rows="1"
                                  placeholder="Decisões, premissas, regras de negócio…"
                                  oninput="planoObsInput(this)"
                                  onchange="planoAcaoSet(${a.id}, 'observacoes', this.value)">${escapeHtml(a.observacoes || '')}</textarea>
                        <div class="plano-obs-link-preview" id="planoObsPreview-${a.id}" hidden></div>
                    </label>
                </div>
            </div>`;

        return `<div class="plano-acao-card ${aberta ? 'aberta' : ''}" data-acao-id="${a.id}">
            <div class="plano-acao-resumo" onclick="planoToggleAcao(${a.id})">${planoResumoHtml(a, aberta)}</div>
            ${detalhe}
        </div>`;
    }).join('');

    /* Ajusta altura dos textareas + reconstrói previews */
    /* Ajusta altura dos textareas + reconstrói previews */
    requestAnimationFrame(planoAutoResizeTodos);

    /* Liga o drag-and-drop (uma vez só — a função tem guard interno) */
    planoAcoesBindDrag();
}

function planoToggleAcao(acaoId){
    if(planoAcoesAbertas.has(acaoId)) planoAcoesAbertas.delete(acaoId);
    else planoAcoesAbertas.add(acaoId);
    renderPlanoAcoesModal();
    if(planoAcoesAbertas.has(acaoId)){
        const campo = document.querySelector(`.plano-acao-card[data-acao-id="${acaoId}"] .plano-acao-nome`);
        if(campo && !campo.value) campo.focus();
    }
}

function planoAdicionarAcao(){
    const d = planoDemandaAtiva();
    if(!d) return;
    const id = Date.now() + Math.floor(Math.random() * 1000);
    d.acoes.push({
        id,
        acao: '',
        etapa: '',
        responsavel: '',
        inicio: '',
        prazo: '',
        status: 'A fazer',
        esforcoEstimado: 0,
        esforcoReal: 0,
        observacoes: '',
        ordem: (d.acoes.length + 1) * 10
    });
    planoAcoesAbertas.add(id);
    marcarAlterado();
    renderPlanoAcoesModal();
    planoAtualizarPctModal();
    setTimeout(() => {
        const card = document.querySelector(`.plano-acao-card[data-acao-id="${id}"]`);
        if(card){
            card.scrollIntoView({ block: 'nearest' });
            const campo = card.querySelector('.plano-acao-nome');
            if(campo) campo.focus();
        }
    }, 40);
}

function planoAcaoSet(acaoId, campo, valor){
    const d = planoDemandaAtiva();
    if(!d) return;
    const a = d.acoes.find(x => x.id === acaoId);
    if(!a) return;

    if(campo === 'esforcoEstimado' || campo === 'esforcoReal'){
        a[campo] = Number(valor) || 0;
    } else {
        a[campo] = valor;
    }
    marcarAlterado();

    if(campo === 'status') planoAtualizarPctModal();

    /* Atualiza só o resumo do cartão, sem re-renderizar tudo */
    const resumo = document.querySelector(`.plano-acao-card[data-acao-id="${acaoId}"] .plano-acao-resumo`);
    if(resumo) resumo.innerHTML = planoResumoHtml(a, planoAcoesAbertas.has(acaoId));
}

function planoExcluirAcao(acaoId){
    const d = planoDemandaAtiva();
    if(!d) return;
    if(!confirm('Excluir esta ação?')) return;
    d.acoes = d.acoes.filter(x => x.id !== acaoId);
    marcarAlterado();
    renderPlanoAcoesModal();
    planoAtualizarPctModal();
}

/* ============================================================
   SALVAR / EXCLUIR DEMANDA
============================================================ */
function planoSalvarDemandaForm(){
    const d = planoDemandaAtiva();
    if(!d) return;

    const $ = id => document.getElementById(id);
    d.demanda      = $('planoFormDemanda').value.trim();
    d.tipo         = $('planoFormTipo').value;
    d.solicitante  = $('planoFormSolicitante').value.trim();
    d.responsavel  = $('planoFormResponsavel').value;
    d.porte        = $('planoFormPorte').value;
    d.prioridade   = $('planoFormPrioridade').value;
    d.status       = $('planoFormStatus').value;
    d.dataEntrada  = $('planoFormDataEntrada').value || '';
    d.prazo        = $('planoFormPrazo').value || '';
    d.proximoPasso = $('planoFormProximoPasso').value.trim();
    d.bloqueio     = $('planoFormBloqueio').value.trim();
    d.link         = $('planoFormLink').value.trim();

    marcarAlterado();
    planoAtualizarPctModal();
}

function planoExcluirDemanda(){
    const d = planoDemandaAtiva();
    if(!d) return;
    if(!confirm(`Excluir a demanda "${d.demanda || d.codigo}" e suas ${d.acoes.length} ação(ões)?`)) return;

    data.plano = data.plano.filter(x => x.id !== d.id);
    marcarAlterado();
    fecharDetalheDemanda();
    renderPlano();
}
