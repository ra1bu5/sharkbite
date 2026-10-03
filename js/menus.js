/* ============================================================
   menus.js — Categorias do cabeçalho e semana útil
   Depende de: config.js, state.js
   ============================================================ */

/* ============================================================
   MODO DE SEMANA
============================================================ */
function semanaUtil(){
    return localStorage.getItem('sharkbite_semana') === 'util';
}

function setSemana(modo){
    localStorage.setItem('sharkbite_semana', modo);
    document.activeElement && document.activeElement.blur();
    setView('semana');
}

/* ============================================================
   MAPA: qual categoria cada view pertence
============================================================ */
const CATEGORIA_POR_VIEW = {
    mes:       'planejamento',
    semana:    'planejamento',
    dia:       'planejamento',
    quadro:    'planejamento',
    inbox:     'planejamento',
    notas:     'central',
    registros: 'central',
    reunioes:  'central',
    plano:     'central'
};

/* Compatibilidade: quem chamava `marcarSemana()` continua funcionando */
function marcarSemana(){
    marcarMenus();
}

/* ============================================================
   ATUALIZAR ESTADO VISUAL DOS MENUS
============================================================ */
function marcarMenus(){
    /* Modo da semana (completa / util) */
    const modo = semanaUtil() ? 'util' : 'completa';
    document.querySelectorAll('.tab-menu-box button[data-modo]').forEach(b => {
        b.classList.toggle('atual', b.dataset.modo === modo);
    });

    /* Item ativo dentro dos menus */
    document.querySelectorAll('.tab-menu-box button[data-view]').forEach(b => {
        const ehSemana = b.dataset.view === 'semana';
        const ativo = ehSemana
            ? (b.dataset.view === view && b.dataset.modo === modo)
            : (b.dataset.view === view);
        b.classList.toggle('atual', ativo);
    });

    /* Categoria pai ativa */
    const categoriaAtiva = CATEGORIA_POR_VIEW[view];
    document.querySelectorAll('.tabs > .tab-wrap').forEach(w => {
        w.classList.toggle('ativo-grupo', w.dataset.grupo === categoriaAtiva);
        const btnPai = w.querySelector(':scope > .btn-toggle');
        if(btnPai) btnPai.classList.toggle('ativo-grupo', w.dataset.grupo === categoriaAtiva);
    });
}

/* ============================================================
   NOVO EVENTO NUM DIA ESPECÍFICO
   (usado pelo "+" no cabeçalho do dia, na view Semana)
============================================================ */
function novoEventoNoDia(key){
    diaSelecionado = key;
    abrirFormEvento(null, key);
}