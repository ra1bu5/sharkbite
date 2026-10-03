/* ============================================================
   views/registros.js — Change Log (histórico de modificações)
   Depende de: config.js, state.js, helpers.js, db.js
   ============================================================ */

/* ============================================================
   CONSTANTES DE STATUS DO LOG
============================================================ */
const REGISTRO_STATUS = [
    { id:'nao-iniciado', label:'Não iniciado', cor:'#9e9e9e' },
    { id:'em-andamento', label:'Em andamento', cor:'#f5a623' },
    { id:'em-validacao', label:'Em validação com área/setor', cor:'#2b6ca3' },
    { id:'finalizado', label:'Finalizado', cor:'#1a9c4a' },
    { id:'finalizado-publicado', label:'Finalizado e publicado', cor:'#0f9fb0' },
    { id:'finalizado-publicado-informado', label:'Finalizado, publicado e informado', cor:'#673ab7' }
];
function getRegistroStatus(id){ return REGISTRO_STATUS.find(s => s.id === id) || null; }

/* ============================================================
   BUSCA
============================================================ */
const REGISTRO_BUSCA_CAMPOS = {
    titulo:      { label: 'Título do log',       placeholder: 'Buscar pelo título do log…' },
    responsavel: { label: 'Responsável',         placeholder: 'Buscar por responsável…' },
    status:      { label: 'Status do log',       placeholder: 'Buscar por status (ex.: validação)…' },
    descricao:   { label: 'Termos na descrição', placeholder: 'Buscar termos na descrição do log…' }
};

function registroBuscaTermos(){
    return buscaNorm(registroBuscaTexto).split(/\s+/).map(t => t.replace(/^@+/, '')).filter(Boolean);
}
function registroBuscaAtiva(){ return registroBuscaTermos().length > 0; }

function registroValorBusca(reg){
    if(registroBuscaCampo === 'responsavel') return reg.responsavel || '';
    if(registroBuscaCampo === 'status'){
        const st = getRegistroStatus(reg.statusLog);
        return st ? st.label : '';
    }
    if(registroBuscaCampo === 'descricao') return reg.descricao || '';
    return reg.titulo || '';
}
function registroCombina(reg){
    const termos = registroBuscaTermos();
    if(!termos.length) return true;
    const alvo = buscaNorm(registroValorBusca(reg));
    return termos.every(t => alvo.includes(t));
}

/* Devolve o texto já escapado, com os termos dentro de <mark> */
function buscaDestacar(texto, termos){
    texto = String(texto == null ? '' : texto);
    const n = buscaNorm(texto);
    if(!termos || !termos.length || n.length !== texto.length) return escapeHtml(texto);

    const marca = new Array(texto.length).fill(false);
    termos.forEach(t => {
        let i = n.indexOf(t);
        while(i !== -1){
            for(let k = i; k < i + t.length; k++) marca[k] = true;
            i = n.indexOf(t, i + t.length);
        }
    });

    let out = '', aberto = false;
    for(let i = 0; i < texto.length; i++){
        if(marca[i] && !aberto){ out += '<mark>'; aberto = true; }
        if(!marca[i] && aberto){ out += '</mark>'; aberto = false; }
        out += escapeHtml(texto[i]);
    }
    return aberto ? out + '</mark>' : out;
}

/* Trecho da descrição em volta da primeira ocorrência */
function buscaTrecho(texto, termos){
    texto = String(texto || '').replace(/\s+/g, ' ').trim();
    const n = buscaNorm(texto);
    let pos = -1;
    if(n.length === texto.length){
        termos.forEach(t => {
            const i = n.indexOf(t);
            if(i !== -1 && (pos === -1 || i < pos)) pos = i;
        });
    }
    const ini = pos > 40 ? pos - 40 : 0;
    const fim = Math.min(texto.length, ini + 170);
    return (ini > 0 ? '…' : '') + buscaDestacar(texto.slice(ini, fim), termos) + (fim < texto.length ? '…' : '');
}

/* ============================================================
   BARRA DE BUSCA — ações
============================================================ */
function registroBuscaConfigurarCampo(){
    const info = REGISTRO_BUSCA_CAMPOS[registroBuscaCampo];
    const sel = document.getElementById('registroBuscaCampo'); if(sel) sel.value = registroBuscaCampo;
    const inp = document.getElementById('registroBuscaTexto');
    if(inp){
        inp.placeholder = info.placeholder;
        if(inp.value !== registroBuscaTexto) inp.value = registroBuscaTexto;
    }
    const dl = document.getElementById('registroBuscaSugestoes');
    if(dl){
        let opcoes = [];
        if(registroBuscaCampo === 'responsavel') opcoes = (data.config.responsaveis || []).map(r => r.label);
        else if(registroBuscaCampo === 'status')  opcoes = REGISTRO_STATUS.map(s => s.label);
        dl.innerHTML = opcoes.map(o => `<option value="${escapeHtml(o)}"></option>`).join('');
    }
}

function registroBuscaMudouCampo(sel){
    registroBuscaCampo = sel.value;
    registroBuscaConfigurarCampo();
    registroBuscaAplicar();
}

function registroBuscaMudouTexto(inp){
    registroBuscaTexto = inp.value;
    registroBuscaAplicar();
}

function registroBuscaAplicar(){
    /* Buscando: os resultados aparecem no painel da direita, então fecha o log aberto */
    if(registroBuscaAtiva() && registroEntradaAtivaId){
        if(registroEditandoLog){ registroSincronizarCamposEdicao(); marcarAlterado(); }
        registroEntradaAtivaId = null;
        registroEditandoLog = false;
    }
    renderRegistros();
}

function registroBuscaLimpar(){
    registroBuscaTexto = '';
    const inp = document.getElementById('registroBuscaTexto');
    if(inp){ inp.value = ''; inp.focus(); }
    renderRegistros();
}

function registroBuscaAtualizarContagem(){
    const el = document.getElementById('registroBuscaCount');
    if(!el) return;
    if(!registroBuscaAtiva()){ el.textContent = ''; return; }
    let n = 0;
    (data.registros || []).forEach(p => (p.entradas || []).forEach(r => {
        if(registroCombina(r)) n++;
    }));
    el.textContent = n === 1 ? '1 resultado' : `${n} resultados`;
}

/* ============================================================
   RESULTADOS DA BUSCA (painel da direita)
============================================================ */
function registroResultadosBuscaHtml(){
    const termos = registroBuscaTermos();
    const campo  = registroBuscaCampo;
    const res    = [];

    (data.registros || []).forEach(p => (p.entradas || []).forEach(r => {
        if(registroCombina(r)) res.push({ p, r });
    }));
    res.sort((a, b) => new Date(b.r.data) - new Date(a.r.data));
    const nProd = new Set(res.map(x => x.p.id)).size;

    const cards = res.map(({ p, r }) => {
        const d = new Date(r.data);
        const dataStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
        let trecho = '';

        if(campo === 'responsavel' && r.responsavel){
            trecho = `<span class="badge badge-resp" style="${badgeStyle(getRespCor(r.responsavel))}">@${buscaDestacar(r.responsavel, termos)}</span>`;
        } else if(campo === 'status'){
            const st = getRegistroStatus(r.statusLog);
            if(st) trecho = `<span class="badge" style="${badgeStyle(st.cor)}">${buscaDestacar(st.label, termos)}</span>`;
        } else if(campo === 'descricao'){
            trecho = buscaTrecho(r.descricao, termos);
        }

        return `<div class="registro-card" onclick="selecionarRegistroEntrada(${p.id}, ${r.id})">
            <div class="registro-card-data">${dataStr} · ${escapeHtml(p.nome || 'Sem nome')}</div>
            <div class="registro-card-titulo">${campo === 'titulo'
                ? buscaDestacar(r.titulo || 'Sem título', termos)
                : escapeHtml(r.titulo || 'Sem título')}</div>
            ${trecho ? `<div class="registro-card-trecho">${trecho}</div>` : ''}
            <div class="registro-card-link">Ver registro →</div>
        </div>`;
    }).join('');

    return `<div class="registro-lista-conteudo">
        <div class="registro-lista-head"><div>
            <div class="registro-lista-titulo">Resultados da busca</div>
            <div class="registro-lista-subtitulo">${res.length === 1 ? '1 log' : res.length + ' logs'} em ${nProd === 1 ? '1 produto/painel' : nProd + ' produtos/painéis'} · ${escapeHtml(REGISTRO_BUSCA_CAMPOS[campo].label)}: “${escapeHtml(registroBuscaTexto.trim())}”</div>
        </div></div>
        ${res.length ? cards : '<div class="registro-lista-vazio">Nenhum log encontrado.</div>'}
    </div>`;
}

/* ============================================================
   RENDER PRINCIPAL
============================================================ */
function renderRegistros(){
    const c = document.getElementById('viewContainer');
    if(!data.registros) data.registros = [];

    const buscando = registroBuscaAtiva();
    registroBuscaAtualizarContagem();

    /* Seleciona o primeiro produto se ainda não houver */
    if(!registroProdutoAtivoId && data.registros.length > 0){
        registroProdutoAtivoId = data.registros[0].id;
    }
    const produtoAtivo = data.registros.find(p => p.id === registroProdutoAtivoId) || null;

    /* ---------- LATERAL ---------- */
    const listaHtml = data.registros.length === 0
        ? `<li class="notas-vazio">Nenhum produto/painel ainda.</li>`
        : data.registros.map(produto => {
            const ativa = produto.id === registroProdutoAtivoId ? 'ativa' : '';

            let entradas = [...(produto.entradas || [])]
                .sort((a, b) => new Date(b.data) - new Date(a.data));

            if(buscando){
                entradas = entradas.filter(registroCombina);
                if(entradas.length === 0) return '';
            }

            const entradasHtml = entradas.length === 0
                ? `<li class="registro-vazio-mini">Nenhum log ainda.</li>`
                : entradas.map(registro => {
                    const registroAtivo = (produto.id === registroProdutoAtivoId && registro.id === registroEntradaAtivaId)
                        ? 'ativa' : '';
                    const d = new Date(registro.data);
                    const dataStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
                    return `<li class="registro-entrada-item ${registroAtivo}"
                                onclick="event.stopPropagation(); selecionarRegistroEntrada(${produto.id}, ${registro.id})">
                                <span class="registro-entrada-titulo">${escapeHtml(registro.titulo || 'Sem título')}</span>
                                <span class="registro-entrada-data">${dataStr}</span>
                            </li>`;
                }).join('');

            return `<li class="registro-produto">
                <div class="registro-produto-head ${ativa}" onclick="selecionarRegistroProduto(${produto.id})">
                    <span class="registro-arrow">${(produto.expandido !== false || buscando) ? '▾' : '▸'}</span>
                    <span class="registro-cor-dot" style="background:${escapeHtml(produto.cor || 'var(--primary)')}"></span>
                    <span class="registro-produto-nome">${escapeHtml(produto.nome || 'Sem nome')}</span>
                    <button type="button" class="registro-mini-del" title="Excluir produto/painel"
                            onclick="event.stopPropagation(); excluirRegistroProduto(${produto.id})">×</button>
                </div>
                ${(produto.expandido !== false || buscando) ? `<ul class="registro-entradas">${entradasHtml}</ul>` : ''}
            </li>`;
        }).join('');

    /* ---------- PAINEL DIREITO ---------- */
    let conteudoDireita = '';

    if(!produtoAtivo){
        conteudoDireita = `<div class="notas-vazio" style="margin:auto;"><p>Crie um produto ou painel para começar a registrar logs.</p></div>`;
    } else {
        const entradas = [...(produtoAtivo.entradas || [])]
            .sort((a, b) => new Date(b.data) - new Date(a.data));
        const registroAtivo = registroEntradaAtivaId
            ? entradas.find(r => r.id === registroEntradaAtivaId)
            : null;

        if(!registroAtivo && buscando){
            conteudoDireita = registroResultadosBuscaHtml();

        } else if(!registroAtivo){
            conteudoDireita = `<div class="registro-lista-conteudo">
                <div class="registro-lista-head">
                    <div>
                        <div class="registro-lista-titulo">${escapeHtml(produtoAtivo.nome)}</div>
                        <div class="registro-lista-subtitulo">Logs registrados</div>
                    </div>
                    <div class="registro-lista-acoes">
                        <button type="button" class="btn-mini edit" title="Editar nome" onclick="editarRegistroProduto(${produtoAtivo.id})">${ic('edit', 14)}</button>
                        <button type="button" class="btn-mini dup" title="Novo log" onclick="novoRegistro(${produtoAtivo.id})">${ic('plus', 14)}</button>
                    </div>
                </div>
                ${entradas.length === 0
                    ? `<div class="registro-lista-vazio">Nenhum log registrado neste produto/painel.</div>`
                    : entradas.map(registro => {
                        const d = new Date(registro.data);
                        const dataStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
                        return `<div class="registro-card" onclick="selecionarRegistroEntrada(${produtoAtivo.id}, ${registro.id})">
                            <div class="registro-card-data">${dataStr}</div>
                            <div class="registro-card-titulo">${escapeHtml(registro.titulo || 'Sem título')}</div>
                            <div class="registro-card-link">Ver registro →</div>
                        </div>`;
                    }).join('')
                }
            </div>`;

        } else {
            /* Há um log aberto — mostra formulário ou view */
            const logAcoes = registroEditandoLog
                ? `<button type="button" class="btn-mini del" title="Excluir log" onclick="excluirRegistroEntrada()">${ic('x', 14)}</button>
                   <button type="button" class="btn btn-success" onclick="registrarModificacao()">Registrar log</button>`
                : `<button type="button" class="btn-mini del" title="Excluir log" onclick="excluirRegistroEntrada()">${ic('x', 14)}</button>
                   <button type="button" class="btn-mini edit" title="Editar log" onclick="editarRegistroEntrada()">${ic('edit', 14)}</button>`;

            const statusLogInfo = getRegistroStatus(registroAtivo.statusLog);

            const anexosViewHtml = (registroAtivo.anexosArquivos || []).length
                ? `<div class="registro-anexos-lista">${registroAtivo.anexosArquivos.map(a => `
                    <a class="registro-anexo-item" href="${escapeHtml(a.url)}" target="_blank" rel="noopener">
                        ${ic('clip', 14)}<span class="registro-anexo-nome">${escapeHtml(a.nome)}</span>
                    </a>`).join('')}</div>`
                : '—';

            const camposView = [
                ['Título', escapeHtml(registroAtivo.titulo || '—')],
                ['Responsável', registroAtivo.responsavel
                    ? `<span class="badge badge-resp" style="${badgeStyle(getRespCor(registroAtivo.responsavel))}">@${escapeHtml(registroAtivo.responsavel)}</span>`
                    : '—'],
                ['Status', statusLogInfo
                    ? `<span class="badge" style="${badgeStyle(statusLogInfo.cor)}">${escapeHtml(statusLogInfo.label)}</span>`
                    : '—'],
                ['Descrição', escapeHtml(registroAtivo.descricao || '—')],
                ['Onde', escapeHtml(registroAtivo.onde || '—')],
                ['Resolução', escapeHtml(registroAtivo.resolucao || '—')],
                ['Anexos', anexosViewHtml]
            ].map(([label, valorHtml]) => `
                <div class="registro-view-campo">
                    <label>${label}</label>
                    <div class="registro-view-valor">${valorHtml}</div>
                </div>
            `).join('');

            const anexosEdicaoHtml = (registroAtivo.anexosArquivos || []).length
                ? registroAtivo.anexosArquivos.map((a, i) => `
                    <div class="registro-anexo-item">
                        <a href="${escapeHtml(a.url)}" target="_blank" rel="noopener">
                            ${ic('clip', 14)}<span class="registro-anexo-nome">${escapeHtml(a.nome)}</span>
                        </a>
                        <button type="button" class="registro-anexo-del" title="Remover anexo" onclick="registroRemoverAnexo(${i})">${ic('x', 13)}</button>
                    </div>`).join('')
                : '<div class="registro-vazio-mini">Nenhum arquivo anexado.</div>';

            const camposEdicao = `
                <div class="registro-campo">
                    <label>Título</label>
                    <input type="text" id="registroTitulo" placeholder="Título do log" value="${escapeHtml(registroAtivo.titulo || '')}">
                </div>
                <div class="registro-row2">
                    <div class="registro-campo">
                        <label>Responsável</label>
                        <select id="registroResponsavel">
                            <option value="">— Nenhum —</option>
                            ${(data.config.responsaveis || []).map(r => `<option value="${escapeHtml(r.label)}" ${registroAtivo.responsavel === r.label ? 'selected' : ''}>${escapeHtml(r.label)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="registro-campo">
                        <label>Status</label>
                        <select id="registroStatusLog">
                            <option value="">— Nenhum —</option>
                            ${REGISTRO_STATUS.map(s => `<option value="${escapeHtml(s.id)}" ${registroAtivo.statusLog === s.id ? 'selected' : ''}>${escapeHtml(s.label)}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="registro-campo">
                    <label>Descrição</label>
                    <textarea id="registroDescricao" placeholder="Descreva o log realizado...">${escapeHtml(registroAtivo.descricao || '')}</textarea>
                </div>
                <div class="registro-campo">
                    <label>Onde</label>
                    <textarea id="registroOnde" placeholder="Informe onde a alteração foi realizada...">${escapeHtml(registroAtivo.onde || '')}</textarea>
                </div>
                <div class="registro-campo">
                    <label>Resolução</label>
                    <textarea id="registroResolucao" placeholder="Descreva como o problema foi resolvido ou o que foi alterado...">${escapeHtml(registroAtivo.resolucao || '')}</textarea>
                </div>
                <div class="registro-campo">
                    <label>Anexos</label>
                    <div class="registro-anexos-lista">${anexosEdicaoHtml}</div>
                    <button type="button" class="checklist-add" onclick="registroAnexarArquivo()">Anexar arquivo</button>
                </div>
            `;

            conteudoDireita = `
                <div class="notas-toolbar">
                    <strong style="flex:1;font-size:16px;color:var(--text-heading);">${escapeHtml(produtoAtivo.nome)}</strong>
                    <div class="registro-log-acoes">${logAcoes}</div>
                    <button class="danger" onclick="fecharRegistroEntrada()">Voltar</button>
                </div>
                <div class="${registroEditandoLog ? 'registro-form' : 'registro-view'}">
                    ${registroEditandoLog ? camposEdicao : camposView}
                </div>
            `;
        }
    }

    /* ---------- HTML FINAL ---------- */
    c.innerHTML = `
        <div class="notas-view registros-view">
            <div class="notas-sidebar">
                <button class="btn-nova-nota" onclick="novoRegistroProduto()">+ Novo produto/painel</button>
                <ul class="notas-lista">${listaHtml || '<li class="notas-vazio">Nenhum log encontrado.</li>'}</ul>
            </div>
            <div class="notas-editor-wrap">${conteudoDireita}</div>
        </div>
    `;
}

/* ============================================================
   CRUD DE PRODUTO / PAINEL
============================================================ */
function novoRegistroProduto(){
    const nome = prompt('Nome do produto/painel:');
    if(!nome || !nome.trim()) return;

    const novo = {
        id: Date.now(),
        nome: nome.trim(),
        cor: 'var(--primary)',
        expandido: true,
        entradas: []
    };
    data.registros.unshift(novo);
    registroProdutoAtivoId = novo.id;
    registroEntradaAtivaId = null;
    marcarAlterado();
    renderRegistros();
}

function editarRegistroProduto(id){
    const produto = data.registros.find(p => p.id === id);
    if(!produto) return;

    const novoNome = prompt('Nome do produto/painel:', produto.nome || '');
    if(novoNome === null) return;
    const nome = novoNome.trim();
    if(!nome){ alert('Informe um nome para o produto/painel.'); return; }

    produto.nome = nome;
    marcarAlterado();
    renderRegistros();
}

function excluirRegistroProduto(id){
    const produto = data.registros.find(p => p.id === id);
    if(!produto) return;

    const qtd = (produto.entradas || []).length;
    const msg = qtd > 0
        ? `Excluir "${produto.nome}" e ${qtd} log(s) registrado(s)?`
        : `Excluir "${produto.nome}"?`;
    if(!confirm(msg)) return;

    data.registros = data.registros.filter(p => p.id !== id);
    if(registroProdutoAtivoId === id){
        registroProdutoAtivoId = data.registros.length > 0 ? data.registros[0].id : null;
        registroEntradaAtivaId = null;
    }
    marcarAlterado();
    renderRegistros();
}

function selecionarRegistroProduto(id){
    const produto = data.registros.find(p => p.id === id);
    if(!produto) return;
    registroProdutoAtivoId = id;
    registroEntradaAtivaId = null;
    produto.expandido = produto.expandido === false ? true : false;
    renderRegistros();
}

/* ============================================================
   CRUD DE ENTRADA (log)
============================================================ */
function selecionarRegistroEntrada(produtoId, entradaId){
    registroProdutoAtivoId = produtoId;
    registroEntradaAtivaId = entradaId;
    registroEditandoLog = false;
    renderRegistros();
}

function novoRegistro(produtoId){
    const produto = data.registros.find(p => p.id === produtoId);
    if(!produto) return;
    if(!produto.entradas) produto.entradas = [];

    const novo = {
        id: Date.now(),
        titulo: '',
        descricao: '',
        onde: '',
        resolucao: '',
        responsavel: '',
        statusLog: '',
        anexosArquivos: [],
        data: new Date().toISOString()
    };
    produto.entradas.unshift(novo);
    produto.expandido = true;

    registroProdutoAtivoId = produtoId;
    registroEntradaAtivaId = novo.id;
    registroEditandoLog = true;

    renderRegistros();
    setTimeout(() => {
        const campo = document.getElementById('registroTitulo');
        if(campo) campo.focus();
    }, 50);
}

function fecharRegistroEntrada(){
    registroEntradaAtivaId = null;
    renderRegistros();
}

function editarRegistroEntrada(){
    registroEditandoLog = true;
    renderRegistros();
    setTimeout(() => {
        const campo = document.getElementById('registroTitulo');
        if(campo) campo.focus();
    }, 50);
}

function excluirRegistroEntrada(){
    if(!registroProdutoAtivoId || !registroEntradaAtivaId) return;
    const produto = data.registros.find(p => p.id === registroProdutoAtivoId);
    if(!produto) return;
    if(!confirm('Excluir este log?')) return;

    produto.entradas = produto.entradas.filter(r => r.id !== registroEntradaAtivaId);
    registroEntradaAtivaId = null;
    registroEditandoLog = false;
    marcarAlterado();
    renderRegistros();
}

function registrarModificacao(){
    if(!registroProdutoAtivoId || !registroEntradaAtivaId) return;

    const produto = data.registros.find(p => p.id === registroProdutoAtivoId);
    if(!produto) return;
    const registro = produto.entradas.find(r => r.id === registroEntradaAtivaId);
    if(!registro) return;

    const titulo     = document.getElementById('registroTitulo').value.trim();
    const descricao  = document.getElementById('registroDescricao').value.trim();
    const onde       = document.getElementById('registroOnde').value.trim();
    const resolucao  = document.getElementById('registroResolucao').value.trim();
    const responsavel = document.getElementById('registroResponsavel').value;
    const statusLog  = document.getElementById('registroStatusLog').value;

    if(!titulo){ alert('Informe um título para o log.'); return; }

    registro.titulo      = titulo;
    registro.descricao   = descricao;
    registro.onde        = onde;
    registro.resolucao   = resolucao;
    registro.responsavel = responsavel;
    registro.statusLog   = statusLog;
    registro.data        = new Date().toISOString();

    marcarAlterado();
    registroEditandoLog = false;
    renderRegistros();
}

/* ============================================================
   HELPERS DE ANEXO / EDIÇÃO
============================================================ */
function registroEntradaAtiva(){
    const produto = data.registros.find(p => p.id === registroProdutoAtivoId);
    if(!produto) return null;
    return (produto.entradas || []).find(r => r.id === registroEntradaAtivaId) || null;
}

/* Salva no objeto o que já foi digitado antes de re-renderizar */
function registroSincronizarCamposEdicao(){
    if(!registroEditandoLog) return;
    const registro = registroEntradaAtiva();
    if(!registro) return;
    const $ = id => document.getElementById(id);
    if($('registroTitulo'))      registro.titulo      = $('registroTitulo').value;
    if($('registroDescricao'))   registro.descricao   = $('registroDescricao').value;
    if($('registroOnde'))        registro.onde        = $('registroOnde').value;
    if($('registroResolucao'))   registro.resolucao   = $('registroResolucao').value;
    if($('registroResponsavel')) registro.responsavel = $('registroResponsavel').value;
    if($('registroStatusLog'))   registro.statusLog   = $('registroStatusLog').value;
}

function registroAnexarArquivo(){
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
        registroUploadAnexo(file);
    };
    input.click();
}

async function registroUploadAnexo(file){
    if(!authToken){
        alert('Para anexar arquivos é preciso estar logado como admin (Admin).\nSem login, os arquivos não podem ser enviados.');
        return;
    }
    const registro = registroEntradaAtiva();
    if(!registro) return;

    const pasta = 'registros';
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
        const urlRaw = storageUrl(caminho);
        registro.anexosArquivos.push({ nome: file.name, url: urlRaw, arquivo: nomeFinal });

        registroSincronizarCamposEdicao();
        marcarAlterado();
        renderRegistros();
    } catch(e){
        console.error('Erro no upload:', e);
        alert('Erro ao enviar o arquivo: ' + (e.message || 'desconhecido'));
    } finally {
        if(progress) progress.style.display = 'none';
    }
}

async function registroRemoverAnexo(idx){
    const registro = registroEntradaAtiva();
    if(!registro || !registro.anexosArquivos || !registro.anexosArquivos[idx]) return;

    const anexo = registro.anexosArquivos[idx];
    if(!confirm(`Remover o anexo "${anexo.nome}"?`)) return;

    if(authToken && anexo.arquivo){
        await removerAnexo(`img/registros-anexos/${anexo.arquivo}`);
    }

    registro.anexosArquivos.splice(idx, 1);
    registroSincronizarCamposEdicao();
    marcarAlterado();
    renderRegistros();
}