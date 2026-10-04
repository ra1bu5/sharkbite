/* ============================================================
   init.js — Bootstrap da aplicação
   Depende de: TODOS os outros arquivos JS
   ============================================================ */

/* ============================================================
   AMBIENTE (nome exibido no cabeçalho)
============================================================ */
function aplicarNomeAmbiente(nome){
    const el = document.getElementById('ambienteNome');
    if(el) el.textContent = nome;
    document.title = nome + ' · Sharkbite';
}

async function carregarAmbiente(){
    try {
        const { data: row, error } = await sb
            .from('ambientes')
            .select('id,nome,ativo')
            .eq('id', AMBIENTE_ID)
            .maybeSingle();

        if(error) throw error;
        if(!row) return null;

        localStorage.setItem(AMBIENTE_NOME_KEY, row.nome);
        aplicarNomeAmbiente(row.nome);
        return row;
    } catch(e){
        console.warn('Não foi possível validar o ambiente:', e);
        const nome = localStorage.getItem(AMBIENTE_NOME_KEY) || 'Ambiente';
        aplicarNomeAmbiente(nome);
        return { id: AMBIENTE_ID, nome };
    }
}

/* ============================================================
   AJUSTE DO nextId GLOBAL
   Os ids dos eventos são gerados aqui no front e a chave primária
   é global: começa depois do maior id de TODOS os ambientes,
   senão um evento novo poderia sobrescrever o de outro ambiente.
============================================================ */
async function ajustarNextIdGlobal(){
    try {
        const { data: rows, error } = await sb
            .from('eventos')
            .select('id')
            .order('id', { ascending: false })
            .limit(1);

        if(!error && rows && rows.length){
            nextId = Math.max(nextId, Number(rows[0].id) + 1);
        }
    } catch(e){
        console.warn('nextId global:', e);
    }
}

/* ============================================================
   CARREGAMENTO DOS DADOS
============================================================ */
async function loadData(){
    const raw      = localStorage.getItem(CACHE_KEY);
    const snapRaw  = localStorage.getItem(SNAP_KEY);
    const t        = Number(localStorage.getItem(CACHE_TIME_KEY) || 0);
    const pendente = localStorage.getItem(PEND_KEY) === '1';

    /* Usa o cache se: há alterações não gravadas OU cache < 30s */
    if(raw && snapRaw && (pendente || (t && Date.now() - t < 30000))){
        try {
            data     = JSON.parse(raw);
            snapshot = JSON.parse(snapRaw);
            prepararDados();
            return;
        } catch(e){}
    }

    /* Busca do Supabase */
    const remoto = await carregarDoSupabase();
    if(remoto){
        data = remoto;
        prepararDados();
        reconstruirSnapshot();
        salvarSnapshot();
        cacheLocal();
        localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
        localStorage.removeItem(PEND_KEY);
        return;
    }

    /* Fallback offline */
    if(raw){
        try {
            data     = JSON.parse(raw);
            snapshot = snapRaw ? JSON.parse(snapRaw) : {};
            prepararDados();
        } catch(e){}
    } else {
        cacheLocal();
    }
}

/* ============================================================
   NORMALIZAÇÃO DOS DADOS
   Garante que todos os campos existam, migra estruturas antigas
   e repara arrays vazios.
============================================================ */
function prepararDados(){
    if(!data.eventos)   data.eventos = [];
    if(!data.config)    data.config  = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    if(!data.config.tipos)  data.config.tipos  = JSON.parse(JSON.stringify(DEFAULT_CONFIG.tipos));
    if(!data.config.status) data.config.status = JSON.parse(JSON.stringify(DEFAULT_CONFIG.status));
    if(!data.config.background) data.config.background = { tipo:'cor', cor:'#f4f7fa', imagem:'' };
    if(data.config.userPhoto === undefined) data.config.userPhoto = '';
    if(!data.notas)     data.notas = [];
    if(!data.registros) data.registros = [];
    if(!data.reunioes)  data.reunioes = [];
    if(!data.plano)     data.plano = [];

    /* ---------- Registros: garante campos ---------- */
    data.registros.forEach(produto => {
        if(!produto.entradas) produto.entradas = [];
        produto.entradas.forEach(registro => {
            if(registro.responsavel === undefined) registro.responsavel = '';
            if(registro.statusLog   === undefined) registro.statusLog = '';
            if(!Array.isArray(registro.anexosArquivos)) registro.anexosArquivos = [];
        });
    });

    /* ---------- Notas: garante campos ---------- */
    data.notas.forEach((n, idx) => {
        if(!n.anexos) n.anexos = [];
        if(n.ordem === undefined) n.ordem = idx * 10;
    });

    /* ---------- Plano: garante campos ---------- */
    data.plano.forEach(dem => {
        if(!Array.isArray(dem.acoes)) dem.acoes = [];
        dem.acoes.forEach(a => {
            if(a.esforcoEstimado == null) a.esforcoEstimado = 0;
            if(a.esforcoReal     == null) a.esforcoReal = 0;
        });
    });

    /* ---------- Reuniões: garante campos + compatibilidade ---------- */
    data.reunioes.forEach(r => {
        if(!Array.isArray(r.entradas)) r.entradas = [];
        r.entradas.forEach(en => {
            if(!Array.isArray(en.pautas))          en.pautas = [];
            if(!Array.isArray(en.pendencias))      en.pendencias = [];
            if(!Array.isArray(en.assuntos))        en.assuntos = [];
            if(!Array.isArray(en.encaminhamentos)) en.encaminhamentos = [];

            if(en.participantes === undefined){
                en.participantes = [];
            } else if(typeof en.participantes === 'string'){
                en.participantes = en.participantes.split(',').map(x => x.trim()).filter(Boolean);
            }

            if(en.setor     === undefined) en.setor = '';
            if(en.dataHora  === undefined) en.dataHora = '';
            if(en.hora      === undefined) en.hora = '';
            if(en.minuto    === undefined) en.minuto = '';

            /* Compatibilidade com reuniões antigas (dataHora ISO) */
            if(!en.hora && !en.minuto && en.dataHora){
                const m = en.dataHora.match(/T(\d{2}):(\d{2})/);
                if(m){
                    en.hora   = m[1];
                    en.minuto = m[2];
                }
            }
        });
    });

    /* ---------- Autosave / temas ---------- */
    if(!data.config.autosave) data.config.autosave = { ativo: true, debounceMs: 3000, dragImediato: true };

    const embutidos = [
        ['claro',  'Sharkbite Claro',  THEME_VARS_SHARKBITE],
        ['escuro', 'Sharkbite Escuro', THEME_VARS_ESCURO]
    ];
    const temas = (Array.isArray(data.config.temas) ? data.config.temas : [])
        .filter(t => !['default', 'doom', 'sharkbite'].includes(t.id));

    embutidos.forEach(([id, nome, vars], i) => {
        if(!temas.find(t => t.id === id)){
            temas.splice(i, 0, { id, nome, builtIn: true, vars: JSON.parse(JSON.stringify(vars)) });
        }
    });
    data.config.temas = temas;
    if(!temas.find(t => t.id === data.config.temaAtivo)) data.config.temaAtivo = 'claro';

    /* ---------- Responsáveis / áreas / setores: aceita string ou objeto ---------- */
    data.config.responsaveis = (data.config.responsaveis || [])
        .map(r => typeof r === 'string' ? { label: r, cor: corAutomatica(r) } : r);
    data.config.areas = (data.config.areas || [])
        .map(a => typeof a === 'string' ? { label: a, cor: corAutomatica(a) } : a);
    data.config.setores = (data.config.setores || [])
        .map(s => typeof s === 'string' ? { label: s, cor: corAutomatica(s) } : s);

    /* ---------- Eventos: compatibilidade e normalização ---------- */
    data.eventos.forEach(ev => {
        if(!ev.dataInicio && ev.data){ ev.dataInicio = ev.data; delete ev.data; }
        if(ev.dataFim === undefined) ev.dataFim = ev.dataInicio || '';
        if(ev.responsavel === undefined) ev.responsavel = '';
        if(ev.area        === undefined) ev.area = '';
        if(ev.status      === undefined) ev.status = '';
        if(ev.complexidade === 'critica') ev.complexidade = 'alta';
        if(ev.ordem === undefined) ev.ordem = ev.id * 10;

        if(!Array.isArray(ev.checklist)) ev.checklist = [];
        ev.checklist = ev.checklist.map((item, idx) => ({
            id: item && item.id ? item.id : `ck_${ev.id}_${idx + 1}`,
            texto: item && item.texto != null
                ? String(item.texto)
                : String(item && (item.titulo || item.title) || ''),
            concluido: !!(item && (item.concluido || item.done || item.checked)),
            data: item && (item.data || item.dataVencimento || item.dueDate)
                ? String(item.data || item.dataVencimento || item.dueDate)
                : '',
            responsavel: item && item.responsavel ? String(item.responsavel) : ''
        }));
    });

    /* Recalcula nextId a partir do maior id de eventos */
    let max = 0;
    data.eventos.forEach(e => { if(e.id > max) max = e.id; });
    nextId = max + 1;
}

/* ============================================================
   BOOTSTRAP — dispara tudo no DOMContentLoaded
============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
    if(!AMBIENTE_ID){ location.replace('index.html'); return; }

    /* PRIMEIRO: aguarda o guard de auth */
    const ctx = await window.Auth.ready;
    if (!ctx) return;   // redireciona pro login
    authUser  = ctx.user;
    authToken = 'supabase';

    /* Esconde o botão Admin para não-admins */
    const btnAdmin = document.getElementById('btnAdmin');
    if (btnAdmin && !window.Auth.isAdmin) btnAdmin.style.display = 'none';

    /* AGORA sim carrega os dados */
    const amb = await carregarAmbiente();
    if(!amb){ location.replace('index.html'); return; }

    await loadData();
    await ajustarNextIdGlobal();
    aplicarTema();

    const pref = localStorage.getItem(VIEW_KEY);
    if(pref) view = (pref === 'lista' ? 'quadro' : pref);
    else if(window.innerWidth < 560) view = 'quadro';

    initSelects();
    sincronizarSelects();
    popularFiltros();

    render();
    atualizarBotaoSalvar();

   /* Aguarda o guard de auth */
   const ctx = await window.Auth.ready;
   if (!ctx) return;   // vai ser redirecionado
   authUser  = ctx.user;
   authToken = 'supabase';
   
   /* Esconde o botão Admin para não-admins */
   const btnAdmin = document.getElementById('btnAdmin');
   if (btnAdmin && !window.Auth.isAdmin) btnAdmin.style.display = 'none';
   
   /* Carrega o botão de usuário/logout no header (opcional, ver abaixo) */
   if (localStorage.getItem(PEND_KEY) === '1') {
       autosave.alteracoesPendentes = true;
       atualizarBotaoSalvar();
   }

    /* ---------- Atalhos globais ---------- */
    document.addEventListener('keydown', e => {
        if(e.key === 'Escape'){
            fecharForm();
            fecharModalDia();
            fecharAdmin();
            fecharDetalheDemanda();
            return;
        }

        /* Setas ← → na view Dia */
        if(view === 'dia'){
            const tag = (e.target.tagName || '').toLowerCase();
            const digitando = (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable);
            const modalAberto = document.querySelector('.modal-overlay.active');
            if(digitando || modalAberto) return;

            if(e.key === 'ArrowLeft'){  e.preventDefault(); navDiaPrev(); }
            if(e.key === 'ArrowRight'){ e.preventDefault(); navDiaNext(); }
        }
    });

    /* ---------- Salva antes de fechar a aba ---------- */
    window.addEventListener('beforeunload', () => {
        if(autosave.alteracoesPendentes && authToken){
            salvarAntesDeFechar();
        }
    });

    /* ---------- Salva quando a aba perde foco ---------- */
    document.addEventListener('visibilitychange', () => {
        if(document.hidden && autosave.alteracoesPendentes && authToken){
            if(autosave.timer){ clearTimeout(autosave.timer); autosave.timer = null; }
            salvarAutomatico();
        }
    });
});
