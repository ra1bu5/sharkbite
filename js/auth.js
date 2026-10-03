/* ============================================================
   auth.js — Autenticação (login, logout, validação)
   Depende de: config.js, state.js
   ============================================================ */

async function validarToken(){
    return !!authUser;
}

/* ============================================================
   LOGIN (provisório, via prompt até existir a tela de login)
============================================================ */
async function abrirLoginSupabase(){
    const email = prompt('E-mail (admin):');
    if(!email) return false;

    const senha = prompt('Senha:');
    if(!senha) return false;

    const { data, error } = await sb.auth.signInWithPassword({
        email,
        password: senha
    });

    if(error){
        alert('Login falhou: ' + error.message);
        return false;
    }

    authUser  = data.user;
    authToken = 'supabase';   // ativa os checks espalhados pelo código
    return true;
}

/* ============================================================
   LOGOUT
============================================================ */
async function logoutSupabase(){
    await sb.auth.signOut();
    authUser = null;
    authToken = '';
}

async function fazerLogout(){
    if(!confirm('Sair do modo admin?')) return;

    /* Se houver alterações pendentes, salva antes de sair */
    if(autosave.alteracoesPendentes){
        await salvarAutomatico();
    }

    await logoutSupabase();
    fecharAdmin();   // definido em modais/admin.js
}