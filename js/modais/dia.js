/* ============================================================
   modais/dia.js — Modal "Eventos do dia"
   Depende de: config.js, state.js, helpers.js, views/shared.js
   ============================================================ */

/* ============================================================
   ABRIR / FECHAR
============================================================ */
function abrirModalDia(key){
    if(!key) key = dateKeyFromDate(currentDate);
    diaSelecionado = key;

    const [y, m, d] = key.split('-');
    document.getElementById('modalDiaTitulo').textContent = `${Number(d)} ${MESES[Number(m) - 1]} ${y}`;

    renderListaDia();
    document.getElementById('modalDia').classList.add('active');
}

function fecharModalDia(){
    document.getElementById('modalDia').classList.remove('active');
}

/* ============================================================
   RENDER DA LISTA
============================================================ */
function renderListaDia(){
    const evs = data.eventos
        .filter(ev => ev.dataInicio && ev.dataFim && ev.dataInicio <= diaSelecionado && diaSelecionado <= ev.dataFim)
        .filter(passaFiltro)
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || a.id - b.id);

    const c = document.getElementById('eventsDayList');
    if(!c) return;

    if(evs.length === 0){
        c.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;font-family:var(--font-body);">Nenhum evento neste dia.</p>';
        return;
    }

    c.innerHTML = evs.map(ev => {
        const t = getTipo(ev.tipo);
        const periodo = ev.dataInicio !== ev.dataFim
            ? `<span class="periodo">${fmtBR(ev.dataInicio)} → ${fmtBR(ev.dataFim)}</span>`
            : '';
        const header = renderChipHeader(ev, false);

        return `<div class="event-row" style="${cardCss(ev)}" data-event-id="${ev.id}">
                    <div class="info">
                        <span class="tipo-label">${escapeHtml(t.label)}</span>
                        ${header}
                        <strong>${escapeHtml(ev.titulo)}</strong>
                        ${periodo}
                        ${ev.descricao ? `<div class="desc">${descHtml(ev)}</div>` : ''}
                        ${checklistResumo(ev)}
                    </div>
                    <div class="row-actions">
                        <button class="btn-mini edit" onclick="abrirFormEvento(${ev.id})">Editar</button>
                        <button class="btn-mini dup"  onclick="duplicarEvento(${ev.id})">Duplicar</button>
                        <button class="btn-mini del"  onclick="excluirEvento(${ev.id})">Excluir</button>
                    </div>
                </div>`;
    }).join('');
}