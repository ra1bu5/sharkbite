/* ============================================================
   rte.js — Editor de Texto Rico (usado nas Notas e nas Descrições)
   Depende de: config.js, state.js, helpers.js
   ============================================================ */

/* ============================================================
   CONSTANTES DO EDITOR
============================================================ */
const RTE_FONTES   = ['Inter', 'Calibri', 'Arial', 'Georgia', 'Times New Roman', 'Verdana', 'Courier New', 'Comic Sans MS'];
const RTE_TAMANHOS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

const SAN_TAGS = new Set([
    'B','STRONG','I','EM','U','S','STRIKE','MARK','SUB','SUP','CODE',
    'BR','DIV','P','SPAN','UL','OL','LI','A','H1','H2','H3','FONT','INPUT'
]);
const SAN_STYLE = [
    'color','background-color','font-family','font-size','font-weight',
    'font-style','text-decoration','text-align'
];

/* ============================================================
   EVENT LISTENERS GLOBAIS
============================================================ */
document.addEventListener('mousedown', e => {
    overlayDown = !!(e.target.classList && e.target.classList.contains('modal-overlay'));
}, true);

document.addEventListener('selectionchange', () => {
    const s = getSelection();
    if(!s.rangeCount) return;
    const n = s.anchorNode, el = n && (n.nodeType === 1 ? n : n.parentElement);
    const ed = el && el.closest ? el.closest('.rte') : null;
    if(ed){
        rteUltimo = ed;
        rteRange  = s.getRangeAt(0).cloneRange();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const b = document.getElementById('rteBarraForm');
    if(b) b.innerHTML = rteBarra();
});

/* ============================================================
   BARRA DE FORMATAÇÃO
============================================================ */
function rteBarra(){
    const b = (cmd, label, title, cls) =>
        `<button type="button" class="fmt-btn ${cls || ''}" onmousedown="event.preventDefault(); rteAcao('${cmd}')" title="${title}">${label}</button>`;

    return `<div class="rte-bar">
        <select onchange="rteSel('fontName', this)" title="Fonte">
            <option value="">Fonte</option>
            ${RTE_FONTES.map(f => `<option value="${f}" style="font-family:'${f}'">${f}</option>`).join('')}
        </select>
        <select onchange="rteTamanho(this)" title="Tamanho">
            <option value="">Tamanho</option>
            ${RTE_TAMANHOS.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
        <div class="fmt-group">
            ${b('bold','B','Negrito (Ctrl+B)','fmt-b')}
            ${b('italic','I','Itálico (Ctrl+I)','fmt-i')}
            ${b('underline','U','Sublinhado (Ctrl+U)','fmt-u')}
            ${b('strikeThrough','S','Riscado','fmt-s')}
            ${b('superscript','X²','Sobrescrito','fmt-sup')}
            ${b('subscript','X₂','Subscrito','fmt-sub')}
        </div>
        <div class="fmt-group">
            <input type="color" value="#0b2a4a" onchange="rteCor(this.value)" title="Cor da fonte">
            ${b('mark', ic('marker'), 'Marca-texto (liga/desliga)', 'fmt-hl')}
        </div>
        <div class="fmt-group">
            ${b('insertUnorderedList', ic('ul'), 'Lista com marcadores')}
            ${b('insertOrderedList','1.','Lista numerada')}
        </div>
        <div class="fmt-group">
            ${b('createLink', ic('link'), 'Inserir link')}
            ${b('removeFormat','Tx','Limpar formatação')}
            ${b('undo','↶','Desfazer')}
            ${b('redo','↷','Refazer')}
        </div>
    </div>`;
}

/* ============================================================
   EDIÇÃO — FUNÇÕES INTERNAS
============================================================ */
function edAtivo(){
    const a = document.activeElement;
    const c = a && a.closest ? a.closest('.rte') : null;
    if(c) return c;
    if(rteUltimo && document.contains(rteUltimo)) return rteUltimo;
    return document.getElementById('notaEditor');
}

function rteRestaurar(){
    const ed = edAtivo();
    if(!ed) return null;
    ed.focus();
    if(rteRange){
        const s = getSelection();
        s.removeAllRanges();
        s.addRange(rteRange);
    }
    return ed;
}

function rteMudou(ed){
    if(!ed) return;
    ed.dispatchEvent(new Event('input', { bubbles: true }));
    fmtAtualizarEstado();
}

/* Tamanho em pontos: aplica via span (execCommand fontSize só aceita 1-7) */
function rteTamanho(sel){
    const v = sel.value;
    sel.selectedIndex = 0;
    if(!v) return;
    const ed = rteRestaurar();
    if(!ed) return;

    document.execCommand('fontSize', false, '7');
    ed.querySelectorAll('font[size="7"]').forEach(f => {
        const span = document.createElement('span');
        span.style.fontSize = v + 'pt';
        while(f.firstChild) span.appendChild(f.firstChild);
        f.replaceWith(span);
    });
    rteMudou(ed);
}

function rteAcao(cmd){
    const ed = edAtivo();
    if(!ed) return;
    ed.focus();

    if(cmd === 'mark')  return fmtHighlight();
    if(cmd === 'check') return rteChecklist();

    if(cmd === 'createLink'){
        const u = prompt('Endereço do link:', 'https://');
        if(!u || u === 'https://') return;
        const url = /^(https?:|mailto:)/i.test(u) ? u : 'https://' + u;
        rteRestaurar();
        if(getSelection().isCollapsed){
            document.execCommand('insertHTML', false, `<a href="${escapeHtml(url)}">${escapeHtml(u)}</a>`);
        } else {
            document.execCommand('createLink', false, url);
        }
    } else {
        document.execCommand(cmd, false, null);
    }
    rteMudou(ed);
}

function rteEstilo(cmd, v){
    const ed = rteRestaurar();
    if(!ed) return;
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(cmd, false, v);
    document.execCommand('styleWithCSS', false, false);
    rteMudou(ed);
}

function rteSel(cmd, sel){
    const v = sel.value;
    sel.selectedIndex = 0;
    if(v) rteEstilo(cmd, v);
}

function rteCor(v){ rteEstilo('foreColor', v); }

/* ============================================================
   PASTE — imagens e texto puro
============================================================ */
function rtePaste(e){
    const cd = e.clipboardData || window.clipboardData;
    if(!cd) return;

    /* 1) Imagem no clipboard (print de tela, cópia de imagem) */
    const items = cd.items || [];
    for(let i = 0; i < items.length; i++){
        const item = items[i];
        if(item.type && item.type.indexOf('image/') === 0){
            e.preventDefault();
            const file = item.getAsFile();
            if(file) rteInserirImagem(file);
            return;
        }
    }

    /* 2) Arquivos colados (Ctrl+C de arquivo no explorador) */
    const files = cd.files;
    if(files && files.length > 0){
        let handled = false;
        for(let i = 0; i < files.length; i++){
            const f = files[i];
            if(f.type && f.type.indexOf('image/') === 0){
                e.preventDefault();
                rteInserirImagem(f);
                handled = true;
            }
        }
        if(handled) return;
    }

    /* 3) Texto puro */
    e.preventDefault();
    document.execCommand('insertText', false, cd.getData('text/plain'));
}

async function rteInserirImagem(file){
    const ed = edAtivo();
    if(!ed) return;

    if(file.size > 1024 * 1024){
        if(!confirm(`Imagem grande (${Math.round(file.size / 1024)} KB). Isso vai aumentar o tamanho do arquivo salvo. Continuar?`)) return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
        ed.focus();
        if(rteRange){
            const s = getSelection();
            s.removeAllRanges();
            s.addRange(rteRange);
        }
        document.execCommand('insertHTML', false,
            `<img src="${ev.target.result}" alt="${escapeHtml(file.name || 'Imagem colada')}" style="max-width:100%;">`);
        rteMudou(ed);
    };
    reader.readAsDataURL(file);
}

/* ============================================================
   FORMATAÇÃO — helpers públicos
============================================================ */
function fmt(cmd, value){
    const ed = edAtivo();
    if(!ed) return;
    ed.focus();
    document.execCommand(cmd, false, value || null);
    rteMudou(ed);
}

/* Marca-texto — alterna ligar/desligar. Usa <mark> como padrão. */
function fmtHighlight(){
    const editor = edAtivo();
    if(!editor) return;
    editor.focus();

    const sel = window.getSelection();
    if(!sel || sel.rangeCount === 0) return;

    /* Verifica se o cursor/seleção está dentro de um <mark> */
    let dentro = false;
    let node = sel.anchorNode;
    while(node && node !== editor){
        if(node.nodeName === 'MARK'){ dentro = true; break; }
        if(node.style && node.style.backgroundColor &&
           node.style.backgroundColor !== 'transparent' &&
           node.style.backgroundColor !== 'rgba(0, 0, 0, 0)'){
            dentro = true; break;
        }
        node = node.parentNode;
    }
    if(!dentro){
        node = sel.focusNode;
        while(node && node !== editor){
            if(node.nodeName === 'MARK'){ dentro = true; break; }
            if(node.style && node.style.backgroundColor &&
               node.style.backgroundColor !== 'transparent' &&
               node.style.backgroundColor !== 'rgba(0, 0, 0, 0)'){
                dentro = true; break;
            }
            node = node.parentNode;
        }
    }

    if(dentro){
        /* === DESMARCAR === */
        if(sel.isCollapsed){
            let mark = sel.anchorNode;
            while(mark && mark !== editor && mark.nodeName !== 'MARK'){
                mark = mark.parentNode;
            }
            if(mark && mark.nodeName === 'MARK') unwrapElement(mark);
            else {
                try { document.execCommand('hiliteColor', false, 'transparent'); } catch(e){}
            }
        } else {
            const range = sel.getRangeAt(0);
            const marks = Array.from(editor.querySelectorAll('mark'));
            let removeu = false;
            marks.forEach(mark => {
                try {
                    if(range.intersectsNode(mark)){
                        unwrapElement(mark);
                        removeu = true;
                    }
                } catch(e){}
            });
            if(!removeu){
                try { document.execCommand('hiliteColor', false, 'transparent'); } catch(e){}
            }
        }
    } else {
        /* === MARCAR === */
        if(sel.isCollapsed) return;
        const range = sel.getRangeAt(0);
        const mark  = document.createElement('mark');
        try {
            range.surroundContents(mark);
        } catch(e){
            const frag = range.extractContents();
            mark.appendChild(frag);
            range.insertNode(mark);
        }
        try {
            const novaRange = document.createRange();
            novaRange.selectNodeContents(mark);
            sel.removeAllRanges();
            sel.addRange(novaRange);
        } catch(e){}
    }

    fmtAtualizarEstado();
    rteMudou(editor);
}

function unwrapElement(el){
    const parent = el.parentNode;
    if(!parent) return;
    while(el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
}

function fmtAtualizarEstado(){
    const _e = edAtivo();
    const bar = (_e && _e.closest('.rte-wrap')) || document;
    const botoes = {
        bold:          bar.querySelector('.fmt-btn.fmt-b'),
        italic:        bar.querySelector('.fmt-btn.fmt-i'),
        underline:     bar.querySelector('.fmt-btn.fmt-u'),
        strikeThrough: bar.querySelector('.fmt-btn.fmt-s'),
        superscript:   bar.querySelector('.fmt-btn.fmt-sup'),
        subscript:     bar.querySelector('.fmt-btn.fmt-sub')
    };
    for(const [cmd, btn] of Object.entries(botoes)){
        if(!btn) continue;
        try {
            if(document.queryCommandState(cmd)) btn.classList.add('ativo');
            else btn.classList.remove('ativo');
        } catch(e){}
    }
}

/* ============================================================
   CHECKLIST INLINE (dentro do editor)
============================================================ */
function chkMigrar(root){
    root.querySelectorAll('.checklist-item').forEach(it => {
        const d  = root.ownerDocument.createElement('div');
        const cb = it.querySelector('input');
        const t  = it.querySelector('.check-text');
        d.className = 'chk' + (it.classList.contains('concluido') || (cb && cb.hasAttribute('checked')) ? ' done' : '');
        d.innerHTML = t ? t.innerHTML : it.textContent;
        it.replaceWith(d);
    });
}

function rteBind(ed){
    if(!ed) return;
    chkMigrar(ed);
    ed.querySelectorAll('.mention').forEach(m => { m.contentEditable = 'false'; });
}

/* Botão de checklist: aplica em todas as linhas selecionadas; se todas já são, remove */
function rteChecklist(){
    const ed = edAtivo();
    if(!ed) return;
    ed.focus();
    document.execCommand('formatBlock', false, 'div');
    const s = getSelection();
    if(!s.rangeCount) return;
    const r = s.getRangeAt(0);
    const topo = n => { while(n && n.parentNode !== ed) n = n.parentNode; return n; };
    const a = topo(r.startContainer), b = topo(r.endContainer);
    if(!a || !b) return;

    const linhas = [];
    for(let n = a; n; n = n.nextSibling){
        const fim = n === b;
        if(n.nodeType === 3 || /^(SPAN|B|I|U|S|STRONG|EM|A|MARK|FONT)$/.test(n.tagName)){
            const d = document.createElement('div');
            n.replaceWith(d);
            d.appendChild(n);
            n = d;
        }
        if(n.nodeType === 1 && !/^(UL|OL|BR)$/.test(n.tagName)) linhas.push(n);
        if(fim) break;
    }

    const todas = linhas.length && linhas.every(n => n.classList.contains('chk'));
    linhas.forEach(n => {
        if(todas) n.classList.remove('chk', 'done');
        else      n.classList.add('chk');
    });
    rteMudou(ed);
}

function rteKeydown(e){
    if(mencaoAberta() && mencaoTecla(e)) return;

    const ed = e.currentTarget, s = getSelection();
    if(!ed || !s.rangeCount) return;
    const n = s.anchorNode, el = n && (n.nodeType === 1 ? n : n.parentElement);
    const it = el && el.closest ? el.closest('.chk') : null;
    if(!it || !ed.contains(it)) return;

    const r = s.getRangeAt(0);

    if(e.key === 'Enter' && !e.shiftKey){
        e.preventDefault();
        if(!it.textContent.trim()){
            it.classList.remove('chk', 'done');
            rteMudou(ed);
            return;
        }
        r.deleteContents();
        const cauda = document.createRange();
        cauda.setStart(r.endContainer, r.endOffset);
        cauda.setEnd(it, it.childNodes.length);

        const nv = document.createElement('div');
        nv.className = 'chk';
        nv.appendChild(cauda.extractContents());
        if(!nv.textContent) nv.innerHTML = '<br>';
        if(!it.textContent) it.innerHTML = '<br>';

        it.after(nv);
        const c = document.createRange();
        c.setStart(nv, 0);
        c.collapse(true);
        s.removeAllRanges();
        s.addRange(c);
        rteMudou(ed);
    } else if(e.key === 'Backspace' && r.collapsed){
        const pre = document.createRange();
        pre.selectNodeContents(it);
        pre.setEnd(r.startContainer, r.startOffset);
        if(!pre.toString()){
            e.preventDefault();
            it.classList.remove('chk', 'done');
            rteMudou(ed);
        }
    }
}

/* Listener: clicar no checkbox de uma linha .chk alterna concluído */
document.addEventListener('mousedown', e => {
    const it = e.target.closest && e.target.closest('.rte .chk');
    if(it){
        const x = e.clientX - it.getBoundingClientRect().left;
        if(x >= 0 && x < 24){
            e.preventDefault();
            it.classList.toggle('done');
            rteMudou(it.closest('.rte'));
        }
    }
    if(!e.target.closest || !e.target.closest('#mencaoMenu')) mencaoFechar();
    if(!e.target.closest || !e.target.closest('#popDia, .more-btn')) fecharPopDia();
});

/* Listener: verificar menções ao digitar */
document.addEventListener('input', e => {
    const ed = e.target.closest && e.target.closest('.rte');
    if(ed) mencaoVerificar(ed);
});

/* ============================================================
   SANITIZAÇÃO — só tags e estilos conhecidos
============================================================ */
function sanitizarHtml(html){
    const doc = new DOMParser().parseFromString('<body>' + (html || ''), 'text/html');
    chkMigrar(doc.body);

    (function limpar(no){
        [...no.childNodes].forEach(n => {
            if(n.nodeType === 3) return;
            if(n.nodeType !== 1 || /^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED)$/.test(n.tagName)){
                n.remove();
                return;
            }
            limpar(n);
            if(!SAN_TAGS.has(n.tagName)){
                n.replaceWith(...[...n.childNodes]);
                return;
            }
            [...n.attributes].forEach(a => {
                const k = a.name;
                if(k === 'style'){
                    const ok = a.value.split(';').map(s => s.trim())
                        .filter(s => SAN_STYLE.includes(s.split(':')[0].trim().toLowerCase())
                                     && !/url\(|expression|javascript/i.test(s));
                    ok.length ? n.setAttribute('style', ok.join(';')) : n.removeAttribute('style');
                } else if(k === 'class'){
                    n.className = a.value.split(/\s+/)
                        .filter(c => /^(chk|done|mention|checklist-item|check-text|concluido)$/.test(c))
                        .join(' ');
                } else if(k === 'href' && n.tagName === 'A' && /^(https?:|mailto:)/i.test(a.value)){
                    // permite
                } else if(k === 'data-resp'){
                    // permite
                } else if(n.tagName === 'INPUT' && (k === 'type' || k === 'checked')){
                    // permite
                } else if(n.tagName === 'FONT' && /^(face|size|color)$/.test(k)){
                    // permite
                } else {
                    n.removeAttribute(k);
                }
            });
            if(n.tagName === 'A'){ n.target = '_blank'; n.rel = 'noopener'; }
            if(n.tagName === 'INPUT'){
                if(n.getAttribute('type') !== 'checkbox') n.remove();
                else n.disabled = true;
            }
        });
    })(doc.body);

    return doc.body.innerHTML;
}

/* Renderiza a descrição de um evento: usa HTML sanitizado ou linkifica texto */
function descHtml(ev){
    if(ev.descricaoHtml) return '<div class="rte-view">' + sanitizarHtml(ev.descricaoHtml) + '</div>';
    return linkifyText(ev.descricao || '');
}