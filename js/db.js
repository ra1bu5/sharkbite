/* ============================================================
   db.js — Sincronização com Supabase
   Depende de: config.js, state.js, helpers.js
   ============================================================ */

/* ============================================================
   MONTAGEM: front (camelCase) → banco (snake_case)
============================================================ */
function montarLinhas(d){
    const L = {};
    TABELAS.forEach(t => L[t] = {});

   const CHAVES_GLOBAIS = new Set([
  'tipos','status','responsaveis','areas','setores'
]);

Object.keys(d.config || {}).forEach(k => {
  if (d.config[k] === undefined) return;
  const chave = configParaBanco(k);
  if (CHAVES_GLOBAIS.has(k)) {
    L.config[chave] = { chave, valor: d.config[k] };        // tabela config
  } else {
    L.config_ambiente[chave] = { ambiente_id: AMBIENTE_ID, chave, valor: d.config[k] };
  }
});

    /* ---------- Config ---------- */
    Object.keys(d.config || {}).forEach(k => {
        if(d.config[k] === undefined) return;
        const chave = configParaBanco(k);
        L.config[chave] = { chave, valor: d.config[k] };
    });

    /* ---------- Eventos ---------- */
    (d.eventos || []).forEach(e => {
        L.eventos[e.id] = {
            ambiente_id: AMBIENTE_ID,
            id: e.id,
            data_inicio: e.dataInicio || null,
            data_fim:    e.dataFim    || null,
            titulo:      e.titulo || '',
            responsavel: e.responsavel || '',
            area:        e.area || '',
            descricao:   e.descricao || '',
            descricao_html: e.descricaoHtml || '',
            tipo:        e.tipo || '',
            status:      e.status || '',
            complexidade: e.complexidade || '',
            checklist:   e.checklist || [],
            ordem:       e.ordem || 0
        };
    });

    /* ---------- Notas ---------- */
    (d.notas || []).forEach(n => {
        if(!n.criadoEm) n.criadoEm = new Date().toISOString();
        L.notas[n.id] = {
            ambiente_id: AMBIENTE_ID,
            id: n.id,
            titulo: n.titulo || '',
            conteudo: n.conteudo || '',
            cor: n.cor || '#ffffff',
            anexos: n.anexos || [],
            ordem: n.ordem || 0,
            criado_em: n.criadoEm
        };
    });

    /* ---------- Registros (Change Log) ---------- */
    (d.registros || []).forEach(p => {
        L.registros_produtos[p.id] = {
            ambiente_id: AMBIENTE_ID,
            id: p.id,
            nome: p.nome || '',
            cor: p.cor || 'var(--primary)',
            expandido: p.expandido !== false
        };
        (p.entradas || []).forEach(en => {
            if(!en.data) en.data = new Date().toISOString();
            L.registros_entradas[en.id] = {
                id: en.id,
                produto_id: p.id,
                titulo: en.titulo || '',
                descricao: en.descricao || '',
                onde: en.onde || '',
                resolucao: en.resolucao || '',
                responsavel: en.responsavel || '',
                status_log: en.statusLog || '',
                anexos_arquivos: en.anexosArquivos || [],
                data: en.data
            };
        });
    });

    /* ---------- Reuniões ---------- */
    (d.reunioes || []).forEach(s => {
        L.reunioes_series[s.id] = {
            ambiente_id: AMBIENTE_ID,
            id: s.id,
            nome: s.nome || '',
            cor: s.cor || '',
            expandido: s.expandido !== false
        };
        (s.entradas || []).forEach(en => {
            L.reunioes_entradas[en.id] = {
                id: en.id,
                serie_id: s.id,
                data: en.data || null,
                data_hora: en.dataHora || '',
                participantes: Array.isArray(en.participantes)
                    ? en.participantes.join(', ')
                    : (en.participantes || ''),
                setor: en.setor || '',
                pautas: en.pautas || [],
                pendencias: en.pendencias || [],
                assuntos: en.assuntos || [],
                encaminhamentos: en.encaminhamentos || [],
                pautas_html: en.pautasHtml || '',
                pendencias_html: en.pendenciasHtml || '',
                assuntos_html: en.assuntosHtml || '',
                encaminhamentos_html: en.encaminhamentosHtml || ''
            };
        });
    });

    /* ---------- Plano de Ação ---------- */
    (d.plano || []).forEach(dem => {
        L.plano_demandas[dem.id] = {
            ambiente_id: AMBIENTE_ID,
            id: dem.id,
            codigo: dem.codigo || '',
            demanda: dem.demanda || '',
            tipo: dem.tipo || '',
            solicitante: dem.solicitante || '',
            responsavel: dem.responsavel || '',
            porte: dem.porte || 'M',
            prioridade: dem.prioridade || 'Média',
            status: dem.status || 'Backlog',
            data_entrada: dem.dataEntrada || null,
            prazo: dem.prazo || null,
            proximo_passo: dem.proximoPasso || '',
            bloqueio: dem.bloqueio || '',
            link: dem.link || '',
            ordem: dem.ordem || 0
        };
        (dem.acoes || []).forEach(ac => {
            L.plano_acoes[ac.id] = {
                id: ac.id,
                demanda_id: dem.id,
                acao: ac.acao || '',
                etapa: ac.etapa || '',
                responsavel: ac.responsavel || '',
                inicio: ac.inicio || null,
                prazo: ac.prazo || null,
                status: ac.status || 'A fazer',
                esforco_estimado: Number(ac.esforcoEstimado) || 0,
                esforco_real: Number(ac.esforcoReal) || 0,
                observacoes: ac.observacoes || '',
                ordem: ac.ordem || 0
            };
        });
    });

    return L;
}

/* ============================================================
   SNAPSHOT — assinatura de cada linha já gravada no banco
============================================================ */
function reconstruirSnapshot(){
    const L = montarLinhas(data);
    snapshot = {};
    TABELAS.forEach(t => {
        snapshot[t] = {};
        Object.keys(L[t]).forEach(k => {
            snapshot[t][k] = hash53(JSON.stringify(L[t][k]));
        });
    });
}

function salvarSnapshot(){
    try { localStorage.setItem(SNAP_KEY, JSON.stringify(snapshot)); } catch(e){}
}

/* ============================================================
   DIFF — o que mudou desde o último salvamento
============================================================ */
function calcularDiferencas(){
    const atual = montarLinhas(data);
    const ups = {}, dels = {}, hashes = {};

    TABELAS.forEach(t => {
        const ant = snapshot[t] || {};
        ups[t] = [];
        hashes[t] = {};

        Object.keys(atual[t]).forEach(k => {
            const h = hash53(JSON.stringify(atual[t][k]));
            hashes[t][k] = h;
            if(ant[k] !== h) ups[t].push(atual[t][k]);
        });

        /* config nunca é apagada por diff (chave ausente ≠ chave removida) */
        dels[t] = t === 'config'
            ? []
            : Object.keys(ant).filter(k => !(k in atual[t])).map(Number);
    });

    return { ups, dels, hashes };
}

/* ============================================================
   GRAVAÇÃO NO BANCO
============================================================ */
async function sincronizarComBanco(){
    const { ups, dels, hashes } = calcularDiferencas();
    TABELAS.forEach(t => { if(!snapshot[t]) snapshot[t] = {}; });
    let ops = 0;

    try {
        /* Upserts (pai antes do filho) */
        for(const t of TABELAS){
            const pk = pkDe(t);
            for(let i = 0; i < ups[t].length; i += 100){
                const lote = ups[t].slice(i, i + 100);
                const { error } = await sb.from(t).upsert(lote, { onConflict: pk });
                if(error) throw new Error(`${t}: ${error.message}`);
                lote.forEach(r => { snapshot[t][r[pk]] = hashes[t][r[pk]]; });
                ops += lote.length;
            }
        }

        /* Deletes (filho antes do pai) */
        for(const t of [...TABELAS].reverse()){
            for(let i = 0; i < dels[t].length; i += 100){
                const lote = dels[t].slice(i, i + 100);
                const { error } = await sb.from(t).delete().in(pkDe(t), lote);
                if(error) throw new Error(`${t}: ${error.message}`);
                lote.forEach(id => { delete snapshot[t][id]; });
                ops += lote.length;
            }
        }
    } finally {
        salvarSnapshot();   // guarda o progresso mesmo se der erro no meio
    }
    return ops;
}

/* ============================================================
   SALVAMENTO AO FECHAR A ABA (melhor esforço)
============================================================ */
function salvarAntesDeFecharKeepalive(){
    if(!accessToken) return;
    const { ups, dels } = calcularDiferencas();

    const headers = {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
    };

    TABELAS.forEach(t => {
        if(ups[t].length){
            fetch(`${SUPABASE_URL}/rest/v1/${t}?on_conflict=${pkDe(t)}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(ups[t]),
                keepalive: true
            }).catch(() => {});
        }
        if(dels[t].length){
            fetch(`${SUPABASE_URL}/rest/v1/${t}?${pkDe(t)}=in.(${dels[t].join(',')})`, {
                method: 'DELETE',
                headers,
                keepalive: true
            }).catch(() => {});
        }
    });
}

/* ============================================================
   STORAGE — anexos no Supabase Storage
============================================================ */
function storageUrl(caminho){
    return sb.storage.from(STORAGE_BUCKET).getPublicUrl(caminho).data.publicUrl;
}

async function storageUpload(caminho, file){
    const { error } = await sb.storage.from(STORAGE_BUCKET).upload(caminho, file, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '31536000',
        upsert: false
    });
    if(error) throw new Error(error.message);
}

/* ============================================================
   LEITURA DO BANCO
============================================================ */
async function carregarDoSupabase(){
    const [
        { data: configRows, error: e1 },
        { data: eventos,    error: e2 },
        { data: notas,      error: e3 },
        { data: produtos,   error: e4 },
        { data: entradas,   error: e5 },
        { data: series,     error: e6 },
        { data: reunioes,   error: e7 },
        { data: demandas,   error: e8 },
        { data: acoes,      error: e9 },
    ] = await Promise.all([
        sb.from('config').select('*'),
        sb.from('eventos').select('*').eq('ambiente_id', AMBIENTE_ID).order('ordem'),
        sb.from('notas').select('*').eq('ambiente_id', AMBIENTE_ID).order('criado_em'),
        sb.from('registros_produtos').select('*').eq('ambiente_id', AMBIENTE_ID),
        sb.from('registros_entradas').select('*'),
        sb.from('reunioes_series').select('*').eq('ambiente_id', AMBIENTE_ID),
        sb.from('reunioes_entradas').select('*'),
        sb.from('plano_demandas').select('*').eq('ambiente_id', AMBIENTE_ID).order('ordem'),
        sb.from('plano_acoes').select('*').order('ordem'),
    ]);

    const err = e1 || e2 || e3 || e4 || e5 || e6 || e7 || e8 || e9;
    if(err){ console.error('Erro ao carregar:', err); return null; }

    /* Reconstrói config como objeto (era chave/valor no banco) */
    const config = {};
    (configRows || []).forEach(r => {
        config[configDoBanco(r.chave)] = r.valor;
    });

    /* Registros: junta produto + entradas */
    const registros = (produtos || []).map(p => ({
        ...mapProdutoDoBanco(p),
        entradas: (entradas || [])
            .filter(e => e.produto_id === p.id)
            .map(mapEntradaDoBanco)
    }));

    /* Reuniões: junta série + entradas */
    const reunioesFinal = (series || []).map(s => ({
        ...mapSerieDoBanco(s),
        entradas: (reunioes || [])
            .filter(e => e.serie_id === s.id)
            .map(mapReuniaoEntradaDoBanco)
    }));

    /* Plano: junta demanda + ações */
    const planoFinal = (demandas || []).map(dem => ({
        ...mapDemandaDoBanco(dem),
        acoes: (acoes || [])
            .filter(a => a.demanda_id === dem.id)
            .map(mapAcaoDoBanco)
    }));

    return {
        config,
        eventos:   (eventos || []).map(mapEventoDoBanco),
        notas:     (notas   || []).map(mapNotaDoBanco),
        registros,
        reunioes:  reunioesFinal,
        plano:     planoFinal,
    };
}

/* ============================================================
   MAPEADORES: banco (snake_case) → front (camelCase)
============================================================ */
function mapEventoDoBanco(e){
    return {
        id: e.id,
        dataInicio: e.data_inicio || '',
        dataFim:    e.data_fim    || '',
        titulo:     e.titulo      || '',
        responsavel:e.responsavel || '',
        area:       e.area        || '',
        descricao:  e.descricao   || '',
        descricaoHtml: e.descricao_html || '',
        tipo:       e.tipo        || '',
        status:     e.status      || '',
        complexidade: e.complexidade || '',
        checklist:  e.checklist   || [],
        ordem:      e.ordem       || 0,
    };
}

function mapNotaDoBanco(n){
    return {
        id: n.id,
        titulo: n.titulo || '',
        conteudo: n.conteudo || '',
        cor: n.cor || '#ffffff',
        anexos: n.anexos || [],
        criadoEm:    n.criado_em,
        atualizadoEm:n.atualizado_em,
        ordem: n.ordem || 0,
    };
}

function mapProdutoDoBanco(p){
    return {
        id: p.id,
        nome: p.nome,
        cor: p.cor || 'var(--primary)',
        expandido: p.expandido !== false,
    };
}

function mapEntradaDoBanco(r){
    return {
        id: r.id,
        titulo: r.titulo || '',
        descricao: r.descricao || '',
        onde: r.onde || '',
        resolucao: r.resolucao || '',
        responsavel: r.responsavel || '',
        statusLog: r.status_log || '',
        anexosArquivos: r.anexos_arquivos || [],
        data: r.data,
    };
}

function mapSerieDoBanco(s){
    return {
        id: s.id,
        nome: s.nome,
        cor: s.cor || '',
        expandido: s.expandido !== false,
    };
}

function mapReuniaoEntradaDoBanco(en){
    return {
        id: en.id,
        data: en.data || '',
        dataHora: en.data_hora || '',
        hora: en.data_hora ? en.data_hora.slice(0,2) : '',
        minuto: en.data_hora ? en.data_hora.slice(3,5) : '',
        participantes: en.participantes
            ? en.participantes.split(',').map(x => x.trim()).filter(Boolean)
            : [],
        setor: en.setor || '',
        pautas: en.pautas || [],
        pendencias: en.pendencias || [],
        assuntos: en.assuntos || [],
        encaminhamentos: en.encaminhamentos || [],
        pautasHtml: en.pautas_html || '',
        pendenciasHtml: en.pendencias_html || '',
        assuntosHtml: en.assuntos_html || '',
        encaminhamentosHtml: en.encaminhamentos_html || '',
    };
}

function mapDemandaDoBanco(d){
    return {
        id: d.id,
        codigo: d.codigo || '',
        demanda: d.demanda || '',
        tipo: d.tipo || '',
        solicitante: d.solicitante || '',
        responsavel: d.responsavel || '',
        porte: d.porte || 'M',
        prioridade: d.prioridade || 'Média',
        status: d.status || 'Backlog',
        dataEntrada: d.data_entrada || '',
        prazo: d.prazo || '',
        proximoPasso: d.proximo_passo || '',
        bloqueio: d.bloqueio || '',
        link: d.link || '',
        ordem: d.ordem || 0,
    };
}

function mapAcaoDoBanco(a){
    return {
        id: a.id,
        acao: a.acao || '',
        etapa: a.etapa || '',
        responsavel: a.responsavel || '',
        inicio: a.inicio || '',
        prazo: a.prazo || '',
        status: a.status || 'A fazer',
        esforcoEstimado: Number(a.esforco_estimado) || 0,
        esforcoReal: Number(a.esforco_real) || 0,
        observacoes: a.observacoes || '',
        ordem: a.ordem || 0,
    };
}
