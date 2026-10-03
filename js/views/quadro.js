/* ============================================================
   views/quadro.js — View Quadro (Kanban por status)
   Depende de: config.js, state.js, helpers.js, views/shared.js
   ============================================================ */

function renderQuadro(){
    const evs = data.eventos
        .filter(passaFiltro)
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || a.id - b.id);

    const cols = (data.config.status || []).map(s => ({
        id: s.id, label: s.label, cor: s.cor
    }));

    /* Coluna "Sem status" sempre que houver cards sem status */
    if(evs.some(e => !e.status)){
        cols.unshift({ id: '', label: 'Sem status', cor: '#94a3b8' });
    }

    return `<div class="quadro">${cols.map(c => {
        const cards = evs.filter(e => (e.status || '') === c.id);
        return `<section class="qcol">
            <header class="qcol-h">
                <span class="qdot" style="background:${escapeHtml(c.cor)}"></span>
                <span class="qcol-t">${escapeHtml(c.label)}</span>
                <span class="qcount">${cards.length}</span>
            </header>
            <div class="qlist" data-status="${escapeHtml(c.id)}"
                 ondragover="onDayDragOver(event, this)"
                 ondragleave="onDayDragLeave(event, this)"
                 ondrop="onQuadroDrop(event, this)">
                ${cards.map(renderQuadroCard).join('')}
            </div>
            <button class="qadd" onclick="novoCartaoQuadro('${escapeHtml(c.id)}')">
                ${ic('plus', 14)}Adicionar tarefa
            </button>
        </section>`;
    }).join('')}</div>`;
}

function renderQuadroCard(ev){
    const t   = getTipo(ev.tipo);
    const hdr = renderChipHeader(ev, false);

    const desc = ev.descricao
        ? `<div class="qdesc">${escapeHtml(ev.descricao.slice(0, 90))}${ev.descricao.length > 90 ? '…' : ''}</div>`
        : '';

    const dt = ev.dataInicio
        ? `<div class="qdate">${ic('calendar', 13)}${fmtBR(ev.dataInicio)}${ev.dataFim && ev.dataFim !== ev.dataInicio ? ' → ' + fmtBR(ev.dataFim) : ''}</div>`
        : '';

    return `<div class="event-chip qcard" style="${cardCss(ev)}" draggable="true" data-event-id="${ev.id}"
                 ondragstart="onChipDragStart(event, ${ev.id}, null)"
                 ondragend="onChipDragEnd(event)"
                 onclick="abrirFormEvento(${ev.id})">
                ${hdr}<span class="chip-title">${escapeHtml(ev.titulo)}</span>${desc}${dt}${checklistResumo(ev)}
            </div>`;
}

function onQuadroDrop(e, el){
    e.preventDefault();
    e.stopPropagation();
    el.classList.remove('drop-target');

    const id = dragState.eventId || Number(e.dataTransfer.getData('text/plain'));
    const ev = data.eventos.find(x => x.id === id);
    if(!ev) return;

    const status = el.dataset.status;

    /* Calcula em qual posição o card deve ser inserido (por Y do mouse) */
    const cards = [...el.querySelectorAll('.qcard')].filter(c => Number(c.dataset.eventId) !== id);
    let idx = cards.length;
    for(let i = 0; i < cards.length; i++){
        const r = cards[i].getBoundingClientRect();
        if(e.clientY < r.top + r.height / 2){ idx = i; break; }
    }

    /* Aplica o novo status */
    ev.status = status;

    /* Reordena todos os cards daquela coluna */
    const lista = data.eventos
        .filter(x => x.id !== id && (x.status || '') === status && passaFiltro(x))
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || a.id - b.id);

    lista.splice(idx, 0, ev);
    lista.forEach((x, i) => { x.ordem = (i + 1) * 10; });

    dragState.eventId = null;
    dragState.sourceDay = null;
    document.body.classList.remove('arrastando');

    marcarAlterado({ imediato: getAutosaveConfig().dragImediato });
    render();
}

function novoCartaoQuadro(status){
    diaSelecionado = '__inbox__';
    abrirFormEvento();
    document.getElementById('formStatus').value = status;
}