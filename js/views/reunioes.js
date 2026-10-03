/* ============================================================
   views/reunioes.js — Atas de reunião (2 níveis)
   Depende de: config.js, state.js, helpers.js, rte.js, views/shared.js
   ============================================================ */

/* ============================================================
   FORMATAÇÃO
============================================================ */
const REUN_DIAS_SEMANA = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];

function reunFormatarDataCurta(key){
    if(!key) return 'Sem data';
    const d = parseDateKey(key);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function reunFormatarDataLonga(key){
    if(!key) return '';
    const d = parseDateKey(key);
    return `${REUN_DIAS_SEMANA[d.getDay()]}, ${d.getDate()} de ${['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][d.getMonth()]} de ${d.getFullYear()}`;
}

function reunFormatarCriadoEm(iso){
    if(!iso) return '';
    const d = new Date(iso);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ============================================================
   HELPERS DE ESTADO
============================================================ */
function reunEntradasOrdenadas(serie){
    return [...(serie.entradas || [])].sort((a, b) => (a.data || '').localeCompare(b.data || '') || a.id - b.id);
}

function reunSerieAtiva(){
    return data.reunioes.find(r => r.id === reuniaoSerieAtivaId) || null;
}

function reunEntradaAtiva(){
    const serie = reunSerieAtiva();
    if(!serie) return null;
    return serie.entradas.find(e => e.id === reuniaoEntradaAtivaId) || null;
}

function reunParticipantesArray(en){
    if(!en) return [];
    if(Array.isArray(en.participantes)) return en.participantes;
    if(typeof en.participantes === 'string'){
        return en.participantes.split(',').map(x => x.trim()).filter(Boolean);
    }
    return [];
}

/* ============================================================
   PARTICIPANTES — seletor múltiplo
============================================================ */
function reunAbrirParticipantes(){
    const menu = document.getElementById('reunParticipantesMenu');
    if(!menu) return;
    menu.style.display = 'block';
    reunRenderParticipantes();
}

function reunRenderParticipantes(){
    const menu = document.getElementById('reunParticipantesMenu');
    if(!menu) return;

    const busca = (document.getElementById('reunParticipantesBusca')?.value || '').toLowerCase().trim();
    const en = reunEntradaAtiva();
    if(!en) return;

    const selecionados = reunParticipantesArray(en);
    const lista = (data.config.responsaveis || []).filter(r =>
        !busca || r.label.toLowerCase().includes(busca)
    );

    if(!lista.length){
        menu.innerHTML = `<div class="reun-multi-vazio">Nenhum responsável encontrado.</div>`;
        return;
    }

    menu.innerHTML = lista.map(r => `
        <label class="reun-multi-option">
            <input type="checkbox" value="${escapeHtml(r.label)}"
                   ${selecionados.includes(r.label) ? 'checked' : ''}
                   onchange="reunAlternarParticipante(this.value, this.checked)">
            <span class="badge badge-resp" style="${badgeStyle(r.cor)}">@${escapeHtml(r.label)}</span>
        </label>
    `).join('');
}

function reunFiltrarParticipantes(){
    reunAbrirParticipantes();
}

function reunAlternarParticipante(nome, marcado){
    const en = reunEntradaAtiva();
    if(!en) return;

    let lista = reunParticipantesArray(en);
    if(marcado){
        if(!lista.includes(nome)) lista.push(nome);
    } else {
        lista = lista.filter(x => x !== nome);
    }
    en.participantes = lista;

    marcarAlterado();
    reunRenderParticipantes();
    reunRenderParticipantesTags();
}

function reunRenderParticipantesTags(){
    const en = reunEntradaAtiva();
    const el = document.getElementById('reunParticipantesTags');
    if(!en || !el) return;

    const lista = reunParticipantesArray(en);
    el.innerHTML = lista.map(nome => {
        const r = (data.config.responsaveis || []).find(x => x.label === nome);
        return `<span class="reun-participante-tag" style="${r ? badgeStyle(r.cor) : ''}">
            @${escapeHtml(nome)}
            <button type="button" onclick="event.stopPropagation(); reunAlternarParticipante('${escapeHtml(nome).replace(/'/g, "\\'")}', false)">×</button>
        </span>`;
    }).join('');
}

/* Fecha o menu de participantes ao clicar fora */
document.addEventListener('mousedown', function(e){
    const picker = document.getElementById('reunParticipantesPicker');
    if(picker && !picker.contains(e.target)){
        const menu = document.getElementById('reunParticipantesMenu');
        if(menu) menu.style.display = 'none';
    }
});

/* ============================================================
   HORA / MINUTO
============================================================ */
function reunSomenteNumeros(el){
    el.value = el.value.replace(/\D/g, '').slice(0, 2);
}

function reunValidarHora(el){
    reunSomenteNumeros(el);
    if(el.value !== ''){
        let v = Number(el.value);
        if(v > 23) v = 23;
        el.value = String(v).padStart(2, '0');
    }
}

function reunValidarMinuto(el){
    reunSomenteNumeros(el);
    if(el.value !== ''){
        let v = Number(el.value);
        if(v > 59) v = 59;
        el.value = String(v).padStart(2, '0');
    }
}

/* ============================================================
   EDITOR RTE DAS SEÇÕES DA ATA
============================================================ */
function reunEditorHtml(campo, titulo, conteudo){
    const id = 'reunEditor_' + campo;
    return `
        <div class="reun-secao reun-rte-secao">
            <div class="sec-head">
                <label>${titulo}</label>
            </div>
            <div class="reun-rte-wrap" id="${id}_wrap">
                <div class="reun-rte-toolbar">${rteBarra()}</div>
                <div id="${id}" class="reun-rte-editor rte" contenteditable="true"
                     data-placeholder="Escreva aqui..."
                     onclick="reunRteAtivar('${id}')"
                     onfocus="reunRteAtivar('${id}')"
                     oninput="reunRteAlterou('${campo}', this)"
                     onkeydown="rteKeydown(event)"
                     onpaste="rtePaste(event)"
                     onkeyup="fmtAtualizarEstado()"
                     onmouseup="fmtAtualizarEstado()">${conteudo || ''}</div>
            </div>
        </div>
    `;
}

function reunRteAtivar(id){
    const ed = document.getElementById(id);
    if(!ed) return;
    rteUltimo = ed;
    document.querySelectorAll('.reun-rte-wrap').forEach(w => w.classList.remove('ativo'));
    const wrap = ed.closest('.reun-rte-wrap');
    if(wrap) wrap.classList.add('ativo');
}

function reunRteAlterou(campo, el){
    const en = reunEntradaAtiva();
    if(!en) return;
    en[campo] = sanitizarHtml(el.innerHTML).trim();
    marcarAlterado();
}

/* Desativa a barra do RTE ao clicar fora */
document.addEventListener('mousedown', function(e){
    if(e.target.closest && e.target.closest('.reun-rte-wrap')) return;
    document.querySelectorAll('.reun-rte-wrap').forEach(w => w.classList.remove('ativo'));
});

/* ============================================================
   RENDER PRINCIPAL
============================================================ */
function renderReunioes(){
    const c = document.getElementById('viewContainer');
    if(!data.reunioes) data.reunioes = [];

    if(!reuniaoSerieAtivaId && data.reunioes.length){
        reuniaoSerieAtivaId = data.reunioes[0].id;
    }
    const serieAtiva = reunSerieAtiva();

    if(serieAtiva && !reuniaoEntradaAtivaId && serieAtiva.entradas.length){
        reuniaoEntradaAtivaId = reunEntradasOrdenadas(serieAtiva)[serieAtiva.entradas.length - 1].id;
    }

    /* ---------- LATERAL ---------- */
    const listaHtml = data.reunioes.length === 0
        ? `<li class="notas-vazio">Nenhuma reunião ainda.</li>`
        : data.reunioes.map(serie => {
            const ativa = serie.id === reuniaoSerieAtivaId ? 'ativa' : '';
            const entradas = reunEntradasOrdenadas(serie);

            const entradasHtml = entradas.length === 0
                ? `<li class="reun-vazio-mini">Nenhuma data ainda.</li>`
                : entradas.map(en => {
                    const entradaAtiva = (en.id === reuniaoEntradaAtivaId && serie.id === reuniaoSerieAtivaId) ? 'ativa' : '';
                    return `<li class="reun-entrada-item ${entradaAtiva}"
                                onclick="event.stopPropagation(); selecionarReuniaoEntrada(${serie.id}, ${en.id})">
                                ${escapeHtml(reunFormatarDataCurta(en.data))}
                            </li>`;
                }).join('');

            return `<li class="reun-serie">
                <div class="reun-serie-head ${ativa}" onclick="toggleReuniaoSerie(${serie.id})">
                    <span class="reun-arrow">${serie.expandido !== false ? '▾' : '▸'}</span>
                    <span class="reun-cor-dot" style="background:${escapeHtml(serie.cor || 'var(--primary)')}"></span>
                    <span class="reun-serie-nome">${escapeHtml(serie.nome || 'Sem nome')}</span>
                    <button type="button" class="reun-mini-add" title="Nova data"
                            onclick="event.stopPropagation(); novaReuniaoEntrada(${serie.id})">${ic('plus', 12)}</button>
                    <button type="button" class="reun-mini-del" title="Excluir reunião"
                            onclick="event.stopPropagation(); excluirReuniaoSerie(${serie.id})">×</button>
                </div>
                ${serie.expandido !== false ? `<ul class="reun-entradas">${entradasHtml}</ul>` : ''}
            </li>`;
        }).join('');

    /* ---------- EDITOR ---------- */
    const en = reunEntradaAtiva();
    let editorHtml;

    if(!en){
        editorHtml = `
            <div class="reun-vazio-editor">
                <div>
                    <strong>${escapeHtml(serieAtiva?.nome || 'Reuniões')}</strong>
                    <p>Selecione uma data à esquerda ou crie uma nova data.</p>
                </div>
            </div>`;
    } else {
        editorHtml = `
            <div class="reun-editor">
                <!-- CABEÇALHO -->
                <div class="reun-editor-top">
                    <div class="reun-meta">
                        <strong>${escapeHtml(serieAtiva?.nome || 'Reunião')}</strong><br>
                        ${escapeHtml(reunFormatarDataLonga(en.data))}
                        ${en.criadoEm ? ` · criado em ${escapeHtml(reunFormatarCriadoEm(en.criadoEm))}` : ''}
                    </div>
                    <button type="button" class="btn btn-danger btn-mini" onclick="excluirReuniaoEntrada()">Excluir esta data</button>
                </div>

                <!-- INFORMAÇÕES -->
                <div class="reun-info-card">
                    <div class="reun-info-titulo">Informações da reunião</div>
                    <div class="reun-info-grid">
                        <div class="field field-full">
                            <label>Participantes</label>
                            <div class="reun-multi" id="reunParticipantesPicker">
                                <div class="reun-multi-input" onclick="reunAbrirParticipantes()">
                                    <div class="reun-multi-tags" id="reunParticipantesTags"></div>
                                    <input type="text" id="reunParticipantesBusca" placeholder="Buscar responsável..."
                                           oninput="reunFiltrarParticipantes()"
                                           onclick="event.stopPropagation(); reunAbrirParticipantes()">
                                </div>
                                <div class="reun-multi-menu" id="reunParticipantesMenu"></div>
                            </div>
                        </div>

                        <div class="field">
                            <label>Setor</label>
                            <select id="reunSetor" onchange="reunSincronizar()">
                                <option value="">Selecione o setor</option>
                                ${(data.config.setores || []).map(s => `<option value="${escapeHtml(s.label)}" ${en.setor === s.label ? 'selected' : ''}>${escapeHtml(s.label)}</option>`).join('')}
                            </select>
                        </div>

                        <div class="field field-full">
                            <label>Data e hora da reunião</label>
                            <div class="reun-datahora">
                                <input type="date" id="reunData" value="${escapeHtml(en.data || '')}" onchange="reunSincronizar()">
                                <span class="reun-hora-label">às</span>
                                <input type="text" id="reunHora" class="reun-hora" maxlength="2" inputmode="numeric" placeholder="00"
                                       value="${escapeHtml(en.hora || '')}"
                                       oninput="reunValidarHora(this); reunSincronizar()">
                                <span>:</span>
                                <input type="text" id="reunMinuto" class="reun-hora" maxlength="2" inputmode="numeric" placeholder="00"
                                       value="${escapeHtml(en.minuto || '')}"
                                       oninput="reunValidarMinuto(this); reunSincronizar()">
                            </div>
                        </div>
                    </div>
                </div>

                ${reunEditorHtml('pautasHtml', 'Pautas', en.pautasHtml || '')}
                ${reunEditorHtml('pendenciasHtml', 'Pendências da Reunião Anterior', en.pendenciasHtml || '')}
                ${reunEditorHtml('assuntosHtml', 'Assuntos Abordados', en.assuntosHtml || '')}
                ${reunEditorHtml('encaminhamentosHtml', 'Encaminhamentos para as próximas reuniões', en.encaminhamentosHtml || '')}
            </div>`;
    }

    /* ---------- ESTRUTURA ---------- */
    c.innerHTML = `
        <div class="notas-view">
            <div class="notas-sidebar reun-sidebar">
                <button class="btn-nova-nota" onclick="novaReuniaoSerie()">+ Nova reunião</button>
                <ul class="notas-lista reun-lista">${listaHtml}</ul>
            </div>
            <div class="notas-editor-wrap" id="reunEditorWrap">${editorHtml}</div>
        </div>
    `;

    requestAnimationFrame(() => {
        document.querySelectorAll('#reunEditorWrap .reun-simples-input, #reunEditorWrap .reun-tab-texto')
            .forEach(reunAjustarAltura);
    });

    /* Preenche as tags de participantes após render */
    setTimeout(() => { if(en) reunRenderParticipantesTags(); }, 30);
}

/* ============================================================
   LEGADO — tabelas (mantidas para compatibilidade)
============================================================ */
function reunListaHtml(arr, campo){
    if(!arr || !arr.length) return `<div class="task-checklist-empty">Nenhum item.</div>`;
    return arr.map((texto, idx) => `
        <div class="reun-linha-simples" data-idx="${idx}">
            <textarea class="reun-simples-input" rows="1" placeholder="Descreva o item…"
                      oninput="reunAjustarAltura(this)" onchange="reunSincronizar()">${escapeHtml(texto || '')}</textarea>
            <button type="button" class="check-delete" title="Excluir" onclick="reunRemoverItem('${campo}', ${idx})">×</button>
        </div>`).join('');
}

function reunTabelaHtml(arr, campo){
    if(!arr || !arr.length) return `<div class="task-checklist-empty">Nenhum item.</div>`;
    const respOpts   = (data.config.responsaveis || []).map(r => r.label);
    const statusOpts = data.config.status || [];
    return arr.map((item, idx) => `
        <div class="reun-linha-tabela" data-idx="${idx}" data-item-id="${escapeHtml(item.id || '')}">
            <textarea class="reun-tab-texto" rows="1" placeholder="Descreva…"
                      oninput="reunAjustarAltura(this)" onchange="reunSincronizar()">${escapeHtml(item.texto || '')}</textarea>
            <select class="reun-tab-resp" onchange="reunSincronizar()">
                <option value="">—</option>
                ${respOpts.map(r => `<option value="${escapeHtml(r)}" ${item.responsavel === r ? 'selected' : ''}>${escapeHtml(r)}</option>`).join('')}
            </select>
            <input type="date" class="reun-tab-prazo" value="${escapeHtml(item.prazo || '')}" onchange="reunSincronizar()">
            <select class="reun-tab-status" onchange="reunSincronizar()">
                <option value="">—</option>
                ${statusOpts.map(s => `<option value="${escapeHtml(s.id)}" ${item.status === s.id ? 'selected' : ''}>${escapeHtml(s.label)}</option>`).join('')}
            </select>
            <button type="button" class="check-delete" title="Excluir" onclick="reunRemoverItem('${campo}', ${idx})">×</button>
        </div>`).join('');
}

function reunAjustarAltura(el){
    if(!el) return;
    el.style.height = 'auto';
    el.style.height = (el.scrollHeight) + 'px';
}

/* ============================================================
   SINCRONIZAÇÃO DO DOM → ESTADO
============================================================ */
function reunSincronizar(){
    const en = reunEntradaAtiva();
    if(!en) return;

    const $ = id => document.getElementById(id);
    if($('reunData'))   en.data   = $('reunData').value;
    if($('reunHora'))   en.hora   = $('reunHora').value;
    if($('reunMinuto')) en.minuto = $('reunMinuto').value;

    if(!Array.isArray(en.participantes)) en.participantes = reunParticipantesArray(en);
    if($('reunSetor')) en.setor = $('reunSetor').value;

    /* Seções RTE */
    ['pautasHtml','pendenciasHtml','assuntosHtml','encaminhamentosHtml'].forEach(campo => {
        const el = document.getElementById('reunEditor_' + campo);
        if(el) en[campo] = sanitizarHtml(el.innerHTML).trim();
    });

    /* Tabelas (legado) */
    const lerTabela = sel => [...document.querySelectorAll(sel)].map(row => ({
        id: row.dataset.itemId || novoChecklistId(),
        texto: row.querySelector('.reun-tab-texto') ? row.querySelector('.reun-tab-texto').value : '',
        responsavel: row.querySelector('.reun-tab-resp') ? row.querySelector('.reun-tab-resp').value : '',
        prazo: row.querySelector('.reun-tab-prazo') ? row.querySelector('.reun-tab-prazo').value : '',
        status: row.querySelector('.reun-tab-status') ? row.querySelector('.reun-tab-status').value : ''
    }));
    en.pendencias     = lerTabela('#reunTabelaPendencias .reun-linha-tabela');
    en.encaminhamentos = lerTabela('#reunTabelaEncaminhamentos .reun-linha-tabela');

    marcarAlterado();

    /* Atualiza só o rótulo da data na barra lateral (sem re-renderizar tudo) */
    const item = document.querySelector('.reun-entrada-item.ativa');
    if(item) item.textContent = reunFormatarDataCurta(en.data);
}

/* ============================================================
   ADIÇÃO / REMOÇÃO (legado)
============================================================ */
function reunAdicionarLista(campo){
    const en = reunEntradaAtiva();
    if(!en) return;
    reunSincronizar();
    en[campo].push('');
    marcarAlterado();
    renderReunioes();
    setTimeout(() => {
        const root = document.getElementById(campo === 'pautas' ? 'reunListaPautas' : 'reunListaAssuntos');
        const last = root && root.querySelector('.reun-linha-simples:last-child .reun-simples-input');
        if(last) last.focus();
    }, 0);
}

function reunAdicionarTabela(campo){
    const en = reunEntradaAtiva();
    if(!en) return;
    reunSincronizar();
    en[campo].push({ id: novoChecklistId(), texto: '', responsavel: '', prazo: '', status: '' });
    marcarAlterado();
    renderReunioes();
    setTimeout(() => {
        const root = document.getElementById(campo === 'pendencias' ? 'reunTabelaPendencias' : 'reunTabelaEncaminhamentos');
        const last = root && root.querySelector('.reun-linha-tabela:last-child .reun-tab-texto');
        if(last) last.focus();
    }, 0);
}

function reunRemoverItem(campo, idx){
    const en = reunEntradaAtiva();
    if(!en) return;
    reunSincronizar();
    en[campo].splice(idx, 1);
    marcarAlterado();
    renderReunioes();
}

/* ============================================================
   CRUD DE SÉRIE / ENTRADA
============================================================ */
function novaReuniaoSerie(){
    const nome = prompt('Nome da reunião (ex.: NIO + TI):');
    if(!nome || !nome.trim()) return;

    const nova = {
        id: Date.now(),
        nome: nome.trim(),
        cor: corAutomatica(nome.trim()),
        expandido: true,
        entradas: []
    };
    data.reunioes.unshift(nova);
    reuniaoSerieAtivaId = nova.id;
    reuniaoEntradaAtivaId = null;
    marcarAlterado();
    novaReuniaoEntrada(nova.id);
}

function novaReuniaoEntrada(serieId){
    const serie = data.reunioes.find(r => r.id === serieId);
    if(!serie) return;
    reunSincronizar();

    const ordenadas = reunEntradasOrdenadas(serie);
    const anterior  = ordenadas.length ? ordenadas[ordenadas.length - 1] : null;

    /* Encaminhamentos da reunião anterior viram as pendências desta */
    const pendenciasHerdadas = (anterior && anterior.encaminhamentosHtml) ? anterior.encaminhamentosHtml : '';

    const nova = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        data: dateKeyFromDate(new Date()),
        dataHora: '',
        participantes: '',
        setor: '',
        pautas: [],
        pendencias: [],
        assuntos: [],
        encaminhamentos: [],
        pautasHtml: '',
        pendenciasHtml: pendenciasHerdadas,
        assuntosHtml: '',
        encaminhamentosHtml: ''
    };
    serie.entradas.push(nova);
    serie.expandido = true;
    reuniaoSerieAtivaId = serieId;
    reuniaoEntradaAtivaId = nova.id;
    marcarAlterado();
    renderReunioes();
}

function selecionarReuniaoEntrada(serieId, entradaId){
    reunSincronizar();
    reuniaoSerieAtivaId = serieId;
    reuniaoEntradaAtivaId = entradaId;
    renderReunioes();
}

function toggleReuniaoSerie(id){
    reunSincronizar();
    const serie = data.reunioes.find(r => r.id === id);
    if(!serie) return;
    if(reuniaoSerieAtivaId !== id){
        reuniaoSerieAtivaId = id;
        serie.expandido = true;
    } else {
        serie.expandido = serie.expandido === false ? true : false;
    }
    renderReunioes();
}

function excluirReuniaoSerie(id){
    if(!confirm('Excluir esta reunião e todas as suas datas?')) return;
    data.reunioes = data.reunioes.filter(r => r.id !== id);
    if(reuniaoSerieAtivaId === id){
        reuniaoSerieAtivaId = data.reunioes[0] ? data.reunioes[0].id : null;
        reuniaoEntradaAtivaId = null;
    }
    marcarAlterado();
    renderReunioes();
}

function excluirReuniaoEntrada(){
    const serie = reunSerieAtiva();
    if(!serie || !reuniaoEntradaAtivaId) return;
    if(!confirm('Excluir esta data de reunião?')) return;

    serie.entradas = serie.entradas.filter(e => e.id !== reuniaoEntradaAtivaId);
    const ordenadas = reunEntradasOrdenadas(serie);
    reuniaoEntradaAtivaId = ordenadas.length ? ordenadas[ordenadas.length - 1].id : null;
    marcarAlterado();
    renderReunioes();
}