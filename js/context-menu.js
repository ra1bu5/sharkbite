/* ============================================================
   context-menu.js — Menu de botão direito nos cartões
   Depende de: config.js, state.js, helpers.js, views/shared.js
   ============================================================ */

/* ============================================================
   ABRIR MENU RÁPIDO
============================================================ */
function abrirMenuRapido(e, id){
    const ev = data.eventos.find(x => x.id === id);
    if(!ev) return;

    fecharMenuRapido();

    const cfg = data.config;

    /* Opções agrupadas por campo */
    ctxOpcoes = {
        status: (cfg.status || []).map(s => ({ valor: s.id, label: s.label, cor: s.cor })),
        responsavel: [{ valor: '', label: 'Sem responsável' }].concat(
            (cfg.responsaveis || []).map(r => ({ valor: r.label, label: r.label, cor: r.cor }))
        ),
        area: [{ valor: '', label: 'Sem área' }].concat(
            (cfg.areas || []).map(a => ({ valor: a.label, label: a.label, cor: a.cor }))
        ),
        tipo: (cfg.tipos || []).map(t => ({ valor: t.id, label: t.label, cor: t.cor })),
        complexidade: [{ valor: '', label: 'Não definida' }].concat(
            COMPLEXIDADES.map(c => ({ valor: c.id, label: c.label, cor: c.cor }))
        )
    };

    /* Renderiza cada grupo com submenu */
    const grupo = (titulo, campo) => `
        <div class="ctx-item" onmouseenter="ctxAjustar(this)">
            ${titulo}
            <span class="ctx-arrow">›</span>
            <div class="ctx-sub">
                ${ctxOpcoes[campo].map((o, i) =>
                    `<div class="ctx-opt ${(o.valor || '') === (ev[campo] || '') ? 'atual' : ''}"
                          onclick="aplicarRapido(${id}, '${campo}', ${i})">
                        ${o.cor ? `<span class="dot-badge" style="background:${escapeHtml(o.cor)}"></span>` : ''}
                        ${escapeHtml(o.label)}
                    </div>`
                ).join('')}
            </div>
        </div>`;

    const m = document.createElement('div');
    m.id = 'ctxRapido';
    m.innerHTML =
        grupo('Status', 'status') +
        grupo('Responsável', 'responsavel') +
        grupo('Área', 'area') +
        grupo('Tipo', 'tipo') +
        grupo('Complexidade', 'complexidade') +
        `<div class="ctx-sep"></div>
         <div class="ctx-item" onclick="fecharMenuRapido(); abrirFormEvento(${id})">Abrir cartão</div>`;

    document.body.appendChild(m);

    /* Posiciona dentro da viewport */
    m.style.left = Math.max(8, Math.min(e.clientX, innerWidth - m.offsetWidth - 8)) + 'px';
    m.style.top  = Math.max(8, Math.min(e.clientY, innerHeight - m.offsetHeight - 8)) + 'px';

    /* Se estourar à direita, inverte o submenu */
    if(m.getBoundingClientRect().right + 200 > innerWidth) m.classList.add('flip');
}

/* ============================================================
   AJUSTAR SUBMENU (evita sair para baixo)
============================================================ */
function ctxAjustar(item){
    const sub = item.querySelector('.ctx-sub');
    if(!sub) return;
    sub.style.top = '-5px';
    const r = sub.getBoundingClientRect();
    if(r.bottom > innerHeight - 8){
        sub.style.top = (-5 - (r.bottom - innerHeight + 8)) + 'px';
    }
}

/* ============================================================
   FECHAR
============================================================ */
function fecharMenuRapido(){
    const m = document.getElementById('ctxRapido');
    if(m) m.remove();
}

/* ============================================================
   APLICAR UMA OPÇÃO
============================================================ */
function aplicarRapido(id, campo, i){
    const ev = data.eventos.find(x => x.id === id);
    const op = (ctxOpcoes[campo] || [])[i];
    if(!ev || !op) return;

    ev[campo] = op.valor;
    fecharMenuRapido();

    marcarAlterado({ imediato: getAutosaveConfig().dragImediato });
    render();
}

/* ============================================================
   LISTENERS GLOBAIS
============================================================ */

/* Botão direito em qualquer elemento com [data-event-id] */
document.addEventListener('contextmenu', e => {
    const c = e.target.closest && e.target.closest('[data-event-id]');
    if(!c || e.target.closest('.rte')) return;

    e.preventDefault();
    abrirMenuRapido(e, Number(c.dataset.eventId));
});

/* Toque prolongado no celular (500ms) */
document.addEventListener('touchstart', e => {
    const c = e.target.closest && e.target.closest('[data-event-id]');
    if(!c || e.target.closest('.rte')) return;

    const touch = e.touches[0];
    toquePressTimer = setTimeout(() => {
        toquePressTimer = null;
        abrirMenuRapido(
            { clientX: touch.clientX, clientY: touch.clientY, preventDefault(){} },
            Number(c.dataset.eventId)
        );
    }, 500);
}, { passive: true });

document.addEventListener('touchmove',  () => { clearTimeout(toquePressTimer); }, { passive: true });
document.addEventListener('touchend',   () => { clearTimeout(toquePressTimer); });

/* Fechar ao clicar fora / pressionar Esc / redimensionar */
document.addEventListener('mousedown', e => {
    if(!e.target.closest || !e.target.closest('#ctxRapido')) fecharMenuRapido();
});
document.addEventListener('keydown', e => {
    if(e.key === 'Escape') fecharMenuRapido();
});
window.addEventListener('resize', fecharMenuRapido);