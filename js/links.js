/* ============================================================
   links.js — Detecção automática de URLs
   Depende de: helpers.js
   ============================================================ */

/* ============================================================
   REGEX DE DETECÇÃO
   Aceita http://, https:// e www. — evita colar em algo como
   "abc@www.x" ou "(http://x)"
============================================================ */
const URL_REGEX = /(^|[\s(>])((?:https?:\/\/|www\.)[^\s<>"')\]]+)/gi;

/* ============================================================
   ESCAPA E LINKIFICA TEXTO PURO
   Usado em descrições sem HTML rico
============================================================ */
function linkifyText(texto){
    if(!texto) return '';

    /* 1) Escapa tudo */
    const escapado = String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    /* 2) Transforma URLs em <a> */
    return escapado.replace(URL_REGEX, function(_match, prefixo, url){
        const href = url.startsWith('http') ? url : 'https://' + url;
        return prefixo + '<a href="' + href + '" target="_blank" rel="noopener">' + url + '</a>';
    });
}

/* ============================================================
   PERCORRE O DOM DO EDITOR
   Transforma URLs soltas em <a> sem mexer em links já existentes
   Roda em blur / paste.
   Retorna true se algo foi alterado.
============================================================ */
function linkifyEditorDOM(editor){
    if(!editor) return false;
    let alterou = false;

    /* Percorre nós de texto que NÃO estão em <a>, <code>, <pre>, <mark> */
    const walker = document.createTreeWalker(
        editor,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node){
                /* Ignora se estiver em tags que não devem virar link */
                let p = node.parentNode;
                while(p && p !== editor){
                    const tag = (p.nodeName || '').toLowerCase();
                    if(tag === 'a' || tag === 'code' || tag === 'pre' || tag === 'mark'){
                        return NodeFilter.FILTER_REJECT;
                    }
                    p = p.parentNode;
                }
                /* Só testa se o texto tiver URL */
                if(!/https?:\/\/|www\./i.test(node.nodeValue || '')) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    const alvos = [];
    let n;
    while((n = walker.nextNode())) alvos.push(n);

    alvos.forEach(textNode => {
        const texto = textNode.nodeValue;
        const frag  = document.createDocumentFragment();
        let ultimo = 0, m;

        URL_REGEX.lastIndex = 0;
        while((m = URL_REGEX.exec(texto)) !== null){
            const prefixo = m[1];
            const url     = m[2];
            const inicio  = m.index;
            const fim     = m.index + m[0].length;

            /* Texto antes do prefixo */
            const antes = texto.slice(ultimo, inicio + prefixo.length);
            if(antes) frag.appendChild(document.createTextNode(antes));

            /* Cria <a> */
            const a = document.createElement('a');
            a.href      = url.startsWith('http') ? url : ('https://' + url);
            a.target    = '_blank';
            a.rel       = 'noopener';
            a.textContent = url;
            frag.appendChild(a);

            ultimo = fim;
        }

        if(ultimo < texto.length){
            frag.appendChild(document.createTextNode(texto.slice(ultimo)));
        }

        if(frag.childNodes.length > 0){
            textNode.parentNode.replaceChild(frag, textNode);
            alterou = true;
        }
    });

    return alterou;
}

/* ============================================================
   ATALHO PARA O EDITOR DE NOTAS
   Roda no onblur do editor
============================================================ */
function linkificarNota(){
    const editor = document.getElementById('notaEditor');
    if(!editor) return;
    const alterou = linkifyEditorDOM(editor);
    if(alterou){
        notaOnInput();   // definido em views/notas.js
    }
}