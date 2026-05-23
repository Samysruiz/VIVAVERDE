# 🌿 Viva Verde v3 — Antecipação de Pragas

Plataforma inteligente de agrofloresta com **RAG sobre biblioteca técnica Embrapa**, dados climáticos reais e IA para antecipar pragas em Toledo, Paraná.

---

## 📚 Biblioteca técnica

A biblioteca fica no **Google Drive** — sem limite de tamanho, sem travar o GitHub.
O servidor lê do Drive no startup. Sem Drive configurado, usa os arquivos locais em `guides/texts/`.

**Pasta Drive:** [Viva Verde — Biblioteca](https://drive.google.com/drive/folders/1FCfrIqG5sW4KFCO0fSuYUFSaBaMkYxoO)

| Guia | Cultura | Editora | Ano |
|------|---------|---------|-----|
| DOC-175 — Pragas do Tomateiro | Tomate | Embrapa Hortaliças | 2019 |
| DOC-176 — Pragas do Pimentão | Pimentão | Embrapa Hortaliças | 2020 |
| DOC-178 — Pragas do Morangueiro | Morango | Embrapa Hortaliças | 2020 |
| DOC-182 — Pragas da Alface | Alface | Embrapa Hortaliças | 2020 |
| DOC-187 — Pragas dos Brócolis e Couve-flor | Brócolis | Embrapa Hortaliças | 2021 |
| MANEJO — Manejo Sustentável de Pragas e Doenças | Diversas | Atena Editora | 2021 |

**Para adicionar novos guias:** extraia o texto do PDF, salve como JSON no esquema `{id, titulo, cultura, editora, ano, chars, conteudo}` e rode `npm run upload-drive`.

---

## 🏗️ Estrutura

```
viva-verde/
├── server.js                    ← Express + RAG + proxy Anthropic
├── public/index.html            ← Frontend
├── guides/
│   ├── drive-loader.js          ← Carrega do Drive (com fallback local)
│   ├── index.json               ← Metadados locais (fallback)
│   └── texts/                   ← Textos extraídos (fallback local)
│       ├── doc-175.json … manejo.json
├── scripts/
│   └── upload-to-drive.js       ← Sobe/atualiza guias no Drive
├── package.json
├── render.yaml
├── .env.example
└── .gitignore                   ← service-account.json está no .gitignore ✓
```

---

## 🚀 Deploy no Render

1. Fork este repositório
2. [render.com](https://render.com) → New Web Service → conecte o repo
3. Em **Environment Variables** adicione:

```
ANTHROPIC_API_KEY           = sk-ant-SUA_CHAVE
DRIVE_FOLDER_ID             = 1FCfrIqG5sW4KFCO0fSuYUFSaBaMkYxoO
GOOGLE_SERVICE_ACCOUNT_JSON = { ...conteúdo do JSON da Service Account... }
```

4. Deploy — pronto.

---

## 🔑 Configurar Google Drive (Service Account)

Para o servidor do Render ler sua pasta do Drive:

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto (ou use um existente)
3. Ative a **Google Drive API**
4. Vá em **IAM & Admin → Service Accounts → Create**
5. Dê um nome (ex: `viva-verde-reader`) e crie
6. Clique na Service Account → **Keys → Add Key → JSON** → baixe o arquivo
7. Compartilhe a pasta Drive com o e-mail da Service Account (ex: `viva-verde@projeto.iam.gserviceaccount.com`) com permissão de **Leitor**
8. Copie o conteúdo do JSON baixado e cole na variável `GOOGLE_SERVICE_ACCOUNT_JSON` no Render

---

## 💻 Rodar localmente

```bash
git clone https://github.com/SEU_USUARIO/viva-verde.git
cd viva-verde
npm install
cp .env.example .env        # edite com sua chave Anthropic
npm run dev                  # http://localhost:3000
```

Para usar o Drive localmente, coloque o arquivo `service-account.json` na raiz do projeto.

Para subir os guias ao Drive:
```bash
npm run upload-drive
```

---

## 📡 Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/guias` | Lista guias carregados |
| GET | `/api/clima` | Clima real de Toledo |
| GET | `/api/search?q=pulgão` | Busca na biblioteca |
| POST | `/api/antecipar` | Antecipação com RAG + IA |
| POST | `/api/biblioteca/reload` | Recarrega do Drive sem reiniciar |

---

## Licença
MIT
