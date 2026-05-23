/**
 * VIVA VERDE — Loader de Biblioteca Técnica
 *
 * Carrega os textos extraídos dos guias Embrapa/Atena em memória.
 * Em produção, faz cache no startup para não reler disco a cada request.
 *
 * Estrutura de cada documento:
 *   { id, titulo, cultura, editora, ano, chars, conteudo }
 */

const fs   = require('fs');
const path = require('path');

const TEXTS_DIR = path.join(__dirname, 'texts');
const INDEX_FILE = path.join(__dirname, 'index.json');

// Cache em memória — carregado uma vez no startup
let _cache = null;

function loadLibrary() {
  if (_cache) return _cache;

  const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  const docs  = index.map(meta => {
    const filePath = path.join(__dirname, '..', meta.arquivo);
    const doc = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return doc;
  });

  _cache = { index, docs };
  console.log(`📚 Biblioteca carregada: ${docs.length} guias, ${docs.reduce((a,d)=>a+d.chars,0).toLocaleString()} chars`);
  return _cache;
}

/**
 * Busca trechos relevantes da biblioteca para um conjunto de termos.
 * Retorna os N trechos mais relevantes por frequência de hits.
 *
 * @param {string[]} termos — palavras-chave a buscar
 * @param {object}   opts
 *   maxDocs       — máx. documentos a incluir (default 6 = todos)
 *   chunkSize     — chars por trecho (default 800)
 *   maxChunks     — máx. trechos no total (default 12)
 */
function search(termos, opts = {}) {
  const { maxDocs = 6, chunkSize = 800, maxChunks = 12 } = opts;
  const { docs } = loadLibrary();

  const regexes = termos.map(t => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'));

  const results = [];

  for (const doc of docs.slice(0, maxDocs)) {
    const text = doc.conteudo;
    const chunks = [];

    // Divide em chunks e pontua cada um
    for (let i = 0; i < text.length; i += chunkSize / 2) {
      const chunk = text.slice(i, i + chunkSize);
      const score = regexes.reduce((acc, re) => {
        const matches = chunk.match(re);
        return acc + (matches ? matches.length : 0);
      }, 0);
      if (score > 0) {
        chunks.push({ score, chunk, doc: doc.id, titulo: doc.titulo });
      }
    }

    // Top chunks deste documento
    chunks.sort((a, b) => b.score - a.score);
    results.push(...chunks.slice(0, 3));
  }

  // Ordena global e limita
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxChunks);
}

/**
 * Retorna contexto compacto pronto para incluir no prompt da IA.
 * Formata como blocos com cabeçalho de fonte.
 */
function buildContext(termos, opts = {}) {
  const chunks = search(termos, opts);
  if (!chunks.length) return 'Nenhum trecho relevante encontrado na biblioteca.';

  return chunks.map((c, i) =>
    `[Trecho ${i + 1} — Fonte: ${c.doc} "${c.titulo}"]\n${c.chunk.trim()}`
  ).join('\n\n─────────────────────\n\n');
}

module.exports = { loadLibrary, search, buildContext };
