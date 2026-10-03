/* ============================================================
   autosave.js — Núcleo do salvamento automático
   Depende de: config.js, state.js, db.js
   ============================================================ */

/* ============================================================
   CACHE LOCAL
============================================================ */
function cacheLocal(){
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch(e){}
}

/* ============================================================
   CONFIGURAÇÃO ATUAL DE AUTOSAVE
============================================================ */
function getAutosaveConfig(){
    const cfg = data.config.autosave || {};
    return {
        ativo: cfg.ativo !== false,
        debounceMs: Number(cfg.debounceMs) || 3000,
        dragImediato: cfg.dragImediato !== false
    };
}

/* ============================================================
   MARCAÇÃO DE ALTERAÇÃO
   - Salva em localStorage imediatamente (garantia)
   - Se autosave ativo: agenda salvamento (debounce)
   - Se opts.imediato: salva já (drag-and-drop / config)
============================================================ */
function marcarAlterado(opts){
    opts = opts || {};
    autosave.versao++;
    cacheLocal();
    if(authToken) localStorage.setItem(PEND_KEY, '1');

    if(!getAutosaveConfig().ativo) return;
    if(!authToken) return;   // sem login, não tenta salvar no banco

    autosave.alteracoesPendentes = true;
    atualizarBotaoSalvar();

    if(opts.imediato){
        if(autosave.timer){ clearTimeout(autosave.timer); autosave.timer = null; }
        if(autosave.timerRetentativa){ clearTimeout(autosave.timerRetentativa); autosave.timerRetentativa = null; }
        salvarAutomatico();
        return;
    }

    if(autosave.timer) clearTimeout(autosave.timer);
    const wait = getAutosaveConfig().debounceMs;
    autosave.timer = setTimeout(() => {
        autosave.timer = null;
        if(autosave.alteracoesPendentes) salvarAutomatico();
    }, wait);
}

/* ============================================================
   SALVAMENTO AUTOMÁTICO
============================================================ */
async function salvarAutomatico(){
    if(!authToken) return;
    if(!autosave.alteracoesPendentes) return;
    if(autosave.estado === 'salvando') return;   // evita corrida

    autosave.estado = 'salvando';
    atualizarBotaoSalvar();
    const versaoSalva = autosave.versao;

    const sucesso = await executarSalvamento();

    if(sucesso){
        autosave.estado = 'salvo';

        /* Se algo mudou enquanto o PUT estava em andamento,
           mantém a pendência e dispara outro salvamento */
        if(autosave.versao === versaoSalva){
            autosave.alteracoesPendentes = false;
        } else {
            autosave.alteracoesPendentes = true;
            setTimeout(() => {
                if(autosave.alteracoesPendentes) salvarAutomatico();
            }, 0);
        }

        autosave.ultimoErro = null;
        atualizarBotaoSalvar();

        setTimeout(() => {
            if(autosave.estado === 'salvo' && !autosave.alteracoesPendentes){
                autosave.estado = 'salvo';
                atualizarBotaoSalvar();
            }
        }, 2000);
    } else {
        autosave.estado = 'erro';
        atualizarBotaoSalvar();

        /* Retentativa em 10s */
        if(autosave.timerRetentativa) clearTimeout(autosave.timerRetentativa);
        autosave.timerRetentativa = setTimeout(() => {
            autosave.timerRetentativa = null;
            if(autosave.alteracoesPendentes) salvarAutomatico();
        }, 10000);
    }
}

/* ============================================================
   EXECUÇÃO DO SALVAMENTO (grava só o que mudou)
   Retorna true/false. Não mostra alert() — quem chama decide.
============================================================ */
async function executarSalvamento(){
    if(!authToken) return false;
    const v = autosave.versao;
    try {
        await sincronizarComBanco();   // definido em db.js
        localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
        if(autosave.versao === v) localStorage.removeItem(PEND_KEY);
        return true;
    } catch(e){
        console.error('Erro ao salvar:', e);
        autosave.ultimoErro = (e && e.message) || String(e);
        return false;
    }
}

/* ============================================================
   BOTÃO DE SALVAR (estado visual)
============================================================ */
function atualizarBotaoSalvar(){
    const btn = document.getElementById('btnSalvar');
    if(!btn) return;

    btn.classList.remove('autosave-pendente', 'autosave-salvando', 'autosave-erro');

    if(autosave.estado === 'salvando'){
        btn.textContent = '⏳ Salvando…';
        btn.classList.add('autosave-salvando');
        btn.disabled = true;
        return;
    }
    btn.disabled = false;

    if(autosave.estado === 'erro'){
        btn.textContent = 'Erro — tentar de novo';
        btn.classList.add('autosave-erro');
        return;
    }
    if(autosave.alteracoesPendentes){
        btn.textContent = 'Salvar';
        btn.classList.add('autosave-pendente');
        return;
    }
    btn.textContent = 'Salvar';
}

/* ============================================================
   SALVAMENTO MANUAL (botão)
============================================================ */
async function salvarManual(){
    if(!authToken){
        alert('Faça login como admin (Admin) antes de salvar.');
        return;
    }
    if(autosave.estado === 'salvando') return;

    if(autosave.timer){ clearTimeout(autosave.timer); autosave.timer = null; }
    if(autosave.timerRetentativa){ clearTimeout(autosave.timerRetentativa); autosave.timerRetentativa = null; }

    autosave.estado = 'salvando';
    autosave.alteracoesPendentes = true;
    atualizarBotaoSalvar();

    const ok = await executarSalvamento();

    if(ok){
        autosave.estado = 'salvo';
        autosave.alteracoesPendentes = false;
        autosave.ultimoErro = null;
        atualizarBotaoSalvar();
        setTimeout(() => atualizarBotaoSalvar(), 2000);
    } else {
        autosave.estado = 'erro';
        atualizarBotaoSalvar();
        alert('Erro ao salvar: ' + (autosave.ultimoErro || 'desconhecido'));
    }
}

/* ============================================================
   SALVAMENTO AO FECHAR A ABA
============================================================ */
function salvarAntesDeFechar(){
    if(!autosave.alteracoesPendentes || !authToken) return;
    try {
        salvarAntesDeFecharKeepalive();   // definido em db.js
    } catch(e){}
}