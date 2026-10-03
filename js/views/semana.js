/* ============================================================
   views/semana.js — View Semana
   Depende de: config.js, state.js, helpers.js, views/shared.js, menus.js
   ============================================================ */

function renderSemana(){
    const ini = new Date(currentDate);
    ini.setDate(currentDate.getDate() - currentDate.getDay());

    const hojeKey = dateKeyFromDate(new Date());
    const mapa    = construirMapa();
    const util    = semanaUtil();

    let html = `<div class="week-grid" style="grid-template-columns:repeat(${util ? 5 : 7}, minmax(0, 1fr))">`;

    for(let i = 0; i < 7; i++){
        if(util && (i === 0 || i === 6)) continue;

        const d = new Date(ini);
        d.setDate(ini.getDate() + i);

        const key = dateKeyFromDate(d);
        const evs = mapa[key] || [];
        const hj  = key === hojeKey;
        const wknd = (i === 0 || i === 6);

        html += `<div class="week-col ${wknd ? 'weekend' : ''}" data-day="${key}"
                      ondragover="onDayDragOver(event, this)"
                      ondragleave="onDayDragLeave(event, this)"
                      ondrop="onDayDrop(event, this)">`;

        html += `<div class="week-col-header ${hj ? 'hoje' : ''}">
                    <span style="font-size:9px;text-transform:uppercase;letter-spacing:1px;">${DIAS_SEMANA_CURTO[i]}</span>
                    <span class="wk-day">${d.getDate()}</span>
                    <button class="wk-add" title="Novo evento em ${d.getDate()}/${d.getMonth() + 1}"
                            onclick="event.stopPropagation(); novoEventoNoDia('${key}')">${ic('plus', 12)}</button>
                </div>`;

        evs.forEach(({ ev, position }) => {
            html += renderChip(ev, position, key);
        });

        html += '</div>';
    }

    html += '</div>';
    return html;
}