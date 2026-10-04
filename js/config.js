/* ============================================================
   config.js — Constantes, chaves, paletas e setup inicial
   Depende de: nada (é o primeiro JS carregado)
   ============================================================ */

/* ---------- Supabase ---------- */
const SUPABASE_URL  = 'https://vaipqzmdsdanypuprxrk.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaXBxem1kc2RhbnlwdXByeHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NDA0MTAsImV4cCI6MjEwNjExNjQxMH0.r5PBsVKPDDROHaBWbLpsnaezMmsdxc97pkm5205ji-c';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
const AMBIENTE_ID = Number(new URLSearchParams(location.search).get('id')) || 0;
const AMBIENTE_NOME_KEY = 'sharkbite_amb_nome_' + AMBIENTE_ID;

/* ---------- GitHub (só para listar imagens de fundo e fotos) ---------- */
const GITHUB_OWNER = 'ra1bu5';
const GITHUB_REPO  = 'sharkbite';
const GITHUB_BRANCH = 'main';

/* ---------- Chaves de cache e pastas ---------- */
const CACHE_KEY      = 'planner_fgh_a' + AMBIENTE_ID;
const CACHE_TIME_KEY = 'planner_fgh_time_a' + AMBIENTE_ID;
const VIEW_KEY       = 'planner_fgh_view';
const CACHE_DURATION = 5 * 60 * 1000;
const BG_FOLDER           = 'img/background';
const USER_PHOTO_FOLDER   = 'img/user-photo';
const DEFAULT_USER_PHOTO  = 'img/mini-me.png';

/* ---------- Datas ---------- */
const MESES = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
const MESES_CURTOS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const DIAS_SEMANA_LONGO = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
const DIAS_SEMANA_CURTO = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

/* ---------- Paleta de cores (para gerar cores automáticas) ---------- */
const PALETA = ['#2196f3','#4caf50','#f5a623','#9c27b0','#e53935','#00bcd4','#ff5722','#3f51b5','#009688','#795548','#673ab7','#8bc34a','#ff9800','#e91e63','#607d8b'];

/* ============================================================
   TEMAS PREDEFINIDOS
============================================================ */
const THEME_VARS_DEFAULT = {
    '--bg-body': '#f4f7fa', '--bg-body-image': 'none',
    '--bg-container': '#ffffff', '--bg-panel': '#f8fafc', '--bg-panel-alt': '#ffffff', '--bg-panel-dark': '#f0f4f8', '--bg-card': '#ffffff',
    '--border-color': '#e6edf5', '--border-color-strong': '#d1d8e2', '--border-style': 'solid', '--border-width': '1px',
    '--text-color': '#333', '--text-muted': '#5a7ba3', '--text-heading': '#163c6d', '--text-on-primary': '#ffffff',
    '--primary': '#163c6d', '--primary-hover': '#0e2b4f',
    '--secondary': '#2b6ca3', '--secondary-hover': '#1f5280',
    '--success': '#1a9c4a', '--success-hover': '#13803b',
    '--danger': '#dc3545', '--danger-hover': '#a71d2a',
    '--admin-bg': '#7a4b00', '--admin-hover': '#5d3900',
    '--filter-bg': '#fff7e6', '--filter-border': '#f5d99b', '--filter-text': '#7a4b00',
    '--cal-head-bg': '#163c6d', '--cal-head-weekend': '#1f4d85', '--cal-head-text': '#ffffff',
    '--cal-cell-bg': '#ffffff', '--cal-cell-hover': '#f8fbff', '--cal-cell-other': '#f8fafc',
    '--day-badge-bg': '#163c6d', '--day-badge-text': '#ffffff',
    '--day-number-color': '#163c6d', '--day-number-weekend': '#2b6ca3', '--day-number-other': '#c5cdd6',
    '--day-header-bg': '#163c6d', '--day-header-text': '#ffffff',
    '--day-strip-bg': '#ffffff', '--day-strip-bg-active': '#163c6d',
    '--day-strip-text': '#163c6d', '--day-strip-text-active': '#ffffff',
    '--day-strip-hoje-bg': '#f5a623', '--day-strip-hoje-text': '#ffffff',
    '--toolbar-bg': '#f8fafc', '--toolbar-border': '#e6edf5',
    '--modal-bg': '#ffffff', '--modal-overlay': 'rgba(22,60,109,.55)', '--modal-border': 'none',
    '--font-body': "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    '--font-heading': "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    '--font-mono': "'Courier New', monospace",
    '--font-size-base': '15px', '--font-size-h1': '40px',
    '--font-weight-h1': '900', '--letter-spacing-h1': '1px', '--transform-h1': 'uppercase',
    '--btn-font-family': "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    '--btn-font-size': '13px', '--btn-text-transform': 'none', '--btn-letter-spacing': '0',
    '--radius': '8px', '--radius-sm': '4px', '--radius-lg': '12px', '--btn-radius': '6px',
    '--shadow': '0 4px 16px rgba(22,60,109,.08)', '--btn-shadow': 'none', '--text-shadow-h1': 'none',
    '--btn-border-style': 'none', '--btn-border-width': '0px', '--btn-border-color': 'transparent',
};

const THEME_VARS_SHARKBITE = Object.assign({}, THEME_VARS_DEFAULT, {
    '--bg-body': '#eaf0f6', '--bg-panel': '#f5f8fb', '--bg-panel-dark': '#e8eef5',
    '--border-color': '#e1e8f0', '--border-color-strong': '#c9d4e0',
    '--text-color': '#1f2d3d', '--text-muted': '#64788f', '--text-heading': '#0b2a4a',
    '--primary': '#0b2a4a', '--primary-hover': '#123c66', '--secondary': '#0f9fb0', '--secondary-hover': '#0b8494',
    '--success': '#12946f', '--success-hover': '#0d7a5b', '--danger': '#d64545', '--danger-hover': '#b03030',
    '--admin-bg': '#475569', '--admin-hover': '#334155',
    '--filter-bg': '#f5f8fb', '--filter-border': '#dbe5ef', '--filter-text': '#35506e',
    '--cal-head-bg': '#0b2a4a', '--cal-head-weekend': '#123c66', '--cal-cell-hover': '#f3f9fb', '--cal-cell-other': '#f5f8fb',
    '--day-badge-bg': '#0f9fb0', '--day-number-color': '#0b2a4a', '--day-number-weekend': '#0f9fb0',
    '--day-header-bg': '#0b2a4a', '--day-strip-bg-active': '#0b2a4a', '--day-strip-text': '#0b2a4a', '--day-strip-hoje-bg': '#0f9fb0',
    '--toolbar-bg': '#f5f8fb', '--modal-overlay': 'rgba(11,42,74,.55)',
    '--bg-hover': '#eef3f8', '--bg-selected': '#dfe9f2',
    '--font-body': "'Inter', 'Segoe UI', Tahoma, sans-serif", '--font-heading': "'Inter', 'Segoe UI', Tahoma, sans-serif",
    '--btn-font-family': "'Inter', 'Segoe UI', Tahoma, sans-serif", '--font-weight-h1': '800', '--letter-spacing-h1': '.5px',
    '--radius': '10px', '--radius-lg': '16px', '--btn-radius': '8px', '--shadow': '0 8px 30px rgba(11,42,74,.10)'
});

const THEME_VARS_ESCURO = Object.assign({}, THEME_VARS_SHARKBITE, {
    '--bg-body': '#0b1220', '--bg-container': '#111b2e', '--bg-panel': '#16233a', '--bg-panel-alt': '#1b2a44', '--bg-panel-dark': '#22334f', '--bg-card': '#16233a',
    '--border-color': '#25344f', '--border-color-strong': '#33476a',
    '--text-color': '#dbe4f0', '--text-muted': '#8fa3bf', '--text-heading': '#e8f0fb',
    '--primary': '#16365c', '--primary-hover': '#1f4a7c', '--secondary': '#19b5c7', '--secondary-hover': '#14a0b0',
    '--success': '#1aa683', '--success-hover': '#13886b', '--danger': '#e05a5a', '--danger-hover': '#c04444',
    '--admin-bg': '#334155', '--admin-hover': '#475569',
    '--filter-bg': '#16233a', '--filter-border': '#25344f', '--filter-text': '#9db4d1',
    '--cal-head-bg': '#16365c', '--cal-head-weekend': '#1a4272', '--cal-cell-bg': '#111b2e', '--cal-cell-hover': '#16233a', '--cal-cell-other': '#0e1626',
    '--day-badge-bg': '#19b5c7', '--day-number-color': '#dbe4f0', '--day-number-weekend': '#19b5c7', '--day-number-other': '#3a4b66',
    '--day-header-bg': '#16365c', '--day-strip-bg': '#16233a', '--day-strip-bg-active': '#1f4a7c', '--day-strip-text': '#dbe4f0', '--day-strip-hoje-bg': '#19b5c7',
    '--toolbar-bg': '#16233a', '--modal-bg': '#16233a', '--modal-overlay': 'rgba(3,8,18,.7)', '--shadow': '0 8px 30px rgba(0,0,0,.4)',
    '--bg-hover': '#1e2e48', '--bg-selected': '#27395a'
});

/* ---------- Editor de tema: campos disponíveis ---------- */
const THEME_FIELDS_COLOR = [
    ['--bg-body', 'Fundo da página'], ['--bg-container', 'Fundo do container'],
    ['--bg-panel', 'Fundo de painéis'], ['--bg-panel-alt', 'Fundo alternativo'],
    ['--border-color', 'Cor da borda'], ['--border-color-strong', 'Borda forte'],
    ['--text-color', 'Texto'], ['--text-muted', 'Texto secundário'], ['--text-heading', 'Títulos'],
    ['--primary', 'Cor primária'], ['--primary-hover', 'Primária (hover)'],
    ['--secondary', 'Cor secundária'], ['--secondary-hover', 'Secundária (hover)'],
    ['--success', 'Sucesso'], ['--success-hover', 'Sucesso (hover)'],
    ['--danger', 'Perigo'], ['--admin-bg', 'Admin'], ['--admin-hover', 'Admin (hover)'],
    ['--filter-bg', 'Fundo dos filtros'], ['--filter-border', 'Borda dos filtros'], ['--filter-text', 'Texto dos filtros'],
    ['--cal-head-bg', 'Cabeçalho do mês'], ['--cal-head-weekend', 'Cabeçalho FDS'], ['--cal-head-text', 'Texto do cabeçalho'],
    ['--cal-cell-bg', 'Célula do dia'], ['--cal-cell-hover', 'Célula (hover)'], ['--cal-cell-other', 'Célula (outro mês)'],
    ['--day-badge-bg', 'Badge de contagem'], ['--day-number-color', 'Número do dia'],
    ['--day-header-bg', 'Cabeçalho da view Dia'],
    ['--day-strip-bg', 'Strip Dia'], ['--day-strip-bg-active', 'Strip Dia (ativo)'], ['--day-strip-hoje-bg', 'Strip Dia (hoje)'],
    ['--toolbar-bg', 'Toolbar'], ['--modal-bg', 'Modal'], ['--modal-overlay', 'Overlay do modal'],
    ['--bg-hover', 'Fundo (hover)'], ['--bg-selected', 'Fundo (selecionado)']
];
const THEME_FIELDS_FONT = [
    ['--font-body', 'Fonte do corpo', 'font'],
    ['--font-heading', 'Fonte dos títulos', 'font'],
    ['--font-size-base', 'Tamanho base', 'size'],
    ['--font-size-h1', 'Tamanho H1', 'size'],
    ['--font-weight-h1', 'Peso do H1', 'number'],
    ['--letter-spacing-h1', 'Letter-spacing H1', 'size'],
    ['--transform-h1', 'Transform H1', 'transform']
];
const THEME_FIELDS_SHAPE = [
    ['--radius', 'Arredondamento', 'size'],
    ['--radius-sm', 'Arredondamento pequeno', 'size'],
    ['--radius-lg', 'Arredondamento grande', 'size'],
    ['--btn-radius', 'Arredondamento de botão', 'size'],
    ['--shadow', 'Sombra do container', 'text'],
    ['--text-shadow-h1', 'Sombra do H1', 'text']
];
const FONT_OPTIONS = [
    ['Segoe UI', "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"],
    ['Arial', 'Arial, Helvetica, sans-serif'],
    ['Georgia', 'Georgia, serif'],
    ['Courier New', "'Courier New', monospace"],
    ['Comic Sans', "'Comic Sans MS', cursive"]
];

/* ============================================================
   CONFIGURAÇÃO PADRÃO
============================================================ */
const DEFAULT_CONFIG = {
    tipos: [
        { id:'info', label:'Informativo', cor:'#4caf50' },
        { id:'prazo', label:'Prazo', cor:'#f5a623' },
        { id:'tarefa', label:'Tarefa', cor:'#2196f3' },
        { id:'comunicado', label:'Comunicado', cor:'#9c27b0' },
        { id:'feriado', label:'Feriado', cor:'#e53935' }
    ],
    status: [
        { id:'nao-iniciado', label:'Não iniciado', cor:'#9e9e9e' },
        { id:'em-andamento', label:'Em andamento', cor:'#f5a623' },
        { id:'finalizado', label:'Finalizado', cor:'#1a9c4a' }
    ],
    responsaveis: [],
    areas: [],
    setores: [],
    background: { tipo: 'cor', cor: '#f4f7fa', imagem: '' },
    notas: [],
    userPhoto: '',
    temaAtivo: 'claro',
    temas: [
        { id: 'claro', nome: 'Sharkbite Claro', builtIn: true, vars: JSON.parse(JSON.stringify(THEME_VARS_SHARKBITE)) },
        { id: 'escuro', nome: 'Sharkbite Escuro', builtIn: true, vars: JSON.parse(JSON.stringify(THEME_VARS_ESCURO)) }
    ],
    autosave: { ativo: true, debounceMs: 3000, dragImediato: true }
};

/* ============================================================
   SINCRONIZAÇÃO COM O SUPABASE
   Chaves usadas para diff/snapshot
============================================================ */
const SNAP_KEY = 'planner_fgh_snap_a' + AMBIENTE_ID;
const PEND_KEY = 'planner_fgh_pendente_a' + AMBIENTE_ID;
const STORAGE_BUCKET = 'anexos';

/* Mapeamento: front (camelCase) <-> banco (snake_case) */
const CONFIG_CHAVES = { userPhoto:'user_photo', temaAtivo:'tema_ativo', linhasMes:'linhas_mes' };
const CONFIG_CHAVES_INV = Object.fromEntries(Object.entries(CONFIG_CHAVES).map(([a,b]) => [b,a]));
const configParaBanco = k => CONFIG_CHAVES[k] || k;
const configDoBanco   = k => CONFIG_CHAVES_INV[k] || k;

/* Ordem respeita as chaves estrangeiras (pai antes do filho) */
const TABELAS = [
  'config',
  'config_ambiente',
  'registros_produtos',
  'reunioes_series',
  'plano_demandas',
  'eventos',
  'notas',
  'registros_entradas',
  'reunioes_entradas',
  'plano_acoes'
];
const pkDe = t =>
  t === 'config'          ? 'chave' :
  t === 'config_ambiente' ? ['ambiente_id','chave'] :
  'id';
