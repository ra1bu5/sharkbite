/* ============================================================
   index.js — Lógica da página de ambientes
   ============================================================ */

/* ---------- Supabase ---------- */
const SUPABASE_URL  = 'https://vaipqzmdsdanypuprxrk.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaXBxem1kc2RhbnlwdXByeHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NDA0MTAsImV4cCI6MjEwNjExNjQxMH0.r5PBsVKPDDROHaBWbLpsnaezMmsdxc97pkm5205ji-c';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/* ---------- Estado ---------- */
let ambientes = [];
let verArquivados = false;

/* ---------- Helpers ---------- */
const $ = id => document.getElementById(id);
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
}[c]));
const fmtData = s => s ? new Date(s).toLocaleDateString('pt-BR') : '';

/* ============================================================
   TEMA (claro / escuro)
   Compartilha a mesma preferência usada dentro dos ambientes
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
    const { data, error } = await sb.from('ambientes').select('*').order('id');

    if(error){
        $('lista').innerHTML = `<div class="vazio">Não foi possível carregar os ambientes: ${esc(error.message)}</div>`;
        return;
    }
    ambientes = data || [];
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
                     style="--c:${esc(a.cor || '#0f9fb0')}"
                     onclick="abrir(${a.id})"
                     onkeydown="if(event.key==='Enter') abrir(${a.id})">
            <div class="acts">
                <button title="Renomear"
                        onclick="event.stopPropagation(); renomear(${a.id})">✎</button>
                <button title="${arq ? 'Restaurar' : 'Arquivar'}"
                        onclick="event.stopPropagation(); alternarAtivo(${a.id})">${arq ? '↺' : '🗃'}</button>
            </div>
            <div class="ico">${esc(a.icone || '📋')}</div>
            <h2>${esc(a.nome)}</h2>
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

    if(!await garantirLogin()) return;

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

    if(!await garantirLogin()) return;

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
   BOOTSTRAP
============================================================ */
aplicarTema();
carregar();
