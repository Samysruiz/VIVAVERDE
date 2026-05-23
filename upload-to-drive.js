/**
 * VIVA VERDE — Upload de biblioteca para o Google Drive
 * ─────────────────────────────────────────────────────
 * Coloque PDFs em  scripts/pdfs/
 * Execute:  node scripts/upload-to-drive.js
 *
 * O script:
 *  1. Detecta todos os PDFs na pasta scripts/pdfs/
 *  2. Extrai o texto com pdftotext (poppler-utils)
 *  3. Sobe os JSONs na pasta Drive "Viva Verde — Biblioteca"
 *  4. Atualiza o index.json no Drive
 *
 * Credenciais (escolha uma opção):
 *  A. Arquivo service-account.json na raiz do projeto
 *  B. Variável GOOGLE_SERVICE_ACCOUNT_JSON no .env
 *
 * Como obter credenciais:
 *  1. console.cloud.google.com → Criar projeto
 *  2. APIs → Ativar Google Drive API
 *  3. IAM → Service Accounts → Criar → baixar JSON
 *  4. Compartilhar a pasta Drive com o e-mail da Service Account
 */

require('dotenv').config();
const fs      = require('fs');
const path    = require('path');
const { execSync, spawnSync } = require('child_process');
const { google } = require('googleapis');
const { Readable } = require('stream');

const FOLDER_ID = process.env.DRIVE_FOLDER_ID || '1FCfrIqG5sW4KFCO0fSuYUFSaBaMkYxoO';
const PDFS_DIR  = path.join(__dirname, 'pdfs');

// ── Helpers ─────────────────────────────────────────────────────────────────

function cleanText(text) {
  return text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function extractTextFromPdf(pdfPath) {
  // Tenta pdftotext (poppler-utils — instala com: brew install poppler / apt install poppler-utils)
  const r = spawnSync('pdftotext', [pdfPath, '-'], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  if (r.status === 0 && r.stdout.trim().length > 100) {
    return cleanText(r.stdout);
  }
  throw new Error(`Falha na extração. Instale poppler-utils: brew install poppler (Mac) ou apt install poppler-utils (Linux)`);
}

function guessMetadata(filename) {
  const base = path.basename(filename, '.pdf');
  // Tenta detectar ID do tipo DOC-175, DOC-182 etc.
  const m = base.match(/DOC[- _]?(\d+)/i);
  const id = m ? `DOC-${m[1]}` : base.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase().slice(0, 20);
  return {
    id,
    titulo: base.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    cultura: 'diversas',
    editora: 'Embrapa / Desconhecido',
    ano: new Date().getFullYear(),
  };
}

// ── Drive Auth ───────────────────────────────────────────────────────────────

function getAuth() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    return new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/drive'] });
  }
  const keyFile = path.join(__dirname, '..', 'service-account.json');
  if (fs.existsSync(keyFile)) {
    return new google.auth.GoogleAuth({ keyFile, scopes: ['https://www.googleapis.com/auth/drive'] });
  }
  throw new Error(
    '\n❌ Credenciais não encontradas.\n' +
    '   Opção A: Coloque service-account.json na raiz do projeto\n' +
    '   Opção B: Configure GOOGLE_SERVICE_ACCOUNT_JSON no .env\n' +
    '   Veja README.md → "Configurar Google Drive"\n'
  );
}

// ── Drive Upload ─────────────────────────────────────────────────────────────

async function findExisting(drive, name) {
  const res = await drive.files.list({
    q: `name='${name.replace(/'/g,"\\'")}' and '${FOLDER_ID}' in parents and trashed=false`,
    fields: 'files(id,name)',
  });
  return res.data.files[0] || null;
}

async function upsertFile(drive, name, content) {
  const media  = { mimeType: 'application/json', body: Readable.from([content]) };
  const existing = await findExisting(drive, name);

  if (existing) {
    await drive.files.update({ fileId: existing.id, media });
    return { id: existing.id, updated: true };
  }

  const res = await drive.files.create({
    requestBody: { name, parents: [FOLDER_ID], mimeType: 'application/json' },
    media,
    fields: 'id',
  });
  return { id: res.data.id, updated: false };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌿 Viva Verde — Upload de biblioteca para o Google Drive\n');

  // Cria pasta de PDFs se não existir
  if (!fs.existsSync(PDFS_DIR)) {
    fs.mkdirSync(PDFS_DIR, { recursive: true });
    console.log(`📁 Pasta criada: scripts/pdfs/`);
    console.log('   Coloque seus PDFs lá e rode novamente.\n');
    return;
  }

  const pdfs = fs.readdirSync(PDFS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  if (!pdfs.length) {
    console.log('⚠️  Nenhum PDF encontrado em scripts/pdfs/');
    console.log('   Coloque seus PDFs lá e rode novamente.\n');
    return;
  }

  console.log(`📄 ${pdfs.length} PDF(s) encontrado(s):\n`);
  pdfs.forEach(f => console.log(`   • ${f}`));
  console.log();

  const auth  = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  const index = [];

  for (const pdfFile of pdfs) {
    const pdfPath = path.join(PDFS_DIR, pdfFile);
    process.stdout.write(`  Processando ${pdfFile}...\n`);

    try {
      // 1. Extrai texto
      process.stdout.write(`    ├─ Extraindo texto...\n`);
      const texto = extractTextFromPdf(pdfPath);

      // 2. Detecta metadados (pode editar abaixo para personalizar)
      const meta  = guessMetadata(pdfFile);

      // 3. Monta JSON
      const doc   = { ...meta, chars: texto.length, conteudo: texto };
      const nome  = `${meta.id} — ${meta.titulo}.json`;
      const json  = JSON.stringify(doc, null, 2);

      // 4. Sobe ao Drive
      process.stdout.write(`    ├─ Subindo ao Drive (${Math.round(json.length/1024)}KB)...\n`);
      const { id, updated } = await upsertFile(drive, nome, json);

      process.stdout.write(`    └─ ${updated ? '🔄 Atualizado' : '✅ Criado'}  (${id})\n\n`);
      index.push({ ...meta, driveFileId: id, chars: texto.length });

    } catch (e) {
      process.stdout.write(`    └─ ❌ Erro: ${e.message}\n\n`);
    }
  }

  // Atualiza index.json
  if (index.length) {
    console.log('  Atualizando index.json no Drive...');
    await upsertFile(drive, 'index.json', JSON.stringify(index, null, 2));
    console.log(`\n✅ ${index.length} guia(s) disponíveis na biblioteca\n`);
    console.log(`   Drive: https://drive.google.com/drive/folders/${FOLDER_ID}\n`);
  }
}

main().catch(e => { console.error('\n' + e.message); process.exit(1); });
