/* ============================================================
   state.js — Estado global mutável da aplicação
   Depende de: config.js
   ============================================================ */

/* ---------- Dados principais ---------- */
let data = {
    config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
    eventos: [],
    registros: [],
    plano: []
};

let nextId = 1;
let currentDate = new Date();
let view = 'mes';
let diaSelecionado = null;

/* ---------- Autenticação ---------- */
let authUser  = null;
let authToken = '';

/* ---------- Filtros e drag ---------- */
let filtros = { tipo:'', status:'', responsavel:'', area:'', complexidade:'' };
let dragState = { eventId: null, sourceDay: null };

/* ---------- Aparência (backgrounds e fotos) ---------- */
let backgroundsDisponiveis = [];
let backgroundsCarregados = false;
let userPhotosDisponiveis = [];
let userPhotosCarregadas = false;

/* ---------- Notas ---------- */
let notaAtivaId = null;
let notaCheckTimer = null;
let notaAnexosProcessando = false;
let notaTextoSelecionado = '';

/* ---------- Registros (Change Log) ---------- */
let registroProdutoAtivoId = null;
let registroEntradaAtivaId = null;
let registroEditandoLog = false;
let registroBuscaCampo = 'titulo';
let registroBuscaTexto = '';

/* ---------- Reuniões ---------- */
let reuniaoSerieAtivaId = null;
let reuniaoEntradaAtivaId = null;
let formSecEventKey = '__novo__';

/* ---------- Plano de Ação ---------- */
let planoFiltros = { status:'', prioridade:'', porte:'', tipo:'', responsavel:'' };
let planoDemandaAtivaId = null;
let planoAcoesAbertas = new Set();

/* ---------- Editor de texto rico ---------- */
let rteUltimo = null;
let rteRange = null;
let formVoltarDia = false;
let overlayDown = false;

/* ---------- Menções (@) ---------- */
let mencaoSel = 0;
let mencaoLista = [];
let mencaoAlvo = null;

/* ---------- Menus de contexto ---------- */
let ctxOpcoes = {};
let toquePressTimer = null;

/* ============================================================
   AUTOSAVE — estado
============================================================ */
let autosave = {
    estado: 'idle',            // 'idle' | 'salvando' | 'salvo' | 'erro'
    timer: null,
    alteracoesPendentes: false,
    ultimoErro: null,
    timerRetentativa: null,
    versao: 0
};

/* ============================================================
   SINCRONIZAÇÃO — estado do snapshot
============================================================ */
let snapshot = {};
let accessToken = '';

/* Ouve mudanças de sessão do Supabase para manter o token em dia */
sb.auth.onAuthStateChange((_ev, session) => {
    accessToken = session ? session.access_token : '';
});
