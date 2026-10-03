/* ============================================================
   views/dia.js — View Dia
   Depende de: config.js, state.js, helpers.js, views/shared.js
   ============================================================ */

/* ============================================================
   VIEW DIA
============================================================ */
function renderDia(){
    const key = dateKeyFromDate(currentDate);
    const mapa = construirMapa();
    const evs  = mapa[key] || [];
    const dt   = currentDate;
    const hj   = key === dateKeyFromDate(new Date());

    let html = '<div class="day-view">';

    html += `<div class="day-view-header">
        <div>
            <h2>${dt.getDate()} ${MESES[dt.getMonth()]} ${dt.getFullYear()}</h2>
            <div class="sub">${DIAS_SEMANA_LONGO[dt.getDay()]} ${hj ? '• HOJE' : ''}</div>
        </div>
        <div class="day-nav">
            <button class="btn btn-nav" onclick="navDiaPrev()">‹</button>
            <button class="btn btn-primary" onclick="irHoje()">Hoje</button>
            <button class="btn btn-nav" onclick="navDiaNext()">›</button>
            <button class="btn btn-secondary" onclick="abrirFormEvento(null, '${key}')">Novo</button>
        </div>
    </div>`;

    html += renderDayStrip();

    html += `<div class="day-view-list" data-day="${key}"
                  ondragover="onDayDragOver(event, this)"
                  ondragleave="onDayDragLeave(event, this)"
                  ondrop="onDayDrop(event, this)">`;

    evs.forEach(({ ev, position }) => {
        html += renderDayCard(ev, position, key);
    });

    html += '</div></div>';
    return html;
}

/* ============================================================
   FAIXA DE 7 DIAS (navegação)
============================================================ */
function renderDayStrip(){
    const ini = new Date(currentDate);
    ini.setDate(currentDate.getDate() - currentDate.getDay());

    const hojeKey = dateKeyFromDate(new Date());
    const curKey  = dateKeyFromDate(currentDate);

    let html = '<div class="day-strip">';

    for(let i = 0; i < 7; i++){
        const d = new Date(ini);
        d.setDate(ini.getDate() + i);

        const k = dateKeyFromDate(d);
        const cls = ['day-strip-item'];
        if(k === curKey)  cls.push('active');
        if(k === hojeKey) cls.push('hoje');

        html += `<button type="button" class="${cls.join(' ')}" onclick="irParaDia('${k}')">
                    <span class="ds-wd">${DIAS_SEMANA_CURTO[i]}</span>
                    <span class="ds-num">${d.getDate()}</span>
                 </button>`;
    }

    html += '</div>';
    return html;
}

/* ============================================================
   CARD DE EVENTO (view Dia)
============================================================ */
function renderDayCard(ev, position, dayKey){
    const t = getTipo(ev.tipo);
    const isMulti = ev.dataInicio !== ev.dataFim;
    const isCont  = isMulti && position !== 'start' && position !== 'single';
    const header  = renderChipHeader(ev, isCont);

    const periodo = isMulti
        ? `<div class="dc-meta">${fmtBR(ev.dataInicio)} → ${fmtBR(ev.dataFim)}</div>`
        : '';
    const desc = ev.descricao
        ? `<div class="dc-desc">${descHtml(ev)}</div>`
        : '';

    return `<div class="day-card" style="${cardCss(ev)}" draggable="true"
                 data-event-id="${ev.id}" data-day="${dayKey}"
                 ondragstart="onChipDragStart(event, ${ev.id}, '${dayKey}')"
                 ondragend="onChipDragEnd(event)"
                 onclick="abrirFormEvento(${ev.id})">
                <div class="dc-header">
                    <div style="flex:1;min-width:0;">${header}</div>
                    <div class="dc-actions">
                        <button class="btn-mini edit" onclick="event.stopPropagation(); abrirFormEvento(${ev.id})">${ic('edit',14)}</button>
                        <button class="btn-mini dup"  onclick="event.stopPropagation(); duplicarEvento(${ev.id})">${ic('copy',14)}</button>
                        <button class="btn-mini del"  onclick="event.stopPropagation(); excluirEvento(${ev.id})">${ic('x',14)}</button>
                    </div>
                </div>
                <div class="dc-title">${escapeHtml(ev.titulo)}</div>
                ${periodo}${desc}${checklistResumo(ev)}
                <div class="dc-meta"><span style="opacity:.7;font-weight:700;text-transform:uppercase;font-size:11px;">${escapeHtml(t.label)}</span></div>
            </div>`;
}