/* ============================================================
   background.js — Fundo da página e foto do usuário
   Depende de: config.js, state.js, helpers.js
   ============================================================ */

/* ============================================================
   APLICAR FUNDO
============================================================ */
function aplicarBackground(){
    const bg = data.config.background || { tipo:'cor', cor:'#f4f7fa', imagem:'' };

    if(bg.tipo === 'imagem' && bg.imagem){
        document.body.style.backgroundImage    = `url('${BG_FOLDER}/${encodeURI(bg.imagem)}')`;
        document.body.style.backgroundSize     = 'cover';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundColor    = '';
    } else {
        document.body.style.backgroundImage = '';
        document.body.style.background =
            (!bg.cor || bg.cor.toLowerCase() === '#f4f7fa') ? '' : bg.cor;
    }
}

/* ============================================================
   LISTAGEM DE ARQUIVOS EM PASTAS DO GITHUB
   (leitura pública, sem token)
============================================================ */
async function listarArquivosPasta(pasta){
    const caminhos = [pasta, 'calendario/' + pasta];

    for(const p of caminhos){
        try {
            const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${p}?ref=${GITHUB_BRANCH}`;
            const r = await fetch(url);
            if(!r.ok) continue;

            const lista = await r.json();
            if(Array.isArray(lista)){
                const imgs = lista
                    .filter(f => f.type === 'file' && /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(f.name))
                    .map(f => f.name)
                    .sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric:true }));
                if(imgs.length) return imgs;
            }
        } catch(e){}
    }
    return [];
}

/* ============================================================
   BACKGROUNDS (fundo)
============================================================ */
async function carregarBackgroundsSeNecessario(){
    if(backgroundsCarregados) return;
    backgroundsCarregados = true;
    backgroundsDisponiveis = await listarArquivosPasta(BG_FOLDER);
    renderBgLista();
}

function selecionarBgImagem(nome){
    if(!data.config.background) data.config.background = { tipo:'cor', cor:'#f4f7fa', imagem:'' };
    data.config.background.tipo    = 'imagem';
    data.config.background.imagem  = nome;
    marcarAlterado();
    renderBgLista();
    renderBgPreview();
    aplicarBackground();
}

function renderBgLista(){
    const el = document.getElementById('bgLista');
    if(!el) return;

    if(!backgroundsCarregados){
        el.innerHTML = '<div class="bg-vazio">Carregando…</div>';
        return;
    }
    if(backgroundsDisponiveis.length === 0){
        el.innerHTML = '<div class="bg-vazio">Nenhuma imagem em img/background</div>';
        return;
    }

    const atual = (data.config.background && data.config.background.imagem) || '';
    el.innerHTML = backgroundsDisponiveis.map(nome => `
        <div class="bg-item ${nome === atual ? 'selected' : ''}"
             onclick="selecionarBgImagem('${escapeHtml(nome).replace(/'/g,"\\'")}')">
            <span class="bg-check"></span>
            <img src="${BG_FOLDER}/${encodeURI(nome)}" alt="${escapeHtml(nome)}" onerror="this.style.opacity=.25;">
            <div class="bg-nome">${escapeHtml(nome)}</div>
        </div>`
    ).join('');
}

function renderBgPreview(){
    const el = document.getElementById('bgPreview');
    if(!el) return;

    const bg = data.config.background || { tipo:'cor', cor:'#f4f7fa', imagem:'' };

    if(bg.tipo === 'imagem' && bg.imagem){
        el.style.background = `url('${BG_FOLDER}/${encodeURI(bg.imagem)}') center/cover no-repeat`;
        el.innerHTML = `<span class="preview-tag">${escapeHtml(bg.imagem)}</span>`;
    } else {
        el.style.background = bg.cor || '#f4f7fa';
        el.innerHTML = `<span class="preview-tag">${escapeHtml(bg.cor || '#f4f7fa')}</span>`;
    }
}

/* ---------- Trocar cor / tipo de fundo ---------- */
function trocarBgTipo(){
    const tipo = document.getElementById('bgTipoSelect').value;
    if(!data.config.background) data.config.background = { tipo:'cor', cor:'#f4f7fa', imagem:'' };
    data.config.background.tipo = tipo;
    marcarAlterado();
    renderBgAdmin();
    aplicarBackground();
}

function salvarBgCor(){
    const cor = document.getElementById('bgCor').value;
    if(!data.config.background) data.config.background = { tipo:'cor', cor:'#f4f7fa', imagem:'' };
    data.config.background.cor  = cor;
    data.config.background.tipo = 'cor';
    marcarAlterado();
    renderBgPreview();
    aplicarBackground();
}

/* Render completo do painel "Aparência" (cor / imagem / preview) */
function renderBgAdmin(){
    const bg = data.config.background || { tipo:'cor', cor:'#f4f7fa', imagem:'' };

    const sel = document.getElementById('bgTipoSelect');
    const corInput = document.getElementById('bgCor');
    const corWrap  = document.getElementById('bgCorWrap');
    const imgWrap  = document.getElementById('bgImagemWrap');

    if(sel)      sel.value = bg.tipo || 'cor';
    if(corInput) corInput.value = bg.cor || '#f4f7fa';
    if(corWrap)  corWrap.style.display = (bg.tipo === 'cor') ? '' : 'none';
    if(imgWrap)  imgWrap.style.display = (bg.tipo === 'imagem') ? '' : 'none';

    renderBgLista();
    renderBgPreview();
}

/* ============================================================
   FOTO DO USUÁRIO
============================================================ */
async function carregarUserPhotosSeNecessario(){
    if(userPhotosCarregadas) return;
    userPhotosCarregadas = true;
    userPhotosDisponiveis = await listarArquivosPasta(USER_PHOTO_FOLDER);
    renderFotoLista();
}

function selecionarUserPhoto(nome){
    data.config.userPhoto = nome;
    marcarAlterado();
    renderFotoLista();
    renderFotoPreview();
}

function resetUserPhoto(){
    data.config.userPhoto = '';
    marcarAlterado();
    renderFotoLista();
    renderFotoPreview();
}

function renderFotoLista(){
    const el = document.getElementById('fotoLista');
    if(!el) return;

    if(!userPhotosCarregadas){
        el.innerHTML = '<div class="bg-vazio">Carregando…</div>';
        return;
    }
    if(userPhotosDisponiveis.length === 0){
        el.innerHTML = '<div class="bg-vazio">Nenhuma imagem em <b>img/user-photo</b></div>';
        return;
    }

    const atual = (data.config && data.config.userPhoto) || '';
    el.innerHTML = userPhotosDisponiveis.map(nome => `
        <div class="bg-item ${nome === atual ? 'selected' : ''}"
             onclick="selecionarUserPhoto('${escapeHtml(nome).replace(/'/g,"\\'")}')"
             title="${escapeHtml(nome)}">
            <span class="bg-check"></span>
            <img src="${USER_PHOTO_FOLDER}/${encodeURI(nome)}" alt="${escapeHtml(nome)}" onerror="this.style.opacity=.25;">
            <div class="bg-nome">${escapeHtml(nome)}</div>
        </div>`
    ).join('');
}

function renderFotoPreview(){
    const el = document.getElementById('fotoPreview');
    if(!el) return;
    el.src = getUserPhotoSrc();
    el.onerror = function(){ this.src = DEFAULT_USER_PHOTO; };
}