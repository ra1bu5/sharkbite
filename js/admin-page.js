/* ============================================================
   admin-page.js — Lógica da página admin.html
   Depende de: config.js, state.js, auth-guard.js, helpers.js
   ============================================================ */
(async () => {
  const ctx = await window.Auth.ready;
  if (!ctx) return;
  document.getElementById('loading').style.display = 'none';

  if (!window.Auth.isAdmin) {
    document.getElementById('negado').style.display = '';
    return;
  }

  document.getElementById('adminWrap').style.display = '';
  document.getElementById('userTag').textContent =
    (window.Auth.profile?.nome || window.Auth.user.email) + ' · ' + window.Auth.profile.role;

  /* ---- Carrega config global (tipos/status/etc.) ---- */
  await carregarConfigGlobal();

  renderAdminListas();   // já existe em admin.js
  carregarUsuarios();
  carregarAmbientesAdmin();
})();

/* ============================================================
   CONFIG GLOBAL (tabela config)
============================================================ */
async function carregarConfigGlobal(){
  const { data: rows, error } = await sb.from('config').select('*');
  if (error) { console.error(error); return; }

  if (!data.config) data.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

  (rows || []).forEach(r => {
    data.config[configDoBanco(r.chave)] = r.valor;
  });

  ['tipos','status','responsaveis','areas','setores'].forEach(k => {
    if (!data.config[k]) data.config[k] = JSON.parse(JSON.stringify(DEFAULT_CONFIG[k] || []));
  });
}

/* Salva uma chave específica do config global */
async function salvarConfigGlobal(chave, valor){
  const { error } = await sb.from('config')
    .upsert({ chave, valor }, { onConflict: 'chave' });
  if (error) { alert('Erro ao salvar: ' + error.message); return false; }
  return true;
}

/* Intercepta as funções do admin.js que mexem em data.config.* */
// As funções addTipo(), delTipo(), editarTipoLabel(), etc. em admin.js
// já chamam marcarAlterado(), que grava no Supabase via autosave.
// Aqui a gente só precisa garantir que essas chaves vão pro lugar certo.
// Isso já é resolvido no db.js ajustado (ver seção "Ajustes").

/* ============================================================
   USUÁRIOS
============================================================ */
async function carregarUsuarios(){
  const wrap = document.getElementById('listaUsuarios');
  wrap.innerHTML = '<p style="color:var(--text-muted)">Carregando usuários…</p>';

  const { data, error } = await sb.from('profiles')
    .select('*').order('criado_em', { ascending: true });

  if (error) { wrap.innerHTML = 'Erro: ' + error.message; return; }

  if (!data.length) {
    wrap.innerHTML = '<p style="color:var(--text-muted)">Nenhum usuário ainda.</p>';
    return;
  }

  wrap.innerHTML = data.map(u => {
    const data_str = u.criado_em ? new Date(u.criado_em).toLocaleDateString('pt-BR') : '—';
    const isSelf   = u.id === window.Auth.user.id;
    const roleNow  = u.role || 'basic';

    return `<div class="user-row">
      <div>
        <div class="nome">${escapeHtml(u.nome || '—')} ${isSelf ? '<span style="color:var(--text-muted);font-weight:400;font-size:12px">(você)</span>' : ''}</div>
        <div class="email">${escapeHtml(u.email || '')}</div>
      </div>
      <div><span class="badge-role ${roleNow}">${roleNow}</span></div>
      <select data-user="${u.id}" ${isSelf ? 'disabled' : ''}>
        <option value="basic" ${roleNow === 'basic' ? 'selected' : ''}>basic</option>
        <option value="admin" ${roleNow === 'admin' ? 'selected' : ''}>admin</option>
      </select>
      <div class="criado">${data_str}</div>
    </div>`;
  }).join('');

  wrap.querySelectorAll('select[data-user]').forEach(sel => {
    sel.addEventListener('change', async () => {
      const uid = sel.dataset.user;
      const novoRole = sel.value;
      const { error } = await sb.from('profiles')
        .update({ role: novoRole }).eq('id', uid);
      if (error) { alert('Erro: ' + error.message); return; }
      carregarUsuarios();
    });
  });
}

/* ============================================================
   AMBIENTES (todos, como admin)
============================================================ */
async function carregarAmbientesAdmin(){
  const wrap = document.getElementById('listaAmbientes');
  const { data, error } = await sb.from('ambientes')
    .select('id, nome, cor, icone, ativo, owner_id, criado_em')
    .order('id');

  if (error) { wrap.innerHTML = 'Erro: ' + error.message; return; }

  if (!data.length) { wrap.innerHTML = '<p style="color:var(--text-muted)">Nenhum ambiente.</p>'; return; }

  // pega emails dos donos
  const ids = [...new Set(data.map(a => a.owner_id))];
  const { data: profs } = await sb.from('profiles').select('id, nome, email').in('id', ids);
  const profMap = Object.fromEntries((profs || []).map(p => [p.id, p]));

  wrap.innerHTML = data.map(a => {
    const dono = profMap[a.owner_id];
    return `<div class="tag-amb" style="--c:${escapeHtml(a.cor || '#0f9fb0')}">
      <span class="dot"></span>
      <a href="ambiente.html?id=${a.id}" style="text-decoration:none;color:inherit;font-weight:700">${escapeHtml(a.nome)}</a>
      <span style="color:var(--text-muted);font-size:12px">· ${escapeHtml(dono?.nome || dono?.email || '—')}</span>
      ${a.ativo === false ? '<span style="color:var(--danger);font-size:11px">arquivado</span>' : ''}
    </div>`;
  }).join('');
}

/* ============================================================
   NAVEGAÇÃO DE PAINÉIS
============================================================ */
document.querySelectorAll('.pane-nav button').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.pane-nav button').forEach(x => x.classList.toggle('active', x === b));
    document.querySelectorAll('.pane').forEach(p => p.classList.toggle('active', p.id === 'pane-' + b.dataset.pane));
  });
});

/* ============================================================
   LOGOUT
============================================================ */
async function logout(){
  await sb.auth.signOut();
  location.replace('login.html');
}
