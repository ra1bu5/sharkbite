/* ============================================================
   views/mes.js — View Mês, popover de dia e clique em célula
   Depende de: config.js, state.js, helpers.js, views/shared.js
   ============================================================ */

/* ============================================================
   CONFIG: LINHAS POR DIA (Mês)
============================================================ */
function linhasMes(){
    return Math.max(1, Math.min(8, Number((data.config || {}).linhasMes) || 3));
}

function setLinhasMes(v){
    data.config.linhasMes = Math.max(1, Math.min(8, Number(v) || 3));
    marcarAlterado();
    if(view === 'mes') render();
}

/* ============================================================
   RENDER DO MÊS
============================================================ */
function renderMes(){
    const ano = currentDate.getFullYear();
    const mes = currentDate.getMonth();

    const primeiro     = new Date(ano, mes, 1);
    const diaSemanaIni = primeiro.getDay();
    const ultimoDia    = new Date(ano, mes + 1, 0).getDate();
    const ultimoAnt    = new Date(ano, mes, 0).getDate();
    const hojeKey      = dateKeyFromDate(new Date());
    const mapa         = construirMapa();

    let html = `<table class="calendar" style="--linhas:${linhasMes()}"><thead><tr>`;
    ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'].forEach((d, i) => {
        html += `<th class="${(i === 0 || i === 6) ? 'weekend' : ''}">${d}</th>`;
    });
    html += '</tr></thead><tbody>';

    const total = Math.ceil((diaSemanaIni + ultimoDia) / 7) * 7;

    for(let i = 0; i < total; i++){
        if(i % 7 === 0) html += '<tr>';

        const dia = i - diaSemanaIni + 1;
        let cy = ano, cm = mes, cd, other = false;

        if(dia < 1){
            other = true;
            cm = mes - 1; cy = ano;
            if(cm < 0){ cm = 11; cy--; }
            cd = ultimoAnt + dia;
        } else if(dia > ultimoDia){
            other = true;
            cm = mes + 1; cy = ano;
            if(cm > 11){ cm = 0; cy++; }
            cd = dia - ultimoDia;
        } else {
            cd = dia;
        }

        const key = dateKey(cy, cm, cd);
        const evs = mapa[key] || [];
        const wknd = (i % 7 === 0 || i % 7 === 6);
        const hj   = key === hojeKey;

        let cls = '';
        if(other) cls += ' other-month';
        if(wknd)  cls += ' weekend';

        html += `<td class="${cls}" data-day="${key}" ${other ? '' : `onclick="cellClick(event, '${key}')"`} ondragover="onDayDragOver(event, this)" ondragleave="onDayDragLeave(event, this)" ondrop="onDayDrop(event, this)">`;
        {
            html += `<span class="day-number ${hj ? 'hoje' : ''}">${cd}</span>`;
            if(evs.length > 0){
                const max = linhasMes();
                html += '<div class="events-list">';
                evs.slice(0, max).forEach(({ ev, position }) => {
                    html += renderChip(ev, position, key);
                });
                if(evs.length > max){
                    html += `<button class="more-btn" onclick="abrirPopDia(event, '${key}')" title="Ver todos os eventos do dia">+${evs.length - max}</button>`;
                }
                html += '</div>';
            }
        }
        html += '</td>';

        if(i % 7 === 6) html += '</tr>';
    }

    html += '</tbody></table>';
    return html;
}

/* ============================================================
   CLIQUE EM CÉLULA VAZIA (ou com eventos)
============================================================ */
function cellClick(e, key){
    if(e.target.closest('.event-chip')) return;

    const tem = data.eventos.some(ev =>
        ev.dataInicio && ev.dataInicio <= key && key <= (ev.dataFim || ev.dataInicio)
    );

    if(tem){
        abrirModalDia(key);
    } else {
        diaSelecionado = key;
        abrirFormEvento(null, key);
    }
}

/* ============================================================
   POPOVER "+N" DO DIA
============================================================ */
function fecharPopDia(){
    const p = document.getElementById('popDia');
    if(p) p.remove();
}

function abrirPopDia(e, key){
    e.stopPropagation();
    fecharPopDia();

    const lista = construirMapa()[key] || [];
    const [y, m, d] = key.split('-').map(Number);
    const tit = new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long'
    });

    const p = document.createElement('div');
    p.id = 'popDia';
    p.innerHTML = `
        <div class="pop-h">
            <span>${escapeHtml(tit.charAt(0).toUpperCase() + tit.slice(1))}</span>
            <button onclick="fecharPopDia()" title="Fechar">${ic('x', 16)}</button>
        </div>
        <div class="pop-list">
            ${lista.map(({ ev }) => `
                <div class="event-chip pop-item" style="${cardCss(ev)}" data-event-id="${ev.id}"
                     onclick="fecharPopDia(); abrirFormEvento(${ev.id})">
                    ${renderChipHeaderPontos(ev, false)}
                    <span class="chip-title">${escapeHtml(ev.titulo)}</span>
                </div>`).join('')}
        </div>
        <button class="pop-add" onclick="fecharPopDia(); abrirFormEvento(null, '${key}')">Novo evento neste dia</button>
    `;

    document.body.appendChild(p);

    const rc = e.currentTarget.getBoundingClientRect();
    p.style.left = Math.max(8, Math.min(rc.left + rc.width / 2 - 150, innerWidth - 308)) + 'px';
    p.style.top  = (rc.bottom + 6 + p.offsetHeight > innerHeight
        ? Math.max(8, rc.top - 6 - p.offsetHeight)
        : rc.bottom + 6) + 'px';
}

/* ============================================================
   FECHAR POPOVER AO CLICAR FORA / ESC
============================================================ */
document.addEventListener('mousedown', e => {
    if(!e.target.closest || !e.target.closest('#popDia, .more-btn')) fecharPopDia();
});

document.addEventListener('keydown', e => {
    if(e.key === 'Escape') fecharPopDia();
});