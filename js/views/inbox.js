/* ============================================================
   views/inbox.js — View Inbox (tarefas sem data)
   Depende de: config.js, state.js, helpers.js, views/shared.js
   ============================================================ */

function renderInbox(){
    const todos = data.eventos
        .filter(ev => !ev.dataInicio)
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || a.id - b.id);

    const evs = todos.filter(passaFiltro);

    let html = '<div class="inbox-view">';

    html += `<div class="inbox-header">
        <div>
            <h2>Caixa de Entrada</h2>
            <div class="sub">${evs.length} de ${todos.length} tarefa${todos.length !== 1 ? 's' : ''} sem data</div>
        </div>
        <div class="day-nav">
            <button class="btn btn-secondary" onclick="novoEventoInbox()">Nova tarefa sem data</button>
        </div>
    </div>`;

    html += `<div class="inbox-list" data-inbox="1"
                  ondragover="onInboxListDragOver(event, this)"
                  ondragleave="onInboxListDragLeave(event, this)"
                  ondrop="onInboxListDrop(event, this)">`;

    if(evs.length > 0) evs.forEach(ev => { html += renderInboxCard(ev); });

    html += '</div></div>';
    return html;
}

function renderInboxCard(ev){
    const t      = getTipo(ev.tipo);
    const header = renderChipHeader(ev, false);
    const desc   = ev.descricao ? `<div class="dc-desc">${descHtml(ev)}</div>` : '';

    return `<div class="day-card" style="${cardCss(ev)}" draggable="true"
                 data-event-id="${ev.id}" data-inbox="1"
                 ondragstart="onChipDragStart(event, ${ev.id}, null)"
                 ondragend="onChipDragEnd(event)"
                 onclick="abrirFormEvento(${ev.id})">
                <div class="dc-header">
                    <div style="flex:1;min-width:0;">${header}</div>
                    <div class="dc-actions">
                        <button class="btn-mini edit" onclick="event.stopPropagation(); agendarEvento(${ev.id})" title="Agendar data">${ic('calendar',14)}</button>
                        <button class="btn-mini edit" onclick="event.stopPropagation(); abrirFormEvento(${ev.id})" title="Editar">${ic('edit',14)}</button>
                        <button class="btn-mini dup"  onclick="event.stopPropagation(); duplicarEvento(${ev.id})" title="Duplicar">${ic('copy',14)}</button>
                        <button class="btn-mini del"  onclick="event.stopPropagation(); excluirEvento(${ev.id})" title="Excluir">${ic('x',14)}</button>
                    </div>
                </div>
                <div class="dc-title">${escapeHtml(ev.titulo)}</div>
                ${desc}${checklistResumo(ev)}
                <div class="dc-meta"><span style="opacity:.7;font-weight:700;text-transform:uppercase;font-size:11px;">${escapeHtml(t.label)}</span></div>
            </div>`;
}

function novoEventoInbox(){
    diaSelecionado = '__inbox__';
    abrirFormEvento();
}

function agendarEvento(id){
    const ev = data.eventos.find(e => e.id === id);
    if(!ev) return;

    diaSelecionado = dateKeyFromDate(new Date());
    abrirFormEvento(id);

    /* Depois que o form abre, desmarca "sem data" e põe a data de hoje */
    setTimeout(() => {
        const chk = document.getElementById('formSemData');
        if(chk) chk.checked = false;
        toggleSemData();
        document.getElementById('formDataInicio').value = dateKeyFromDate(new Date());
    }, 60);
}