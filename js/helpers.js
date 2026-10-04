/* ============================================================
   helpers.js — Funções utilitárias puras
   Depende de: config.js, state.js
   ============================================================ */

/* ---------- Datas ---------- */
function pad(n){ return String(n).padStart(2,'0'); }

function dateKey(y, m, d){
    return `${y}-${pad(m+1)}-${pad(d)}`;
}

function dateKeyFromDate(dt){
    return dateKey(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function parseDateKey(k){
    const [y, m, d] = k.split('-').map(Number);
    return new Date(y, m-1, d);
}

function fmtBR(k){
    const [y, m, d] = k.split('-');
    return `${Number(d)}/${Number(m)}/${Number(y)}`;
}

function addDays(key, n){
    const d = parseDateKey(key);
    d.setDate(d.getDate() + n);
    return dateKeyFromDate(d);
}

function daysBetween(a, b){
    return Math.round((parseDateKey(b) - parseDateKey(a)) / 86400000);
}

/* ---------- Strings ---------- */
function escapeHtml(t){
    if(t == null) return '';
    return String(t)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function slug(s){
    return String(s)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

/* Normaliza texto para busca (minúsculas, sem acentos) */
function buscaNorm(t){
    return String(t == null ? '' : t)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

/* ---------- Cores ---------- */
function hexToRgb(hex){
    const m = String(hex).match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if(!m) return { r:128, g:128, b:128 };
    return {
        r: parseInt(m[1], 16),
        g: parseInt(m[2], 16),
        b: parseInt(m[3], 16)
    };
}

function mix(a, b, t){
    return {
        r: Math.round(a.r + (b.r - a.r) * t),
        g: Math.round(a.g + (b.g - a.g) * t),
        b: Math.round(a.b + (b.b - a.b) * t)
    };
}

function rgbToHex(c){
    return '#' + [c.r, c.g, c.b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/* Gera uma cor estável a partir de um texto (mesma string → mesma cor) */
function corAutomatica(label){
    let h = 0;
    for(let i = 0; i < label.length; i++){
        h = (h * 31 + label.charCodeAt(i)) >>> 0;
    }
    return PALETA[h % PALETA.length];
}

/* Gera o estilo de badge (fundo claro + texto escuro) a partir de uma cor */
function badgeStyle(cor){
    const base = hexToRgb(cor || '#888');
    const bg  = rgbToHex(mix(base, { r:255, g:255, b:255 }, 0.82));
    const txt = rgbToHex(mix(base, { r:0,   g:0,   b:0   }, 0.35));
    return `background:${bg};color:${txt};`;
}

/* Cor de fundo do chip conforme o status (mais clara que a cor original) */
function statusBg(cor){
    return rgbToHex(mix(hexToRgb(cor || '#888'), { r:255, g:255, b:255 }, .78));
}

/* ---------- Config: tipos e status ---------- */
function getTipo(id){
    return (data.config.tipos || []).find(t => t.id === id)
        || { id, label: id || 'Sem tipo', cor: '#888' };
}

function getStatus(id){
    if(!id) return null;
    return (data.config.status || []).find(s => s.id === id)
        || { id, label: id, cor: '#888' };
}

function getRespCor(label){
    const r = (data.config.responsaveis || []).find(x => x.label === label);
    return r ? r.cor : '#888';
}

function getAreaCor(label){
    const a = (data.config.areas || []).find(x => x.label === label);
    return a ? a.cor : '#888';
}

/* ---------- Foto do usuário ---------- */
function getUserPhotoSrc(){
    const f = data.config && data.config.userPhoto;
    if(f) return `${USER_PHOTO_FOLDER}/${encodeURI(f)}`;
    return DEFAULT_USER_PHOTO;
}

/* ---------- Complexidade ---------- */
const COMPLEXIDADES = [
    { id: 'baixa', label: 'Baixa', cor: '#22a06b' },
    { id: 'media', label: 'Média', cor: '#d9a300' },
    { id: 'alta',  label: 'Alta',  cor: '#f07a1a' }
];
function getComplexidade(id){
    return COMPLEXIDADES.find(c => c.id === id) || null;
}

/* ---------- Ícones (SVG inline) ---------- */
const IC = {
    edit:     '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
    copy:     '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
    x:        '<path d="M18 6L6 18M6 6l12 12"/>',
    plus:     '<path d="M12 5v14M5 12h14"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    sliders:  '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    sun:      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon:     '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>',
    link:     '<path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1"/><path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/>',
    image:    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    clip:     '<path d="M21 11l-9 9a5 5 0 01-7-7l9-9a3.5 3.5 0 015 5l-9 9a2 2 0 01-3-3l8-8"/>',
    check:    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12l3 3 5-6"/>',
    ul:       '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    marker:   '<path d="M9 11l-5 5v4h4l5-5M9 11l6-6 4 4-6 6z"/>',
    search:   '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    grip:     '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
    user:     '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
   save:     '<path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
   loader:   '<line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>',
   checkOk:  '<polyline points="20 6 9 17 4 12"/>',
   alert:    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
};

function ic(n, s){
    s = s || 16;
    return `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ''}</svg>`;
}

/* Preenche qualquer elemento com [data-ic] com o SVG correspondente */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-ic]').forEach(e => {
        e.innerHTML = ic(e.dataset.ic);
    });
});

/* ---------- Hash determinístico (para diff de snapshot) ---------- */
function hash53(str){
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for(let i = 0, ch; i < str.length; i++){
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/* ---------- Toast de feedback ---------- */
function mostrarToast(msg){
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
        'background:var(--primary);color:var(--text-on-primary);padding:12px 22px;' +
        'border-radius:24px;font-family:var(--font-body);font-weight:700;z-index:5000;' +
        'box-shadow:0 6px 20px rgba(0,0,0,.3);animation:popTubies .3s ease-out;';
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 1600);
    setTimeout(() => el.remove(), 2000);
}

/* ---------- Preencher <select> ---------- */
function preencherSelect(id, opcoes, valorAtual){
    const sel = document.getElementById(id);
    if(!sel) return;
    const normalizadas = opcoes.map(o => (typeof o === 'string' ? { value: o, label: o } : o));
    let html = '<option value="">— Nenhum —</option>';
    html += normalizadas.map(o =>
        `<option value="${escapeHtml(o.value)}" ${o.value === valorAtual ? 'selected' : ''}>${escapeHtml(o.label)}</option>`
    ).join('');
    if(valorAtual && !normalizadas.find(o => o.value === valorAtual)){
        html += `<option value="${escapeHtml(valorAtual)}" selected>${escapeHtml(valorAtual)} (removido)</option>`;
    }
    sel.innerHTML = html;
}
