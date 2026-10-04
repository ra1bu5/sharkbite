/* ============================================================
   index.js — Lógica da página de ambientes
   Depende de: config.js, state.js, auth-guard.js, helpers.js
   NÃO redefine sb / SUPABASE_URL / escapeHtml — usa os globais.
   ============================================================ */

/* ---------- Estado ---------- */
let ambientes = [];
let verArquivados = false;

/* ---------- Helpers locais ---------- */
const $ = id => document.getElementById(id);
const fmtData = s => s ? new Date(s).toLocaleDateString('pt-BR') : '';

/* ============================================================
   TEMA (claro / escuro) — mecanismo próprio desta página
   O index.css usa :root[data-theme=dark], que é independente
   do sistema de temas CSS-vars do ambiente.html.
============================================================ */
function aplicarTema(){
    const p = localStorage.getItem('sharkbite_tema');
    const escuro = p ? p === 'escuro' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = escuro ? 'dark' : 'light';
}

function alternarTema(){
    const escuro = document.documentElement.dataset.theme === 'dark';
    localStorage.setItem('sharkbite_tema', escuro ? 'claro' : 'escuro');
    aplicarTema();
}

/* ============================================================
   CARREGAR / RENDERIZAR
============================================================ */
async function carregar(){
    const { data: rows, error } = await sb.from('ambientes').select('*').order('id');

    if(error){
        $('lista').innerHTML =
            `<div class="vazio">Não foi possível carregar os ambientes: ${escapeHtml(error.message)}</div>`;
        return;
    }
    ambientes = rows || [];
    render();
}

function render(){
    const lista = ambientes.filter(a => (a.ativo !== false) !== verArquivados);

    $('btnArq').textContent = verArquivados ? 'Ver ativos' : 'Ver arquivados';

    if(!lista.length){
        $('lista').innerHTML = `<div class="vazio">${
            verArquivados
                ? 'Nenhum ambiente arquivado.'
                : 'Nenhum ambiente ainda. Crie o primeiro em "Novo ambiente".'
        }</div>`;
        return;
    }

    $('lista').innerHTML = lista.map(a => {
        const arq = a.ativo === false;
        return `<article class="card" tabindex="0"
                     style="--c:${escapeHtml(a.cor || '#0f9fb0')}"
                     onclick="abrir(${a.id})"
                     onkeydown="if(event.key==='Enter') abrir(${a.id})">
            <div class="acts">
                <button title="Renomear"
                        onclick="event.stopPropagation(); renomear(${a.id})">✎</button>
                <button title="${arq ? 'Restaurar' : 'Arquivar'}"
                        onclick="event.stopPropagation(); alternarAtivo(${a.id})">${arq ? '↺' : '🗃'}</button>
            </div>
            <div class="ico">${escapeHtml(a.icone || '📋')}</div>
            <h2>${escapeHtml(a.nome)}</h2>
            <p>Criado em ${fmtData(a.criado_em)}</p>
        </article>`;
    }).join('');
}

/* ============================================================
   NAVEGAÇÃO
============================================================ */
function abrir(id){
    location.href = 'ambiente.html?id=' + id;
}

function alternarArquivados(){
    verArquivados = !verArquivados;
    render();
}

/* ============================================================
   MODAL DE NOVO AMBIENTE
============================================================ */
function abrirModal(){
    $('nomeAmb').value = '';
    $('modal').classList.add('on');
    setTimeout(() => $('nomeAmb').focus(), 50);
}

function fecharModal(){
    $('modal').classList.remove('on');
}

async function criar(){
    const nome = $('nomeAmb').value.trim();
    if(!nome){ $('nomeAmb').focus(); return; }

    const { data, error } = await sb.from('ambientes')
        .insert({
            nome,
            cor:   $('corAmb').value,
            icone: $('icoAmb').value.trim() || '📋',
            owner_id: window.Auth.user.id
        })
        .select()
        .single();

    if(error){
        alert('Não foi possível criar o ambiente: ' + error.message);
        return;
    }

    ambientes.push(data);
    verArquivados = false;
    fecharModal();
    render();
}

/* ============================================================
   RENOMEAR
============================================================ */
async function renomear(id){
    const a = ambientes.find(x => x.id === id);
    if(!a) return;

    const nome = prompt('Novo nome do ambiente:', a.nome);
    if(nome === null || !nome.trim() || nome.trim() === a.nome) return;

    const { error } = await sb.from('ambientes')
        .update({ nome: nome.trim() })
        .eq('id', id);

    if(error){
        alert('Não foi possível renomear: ' + error.message);
        return;
    }

    a.nome = nome.trim();
    render();
}

/* ============================================================
   ARQUIVAR / RESTAURAR
============================================================ */
async function alternarAtivo(id){
    const a = ambientes.find(x => x.id === id);
    if(!a) return;

    const arquivar = a.ativo !== false;

    if(arquivar && !confirm(`Arquivar "${a.nome}"? Os dados continuam salvos e você pode restaurar depois.`)) return;

    const { error } = await sb.from('ambientes')
        .update({ ativo: !arquivar })
        .eq('id', id);

    if(error){
        alert('Não foi possível atualizar: ' + error.message);
        return;
    }

    a.ativo = !arquivar;
    render();
}

/* ============================================================
   SAIR
============================================================ */
async function sair(){
    await sb.auth.signOut();
    // O auth-guard.js já redireciona no SIGNED_OUT; o replace abaixo
    // é só um fallback caso o evento demore.
    location.replace('login.html');
}

/* ============================================================
   BOOTSTRAP
============================================================ */
(async () => {
    aplicarTema();                       // aplica o tema ANTES de tudo

    const ctx = await window.Auth.ready; // auth-guard cuida do redirect
    if (!ctx) return;                    // não logado → já está indo pro login

    /* Só revela o botão Admin se for admin de verdade */
    const btnAdm = document.getElementById('btnAdminHeader');
    if (btnAdm && !window.Auth.isAdmin) btnAdm.style.display = 'none';
    else if (btnAdm) btnAdm.style.display = '';

    await carregar();
})();
