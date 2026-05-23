const express  = require('express');
const fetch    = require('node-fetch');
const path     = require('path');
const { loadLibrary, getIndex, buildContext } = require('./drive-loader');

const app  = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Startup ────────────────────────────────────────────────────────────────
loadLibrary().then(() => {
  console.log('🌿 Biblioteca pronta.');
}).catch(e => {
  console.error('Erro ao carregar biblioteca:', e.message);
});

// ── GET /api/guias ─────────────────────────────────────────────────────────
app.get('/api/guias', (_req, res) => res.json(getIndex()));

// ── POST /api/biblioteca/reload ────────────────────────────────────────────
app.post('/api/biblioteca/reload', async (_req, res) => {
  try {
    await loadLibrary({ force: true });
    res.json({ ok: true, guias: getIndex().length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/search ────────────────────────────────────────────────────────
app.get('/api/search', (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'Parâmetro q obrigatório' });
  const { search } = require('./drive-loader');
  const results = search(q.split(/\s+/).filter(Boolean), { maxChunks: 5, chunkSize: 500 });
  return res.json({ query: q, resultados: results.length, trechos: results });
});

// ── GET /api/clima ─────────────────────────────────────────────────────────
app.get('/api/clima', async (_req, res) => {
  const lat = -24.7147, lon = -53.7425;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,weathercode,windspeed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weathercode` +
    `&timezone=America%2FSao_Paulo&forecast_days=7`;
  try {
    const r    = await fetch(url);
    const data = await r.json();
    const cur  = data.current, daily = data.daily;
    const wmo  = c => c===0?'Céu limpo':c<=3?'Nublado':c<=48?'Neblina':c<=67?'Chuva':c<=82?'Chuva forte':'Tempestade';
    const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    return res.json({
      local: 'Toledo, Paraná, Brasil',
      temperatura_atual:         cur.temperature_2m,
      umidade_ar_pct:            cur.relative_humidity_2m,
      precipitacao_atual_mm:     cur.precipitation,
      condicao:                  wmo(cur.weathercode),
      vento_kmh:                 cur.windspeed_10m,
      umidade_solo_estimada_pct: Math.min(95, 40 + cur.relative_humidity_2m * 0.5 + cur.precipitation * 2),
      previsao: daily.time.slice(0,7).map((date,i) => ({
        dia:       i===0?'Hoje':dias[new Date(date+'T12:00:00').getDay()],
        max:       daily.temperature_2m_max[i],
        min:       daily.temperature_2m_min[i],
        chuva_mm:  daily.precipitation_sum[i],
        chuva_pct: daily.precipitation_probability_max[i],
        condicao:  wmo(daily.weathercode[i]),
        wmo:       daily.weathercode[i],
      })),
      contexto: 'Oeste paranaense, altitude 450m, Latossolo Vermelho, clima Cfa subtropical',
      especies_saf: ['Banana-prata','Erva-mate','Cedro-rosa','Angico-vermelho','Canafístula',
        'Jabuticaba','Mandioca','Feijão-guandu','Mamão-formosa','Ora-pro-nóbis',
        'Açafrão-da-terra','Ingá','Uvaia','Gabiroba','Capim-limão'],
      atualizado_em: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/antecipar — Gemini 2.0 Flash ────────────────────────────────
app.post('/api/antecipar', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY não configurada.' });

  const { clima } = req.body;
  if (!clima) return res.status(400).json({ error: 'Dados climáticos ausentes.' });

  const termos = ['praga','mosca-branca','tripes','pulgão','ácaro','lagarta',
    'fungo','ciclo biológico','dano','controle','temperatura','umidade','chuva','seco'];
  const contextoLibrary = buildContext(termos, { maxChunks: 10, chunkSize: 700 });
  const guias = getIndex().map(g => `${g.id} — ${g.titulo} (${g.editora}, ${g.ano})`).join('\n');

  const prompt = `Você é especialista em entomologia agrícola e manejo ecológico de agroflorestas no sul do Brasil.
Analise com base na biblioteca técnica Embrapa/Atena abaixo.

GUIAS DISPONÍVEIS:
${guias}

TRECHOS RELEVANTES DA BIBLIOTECA:
${contextoLibrary}

DADOS CLIMÁTICOS REAIS — Toledo, Paraná — ${new Date().toLocaleDateString('pt-BR')}:
${JSON.stringify(clima, null, 2)}

Antecipe pragas com maior probabilidade de surto nos próximos 7 dias, citando o guia de origem.
Responda APENAS com JSON válido, sem markdown, sem texto extra:

{
  "risco_geral": { "score": <0-100>, "nivel": "<Alto|Médio|Baixo>", "resumo": "<2-3 frases>" },
  "pragas_antecipadas": [
    {
      "nome": "<nome popular>", "nome_cientifico": "<nome científico>",
      "risco": "<Alto|Médio|Baixo>", "score": <0-100>,
      "razao_climatica": "<como estes dados climáticos específicos encaixam nas condições do guia>",
      "especies_vulneraveis": ["<espécie SAF>"],
      "janela_critica": "<quando nos próximos dias>",
      "acao_imediata": "<ação MIP dos guias>",
      "fonte": "<DOC-XXX>"
    }
  ],
  "janela_critica": { "periodo": "<período>", "razao": "<razão>", "gatilhos": ["<g1>","<g2>"] },
  "alertas_urgentes": [ {"titulo": "<t>", "descricao": "<d>"} ]
}

Liste 4 a 6 pragas.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
      }),
    });

    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      return res.status(r.status).json({ error: e?.error?.message || `HTTP ${r.status}` });
    }

    const data  = await r.json();
    const raw   = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    return res.json(JSON.parse(clean));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`🌿 Viva Verde v3 → http://localhost:${PORT}`));
