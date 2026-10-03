/* ============================================================
   views/shared.js — Componentes de UI reutilizados
   Depende de: config.js, state.js, helpers.js
   ============================================================ */

/* ============================================================
   APARÊNCIA DO CARTÃO
   barra lateral = tipo; fundo = status
============================================================ */
function cardCss(ev){
    const t = getTipo(ev.tipo);
    const s = getStatus(ev.status);
    const bg  = s ? statusBg(s.cor) : 'var(--bg-panel-alt)';
    const txt = s ? rgbToHex(mix(hexToRgb(s.cor || '#888'), { r: 0, g: 0, b: 0 }, .55)) : 'var(--text-heading)';
    return `background:${bg};border-left-color:${t.cor || '#888'};color:${txt};`;
}

/* ============================================================
   CABEÇALHO DO CHIP (bolinhas - view Mês)
============================================================ */
function renderChipHeaderPontos(ev, isContinuation){
    const dot = (cor, tit) =>
        `<span class="dot-badge" style="background:${escapeHtml(cor)}" title="${escapeHtml(tit)}"></span>`;

    const parts = [];
    if(isContinuation) parts.push('<span class="continuation-mark" title="Continuação">↳</span>');
    if(ev.area)        parts.push(dot(getAreaCor(ev.area), 'Área: ' + ev.area));
    if(ev.responsavel) parts.push(dot(getRespCor(ev.responsavel), 'Responsável: ' + ev.responsavel));

    const cx = getComplexidade(ev.complexidade);
    if(cx) parts.push(dot(cx.cor, 'Complexidade: ' + cx.label));

    return parts.length ? `<div class="chip-header">${parts.join('')}</div>` : '';
}

/* ============================================================
   CABEÇALHO DO CHIP (nomes - demais views)
============================================================ */
function renderChipHeaderNomes(ev, isContinuation){
    const parts = [];
    if(isContinuation) parts.push('<span class="continuation-mark" title="Continuação">↳</span>');

    if(ev.area){
        parts.push(`<span class="badge badge-area" style="${badgeStyle(getAreaCor(ev.area))}" title="Área: ${escapeHtml(ev.area)}">${escapeHtml(ev.area)}</span>`);
    }
    if(ev.responsavel){
        parts.push(`<span class="badge badge-resp" style="${badgeStyle(getRespCor(ev.responsavel))}" title="Responsável: ${escapeHtml(ev.responsavel)}">@${escapeHtml(ev.responsavel)}</span>`);
    }
    const cx = getComplexidade(ev.complexidade);
    if(cx){
        parts.push(`<span class="badge badge-cx" style="${badgeStyle(cx.cor)}" title="Complexidade: ${cx.label}">${cx.label}</span>`);
    }
    return parts.length ? `<div class="chip-header">${parts.join('')}</div>` : '';
}

/* Escolhe entre pontos (Mês) e nomes (demais) */
function renderChipHeader(ev, isContinuation){
    return view === 'mes'
        ? renderChipHeaderPontos(ev, isContinuation)
        : renderChipHeaderNomes(ev, isContinuation);
}

/* ============================================================
   CHIP DE EVENTO (compacto / expandido)
============================================================ */
function renderChip(ev, position, dayKey, expandido){
    const t = getTipo(ev.tipo);
    const isMulti = ev.dataInicio !== ev.dataFim;
    const isCont  = isMulti && position !== 'start' && position !== 'single';
    const header  = renderChipHeader(ev, isCont);

    const periodo = (expandido && isMulti)
        ? `<div style="font-size:13px;opacity:.75;margin-top:3px;font-style:italic;">${fmtBR(ev.dataInicio)} → ${fmtBR(ev.dataFim)}</div>`
        : '';
    const desc = (expandido && ev.descricao)
        ? `<div style="font-size:14px;opacity:.85;margin-top:3px;">${descHtml(ev)}</div>`
        : '';
    const tipoLabel = expandido
        ? `<div style="font-size:11px;font-weight:700;text-transform:uppercase;opacity:.7;margin-top:3px;">${escapeHtml(t.label)}</div>`
        : '';

    const statusLabel = ev.status ? (getStatus(ev.status) ? getStatus(ev.status).label : ev.status) : '';
    const tooltip = [
        statusLabel ? 'Status: ' + statusLabel : '',
        ev.responsavel ? 'Resp: ' + ev.responsavel : '',
        ev.area ? 'Área: ' + ev.area : '',
        ev.titulo,
        isMulti ? `${fmtBR(ev.dataInicio)} → ${fmtBR(ev.dataFim)}` : '',
        ev.descricao || ''
    ].filter(Boolean).join(' • ');

    /* Modo expandido (view Lista) com ações */
    if(expandido){
        return `<div class="event-chip event-chip-expandido" style="${cardCss(ev)}" draggable="true"
                     data-event-id="${ev.id}" data-day="${dayKey}"
                     title="${escapeHtml(tooltip)}"
                     ondragstart="onChipDragStart(event, ${ev.id}, '${dayKey}')"
                     ondragend="onChipDragEnd(event)"
                     onclick="abrirFormEvento(${ev.id})">
                    <div class="chip-expandido-body">
                        ${header}
                        <span class="chip-title">${escapeHtml(ev.titulo)}</span>
                        ${periodo}${desc}${tipoLabel}
                    </div>
                    <div class="chip-actions">
                        <button class="btn-mini edit" onclick="event.stopPropagation(); abrirFormEvento(${ev.id})" title="Editar">${ic('edit',14)}</button>
                        <button class="btn-mini dup"  onclick="event.stopPropagation(); duplicarEvento(${ev.id})" title="Duplicar">${ic('copy',14)}</button>
                        <button class="btn-mini del"  onclick="event.stopPropagation(); excluirEvento(${ev.id})" title="Excluir">${ic('x',14)}</button>
                    </div>
                </div>`;
    }

    /* Modo compacto (Mês / Semana) — clique abre o form */
    return `<div class="event-chip" style="${cardCss(ev)}" draggable="true"
                 data-event-id="${ev.id}" data-day="${dayKey}"
                 title="${escapeHtml(tooltip)}"
                 ondragstart="onChipDragStart(event, ${ev.id}, '${dayKey}')"
                 ondragend="onChipDragEnd(event)"
                 onclick="event.stopPropagation(); abrirFormEvento(${ev.id})">
                ${header}
                <span class="chip-title">${escapeHtml(ev.titulo)}</span>
                ${periodo}${desc}${tipoLabel}
            </div>`;
}

/* ============================================================
   RESUMO DO CHECKLIST (contador + mini-barra)
============================================================ */
function checklistResumo(ev){
    const itens = Array.isArray(ev.checklist) ? ev.checklist : [];
    if(!itens.length) return '';

    const concluidos = itens.filter(i => i.concluido).length;
    const pct = Math.round((concluidos / itens.length) * 100);

    return `<div class="checklist-summary" title="Checklist: ${concluidos} de ${itens.length} concluídos">${ic('check', 13)}<span>${concluidos}/${itens.length}</span><span class="mini-bar"><span style="width:${pct}%"></span></span></div>`;
}

/* ============================================================
   LEGENDA INFERIOR (tipos + status)
============================================================ */
function renderLegend(){
    const l = document.getElementById('legend');
    if(!l) return;

    const tipos  = (data.config.tipos  || []).map(t => `<div class="item"><span class="lg-bar" style="background:${escapeHtml(t.cor)}"></span>${escapeHtml(t.label)}</div>`).join('');
    const status = (data.config.status || []).map(s => `<div class="item"><span class="lg-sw" style="background:${statusBg(s.cor)}"></span>${escapeHtml(s.label)}</div>`).join('');

    l.innerHTML =
        (tipos  ? '<span class="lg-t">Tipo</span>'   + tipos  : '') +
        (status ? '<div class="sep"></div><span class="lg-t">Status</span>' + status : '');
}