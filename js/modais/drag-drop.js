/* ============================================================
   drag-drop.js — Arrastar e soltar (eventos)
   Depende de: config.js, state.js, helpers.js
   ============================================================ */

/* ============================================================
   INÍCIO / FIM DO ARRASTE (chips)
============================================================ */
function onChipDragStart(e, id, dayKey){
    dragState.eventId = id;
    dragState.sourceDay = dayKey;

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(id));

    e.currentTarget.classList.add('dragging');
    document.body.classList.add('arrastando');
}

function onChipDragEnd(e){
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    document.body.classList.remove('arrastando');

    dragState.eventId = null;
    dragState.sourceDay = null;
}

/* ============================================================
   DROP EM DIA (célula do mês, coluna da semana, lista do dia)
============================================================ */
function onDayDragOver(e, el){
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    el.classList.add('drop-target');
}

function onDayDragLeave(e, el){
    if(!el.contains(e.relatedTarget)) el.classList.remove('drop-target');
}

function onDayDrop(e, el){
    e.preventDefault();
    e.stopPropagation();
    el.classList.remove('drop-target');

    let srcId = dragState.eventId;
    if(!srcId){
        const raw = e.dataTransfer.getData('text/plain');
        srcId = raw ? Number(raw) : null;
    }
    if(!srcId) return;

    const dayKey = el.dataset.day;
    if(!dayKey) return;

    const ev = data.eventos.find(x => x.id === srcId);
    if(!ev) return;

    if(!ev.dataInicio){
        /* Veio do Inbox: ganha data */
        ev.dataInicio = dayKey;
        ev.dataFim    = dayKey;
    } else {
        /* Já tem data: move mantendo a duração */
        const origem = dragState.sourceDay || ev.dataInicio;
        const diff = daysBetween(origem, dayKey);
        if(diff !== 0){
            ev.dataInicio = addDays(ev.dataInicio, diff);
            ev.dataFim    = addDays(ev.dataFim, diff);
        }
    }

    /* Reordena com base na posição do mouse */
    const chips = Array.from(el.querySelectorAll('.event-chip, .day-card'))
        .filter(c => Number(c.dataset.eventId) !== srcId);

    const mouseY = e.clientY;
    let insertBeforeIdx = chips.length;
    for(let i = 0; i < chips.length; i++){
        const rect = chips[i].getBoundingClientRect();
        if(mouseY < rect.top + rect.height / 2){
            insertBeforeIdx = i;
            break;
        }
    }

    const diaEvs = data.eventos
        .filter(x => x.id !== srcId
                  && x.dataInicio
                  && x.dataInicio <= dayKey
                  && dayKey <= x.dataFim
                  && passaFiltro(x))
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || a.id - b.id);

    diaEvs.splice(insertBeforeIdx, 0, ev);
    diaEvs.forEach((x, i) => { x.ordem = (i + 1) * 10; });

    dragState.eventId = null;
    dragState.sourceDay = null;
    document.body.classList.remove('arrastando');

    const cfg = getAutosaveConfig();
    marcarAlterado({ imediato: cfg.dragImediato });
    render();
}

/* ============================================================
   DROPZONE DO INBOX (barra que aparece no topo)
============================================================ */
function onInboxDragOver(e){
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const dz = document.getElementById('inboxDropzone');
    if(dz) dz.classList.add('drop-target');
}

function onInboxDragLeave(e){
    const dz = document.getElementById('inboxDropzone');
    if(dz) dz.classList.remove('drop-target');
}

function onInboxDrop(e){
    e.preventDefault();
    e.stopPropagation();

    const dz = document.getElementById('inboxDropzone');
    if(dz) dz.classList.remove('drop-target');

    let srcId = dragState.eventId;
    if(!srcId){
        const raw = e.dataTransfer.getData('text/plain');
        srcId = raw ? Number(raw) : null;
    }
    if(!srcId) return;

    const ev = data.eventos.find(x => x.id === srcId);
    if(!ev) return;

    /* Remove a data */
    ev.dataInicio = '';
    ev.dataFim = '';

    dragState.eventId = null;
    dragState.sourceDay = null;
    document.body.classList.remove('arrastando');

    const cfg = getAutosaveConfig();
    marcarAlterado({ imediato: cfg.dragImediato });
    render();
}

/* ============================================================
   DROP NA LISTA DO INBOX (reordenar dentro do inbox)
============================================================ */
function onInboxListDragOver(e, el){
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    el.classList.add('drop-target');
}

function onInboxListDragLeave(e, el){
    if(!el.contains(e.relatedTarget)) el.classList.remove('drop-target');
}

function onInboxListDrop(e, el){
    e.preventDefault();
    e.stopPropagation();
    el.classList.remove('drop-target');

    let srcId = dragState.eventId;
    if(!srcId){
        const raw = e.dataTransfer.getData('text/plain');
        srcId = raw ? Number(raw) : null;
    }
    if(!srcId) return;

    const ev = data.eventos.find(x => x.id === srcId);
    if(!ev) return;

    if(!ev.dataInicio){
        /* Veio de dentro do próprio Inbox — reordena */
        const cards = Array.from(el.querySelectorAll('.day-card'))
            .filter(c => Number(c.dataset.eventId) !== srcId);

        const mouseY = e.clientY;
        let insertBeforeIdx = cards.length;
        for(let i = 0; i < cards.length; i++){
            const rect = cards[i].getBoundingClientRect();
            if(mouseY < rect.top + rect.height / 2){
                insertBeforeIdx = i;
                break;
            }
        }

        const inboxEvs = data.eventos
            .filter(x => x.id !== srcId && !x.dataInicio)
            .sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || a.id - b.id);

        inboxEvs.splice(insertBeforeIdx, 0, ev);
        inboxEvs.forEach((x, i) => { x.ordem = (i + 1) * 10; });

    } else {
        /* Veio do calendário: vira tarefa sem data */
        ev.dataInicio = '';
        ev.dataFim = '';
    }

    dragState.eventId = null;
    dragState.sourceDay = null;
    document.body.classList.remove('arrastando');

    const cfg = getAutosaveConfig();
    marcarAlterado({ imediato: cfg.dragImediato });
    render();
}
