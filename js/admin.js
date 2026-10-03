/* ============================================================
   admin.js — Listas do painel Admin e configurações
   Depende de: config.js, state.js, helpers.js, autosave.js
   ============================================================ */

/* ============================================================
   RENDER PRINCIPAL DAS LISTAS
============================================================ */
function renderAdminListas(){

    /* ---------- TIPOS ---------- */
    const lt = document.getElementById('listaTipos');
    if(lt){
        lt.innerHTML = data.config.tipos.length === 0
            ? '<div class="admin-empty">Nenhum tipo cadastrado.</div>'
            : data.config.tipos.map((t, i) => `<li>
                <div class="item-color" style="background:${escapeHtml(t.cor)}"></div>
                <input type="text" class="item-label" value="${escapeHtml(t.label)}" onchange="editarTipoLabel(${i}, this.value)">
                <input type="color" value="${escapeHtml(t.cor)}" onchange="editarTipoCor(${i}, this.value)">
                <div class="item-actions">
                    <button class="btn-mini up"   onclick="moverTipo(${i}, -1)" ${i === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn-mini down" onclick="moverTipo(${i}, 1)"  ${i === data.config.tipos.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn-mini del"  onclick="delTipo(${i})">${ic('x', 14)}</button>
                </div>
            </li>`).join('');
    }

    /* ---------- STATUS ---------- */
    const ls = document.getElementById('listaStatus');
    if(ls){
        ls.innerHTML = data.config.status.length === 0
            ? '<div class="admin-empty">Nenhum status cadastrado.</div>'
            : data.config.status.map((s, i) => `<li>
                <div class="item-color" style="background:${escapeHtml(s.cor)}"></div>
                <input type="text" class="item-label" value="${escapeHtml(s.label)}" onchange="editarStatusLabel(${i}, this.value)">
                <input type="color" value="${escapeHtml(s.cor)}" onchange="editarStatusCor(${i}, this.value)">
                <div class="item-actions">
                    <button class="btn-mini up"   onclick="moverStatus(${i}, -1)" ${i === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn-mini down" onclick="moverStatus(${i}, 1)"  ${i === data.config.status.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn-mini del"  onclick="delStatus(${i})">${ic('x', 14)}</button>
                </div>
            </li>`).join('');
    }

    /* ---------- RESPONSÁVEIS ---------- */
    const lr = document.getElementById('listaResponsaveis');
    if(lr){
        lr.innerHTML = data.config.responsaveis.length === 0
            ? '<div class="admin-empty">Nenhum responsável cadastrado.</div>'
            : data.config.responsaveis.map((r, i) => `<li>
                <span class="badge badge-resp" style="${badgeStyle(r.cor)}">@${escapeHtml(r.label)}</span>
                <input type="text" class="item-label" value="${escapeHtml(r.label)}" onchange="editarRespLabel(${i}, this.value)">
                <input type="color" value="${escapeHtml(r.cor)}" onchange="editarRespCor(${i}, this.value)">
                <div class="item-actions">
                    <button class="btn-mini up"   onclick="moverResponsavel(${i}, -1)" ${i === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn-mini down" onclick="moverResponsavel(${i}, 1)"  ${i === data.config.responsaveis.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn-mini del"  onclick="delResponsavel(${i})">${ic('x', 14)}</button>
                </div>
            </li>`).join('');
    }

    /* ---------- ÁREAS ---------- */
    const la = document.getElementById('listaAreas');
    if(la){
        la.innerHTML = data.config.areas.length === 0
            ? '<div class="admin-empty">Nenhuma área cadastrada.</div>'
            : data.config.areas.map((a, i) => `<li>
                <span class="badge badge-area" style="${badgeStyle(a.cor)}">${escapeHtml(a.label)}</span>
                <input type="text" class="item-label" value="${escapeHtml(a.label)}" onchange="editarAreaLabel(${i}, this.value)">
                <input type="color" value="${escapeHtml(a.cor)}" onchange="editarAreaCor(${i}, this.value)">
                <div class="item-actions">
                    <button class="btn-mini up"   onclick="moverArea(${i}, -1)" ${i === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn-mini down" onclick="moverArea(${i}, 1)"  ${i === data.config.areas.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn-mini del"  onclick="delArea(${i})">${ic('x', 14)}</button>
                </div>
            </li>`).join('');
    }

    /* ---------- SETORES ---------- */
    const lsSetores = document.getElementById('listaSetores');
    if(lsSetores){
        lsSetores.innerHTML = data.config.setores.length === 0
            ? '<div class="admin-empty">Nenhum setor cadastrado.</div>'
            : data.config.setores.map((s, i) => `<li>
                <span class="badge" style="${badgeStyle(s.cor)}">${escapeHtml(s.label)}</span>
                <input type="text" class="item-label" value="${escapeHtml(s.label)}" onchange="editarSetorLabel(${i}, this.value)">
                <input type="color" value="${escapeHtml(s.cor)}" onchange="editarSetorCor(${i}, this.value)">
                <div class="item-actions">
                    <button class="btn-mini up"   onclick="moverSetor(${i}, -1)" ${i === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn-mini down" onclick="moverSetor(${i}, 1)"  ${i === data.config.setores.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn-mini del"  onclick="delSetor(${i})">${ic('x', 14)}</button>
                </div>
            </li>`).join('');
    }
}

/* ============================================================
   TIPOS
============================================================ */
function addTipo(){
    const label = document.getElementById('novoTipoLabel').value.trim();
    const cor   = document.getElementById('novoTipoCor').value;
    if(!label){ alert('Informe o nome.'); return; }

    let id = slug(label) || ('tipo-' + Date.now());
    if(data.config.tipos.find(t => t.id === id)) id = id + '-' + Date.now();

    data.config.tipos.push({ id, label, cor });
    document.getElementById('novoTipoLabel').value = '';

    marcarAlterado();
    renderAdminListas();
    renderLegend();
    popularFiltros();
    render();
}
function editarTipoLabel(i, v){ data.config.tipos[i].label = v.trim() || data.config.tipos[i].label; marcarAlterado(); renderLegend(); popularFiltros(); render(); }
function editarTipoCor(i, v){   data.config.tipos[i].cor = v;  marcarAlterado(); renderAdminListas(); renderLegend(); render(); }
function delTipo(i){
    const t = data.config.tipos[i];
    if(!confirm(`Remover "${t.label}"?`)) return;
    data.config.tipos.splice(i, 1);
    marcarAlterado();
    renderAdminListas();
    renderLegend();
    popularFiltros();
    render();
}
function moverTipo(i, d){ moverItem(data.config.tipos, i, d, renderAdminListas); }

/* ============================================================
   STATUS
============================================================ */
function addStatus(){
    const label = document.getElementById('novoStatusLabel').value.trim();
    const cor   = document.getElementById('novoStatusCor').value;
    if(!label){ alert('Informe o nome.'); return; }

    let id = slug(label) || ('status-' + Date.now());
    if(data.config.status.find(s => s.id === id)) id = id + '-' + Date.now();

    data.config.status.push({ id, label, cor });
    document.getElementById('novoStatusLabel').value = '';

    marcarAlterado();
    renderAdminListas();
    popularFiltros();
    render();
}
function editarStatusLabel(i, v){ data.config.status[i].label = v.trim() || data.config.status[i].label; marcarAlterado(); popularFiltros(); render(); }
function editarStatusCor(i, v){   data.config.status[i].cor = v;  marcarAlterado(); renderAdminListas(); render(); }
function delStatus(i){
    const s = data.config.status[i];
    if(!confirm(`Remover "${s.label}"?`)) return;
    data.config.status.splice(i, 1);
    marcarAlterado();
    renderAdminListas();
    popularFiltros();
    render();
}
function moverStatus(i, d){ moverItem(data.config.status, i, d, renderAdminListas); }

/* ============================================================
   RESPONSÁVEIS
============================================================ */
function addResponsavel(){
    const v = document.getElementById('novoResponsavel').value.trim();
    if(!v) return;
    if(data.config.responsaveis.find(r => r.label === v)){ alert('Já cadastrado.'); return; }

    data.config.responsaveis.push({ label: v, cor: corAutomatica(v) });
    document.getElementById('novoResponsavel').value = '';

    marcarAlterado();
    renderAdminListas();
    popularFiltros();
}
function delResponsavel(i){
    if(!confirm('Remover?')) return;
    data.config.responsaveis.splice(i, 1);
    marcarAlterado();
    renderAdminListas();
    popularFiltros();
    render();
}
function editarRespLabel(i, v){
    v = v.trim();
    if(!v){ renderAdminListas(); return; }
    data.config.responsaveis[i].label = v;
    marcarAlterado();
    renderAdminListas();
    popularFiltros();
    render();
}
function editarRespCor(i, v){ data.config.responsaveis[i].cor = v; marcarAlterado(); renderAdminListas(); render(); }
function moverResponsavel(i, d){ moverItem(data.config.responsaveis, i, d, renderAdminListas); }

/* ============================================================
   SETORES
============================================================ */
function addSetor(){
    const input = document.getElementById('novoSetor');
    const v = input.value.trim();
    if(!v) return;
    if(data.config.setores.find(s => s.label.toLowerCase() === v.toLowerCase())){
        alert('Já cadastrado.');
        return;
    }
    data.config.setores.push({ label: v, cor: corAutomatica(v) });
    input.value = '';
    marcarAlterado();
    renderAdminListas();
}
function delSetor(i){
    if(!confirm('Remover este setor?')) return;
    data.config.setores.splice(i, 1);
    marcarAlterado();
    renderAdminListas();
    render();
}
function editarSetorLabel(i, v){
    v = v.trim();
    if(!v){ renderAdminListas(); return; }
    data.config.setores[i].label = v;
    marcarAlterado();
    renderAdminListas();
    render();
}
function editarSetorCor(i, v){ data.config.setores[i].cor = v; marcarAlterado(); renderAdminListas(); }
function moverSetor(i, d){ moverItem(data.config.setores, i, d, renderAdminListas); }

/* ============================================================
   ÁREAS
============================================================ */
function addArea(){
    const v = document.getElementById('novaArea').value.trim();
    if(!v) return;
    if(data.config.areas.find(a => a.label === v)){ alert('Já cadastrada.'); return; }
    data.config.areas.push({ label: v, cor: corAutomatica(v) });
    document.getElementById('novaArea').value = '';
    marcarAlterado();
    renderAdminListas();
    popularFiltros();
}
function delArea(i){
    if(!confirm('Remover?')) return;
    data.config.areas.splice(i, 1);
    marcarAlterado();
    renderAdminListas();
    popularFiltros();
    render();
}
function editarAreaLabel(i, v){
    v = v.trim();
    if(!v){ renderAdminListas(); return; }
    data.config.areas[i].label = v;
    marcarAlterado();
    renderAdminListas();
    popularFiltros();
    render();
}
function editarAreaCor(i, v){ data.config.areas[i].cor = v; marcarAlterado(); renderAdminListas(); render(); }
function moverArea(i, d){ moverItem(data.config.areas, i, d, renderAdminListas); }

/* ============================================================
   MOVER ITEM (↑ / ↓ nas listas)
============================================================ */
function moverItem(lista, i, dir, rerender){
    const j = i + dir;
    if(j < 0 || j >= lista.length) return;
    const tmp = lista[i]; lista[i] = lista[j]; lista[j] = tmp;
    marcarAlterado();
    if(rerender) rerender();
    popularFiltros();
    render();
}

/* ============================================================
   CONFIG (autosave) — painel Config
============================================================ */
function renderConfigAdmin(){
    const cfg = getAutosaveConfig();
    const selA = document.getElementById('cfgAutosave');
    const inD  = document.getElementById('cfgDebounce');
    const selD = document.getElementById('cfgDrag');
    if(selA) selA.value = cfg.ativo ? '1' : '0';
    if(inD)  inD.value  = Math.round(cfg.debounceMs / 1000);
    if(selD) selD.value = cfg.dragImediato ? '1' : '0';
}

function salvarConfigAutosave(){
    if(!data.config.autosave) data.config.autosave = {};
    data.config.autosave.ativo        = document.getElementById('cfgAutosave').value === '1';
    data.config.autosave.debounceMs   = Math.max(1000, Math.min(30000,
        Number(document.getElementById('cfgDebounce').value) * 1000 || 3000));
    data.config.autosave.dragImediato = document.getElementById('cfgDrag').value === '1';
    marcarAlterado();
}

async function forcarSalvamento(){
    if(!authToken){ alert('Faça login como admin primeiro.'); return; }
    autosave.alteracoesPendentes = true;
    await salvarManual();
}