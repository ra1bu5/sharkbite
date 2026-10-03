/* ============================================================
   modais/admin.js — Painel de Administrador (abrir/fechar/abas)
   Depende de: config.js, state.js, helpers.js, auth.js,
               admin.js, background.js, temas.js
   ============================================================ */

/* ============================================================
   ABRIR
============================================================ */
async function abrirAdmin(){
    /* Pede login se ainda não estiver logado */
    if(!authUser){
        const ok = await abrirLoginSupabase();
        if(!ok) return;
    }

    /* Preenche tudo antes de mostrar o modal */
    renderAdminListas();
    renderBgAdmin();
    renderFotoPreview();
    renderThemeAdmin();
    renderConfigAdmin();

    document.getElementById('modalAdmin').classList.add('active');

    /* Carrega listas do GitHub em background (não bloqueia o modal) */
    carregarBackgroundsSeNecessario();
    carregarUserPhotosSeNecessario();
}

/* ============================================================
   FECHAR
============================================================ */
function fecharAdmin(){
    const modal = document.getElementById('modalAdmin');
    if(!modal || !modal.classList.contains('active')) return;

    modal.classList.remove('active');

    /* Se houver pendências, força salvamento */
    if(autosave.alteracoesPendentes && authToken){
        if(autosave.timer){ clearTimeout(autosave.timer); autosave.timer = null; }
        salvarAutomatico();
    }
}

/* ============================================================
   ABAS
============================================================ */
function switchAdminTab(pane){
    /* Aba ativa */
    document.querySelectorAll('.admin-tab').forEach(b =>
        b.classList.toggle('active', b.dataset.pane === pane)
    );

    /* Painel visível */
    document.querySelectorAll('.admin-pane').forEach(p =>
        p.classList.toggle('active', p.id === 'pane-' + pane)
    );

    /* Hooks por aba */
    if(pane === 'aparencia') renderBgAdmin();
    if(pane === 'foto'){ renderFotoLista(); renderFotoPreview(); }
    if(pane === 'tema') renderThemeAdmin();
    if(pane === 'config') renderConfigAdmin();
}