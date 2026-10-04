/* ============================================================
   auth-guard.js — Protege páginas que exigem login
   Expõe window.Auth.ready (Promise) para quem precisar esperar
   ============================================================ */
(function(){
  window.Auth = {
    ready:   null,
    user:    null,
    profile: null,
    isAdmin: false
  };

  window.Auth.ready = (async () => {
    const { data: { session } } = await sb.auth.getSession();

    if (!session) {
      const next = encodeURIComponent(location.pathname + location.search);
      location.replace('login.html?next=' + next);
      return null;
    }

    window.Auth.user = session.user;

    const { data: profile, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error || !profile) {
      // profile ainda não existe (cadastro em andamento) — trata como basic
      window.Auth.profile = { id: session.user.id, role: 'basic', nome: session.user.email };
      window.Auth.isAdmin = false;
    } else {
      window.Auth.profile = profile;
      window.Auth.isAdmin = profile.role === 'admin';
    }

    return { user: window.Auth.user, profile: window.Auth.profile };
  })();

  // Reage a logout: manda de volta pro login
  sb.auth.onAuthStateChange((evt) => {
    if (evt === 'SIGNED_OUT') location.replace('login.html');
  });
})();
