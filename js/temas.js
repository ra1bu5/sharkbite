/* ============================================================
   temas.js — Sistema de temas (aplicar, editar, renderizar)
   Depende de: config.js, state.js, helpers.js, background.js
   ============================================================ */

/* ============================================================
   SELEÇÃO / APLICAÇÃO
============================================================ */
function getTemaAtivo(){
    const ts = data.config.temas || [];
    const pref = localStorage.getItem('sharkbite_tema');
    const id = pref || (
        window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches
            ? 'escuro'
            : data.config.temaAtivo
    );
    return ts.find(t => t.id === id)
        || ts.find(t => t.id === data.config.temaAtivo)
        || ts[0];
}

function aplicarTema(){
    const tema = getTemaAtivo();
    if(!tema) return;

    const root = document.documentElement;
    const vars = tema.vars || {};
    for(const [key, value] of Object.entries(vars)){
        root.style.setProperty(key, value);
    }

    aplicarBackground();   // definido em background.js

    const bt = document.getElementById('btnTema');
    if(bt) bt.innerHTML = ic(tema.id === 'escuro' ? 'sun' : 'moon');
}

/* ============================================================
   SELEÇÃO / DUPLICAÇÃO / EXCLUSÃO
============================================================ */
function selecionarTema(id){
    data.config.temaAtivo = id;
    localStorage.setItem('sharkbite_tema', id);
    marcarAlterado();
    aplicarTema();
    renderThemeAdmin();
    render();
}

function duplicarTemaAtivo(){
    const atual = getTemaAtivo();
    if(!atual) return;

    const nome = prompt('Nome do novo tema:', atual.nome + ' (cópia)');
    if(!nome) return;

    const novo = {
        id: 'tema-' + Date.now(),
        nome: nome.trim(),
        builtIn: false,
        vars: JSON.parse(JSON.stringify(atual.vars))
    };
    data.config.temas.push(novo);
    data.config.temaAtivo = novo.id;
    marcarAlterado();
    aplicarTema();
    renderThemeAdmin();
    render();
}

function excluirTemaAtivo(){
    const atual = getTemaAtivo();
    if(!atual) return;

    if(atual.builtIn){
        alert('Temas predefinidos não podem ser excluídos.');
        return;
    }
    if(!confirm(`Excluir o tema "${atual.nome}"?`)) return;

    data.config.temas = data.config.temas.filter(t => t.id !== atual.id);
    data.config.temaAtivo = 'claro';
    marcarAlterado();
    aplicarTema();
    renderThemeAdmin();
    render();
}

function resetarTemaAtivo(){
    const a = getTemaAtivo();
    if(!a) return;
    if(!confirm(`Restaurar o tema "${a.nome}" ao padrão?`)) return;

    a.vars = JSON.parse(JSON.stringify(
        a.id === 'escuro' ? THEME_VARS_ESCURO : THEME_VARS_SHARKBITE
    ));
    marcarAlterado();
    aplicarTema();
    renderThemeAdmin();
    render();
}

function renomearTemaAtivo(nome){
    const atual = getTemaAtivo();
    if(!atual) return;
    nome = (nome || '').trim();
    if(!nome) return;
    atual.nome = nome;
    marcarAlterado();
    renderThemeAdmin();
}

/* ============================================================
   EDIÇÃO DE VARIÁVEIS DE TEMA
============================================================ */
function editarVarTema(key, value){
    const atual = getTemaAtivo();
    if(!atual) return;
    atual.vars[key] = value;
    marcarAlterado();
    aplicarTema();
    render();
}

/* ============================================================
   RENDER DO PAINEL DE TEMAS (dentro do Admin)
============================================================ */
function renderThemeAdmin(){
    const grid = document.getElementById('themePresetsGrid');
    if(!grid) return;

    const ativo = data.config.temaAtivo;

    /* ---------- Cards de preset ---------- */
    grid.innerHTML = (data.config.temas || []).map(t => {
        const preview = t.vars['--bg-container'] || '#fff';
        const corH1   = t.vars['--text-heading'] || '#000';
        const fontH1  = t.vars['--font-heading'] || 'sans-serif';
        return `<div class="theme-preset-card ${t.id === ativo ? 'selected' : ''}" onclick="selecionarTema('${t.id}')">
            ${t.builtIn ? '<span class="preset-badge">Built-in</span>' : ''}
            <div class="preset-preview" style="background:${escapeHtml(preview)};color:${escapeHtml(corH1)};font-family:${escapeHtml(fontH1)};">Aa</div>
            <div class="preset-nome">${escapeHtml(t.nome)}</div>
        </div>`;
    }).join('');

    const tema = getTemaAtivo();

    /* ---------- Nome do tema ---------- */
    const nomeInput = document.getElementById('temaNomeInput');
    if(nomeInput) nomeInput.value = tema ? tema.nome : '';

    /* ---------- Botão excluir ---------- */
    const btnExcluir = document.getElementById('btnExcluirTema');
    if(btnExcluir) btnExcluir.disabled = !!(tema && tema.builtIn);

    /* ---------- Cores ---------- */
    const corGrid = document.getElementById('themeColorGrid');
    if(corGrid){
        corGrid.innerHTML = THEME_FIELDS_COLOR.map(([key, label]) => {
            const val = (tema.vars[key] || '#000').trim();
            const isHex = /^#[0-9a-f]{6}$/i.test(val);
            if(isHex){
                return `<div class="theme-field">
                    <label>${escapeHtml(label)}</label>
                    <input type="color" value="${escapeHtml(val)}" onchange="editarVarTema('${key}', this.value)">
                </div>`;
            }
            return `<div class="theme-field">
                <label>${escapeHtml(label)}</label>
                <input type="text" value="${escapeHtml(val)}" onchange="editarVarTema('${key}', this.value)" title="Valor CSS">
            </div>`;
        }).join('');
    }

    /* ---------- Tipografia ---------- */
    const fontGrid = document.getElementById('themeFontGrid');
    if(fontGrid){
        fontGrid.innerHTML = THEME_FIELDS_FONT.map(([key, label, kind]) => {
            const val = tema.vars[key] || '';

            if(kind === 'font'){
                const opts = FONT_OPTIONS.map(([nome, valor]) =>
                    `<option value="${escapeHtml(valor)}" ${valor === val ? 'selected' : ''}>${escapeHtml(nome)}</option>`
                ).join('');
                return `<div class="theme-field">
                    <label>${escapeHtml(label)}</label>
                    <select onchange="editarVarTema('${key}', this.value)">${opts}</select>
                </div>`;
            }

            if(kind === 'transform'){
                return `<div class="theme-field">
                    <label>${escapeHtml(label)}</label>
                    <select onchange="editarVarTema('${key}', this.value)">
                        <option value="none"       ${val === 'none'       ? 'selected' : ''}>Nenhum</option>
                        <option value="uppercase"  ${val === 'uppercase'  ? 'selected' : ''}>MAIÚSCULAS</option>
                        <option value="lowercase"  ${val === 'lowercase'  ? 'selected' : ''}>minúsculas</option>
                        <option value="capitalize" ${val === 'capitalize' ? 'selected' : ''}>Capitalizado</option>
                    </select>
                </div>`;
            }

            if(kind === 'number'){
                return `<div class="theme-field">
                    <label>${escapeHtml(label)}</label>
                    <input type="number" value="${escapeHtml(String(val))}" onchange="editarVarTema('${key}', this.value)">
                </div>`;
            }

            return `<div class="theme-field">
                <label>${escapeHtml(label)}</label>
                <input type="text" value="${escapeHtml(String(val))}" onchange="editarVarTema('${key}', this.value)">
            </div>`;
        }).join('');
    }

    /* ---------- Formas e efeitos ---------- */
    const shapeGrid = document.getElementById('themeShapeGrid');
    if(shapeGrid){
        shapeGrid.innerHTML = THEME_FIELDS_SHAPE.map(([key, label]) => {
            const val = tema.vars[key] || '';
            return `<div class="theme-field">
                <label>${escapeHtml(label)}</label>
                <input type="text" value="${escapeHtml(String(val))}" onchange="editarVarTema('${key}', this.value)">
            </div>`;
        }).join('');
    }
}