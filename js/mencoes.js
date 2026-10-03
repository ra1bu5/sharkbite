/* ============================================================
   mencoes.js — Sistema de @menções no RTE
   Depende de: config.js, state.js, helpers.js, rte.js
   ============================================================ */

/* ============================================================
   ESTADO / VERIFICAÇÃO
============================================================ */
function mencaoAberta(){
    const m = document.getElementById('mencaoMenu');
    return !!(m && m.style.display === 'block');
}

function mencaoFechar(){
    const m = document.getElementById('mencaoMenu');
    if(m) m.style.display = 'none';
    mencaoAlvo = null;
}

/* ============================================================
   VERIFICAR SE O USUÁRIO ESTÁ DIGITANDO "@alguma coisa"
   Chamado a cada input no editor
============================================================ */
function mencaoVerificar(ed){
    const s = getSelection();
    if(!s.rangeCount || !s.isCollapsed || !s.anchorNode || s.anchorNode.nodeType !== 3){
        return mencaoFechar();
    }

    /* Procura "@palavra" imediatamente antes do cursor */
    const m = /(^|\s)@([^\s@]*)$/.exec(s.anchorNode.textContent.slice(0, s.anchorOffset));
    if(!m) return mencaoFechar();

    const q = m[2].toLowerCase();
    mencaoLista = (data.config.responsaveis || [])
        .filter(r => r.label.toLowerCase().includes(q))
        .slice(0, 8);

    if(!mencaoLista.length) return mencaoFechar();

    mencaoSel = 0;
    mencaoAlvo = {
        node: s.anchorNode,
        ini:  s.anchorOffset - m[2].length - 1,
        fim:  s.anchorOffset
    };

    /* Cria o menu se ainda não existir */
    let menu = document.getElementById('mencaoMenu');
    if(!menu){
        menu = document.createElement('div');
        menu.id = 'mencaoMenu';
        document.body.appendChild(menu);
    }

    /* Posiciona próximo ao cursor */
    const rc  = s.getRangeAt(0).getBoundingClientRect();
    const ref = rc.height ? rc : ed.getBoundingClientRect();
    menu.style.display = 'block';
    menu.style.left = Math.max(8, Math.min(ref.left, innerWidth - 240)) + 'px';
    menu.style.top  = (ref.bottom + 6) + 'px';

    mencaoDesenhar();
}

/* ============================================================
   DESENHAR LISTA
============================================================ */
function mencaoDesenhar(){
    const menu = document.getElementById('mencaoMenu');
    if(!menu) return;

    menu.innerHTML = mencaoLista.map((r, i) =>
        `<div class="mencao-item ${i === mencaoSel ? 'sel' : ''}"
              onmousedown="event.preventDefault(); mencaoEscolher(${i})">
            <span class="dot-badge" style="background:${escapeHtml(r.cor)}"></span>
            ${escapeHtml(r.label)}
        </div>`
    ).join('');
}

/* ============================================================
   TECLADO (↑ ↓ Enter Tab Esc)
   Retorna true se consumiu a tecla
============================================================ */
function mencaoTecla(e){
    if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
        e.preventDefault();
        mencaoSel = (mencaoSel + (e.key === 'ArrowDown' ? 1 : -1) + mencaoLista.length) % mencaoLista.length;
        mencaoDesenhar();
        return true;
    }
    if(e.key === 'Enter' || e.key === 'Tab'){
        e.preventDefault();
        mencaoEscolher(mencaoSel);
        return true;
    }
    if(e.key === 'Escape'){
        e.preventDefault();
        e.stopPropagation();
        mencaoFechar();
        return true;
    }
    return false;
}

/* ============================================================
   ESCOLHER UMA MENÇÃO
============================================================ */
function mencaoEscolher(i){
    const r = mencaoLista[i];
    const a = mencaoAlvo;
    if(!r || !a) return;

    const ed = a.node.parentElement.closest('.rte');
    if(!ed) return;

    /* Seleciona o trecho "@palavra" */
    const rg = document.createRange();
    rg.setStart(a.node, a.ini);
    rg.setEnd(a.node, a.fim);

    const s = getSelection();
    s.removeAllRanges();
    s.addRange(rg);

    mencaoFechar();

    /* Substitui pelo chip da menção */
    document.execCommand('insertHTML', false,
        `<span class="mention" data-resp="${escapeHtml(r.label)}" style="background-color:${escapeHtml(r.cor)}33" contenteditable="false">@${escapeHtml(r.label)}</span>&nbsp;`
    );

    rteBind(ed);
    rteMudou(ed);
}

/* ============================================================
   LISTENER GLOBAL: input no editor dispara verificação
   (Obs.: o rte.js já adiciona esse listener, mas mantemos o
   comportamento aqui para documentar a dependência)
============================================================ */
/* Nada a fazer — o listener já está em rte.js */