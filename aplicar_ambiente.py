#!/usr/bin/env python3
"""
Gera o ambiente.html a partir do index.html ATUAL do Sharkbite.

Uso (na pasta do site, ANTES de trocar o index.html pela nova página inicial):
    python aplicar_ambiente.py            # lê ./index.html
    python aplicar_ambiente.py caminho/index.html

O index.html original não é alterado. Se algum trecho não for encontrado
exatamente uma vez, nada é gravado e o script lista o que falhou.
"""
import sys
import pathlib

origem = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'index.html')
destino = origem.with_name('ambiente.html')
html = origem.read_text(encoding='utf-8')

LINHA_AMBIENTE = r'''const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
const AMBIENTE_ID = Number(new URLSearchParams(location.search).get('id')) || 0;
const AMBIENTE_NOME_KEY = 'sharkbite_amb_nome_' + AMBIENTE_ID;'''

FUNCOES_AMBIENTE = r'''/* ---------- Ambiente atual (vem da URL: ambiente.html?id=123) ---------- */
function aplicarNomeAmbiente(nome){
    const el = document.getElementById('ambienteNome'); if(el) el.textContent = nome;
    document.title = nome + ' · Sharkbite';
}
async function carregarAmbiente(){
    try {
        const { data: row, error } = await sb.from('ambientes').select('id,nome,ativo').eq('id', AMBIENTE_ID).maybeSingle();
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
/* Os ids dos eventos são gerados aqui no front e a chave primária é global:
   começa depois do maior id de TODOS os ambientes, senão um evento novo
   poderia sobrescrever o de outro ambiente. */
async function ajustarNextIdGlobal(){
    try {
        const { data: rows, error } = await sb.from('eventos').select('id').order('id', { ascending: false }).limit(1);
        if(!error && rows && rows.length) nextId = Math.max(nextId, Number(rows[0].id) + 1);
    } catch(e){ console.warn('nextId global:', e); }
}

async function loadData(){'''

INICIO_ROTINA = r'''if(!AMBIENTE_ID){ location.replace('index.html'); return; }
    const amb = await carregarAmbiente();
    if(!amb){ location.replace('index.html'); return; }
    await loadData();
    await ajustarNextIdGlobal();'''

trocas = [
    # 1) id do ambiente na URL
    ("const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);", LINHA_AMBIENTE),
    # 2) cache local separado por ambiente (senão um ambiente leria o cache do outro)
    ("'planner_fgh'", "'planner_fgh_a' + AMBIENTE_ID"),
    ("'planner_fgh_time'", "'planner_fgh_time_a' + AMBIENTE_ID"),
    ("'planner_fgh_snap'", "'planner_fgh_snap_a' + AMBIENTE_ID"),
    ("'planner_fgh_pendente'", "'planner_fgh_pendente_a' + AMBIENTE_ID"),
    # 3) leitura: só o conteúdo do ambiente atual
    ("sb.from('eventos').select('*').order('ordem'),", "sb.from('eventos').select('*').eq('ambiente_id', AMBIENTE_ID).order('ordem'),"),
    ("sb.from('notas').select('*').order('criado_em'),", "sb.from('notas').select('*').eq('ambiente_id', AMBIENTE_ID).order('criado_em'),"),
    ("sb.from('registros_produtos').select('*'),", "sb.from('registros_produtos').select('*').eq('ambiente_id', AMBIENTE_ID),"),
    ("sb.from('reunioes_series').select('*'),", "sb.from('reunioes_series').select('*').eq('ambiente_id', AMBIENTE_ID),"),
    # 4) gravação: toda linha nova leva o ambiente_id
    ("L.eventos[e.id] = {", "L.eventos[e.id] = {\n            ambiente_id: AMBIENTE_ID,"),
    ("L.notas[n.id] = {", "L.notas[n.id] = {\n            ambiente_id: AMBIENTE_ID,"),
    ("L.registros_produtos[p.id] = {", "L.registros_produtos[p.id] = {\n            ambiente_id: AMBIENTE_ID,"),
    ("L.reunioes_series[s.id] = {", "L.reunioes_series[s.id] = {\n            ambiente_id: AMBIENTE_ID,"),
    # 5) funções novas e checagem na inicialização
    ("async function loadData(){", FUNCOES_AMBIENTE),
    ("await loadData();", INICIO_ROTINA),
    # 6) cabeçalho: nome do ambiente e volta para a lista
    ('<img class="brand-logo" src="img/logo/logo_shark.png" alt="Sharkbite">',
     '<a href="index.html" title="Voltar para os ambientes" style="display:flex"><img class="brand-logo" src="img/logo/logo_shark.png" alt="Sharkbite"></a>'),
    ('<span class="brand-name">Sharkbite</span>',
     '<div><span class="brand-name">Sharkbite</span><span class="brand-sub" id="ambienteNome"></span></div>'),
    ('<div class="appbar-actions">',
     '<div class="appbar-actions">\n            <a class="btn btn-ghost btn-ic" href="index.html" style="text-decoration:none" title="Voltar para a lista de ambientes">‹ Ambientes</a>'),
]

erros = [f"  {html.count(a)}x  {a[:70]!r}" for a, _ in trocas if html.count(a) != 1]
if erros:
    print("Nada foi gravado. Estes trechos não aparecem exatamente 1 vez no arquivo:")
    print("\n".join(erros))
    sys.exit(1)

for antigo, novo in trocas:
    html = html.replace(antigo, novo)

destino.write_text(html, encoding='utf-8')
print(f"OK: {destino} criado ({len(trocas)} ajustes aplicados).")
