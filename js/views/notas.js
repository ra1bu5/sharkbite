/* ============================================================
   views/notas.js — Bloco de anotações
   Depende de: config.js, state.js, helpers.js, rte.js, db.js
   ============================================================ */

/* ============================================================
   RENDER PRINCIPAL
============================================================ */
function renderNotas(){
    const c = document.getElementById('viewContainer');

    /* Se nenhuma nota está ativa e existem notas, seleciona a primeira */
    if(!notaAtivaId && data.notas.length > 0) notaAtivaId = data.notas[0].id;

    const notasOrdenadas = [...data.notas].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

    const listaHtml = notasOrdenadas.length === 0
        ? '<li class="notas-vazio">Nenhuma nota ainda.<br>Clique em "+ Nova nota".</li>'
        : notasOrdenadas.map(n => {
            const ativa = n.id === notaAtivaId ? 'ativa' : '';
            const data = new Date(n.atualizadoEm || n.criadoEm || Date.now());
            const dataStr = `${pad(data.getDate())}/${pad(data.getMonth() + 1)}`;
            return `<li class="nota-item ${ativa}" data-nota-id="${n.id}" onclick="selecionarNota(${n.id})">
                <span class="nota-handle" title="Arraste para reordenar" onmousedown="event.stopPropagation()">${ic('grip', 14)}</span>
                <span class="nota-cor-dot" style="background:${escapeHtml(n.cor || '#ffffff')}"></span>
                <span class="nota-titulo-lista" id="nota-lista-titulo-${n.id}">${escapeHtml(n.titulo || 'Sem título')}</span>
                <span class="nota-data-lista">${dataStr}</span>
            </li>`;
        }).join('');

    const nota = notaAtivaId ? data.notas.find(n => n.id === notaAtivaId) : null;

    c.innerHTML = `
        <div class="notas-view">
            <div class="notas-sidebar">
                <button class="btn-nova-nota" onclick="novaNota()">Nova nota</button>
                <ul class="notas-lista">${listaHtml}</ul>
            </div>
            <div class="notas-editor-wrap" id="notasEditorWrap">
                ${nota ? `
                    <div class="notas-toolbar">
                        <input type="text" id="notaTitulo" placeholder="Título da nota"
                               value="${escapeHtml(nota.titulo || '')}" oninput="notaOnInput()">
                        <div class="fmt-group">
                            <button class="fmt-btn" onmousedown="event.preventDefault(); notaAddImagem()" title="Inserir imagem (ou cole com Ctrl+V)">${ic('image')}</button>
                            <button class="fmt-btn" onmousedown="event.preventDefault(); notaAnexarArquivo()" title="Anexar arquivo">${ic('clip')}</button>
                        </div>
                        <input type="color" id="notaCor" value="${escapeHtml(nota.cor || '#ffffff')}"
                               onchange="notaTrocarCor(this.value)" title="Cor da nota">
                        <button class="danger" onclick="notaExcluir()" title="Excluir nota">Excluir</button>
                    </div>
                    <div class="rte-wrap">
                        ${rteBarra()}
                        <div class="notas-editor rte" id="notaEditor" contenteditable="true"
                             data-placeholder="Escreva sua nota…"
                             oninput="notaOnInput()"
                             oncontextmenu="notaContextMenu(event)"
                             onkeydown="rteKeydown(event)"
                             onchange="notaOnInput()"
                             onpaste="notaOnPaste(event)"
                             onkeyup="fmtAtualizarEstado()"
                             onmouseup="fmtAtualizarEstado()"
                             onblur="linkificarNota()">${nota.conteudo || ''}</div>
                    </div>
                ` : `
                    <div class="notas-vazio" style="margin:auto;">
                        <p></p>
                        <p>Selecione uma nota à esquerda ou crie uma nova.</p>
                    </div>
                `}
            </div>
        </div>`;

    if(nota) setTimeout(() => rteBind(document.getElementById('notaEditor')), 30);
    notasBindDrag();
}

/* ============================================================
   REORDENAÇÃO POR DRAG (alça ⋮⋮)
============================================================ */
function notasBindDrag(){
    const root = document.querySelector('.notas-lista');
    if(!root || root.dataset.dragBound) return;
    root.dataset.dragBound = '1';

    let arrastando = null;
    const linhaDe = e => e.target.closest && e.target.closest('.nota-item');

    root.addEventListener('mousedown', e => {
        const h = e.target.closest && e.target.closest('.nota-handle');
        if(h) h.closest('.nota-item').draggable = true;
    });

    document.addEventListener('mouseup', () => {
        if(!arrastando){
            root.querySelectorAll('.nota-item[draggable="true"]').forEach(r => { r.draggable = false; });
        }
    });

    root.addEventListener('dragstart', e => {
        const row = linhaDe(e);
        if(!row || e.target !== row) return;
        arrastando = row;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'nota');
        setTimeout(() => row.classList.add('dragging-ck'), 0);
    });

    root.addEventListener('dragover', e => {
        if(!arrastando) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const ref = [...root.querySelectorAll('.nota-item')]
            .filter(r => r !== arrastando)
            .find(r => {
                const b = r.getBoundingClientRect();
                return e.clientY < b.top + b.height / 2;
            });
        if(ref){
            if(arrastando.nextElementSibling !== ref) root.insertBefore(arrastando, ref);
        } else if(root.lastElementChild !== arrastando){
            root.appendChild(arrastando);
        }
    });

    root.addEventListener('drop', e => { if(arrastando) e.preventDefault(); });

    root.addEventListener('dragend', () => {
        if(!arrastando) return;
        const r = arrastando;
        arrastando = null;
        r.draggable = false;
        r.classList.remove('dragging-ck');
        const ids = [...root.querySelectorAll('.nota-item')].map(el => Number(el.dataset.notaId));
        ids.forEach((id, idx) => {
            const n = data.notas.find(x => x.id === id);
            if(n) n.ordem = idx * 10;
        });
        marcarAlterado();
    });
}

/* ============================================================
   SELEÇÃO / CRIAÇÃO
============================================================ */
function selecionarNota(id){
    if(notaAtivaId) notaOnInput();   // salva antes de trocar
    notaAtivaId = id;
    renderNotas();
}

function novaNota(){
    const agora = new Date().toISOString();
    const nova = {
        id: Date.now(),
        titulo: '',
        conteudo: '',
        cor: '#ffffff',
        anexos: [],
        criadoEm: agora,
        atualizadoEm: agora
    };
    data.notas.unshift(nova);
    notaAtivaId = nova.id;
    marcarAlterado();
    renderNotas();
    setTimeout(() => {
        const t = document.getElementById('notaTitulo');
        if(t) t.focus();
    }, 50);
}

/* ============================================================
   EXCLUSÃO DE ANEXO NO STORAGE
   Aceita caminho antigo (img/notas-anexos/x) e converte para o novo (notas/x)
============================================================ */
async function removerAnexo(path){
    if(!authToken) return false;
    const p = path
        .replace(/^img\/notas-anexos\//, 'notas/')
        .replace(/^img\/registros-anexos\//, 'registros/');
    const { error } = await sb.storage.from(STORAGE_BUCKET).remove([p]);
    if(error){
        console.warn('Erro ao remover arquivo:', error.message);
        return false;
    }
    return true;
}

/* ============================================================
   DETECÇÃO DE ANEXOS REMOVIDOS DO EDITOR
============================================================ */
async function detectarAnexosRemovidos(){
    if(notaAnexosProcessando) return;
    if(!notaAtivaId) return;

    const nota = data.notas.find(n => n.id === notaAtivaId);
    if(!nota || !nota.anexos || nota.anexos.length === 0) return;

    const editor = document.getElementById('notaEditor');
    if(!editor) return;
    const html = editor.innerHTML;

    /* Considera presente se o nome (ou sua versão encoded) aparecer no HTML */
    const aindaNoEditor = nota.anexos.filter(f => {
        const fEnc = encodeURIComponent(f);
        return html.includes(f) || html.includes(fEnc) ||
               html.includes(escapeHtml(f)) || html.includes(escapeHtml(fEnc));
    });

    const removidos = nota.anexos.filter(f => !aindaNoEditor.includes(f));
    if(removidos.length === 0) return;

    notaAnexosProcessando = true;
    const nomes = removidos.map(n => '• ' + n).join('\n');
    const pergunta =
        `Você removeu ${removidos.length} anexo(s) desta nota:\n\n${nomes}\n\n` +
        `Deseja também EXCLUIR do armazenamento?\n\n` +
        `OK = excluir do armazenamento (recomendado)\n` +
        `Cancelar = manter o arquivo, mas parar de rastreá-lo`;

    const excluir = confirm(pergunta);

    if(excluir){
        const progress = document.getElementById('uploadProgress');
        const progressText = document.getElementById('uploadProgressText');
        if(progress && progressText){
            progressText.textContent = `Excluindo ${removidos.length} anexo(s)…`;
            progress.style.display = 'flex';
        }
        try {
            for(const f of removidos){
                await removerAnexo(`img/notas-anexos/${f}`);
            }
        } finally {
            if(progress) progress.style.display = 'none';
        }
    }

    /* Em ambos os casos, remove do tracking da nota */
    nota.anexos = aindaNoEditor;
    marcarAlterado();
    notaAnexosProcessando = false;
}

/* ============================================================
   EXCLUIR NOTA
============================================================ */
async function notaExcluir(){
    if(!notaAtivaId) return;
    const nota = data.notas.find(n => n.id === notaAtivaId);
    if(!nota) return;

    let msg = 'Excluir esta nota?';
    const temAnexos = nota.anexos && nota.anexos.length > 0;
    if(temAnexos){
        msg += `\n\nTambém serão excluídos ${nota.anexos.length} anexo(s) do armazenamento.`;
    }
    if(!confirm(msg)) return;

    if(temAnexos && authToken){
        const progress = document.getElementById('uploadProgress');
        const progressText = document.getElementById('uploadProgressText');
        if(progress && progressText){
            progressText.textContent = `Excluindo ${nota.anexos.length} anexo(s)…`;
            progress.style.display = 'flex';
        }
        try {
            for(const f of nota.anexos){
                await removerAnexo(`img/notas-anexos/${f}`);
            }
        } finally {
            if(progress) progress.style.display = 'none';
        }
    } else if(temAnexos && !authToken){
        console.warn('Sem login: anexos não foram removidos.');
    }

    data.notas = data.notas.filter(n => n.id !== notaAtivaId);
    notaAtivaId = data.notas.length > 0 ? data.notas[0].id : null;
    marcarAlterado();
    renderNotas();
}

/* ============================================================
   TROCAR COR
============================================================ */
function notaTrocarCor(cor){
    const nota = data.notas.find(n => n.id === notaAtivaId);
    if(!nota) return;
    nota.cor = cor;
    marcarAlterado();
    const dot = document.querySelector('.nota-item.ativa .nota-cor-dot');
    if(dot) dot.style.background = cor;
}

/* ============================================================
   INPUT (título + conteúdo)
============================================================ */
function notaOnInput(){
    if(!notaAtivaId) return;
    const nota = data.notas.find(n => n.id === notaAtivaId);
    if(!nota) return;

    const editor = document.getElementById('notaEditor');
    const titulo = document.getElementById('notaTitulo');

    if(editor) nota.conteudo = editor.innerHTML;
    if(titulo) nota.titulo = titulo.value;
    nota.atualizadoEm = new Date().toISOString();
    marcarAlterado();

    /* Atualiza só o título na lista lateral (sem re-renderizar tudo) */
    const tituloLista = document.getElementById(`nota-lista-titulo-${nota.id}`);
    if(tituloLista) tituloLista.textContent = nota.titulo || 'Sem título';

    /* Verifica se algum anexo foi removido (com debounce) */
    if(notaCheckTimer) clearTimeout(notaCheckTimer);
    notaCheckTimer = setTimeout(detectarAnexosRemovidos, 1500);
}

/* ============================================================
   PASTE INTELIGENTE (imagens + texto puro)
============================================================ */
function notaOnPaste(e){
    const cd = e.clipboardData || window.clipboardData;
    if(!cd) return;

    /* 1) Imagem no clipboard (print de tela, cópia de imagem etc.) */
    const items = cd.items || [];
    for(const item of items){
        if(item.type && item.type.startsWith('image/')){
            e.preventDefault();
            const file = item.getAsFile();
            if(!file) continue;
            const reader = new FileReader();
            reader.onload = function(ev){
                const editor = document.getElementById('notaEditor');
                if(!editor) return;
                editor.focus();
                const html = `<img src="${ev.target.result}" alt="Imagem colada">`;
                document.execCommand('insertHTML', false, html);
                notaOnInput();
            };
            reader.readAsDataURL(file);
            return;
        }
    }

    /* 2) Arquivos colados */
    const files = cd.files;
    if(files && files.length > 0){
        e.preventDefault();
        for(const f of files){
            if(f.type && f.type.startsWith('image/')){
                const reader = new FileReader();
                reader.onload = function(ev){
                    const editor = document.getElementById('notaEditor');
                    if(!editor) return;
                    editor.focus();
                    document.execCommand('insertHTML', false, `<img src="${ev.target.result}" alt="${escapeHtml(f.name)}">`);
                    notaOnInput();
                };
                reader.readAsDataURL(f);
            } else {
                /* Arquivo não-imagem: envia como anexo */
                notaUploadAnexo(f);
            }
        }
        return;
    }

    /* 3) Texto puro */
    e.preventDefault();
    const texto = cd.getData('text/plain');
    document.execCommand('insertText', false, texto);

    /* Após colar, transforma URLs em links */
    setTimeout(() => {
        const editor = document.getElementById('notaEditor');
        if(editor && linkifyEditorDOM(editor)) notaOnInput();
    }, 30);
}

/* ============================================================
   ADD IMAGEM (botão)
============================================================ */
function notaAddImagem(){
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(){
        const f = input.files && input.files[0];
        if(!f) return;
        if(f.size > 500 * 1024){
            mostrarToast('Imagem grande: enviando para o repositório…');
            notaUploadAnexo(f);
            return;
        }
        const r = new FileReader();
        r.onload = ev => {
            const ed = document.getElementById('notaEditor');
            if(!ed) return;
            ed.focus();
            document.execCommand('insertHTML', false, `<img src="${ev.target.result}" alt="${escapeHtml(f.name)}">`);
            notaOnInput();
        };
        r.readAsDataURL(f);
    };
    input.click();
}

/* ============================================================
   ANEXAR ARQUIVO (botão)
============================================================ */
function notaAnexarArquivo(){
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = function(){
        const file = input.files && input.files[0];
        if(!file) return;
        if(file.size > 5 * 1024 * 1024){
            alert('Arquivo muito grande (máx. 5 MB).');
            return;
        }
        notaUploadAnexo(file);
    };
    input.click();
}

async function notaUploadAnexo(file){
    if(!authToken){
        alert('Para anexar arquivos é preciso estar logado como admin (Admin).\nSem login, os arquivos não podem ser enviados.');
        return;
    }

    const pasta = 'notas';
    const agora = Date.now();
    const nomeLimpo = file.name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const nomeFinal = `${agora}-${nomeLimpo}`;
    const caminho = `${pasta}/${nomeFinal}`;

    const progress = document.getElementById('uploadProgress');
    const progressText = document.getElementById('uploadProgressText');
    if(progress) progress.style.display = 'flex';
    if(progressText) progressText.textContent = `Enviando "${file.name}"…`;

    try {
        await storageUpload(caminho, file);

        /* Registra o anexo na nota */
        const nota = data.notas.find(n => n.id === notaAtivaId);
        if(nota){
            if(!nota.anexos) nota.anexos = [];
            if(!nota.anexos.includes(nomeFinal)) nota.anexos.push(nomeFinal);
        }

        /* Insere no editor */
        const editor = document.getElementById('notaEditor');
        if(editor){
            editor.focus();
            const isImg = file.type.startsWith('image/');
            const urlRaw = storageUrl(caminho);

            let html;
            if(isImg){
                html = `<img src="${urlRaw}" alt="${escapeHtml(file.name)}" data-anexo="${escapeHtml(nomeFinal)}">`;
            } else {
                html = `<a class="anexo-link" href="${urlRaw}" target="_blank" rel="noopener" data-anexo="${escapeHtml(nomeFinal)}">${escapeHtml(file.name)}</a> `;
            }
            document.execCommand('insertHTML', false, html);
            notaOnInput();
        }
    } catch(e){
        console.error('Erro no upload:', e);
        alert('Erro ao enviar o arquivo: ' + (e.message || 'desconhecido'));
    } finally {
        if(progress) progress.style.display = 'none';
    }
}

/* ============================================================
   ATALHOS: Ctrl+B / Ctrl+I / Ctrl+U / Ctrl+H
============================================================ */
document.addEventListener('keydown', function(e){
    const editor = document.getElementById('notaEditor');
    if(!editor) return;
    const ativo = document.activeElement;
    if(!editor.contains(ativo) && ativo !== editor) return;

    if(e.ctrlKey || e.metaKey){
        const k = e.key.toLowerCase();
        if(k === 'b'){ e.preventDefault(); fmt('bold'); return; }
        if(k === 'i'){ e.preventDefault(); fmt('italic'); return; }
        if(k === 'u'){ e.preventDefault(); fmt('underline'); return; }
        if(k === 'h'){ e.preventDefault(); fmtHighlight(); return; }
    }
});