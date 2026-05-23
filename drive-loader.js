/**
 * VIVA VERDE — Drive Loader
 *
 * Carrega a biblioteca de guias de duas fontes (em ordem de prioridade):
 *   1. Google Drive  → produção (Render) — lê via API usando credenciais
 *   2. Arquivos locais (guides/texts/) → desenvolvimento local (fallback)
 *
 * Cache: mantém tudo em memória após o primeiro carregamento.
 * Reload: chame loadLibrary({ force: true }) para recarregar sem reiniciar.
 */

const fs   = require('fs');
const path = require('path');

// Google APIs (opcional — só instala se DRIVE_FOLDER_ID estiver configurado)
let google;
try { ({ google } = require('googleapis')); } catch (_) { google = null; }

const FOLDER_ID  = process.env.DRIVE_FOLDER_ID || '1FCfrIqG5sW4KFCO0fSuYUFSaBaMkYxoO';
const TEXTS_DIR  = path.join(__dirname, 'guides', 'texts');
const INDEX_FILE = path.join(__dirname, 'guides', 'index.json');
let _cache = null;

// ── Auth ──────────────────────────────────────────────────────────────────────
function getDriveClient() {
  if (!google) return null;

  // Opção 1: JSON completo da Service Account em variável de ambiente (Render)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      const auth  = new google.auth.GoogleAuth({
        credentials: creds,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      });
      return google.drive({ version: 'v3', auth });
    } catch (e) {
      console.warn('[Drive] Erro ao parsear GOOGLE_SERVICE_ACCOUNT_JSON:', e.message);
    }
  }

  // Opção 2: Arquivo local service-account.json (desenvolvimento)
  const keyFile = path.join(__dirname, '..', 'service-account.json');
  if (fs.existsSync(keyFile)) {
    const auth = new google.auth.GoogleAuth({
      keyFile,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    return google.drive({ version: 'v3', auth });
  }

  return null;
}

// ── Leitura do Drive ──────────────────────────────────────────────────────────
async function loadFromDrive() {
  const drive = getDriveClient();
  if (!drive) {
    console.log('[Drive] Sem credenciais — usando biblioteca local.');
    return null;
  }

  console.log('[Drive] Carregando biblioteca do Google Drive...');

  try {
    // Lista arquivos JSON na pasta
    const res = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and mimeType='application/json' and trashed=false`,
      fields: 'files(id,name)',
      orderBy: 'name',
    });

    const files = res.data.files;
    if (!files.length) {
      console.warn('[Drive] Pasta vazia — usando biblioteca local.');
      return null;
    }

    const indexFile = files.find(f => f.name === 'index.json');
    if (!indexFile) {
      console.warn('[Drive] index.json não encontrado — usando biblioteca local.');
      return null;
    }

    // Lê o índice
    const indexRes = await drive.files.get(
      { fileId: indexFile.id, alt: 'media' },
      { responseType: 'text' }
    );
    const index = JSON.parse(indexRes.data);

    // Lê cada guia
    const guiaFiles = files.filter(f => f.name !== 'index.json');
    const docs = [];

    for (const file of guiaFiles) {
      try {
        const r = await drive.files.get(
          { fileId: file.id, alt: 'media' },
          { responseType: 'text' }
        );
        const doc = JSON.parse(r.data);
        if (doc.conteudo) {
          docs.push(doc);
          process.stdout.write(`  ✅ ${doc.id || file.name}\n`);
        }
      } catch (e) {
        console.warn(`  ⚠️  Erro ao ler ${file.name}:`, e.message);
      }
    }

    if (!docs.length) {
      console.warn('[Drive] Nenhum guia com conteúdo — usando biblioteca local.');
      return null;
    }

    console.log(`[Drive] ${docs.length} guias carregados do Drive (${docs.reduce((a,d)=>a+d.chars,0).toLocaleString()} chars)\n`);
    return { index, docs };

  } catch (e) {
    console.warn('[Drive] Erro de conexão:', e.message, '— usando biblioteca local.');
    return null;
  }
}

// ── Leitura local (fallback) ──────────────────────────────────────────────────
function loadFromLocal() {
  const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  const docs  = index.map(meta => {
    const fp = path.join(TEXTS_DIR, path.basename(meta.arquivo || `${meta.id.toLowerCase()}.json`));
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  });
  console.log(`[Local] ${docs.length} guias carregados (${docs.reduce((a,d)=>a+d.chars,0).toLocaleString()} chars)\n`);
  return { index, docs };
}

// ── Busca de trechos (RAG) ────────────────────────────────────────────────────

/**
 * Busca trechos relevantes na biblioteca.
 * @param {string[]} termos
 * @param {object}   opts  { maxChunks=12, chunkSize=800 }
 */
function search(termos, opts = {}) {
  if (!_cache) throw new Error('Biblioteca não carregada. Chame loadLibrary() primeiro.');
  const { maxChunks = 12, chunkSize = 800 } = opts;
  const { docs } = _cache;

  const regexes = termos.map(t =>
    new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  );

  const results = [];

  for (const doc of docs) {
    const text = doc.conteudo;
    const step = Math.floor(chunkSize / 2);

    for (let i = 0; i < text.length; i += step) {
      const chunk = text.slice(i, i + chunkSize);
      const score = regexes.reduce((acc, re) => {
        const m = chunk.match(re);
        return acc + (m ? m.length : 0);
      }, 0);
      if (score > 0) {
        results.push({ score, chunk, doc: doc.id, titulo: doc.titulo });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxChunks);
}

/**
 * Formata trechos como contexto para o prompt da IA.
 */
function buildContext(termos, opts = {}) {
  const chunks = search(termos, opts);
  if (!chunks.length) return 'Nenhum trecho relevante encontrado na biblioteca.';
  return chunks.map((c, i) =>
    `[Trecho ${i + 1} — Fonte: ${c.doc} "${c.titulo}"]\n${c.chunk.trim()}`
  ).join('\n\n─────────────────────\n\n');
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Carrega a biblioteca (Drive ou local) e armazena em cache.
 * @param {{ force?: boolean }} opts
 */
async function loadLibrary(opts = {}) {
  if (_cache && !opts.force) return _cache;

  let result = await loadFromDrive();
  if (!result) result = loadFromLocal();

  _cache = result;
  return _cache;
}

function getIndex() {
  return _cache ? _cache.index : [];
}

module.exports = { loadLibrary, getIndex, search, buildContext };
