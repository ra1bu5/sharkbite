/* ============================================================
   checklist.js — Checklist do formulário de evento
   Depende de: config.js, state.js, helpers.js, rte.js
   ============================================================ */

/* ============================================================
   HELPERS DE CHECKLIST
============================================================ */
function novoChecklistId(){
    if(window.crypto && crypto.randomUUID) return 'ck_' + crypto.randomUUID();
    return 'ck_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
}

function clonarChecklist(lista){
    return (Array.isArray(lista) ? lista : []).map(item => ({
        id: item && item.id ? String(item.id) : novoChecklistId(),
        texto: item && item.texto != null ? String(item.texto) : '',
        concluido: !!(item && item.concluido),
        data: item && item.data ? String(item.data) : '',
        responsavel: item && item.responsavel ? String(item.responsavel) : ''
    }));
}

function checklistPct(lista){
    const itens = Array.isArray(lista) ? lista : [];
    if(!itens.length) return 0;
    return Math.round((itens.filter(i => i.concluido).length / itens.length) * 100);
}

/* ============================================================
   PROGRESSO
============================================================ */
function checklistAtualizarProgresso(){
    const pct  = checklistPct(formChecklistDraft);
    const pctEl = document.getElementById('formChecklistPct');
    const wrap  = document.getElementById('formChecklistProgressWrap');
    const bar   = document.getElementById('formChecklistProgress');

    if(pctEl) pctEl.textContent = formChecklistDraft.length ? `${pct}%` : '';
    if(wrap)  wrap.style.display = formChecklistDraft.length ? '' : 'none';
    if(bar)   bar.style.width = pct + '%';
}

/* ============================================================
   SINCRONIZAÇÃO DOM → ESTADO
============================================================ */
function checklistSincronizarDoDOM(){
    const root = document.getElementById('formChecklistItems');
    if(!root) return;

    const itens = [];
    root.querySelectorAll('.task-checklist-item').forEach(row => {
        const texto   = row.querySelector('.check-text-input');
        const dataEl  = row.querySelector('.check-date');
        const cb      = row.querySelector('input[type=checkbox]');
        const respBtn = row.querySelector('.check-resp-btn');
        itens.push({
            id:          row.dataset.checkId || novoChecklistId(),
            texto:       texto ? texto.value : '',
            concluido:   !!(cb && cb.checked),
            data:        dataEl ? dataEl.value : '',
            responsavel: respBtn ? (respBtn.dataset.resp || '') : ''
        });
    });
    formChecklistDraft = itens;
    checklistAtualizarProgresso();
}

/* Salva o checklist no evento em edição (se já existir) */
function checklistPersistirSeEventoExistente(){
    checklistSincronizarDoDOM();
    const id = Number(document.getElementById('formId')?.value || 0);
    if(!id) return;
    const ev = data.eventos.find(e => e.id === id);
    if(!ev) return;
    ev.checklist = clonarChecklist(formChecklistDraft);
    marcarAlterado();
}

/* ============================================================
   RENDER DO CHECKLIST
============================================================ */
function renderChecklistForm(){
    const root = document.getElementById('formChecklistItems');
    if(!root) return;

    const itens = clonarChecklist(formChecklistDraft);

    if(!itens.length){
        root.innerHTML = '<div class="task-checklist-empty">Nenhum item. Clique em <b>Checklist +</b> para criar o primeiro.</div>';
        checklistAtualizarProgresso();
        return;
    }

    root.innerHTML = itens.map(item => {
        const cor     = item.responsavel ? getRespCor(item.responsavel) : '';
        const respHtml = item.responsavel
            ? `<span class="resp-dot-inner" style="background:${escapeHtml(cor)}"></span>`
            : '<span>?</span>';
        const respTitle = item.responsavel
            ? `Responsável: ${escapeHtml(item.responsavel)}`
            : 'Sem responsável';

        return `
        <div class="task-checklist-item ${item.concluido ? 'done' : ''}" data-check-id="${escapeHtml(item.id)}">
            <span class="check-handle" title="Arraste para reordenar">${ic('grip', 14)}</span>
            <input type="checkbox" ${item.concluido ? 'checked' : ''} aria-label="Concluir item do checklist">
            <textarea class="check-text-input" rows="1" placeholder="Item do checklist">${escapeHtml(item.texto)}</textarea>
            <input type="date" class="check-date" value="${escapeHtml(item.data || '')}" title="Data do item">
            <button type="button" class="check-resp-btn" data-resp="${escapeHtml(item.responsavel || '')}" title="${respTitle}" onclick="checklistAbrirMenuResp(event, '${escapeHtml(item.id)}')">${respHtml}</button>
            <button type="button" class="check-delete" title="Excluir item">×</button>
        </div>`;
    }).join('');

    checklistAtualizarProgresso();
}

/* ============================================================
   ADICIONAR / REMOVER
============================================================ */
function adicionarChecklistItem(){
    secaoExpandir('check');
    checklistSincronizarDoDOM();
    formChecklistDraft.push({
        id: novoChecklistId(),
        texto: '',
        concluido: false,
        data: '',
        responsavel: ''
    });
    renderChecklistForm();
    checklistPersistirSeEventoExistente();
    setTimeout(() => {
        const root = document.getElementById('formChecklistItems');
        const last = root && root.querySelector('.task-checklist-item:last-child .check-text-input');
        if(last){ last.focus(); last.select(); }
    }, 0);
}

function removerChecklistItem(id){
    checklistSincronizarDoDOM();
    formChecklistDraft = formChecklistDraft.filter(item => item.id !== id);
    renderChecklistForm();
    checklistPersistirSeEventoExistente();
}

/* Legado — não usada diretamente, mas mantida para compatibilidade */
function checklistAlterarItem(){
    checklistPersistirSeEventoExistente();
    checklistAtualizarProgresso();
    const row = event && event.target && event.target.closest
        ? event.target.closest('.task-checklist-item')
        : null;
    if(row){
        const cb = row.querySelector('input[type=checkbox]');
        row.classList.toggle('done', !!(cb && cb.checked));
    }
}

/* ============================================================
   AUTO-ALTURA DAS TEXTAREAS
============================================================ */
function checklistAjustar(el){
    if(!el || !el.offsetParent) return;
    el.style.height = 'auto';
    el.style.height = (el.scrollHeight + (el.offsetHeight - el.clientHeight)) + 'px';
}

function checklistAjustarTodos(){
    requestAnimationFrame(() => {
        document.querySelectorAll('#formChecklistItems .check-text-input')
            .forEach(checklistAjustar);
    });
}

/* ============================================================
   IMPORTAÇÃO DE TEXTO (Descrição → Checklist)
============================================================ */
/* Cada linha vira um item; remove marcadores comuns (-, *, •, 1., 1), [ ]) */
function linhasParaChecklist(texto){
    return String(texto || '').split(/\r?\n/)
        .map(l => l.replace(/\u00a0/g, ' ').trim()
            .replace(/^(?:[-*•·▪◦–]|\d+[.)]|\[[ xX]?\])\s+/, '')
            .trim())
        .filter(Boolean);
}

function checklistAdicionarTextos(textos, pos){
    checklistSincronizarDoDOM();
    const novos = textos.map(t => ({
        id: novoChecklistId(),
        texto: t,
        concluido: false,
        data: '',
        responsavel: ''
    }));
    if(pos == null || pos < 0 || pos > formChecklistDraft.length){
        formChecklistDraft.push(...novos);
    } else {
        formChecklistDraft.splice(pos, 0, ...novos);
    }
    renderChecklistForm();
    checklistPersistirSeEventoExistente();
}

/* Botão "Da descrição": usa o trecho selecionado; sem seleção, usa a descrição inteira */
function checklistDaDescricao(){
    const ed = document.getElementById('formDescricao');
    if(!ed) return;

    const sel = getSelection();
    let usaSel = false, rg = null, texto;

    if(sel.rangeCount && !sel.isCollapsed
       && ed.contains(sel.anchorNode) && ed.contains(sel.focusNode)){
        usaSel = true;
        rg = sel.getRangeAt(0).cloneRange();
        texto = sel.toString();
    } else {
        texto = ed.innerText;
    }

    const linhas = linhasParaChecklist(texto);
    if(!linhas.length){
        mostrarToast('Nenhuma linha encontrada na descrição');
        return;
    }

    secaoExpandir('check');
    checklistAdicionarTextos(linhas);

    const n = linhas.length;
    if(confirm(`${n} ${n > 1 ? 'itens adicionados' : 'item adicionado'} ao checklist.\n\nRemover ${usaSel ? 'o trecho selecionado' : 'esse texto'} da descrição?`)){
        if(usaSel){
            ed.focus();
            const s2 = getSelection();
            s2.removeAllRanges();
            s2.addRange(rg);
            document.execCommand('delete');
        } else {
            ed.innerHTML = '';
        }
        rteMudou(ed);
    }
}

/* ============================================================
   MENU DE RESPONSÁVEL DO ITEM
============================================================ */
function checklistAbrirMenuResp(e, itemId){
    e.stopPropagation();
    fecharMenuRespChecklist();

    const resps = data.config.responsaveis || [];
    const menu = document.createElement('div');
    menu.id = 'checklistRespMenu';
    menu.className = 'checklist-resp-menu';

    menu.innerHTML = `
        <div class="ctx-opt" onclick="checklistSetResp('${itemId}', '')">
            <span class="resp-empty">—</span> Sem responsável
        </div>
        ${resps.length
            ? resps.map(r => `<div class="ctx-opt" onclick="checklistSetResp('${itemId}', '${escapeHtml(r.label).replace(/'/g, "\\'")}')">
                <span class="resp-dot" style="background:${escapeHtml(r.cor)}"></span>${escapeHtml(r.label)}
              </div>`).join('')
            : '<div class="sem-resp">Nenhum responsável cadastrado.</div>'}
    `;

    document.body.appendChild(menu);

    const rc = e.currentTarget.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(rc.left, innerWidth - menu.offsetWidth - 8)) + 'px';
    menu.style.top  = Math.min(rc.bottom + 4, innerHeight - menu.offsetHeight - 8) + 'px';
}

function fecharMenuRespChecklist(){
    const m = document.getElementById('checklistRespMenu');
    if(m) m.remove();
}

function checklistSetResp(itemId, responsavel){
    checklistSincronizarDoDOM();
    const item = formChecklistDraft.find(i => i.id === itemId);
    if(!item) return;
    item.responsavel = responsavel;
    fecharMenuRespChecklist();
    renderChecklistForm();
    checklistPersistirSeEventoExistente();
    checklistAjustarTodos();
}

/* ============================================================
   SEÇÕES RECOLHÍVEIS (Descrição / Checklist)
============================================================ */
function secoesLer(){
    try {
        const all = JSON.parse(localStorage.getItem('sharkbite_secoes') || '{}') || {};
        return all[formSecEventKey] || {};
    } catch(e){ return {}; }
}

function secoesSalvar(state){
    try {
        const all = JSON.parse(localStorage.getItem('sharkbite_secoes') || '{}') || {};
        all[formSecEventKey] = state;
        localStorage.setItem('sharkbite_secoes', JSON.stringify(all));
    } catch(e){}
}

function secoesAplicar(){
    const s = secoesLer();
    [['desc', 'secDesc'], ['check', 'formChecklist']].forEach(([k, id]) => {
        const el = document.getElementById(id);
        if(!el) return;
        el.classList.toggle('sec-fechada', !!s[k]);
        const a = el.querySelector('.sec-arrow');
        if(a) a.textContent = s[k] ? '▸' : '▾';
    });
    const ed   = document.getElementById('formDescricao');
    const info = document.getElementById('descInfo');
    if(info) info.textContent = (s.desc && ed && ed.textContent.trim()) ? '· preenchida' : '';
}

function toggleSecao(nome){
    const s = secoesLer();
    s[nome] = !s[nome];
    secoesSalvar(s);
    secoesAplicar();
}

function secaoExpandir(nome){
    if(secoesLer()[nome]) toggleSecao(nome);
}

/* ============================================================
   WRAPPER: mantém auto-altura sempre após render/apply
============================================================ */
(function(){
    const _render = renderChecklistForm;
    renderChecklistForm = function(){ _render(); checklistAjustarTodos(); };

    const _secoes = secoesAplicar;
    secoesAplicar = function(){ _secoes(); checklistAjustarTodos(); };
})();

window.addEventListener('resize', checklistAjustarTodos);

/* ============================================================
   LISTENERS
============================================================ */

/* --- Drag-and-drop dos itens (só pela alça) + paste multi-linha --- */
document.addEventListener('DOMContentLoaded', () => {
    secoesAplicar();

    const root = document.getElementById('formChecklistItems');
    if(!root) return;

    let arrastando = null;
    const linhaDe = e => e.target.closest && e.target.closest('.task-checklist-item');

    /* Só a alça (⋮⋮) inicia o arraste */
    root.addEventListener('mousedown', e => {
        const h = e.target.closest && e.target.closest('.check-handle');
        if(h) h.closest('.task-checklist-item').draggable = true;
    });
    document.addEventListener('mouseup', () => {
        if(!arrastando){
            root.querySelectorAll('.task-checklist-item[draggable="true"]')
                .forEach(r => { r.draggable = false; });
        }
    });
    root.addEventListener('dragstart', e => {
        const row = linhaDe(e);
        if(!row || e.target !== row) return;
        arrastando = row;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'checklist');
        setTimeout(() => row.classList.add('dragging-ck'), 0);
    });
    root.addEventListener('dragover', e => {
        if(!arrastando) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const ref = [...root.querySelectorAll('.task-checklist-item')]
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
        r.classList.remove('dragging-ck');
        checklistPersistirSeEventoExistente();   /* lê a nova ordem do DOM e salva */
    });

    /* Colar várias linhas num item: cada linha vira um item */
    root.addEventListener('paste', e => {
        const inp = e.target.closest && e.target.closest('.check-text-input');
        if(!inp) return;
        const txt = (e.clipboardData || window.clipboardData).getData('text/plain');
        const linhas = linhasParaChecklist(txt);
        if(linhas.length < 2) return;
        e.preventDefault();
        const row = inp.closest('.task-checklist-item');
        const idx = [...root.querySelectorAll('.task-checklist-item')].indexOf(row);
        if(!inp.value.trim()) inp.value = linhas.shift();
        checklistAdicionarTextos(linhas, idx + 1);
    });
});

/* --- Auto-altura + Enter cria novo item --- */
document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('formChecklistItems');
    if(!root) return;

    root.addEventListener('input', e => {
        if(e.target.classList && e.target.classList.contains('check-text-input')){
            checklistAjustar(e.target);
        }
    });

    root.addEventListener('keydown', e => {
        const inp = e.target;
        if(!inp.classList || !inp.classList.contains('check-text-input')) return;
        if(e.key !== 'Enter' || e.isComposing) return;
        e.preventDefault();
        const rows = [...root.querySelectorAll('.task-checklist-item')];
        const idx = rows.indexOf(inp.closest('.task-checklist-item'));
        checklistAdicionarTextos([''], idx + 1);
        setTimeout(() => {
            const n = root.querySelectorAll('.task-checklist-item')[idx + 1];
            const t = n && n.querySelector('.check-text-input');
            if(t) t.focus();
        }, 0);
    });
});

/* --- Alterações dentro do modal do evento (input / change / click) --- */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('modalForm');
    if(!form) return;

    form.addEventListener('input', e => {
        if(e.target.closest && e.target.closest('#formChecklistItems')){
            const row = e.target.closest('.task-checklist-item');
            if(row && e.target.classList.contains('check-text-input')) checklistPersistirSeEventoExistente();
            return;
        }
        if(['formTitulo','formResponsavel','formArea','formDescricao','formTipo','formStatus','formComplexidade'].includes(e.target.id)){
            sincronizarFormularioEmEdicao();
        }
    });

    form.addEventListener('change', e => {
        if(e.target.closest && e.target.closest('#formChecklistItems')){
            const row = e.target.closest('.task-checklist-item');
            if(row){
                row.classList.toggle('done', !!(row.querySelector('input[type=checkbox]')?.checked));
                checklistPersistirSeEventoExistente();
            }
            return;
        }
        if(['formResponsavel','formArea','formTipo','formStatus','formComplexidade'].includes(e.target.id)){
            sincronizarFormularioEmEdicao();
        }
    });

    form.addEventListener('click', e => {
        const del = e.target.closest && e.target.closest('.check-delete');
        if(del){
            e.preventDefault();
            const row = del.closest('.task-checklist-item');
            if(row) removerChecklistItem(row.dataset.checkId);
        }
    });
});

/* --- Fechar menu de responsável do checklist --- */
document.addEventListener('mousedown', e => {
    if(!e.target.closest || !e.target.closest('#checklistRespMenu, .check-resp-btn')){
        fecharMenuRespChecklist();
    }
});
document.addEventListener('keydown', e => { if(e.key === 'Escape') fecharMenuRespChecklist(); });
window.addEventListener('scroll', fecharMenuRespChecklist, true);

/* --- Celular: "Filtros ▸" abre/fecha os filtros --- */
document.addEventListener('DOMContentLoaded', () => {
    const bar = document.getElementById('filtersBar');
    const l   = bar && bar.querySelector('.lbl');
    if(l) l.addEventListener('click', () => bar.classList.toggle('filtros-abertos'));
});