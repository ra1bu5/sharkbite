/* ============================================================
   modais/evento.js — Formulário de evento (criar / editar)
   Depende de: config.js, state.js, helpers.js, checklist.js, views/shared.js
   ============================================================ */

/* ============================================================
   TOGGLE "SEM DATA"
============================================================ */
function toggleSemData(){
    const semData = document.getElementById('formSemData').checked;
    const row = document.getElementById('formDatasRow');

    if(row){
        row.style.opacity = semData ? '.4' : '1';
        row.style.pointerEvents = semData ? 'none' : '';
    }

    if(semData){
        document.getElementById('formDataInicio').value = '';
        document.getElementById('formDataFim').value = '';
        const wrap = document.getElementById('formIsoladoWrap');
        if(wrap) wrap.style.display = 'none';
    } else {
        atualizarToggleIsolado();
    }
}

/* ============================================================
   TOGGLE "TAREFAS ISOLADAS"
============================================================ */
function atualizarToggleIsolado(){
    const semData = document.getElementById('formSemData').checked;
    const wrap = document.getElementById('formIsoladoWrap');
    if(!wrap) return;

    if(semData){ wrap.style.display = 'none'; return; }

    const inicio = document.getElementById('formDataInicio').value;
    const fim    = document.getElementById('formDataFim').value;

    if(fim && inicio && fim > inicio){
        wrap.style.display = '';
    } else {
        wrap.style.display = 'none';
        const chk = document.getElementById('formIsolado');
        if(chk) chk.checked = false;
        const du = document.getElementById('formDiasUteis');
        if(du) du.checked = false;
    }
    atualizarDiasUteisWrap();
}

function atualizarDiasUteisWrap(){
    const isolado = document.getElementById('formIsolado');
    const wrap    = document.getElementById('formDiasUteisWrap');
    if(!wrap) return;

    wrap.style.display = (isolado && isolado.checked) ? '' : 'none';
    if(!isolado || !isolado.checked){
        const du = document.getElementById('formDiasUteis');
        if(du) du.checked = false;
    }
}

/* ============================================================
   SINCRONIZAÇÃO DO FORMULÁRIO EM EDIÇÃO
   (chamada a cada input/change quando o evento já existe)
============================================================ */
function sincronizarFormularioEmEdicao(){
    const id = Number(document.getElementById('formId')?.value || 0);
    if(!id) return;   // novos só persistem ao fechar

    const ev = data.eventos.find(e => e.id === id);
    if(!ev) return;

    ev.titulo      = document.getElementById('formTitulo').value.trim();
    ev.responsavel = document.getElementById('formResponsavel').value;
    ev.area        = document.getElementById('formArea').value;

    const ed = document.getElementById('formDescricao');
    if(ed){
        const descricao = ed.textContent.trim();
        ev.descricao     = descricao;
        ev.descricaoHtml = descricao ? sanitizarHtml(ed.innerHTML).trim() : '';
    }

    ev.tipo         = document.getElementById('formTipo').value;
    ev.status       = document.getElementById('formStatus').value;
    ev.complexidade = document.getElementById('formComplexidade').value;

    checklistSincronizarDoDOM();
    ev.checklist = clonarChecklist(formChecklistDraft);

    marcarAlterado();
}

/* ============================================================
   ABRIR
============================================================ */
function abrirFormEvento(id, diaForcado){
    formVoltarDia = document.getElementById('modalDia').classList.contains('active');
    fecharModalDia();

    const ev = id ? data.eventos.find(e => e.id === id) : null;
    const semData = (diaForcado === '__inbox__')
                 || (ev && !ev.dataInicio)
                 || (!ev && diaSelecionado === '__inbox__');

    if(diaForcado && diaForcado !== '__inbox__') diaSelecionado = diaForcado;

    document.getElementById('formTituloModal').textContent = ev ? 'Editar evento' : 'Novo evento';
    document.getElementById('formId').value = ev ? ev.id : '';
    document.getElementById('formSemData').checked = !!semData;

    if(semData){
        document.getElementById('formDataInicio').value = '';
        document.getElementById('formDataFim').value = '';
    } else {
        const dataIni = ev
            ? ev.dataInicio
            : (diaSelecionado && diaSelecionado !== '__inbox__'
                ? diaSelecionado
                : dateKeyFromDate(new Date()));
        document.getElementById('formDataInicio').value = dataIni || '';
        document.getElementById('formDataFim').value =
            (ev && ev.dataFim && ev.dataFim !== ev.dataInicio) ? ev.dataFim : '';
    }

    document.getElementById('formTitulo').value = ev ? ev.titulo : '';

    {
        const ed = document.getElementById('formDescricao');
        ed.innerHTML = ev
            ? (ev.descricaoHtml
                ? sanitizarHtml(ev.descricaoHtml)
                : linkifyText(ev.descricao || '').replace(/\n/g, '<br>'))
            : '';
        rteBind(ed);
    }

    document.getElementById('btnExcluirForm').style.display = ev ? 'inline-block' : 'none';

    preencherSelect('formResponsavel', data.config.responsaveis.map(r => r.label), ev ? ev.responsavel : '');
    preencherSelect('formArea',        data.config.areas.map(a => a.label),          ev ? ev.area : '');

    const tipoDefault = (data.config.tipos[0] && data.config.tipos[0].id) || '';
    preencherSelect('formTipo', data.config.tipos.map(t => ({ value: t.id, label: t.label })), ev ? ev.tipo : tipoDefault);

    const statusDefault = ev ? (ev.status || '') : ((data.config.status[0] && data.config.status[0].id) || '');
    preencherSelect('formStatus', data.config.status.map(s => ({ value: s.id, label: s.label })), statusDefault);

    preencherSelect('formComplexidade',
        [{ value:'', label:'Não definida' }].concat(COMPLEXIDADES.map(c => ({ value: c.id, label: c.label }))),
        ev ? (ev.complexidade || '') : '');

    formChecklistDraft = clonarChecklist(ev ? ev.checklist : []);
    renderChecklistForm();

    const chk = document.getElementById('formIsolado');
    if(chk) chk.checked = false;
    const du = document.getElementById('formDiasUteis');
    if(du) du.checked = false;

    toggleSemData();
    atualizarToggleIsolado();

    formSecEventKey = ev ? 'ev_' + ev.id : '__novo__';
    secoesAplicar();

    document.getElementById('modalForm').classList.add('active');
    checklistAjustarTodos();
    setTimeout(() => document.getElementById('formTitulo').focus(), 100);
}

/* ============================================================
   PERSISTIR
============================================================ */
function persistirFormulario(){
    const semData      = document.getElementById('formSemData').checked;
    const dataInicio   = semData ? '' : document.getElementById('formDataInicio').value;
    const dataFimRaw   = semData ? '' : document.getElementById('formDataFim').value;
    const titulo       = document.getElementById('formTitulo').value.trim();
    const responsavel  = document.getElementById('formResponsavel').value;
    const area         = document.getElementById('formArea').value;

    const _ed = document.getElementById('formDescricao');
    const descricao     = _ed.textContent.trim();
    const descricaoHtml = descricao ? sanitizarHtml(_ed.innerHTML).trim() : '';

    const tipo         = document.getElementById('formTipo').value;
    const status       = document.getElementById('formStatus').value;
    const complexidade = document.getElementById('formComplexidade').value;
    const id           = document.getElementById('formId').value;

    const isolado   = document.getElementById('formIsolado').checked;
    const diasUteis = isolado
        && document.getElementById('formDiasUteis')
        && document.getElementById('formDiasUteis').checked;

    checklistSincronizarDoDOM();
    const checklist = clonarChecklist(formChecklistDraft);

    if(!titulo){ alert('Informe o título.'); return false; }
    if(!semData && !dataInicio){ alert('Informe a data de início ou marque "Sem data definida".'); return false; }
    if(!semData && dataFimRaw && dataFimRaw < dataInicio){
        alert('A data de término não pode ser anterior à data de início.');
        return false;
    }

    const dataFim = (!semData && dataFimRaw && dataFimRaw >= dataInicio) ? dataFimRaw : dataInicio;
    const isMulti = !semData && dataFim > dataInicio;

    /* Cria eventos isolados (um por dia) */
    function criarIsolados(){
        const N = daysBetween(dataInicio, dataFim) + 1;
        for(let i = 0; i < N; i++){
            const d = addDays(dataInicio, i);
            if(diasUteis){
                const dow = parseDateKey(d).getDay();   // 0=dom, 6=sáb
                if(dow === 0 || dow === 6) continue;
            }
            data.eventos.push({
                id: nextId++,
                dataInicio: d, dataFim: d,
                titulo, responsavel, area, descricao, descricaoHtml, tipo, status, complexidade,
                checklist: clonarChecklist(checklist),
                ordem: nextId * 10
            });
        }
    }

    if(id){
        const ev = data.eventos.find(e => e.id === Number(id));
        if(ev){
            if(isolado && isMulti){
                data.eventos = data.eventos.filter(e => e.id !== Number(id));
                criarIsolados();
            } else {
                ev.dataInicio = semData ? '' : dataInicio;
                ev.dataFim    = semData ? '' : dataFim;
                ev.titulo = titulo;
                ev.responsavel = responsavel;
                ev.area = area;
                ev.descricao = descricao;
                ev.descricaoHtml = descricaoHtml;
                ev.complexidade = complexidade;
                ev.tipo = tipo;
                ev.status = status;
                ev.checklist = clonarChecklist(checklist);
            }
        }
    } else {
        if(isolado && isMulti){
            criarIsolados();
        } else {
            data.eventos.push({
                id: nextId++,
                dataInicio: semData ? '' : dataInicio,
                dataFim:    semData ? '' : dataFim,
                titulo, responsavel, area, descricao, descricaoHtml, tipo, status, complexidade,
                checklist: clonarChecklist(checklist),
                ordem: nextId * 10
            });
        }
        mostrarToast('Evento criado');
    }

    marcarAlterado({ imediato: true });

    if(semData){
        diaSelecionado = null;
        setView('inbox');
    } else {
        diaSelecionado = dataInicio;
        render();
        if(formVoltarDia) abrirModalDia(dataInicio);
    }
    return true;
}

/* ============================================================
   SALVAR / FECHAR
============================================================ */
function salvarEvento(){
    if(persistirFormulario()) fecharForm({ salvar:false });
}

function fecharForm(opcoes){
    opcoes = opcoes || {};
    const salvar = opcoes.salvar !== false;

    const modal = document.getElementById('modalForm');
    if(!modal || !modal.classList.contains('active')) return;

    if(salvar){
        const tituloEl = document.getElementById('formTitulo');
        const titulo = tituloEl ? tituloEl.value.trim() : '';

        if(!titulo){
            if(!confirm('Tarefa sem título, prosseguir?\nA tarefa não será salva.')) return;
            modal.classList.remove('active');
            return;
        }
        if(!persistirFormulario()) return;
    }
    modal.classList.remove('active');
}

/* ============================================================
   DUPLICAR
============================================================ */
function duplicarEvento(id){
    const ev = data.eventos.find(e => e.id === id);
    if(!ev) return;

    const novo = JSON.parse(JSON.stringify(ev));
    novo.id = nextId++;
    novo.ordem = nextId * 10;
    novo.titulo = ev.titulo + ' (cópia)';
    data.eventos.push(novo);

    marcarAlterado();
    render();
    renderListaDia();
}

/* ============================================================
   EXCLUIR
============================================================ */
function excluirEvento(id){
    if(!confirm('Excluir este evento?')) return;
    data.eventos = data.eventos.filter(e => e.id !== id);
    marcarAlterado();
    renderListaDia();
    render();
}

function excluirEventoForm(){
    const id = Number(document.getElementById('formId').value);
    if(!id) return;
    if(!confirm('Excluir este evento?')) return;

    data.eventos = data.eventos.filter(e => e.id !== id);
    marcarAlterado({ imediato: true });
    fecharForm({ salvar:false });

    if(document.getElementById('modalDia').classList.contains('active')) renderListaDia();
    render();
}