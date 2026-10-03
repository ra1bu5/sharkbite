/* ============================================================
   botoes.js — Ações de botão (tema, novo, tamanho)
   Depende de: config.js, state.js, helpers.js, temas.js
   ============================================================ */

/* ============================================================
   ALTERNAR TEMA (claro / escuro)
============================================================ */
function alternarTema(){
    const a = getTemaAtivo();
    localStorage.setItem('sharkbite_tema', a && a.id === 'escuro' ? 'claro' : 'escuro');
    aplicarTema();
    render();
}

/* ============================================================
   "+ NOVO" — comportamento muda conforme a view atual
============================================================ */
function novoEventoHoje(){
    if(view === 'plano'){ novaDemanda(); return; }
    if(view === 'inbox'){ novoEventoInbox(); return; }
    if(view === 'notas'){ novaNota(); return; }
    if(view === 'reunioes'){
        if(reuniaoSerieAtivaId) novaReuniaoEntrada(reuniaoSerieAtivaId);
        else novaReuniaoSerie();
        return;
    }
    /* Views de calendário (mês, semana, dia, quadro) */
    diaSelecionado = dateKeyFromDate(currentDate);
    abrirFormEvento();
}

/* ============================================================
   CONTROLE DE TAMANHO DAS VIEWS (zoom)
   Usado em Admin → Aparência
============================================================ */
const TAM_PADRAO = { mes: 90, semana: 90, dia: 100, quadro: 100, inbox: 100 };
const TAM_NOMES  = { mes: 'Mês', semana: 'Semana', dia: 'Dia', quadro: 'Quadro', inbox: 'Inbox' };

function tamanhoView(v){
    return Number((data.config.tamanhos || {})[v]) || TAM_PADRAO[v] || 100;
}

function aplicarTamanhoView(){
    /* Aplica o zoom na view ativa */
    const c = document.getElementById('viewContainer');
    if(c) c.style.zoom = tamanhoView(view) / 100;

    /* Monta os sliders do painel Admin (só uma vez) */
    const box = document.getElementById('cfgTamanhos');
    if(box && !box.firstChild){
        box.innerHTML = Object.keys(TAM_NOMES).map(k => `
            <div class="config-row">
                <div class="config-lbl">${TAM_NOMES[k]}</div>
                <input type="range" min="60" max="140" step="5" value="${tamanhoView(k)}"
                       oninput="setTamanho('${k}', this.value)" style="width:170px">
                <span class="tam-val" id="tamVal-${k}">${tamanhoView(k)}%</span>
            </div>`).join('')
            + `<div class="config-row">
                   <div class="config-lbl">Linhas por dia (Mês)</div>
                   <input type="number" min="1" max="8" value="${linhasMes()}"
                          oninput="setLinhasMes(this.value)" style="width:70px">
               </div>`
            + `<button class="btn btn-secondary" onclick="resetTamanhos()">Restaurar padrão</button>`;
    }
}

function setTamanho(k, v){
    data.config.tamanhos = data.config.tamanhos || {};
    data.config.tamanhos[k] = Number(v);

    const label = document.getElementById('tamVal-' + k);
    if(label) label.textContent = v + '%';

    if(k === view) aplicarTamanhoView();
    marcarAlterado();
}

function resetTamanhos(){
    data.config.tamanhos = {};
    const box = document.getElementById('cfgTamanhos');
    if(box) box.innerHTML = '';
    aplicarTamanhoView();
    marcarAlterado();
}