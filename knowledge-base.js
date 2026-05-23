/**
 * VIVA VERDE — Base de Conhecimento de Pragas
 * Compilada a partir de:
 *
 *  DOC-175 | Guia para Identificação de Pragas do Tomateiro    — Embrapa Hortaliças, 2019
 *  DOC-176 | Guia para Identificação de Pragas do Pimentão     — Embrapa Hortaliças, 2020
 *  DOC-178 | Guia para Identificação de Pragas do Morangueiro  — Embrapa Hortaliças, 2020
 *  DOC-182 | Guia para Identificação de Pragas da Alface       — Embrapa Hortaliças, 2020
 *  DOC-187 | Guia para Identificação de Pragas dos Brócolis e da Couve-flor — Embrapa, 2021
 *  Manejo Sustentável de Pragas e Doenças Agrícolas            — Atena Editora, 2021
 */

const GUIAS = [
  { id: 'DOC-175', titulo: 'Pragas do Tomateiro',              editora: 'Embrapa Hortaliças', ano: 2019 },
  { id: 'DOC-176', titulo: 'Pragas do Pimentão',               editora: 'Embrapa Hortaliças', ano: 2020 },
  { id: 'DOC-178', titulo: 'Pragas do Morangueiro',            editora: 'Embrapa Hortaliças', ano: 2020 },
  { id: 'DOC-182', titulo: 'Pragas da Alface',                 editora: 'Embrapa Hortaliças', ano: 2020 },
  { id: 'DOC-187', titulo: 'Pragas dos Brócolis e Couve-flor', editora: 'Embrapa Hortaliças', ano: 2021 },
  { id: 'MANEJO',  titulo: 'Manejo Sustentável de Pragas e Doenças Agrícolas', editora: 'Atena Editora', ano: 2021 },
];

/**
 * Base de pragas consolidada — cada entrada cruza dados de múltiplos guias.
 * Campos:
 *   nome           — nome popular
 *   cientifico     — nome científico
 *   tipo           — praga | fungo | vírus | bactéria | ácaro
 *   classe         — chave | secundária
 *   culturas       — culturas afetadas (dos guias)
 *   ciclo_dias     — min-max
 *   condicoes_fav  — condições climáticas que favorecem surto
 *   sintomas       — sinais visíveis
 *   fontes         — IDs dos guias de origem
 */
const PRAGAS = [
  {
    nome: 'Mosca-branca',
    cientifico: 'Bemisia tabaci / Trialeurodes vaporariorum',
    tipo: 'praga',
    classe: 'chave',
    culturas: ['tomate', 'pimentão', 'morango', 'alface', 'brócolis'],
    ciclo_dias: [14, 27],
    condicoes_fav: 'Temperatura 24–30°C, umidade relativa 60–80%, ausência de chuva forte, época quente. B. tabaci prefere clima quente e seco; T. vaporariorum tolera clima ameno.',
    sintomas: 'Fumagina nas folhas, amadurecimento irregular de frutos, mosaico, nanismo. Transmite Geminivirose (BegoMOvírus) e Crinivirose (ToCV).',
    fontes: ['DOC-175', 'DOC-176', 'DOC-178', 'DOC-182', 'DOC-187'],
  },
  {
    nome: 'Tripes',
    cientifico: 'Frankliniella schultzei / F. occidentalis / Thrips palmi / T. tabaci',
    tipo: 'praga',
    classe: 'chave',
    culturas: ['tomate', 'pimentão', 'morango', 'alface'],
    ciclo_dias: [12, 25],
    condicoes_fav: 'Período seco, temperatura 25–35°C, baixa umidade. Surtos explosivos em estiagem. Frankliniella schultzei é principal vetor do Vira-cabeça.',
    sintomas: 'Manchas prateadas nas folhas, pontuações escuras (fezes), deformação. Transmite Vira-cabeça (TSWV, GRSV, TCSV).',
    fontes: ['DOC-175', 'DOC-176', 'DOC-182', 'DOC-187'],
  },
  {
    nome: 'Traça-do-tomateiro',
    cientifico: 'Tuta absoluta',
    tipo: 'praga',
    classe: 'chave',
    culturas: ['tomate', 'pimentão'],
    ciclo_dias: [25, 40],
    condicoes_fav: 'Temperatura 20–30°C, umidade moderada, noites quentes. Ocorrência durante todo o ano; picos em primavera-verão.',
    sintomas: 'Galerias largas nos folíolos, perfuração de ponteiros e frutos, fezes pretas.',
    fontes: ['DOC-175', 'DOC-176'],
  },
  {
    nome: 'Traça-das-crucíferas',
    cientifico: 'Plutella xylostella',
    tipo: 'praga',
    classe: 'chave',
    culturas: ['brócolis', 'couve-flor', 'couve'],
    ciclo_dias: [11, 28],
    condicoes_fav: 'Estiagem (sem chuvas), temperaturas baixas NÃO inibem surtos. Mais severa em período seco mesmo no inverno. Alta resistência a inseticidas.',
    sintomas: 'Orifícios em "janela" nas folhas, galerias iniciais, rendilhamento. Lagartas contaminam inflorescências.',
    fontes: ['DOC-187'],
  },
  {
    nome: 'Pulgões',
    cientifico: 'Aphis gossypii / Macrosiphum euphorbiae / Myzus persicae',
    tipo: 'praga',
    classe: 'chave',
    culturas: ['tomate', 'pimentão', 'morango', 'alface', 'brócolis'],
    ciclo_dias: [5, 15],
    condicoes_fav: 'Clima ameno-quente (15–25°C), umidade média, falta de controle de formigas e inimigos naturais. Populações explodem em pós-chuva com sol.',
    sintomas: 'Colônias no ápice, fumagina, deformação de folhas novas. Transmitem vírus (PVY, TBTV) de forma não-persistente.',
    fontes: ['DOC-175', 'DOC-176', 'DOC-178', 'DOC-182', 'DOC-187'],
  },
  {
    nome: 'Ácaro-rajado',
    cientifico: 'Tetranychus urticae',
    tipo: 'ácaro',
    classe: 'chave',
    culturas: ['tomate', 'pimentão', 'morango'],
    ciclo_dias: [7, 21],
    condicoes_fav: 'Clima quente e seco, temperatura 27–35°C, umidade <60%, presença de poeira. Morango: redução de produção de até 80% sem controle.',
    sintomas: 'Pontilhado clorótico/bronzeado na face superior, teia na face inferior, senescência precoce.',
    fontes: ['DOC-175', 'DOC-176', 'DOC-178'],
  },
  {
    nome: 'Ácaro-branco',
    cientifico: 'Polyphagotarsonemus latus',
    tipo: 'ácaro',
    classe: 'chave',
    culturas: ['tomate', 'pimentão'],
    ciclo_dias: [3, 8],
    condicoes_fav: 'Clima quente e úmido (25–32°C, UR >70%). Pimentão e tomate em estufa são os mais afetados. Ciclo muito curto — surtos rápidos.',
    sintomas: 'Brotos bronzeados, folhas novas enroladas para baixo e quebradiças, aspecto vítreo na face inferior.',
    fontes: ['DOC-175', 'DOC-176'],
  },
  {
    nome: 'Lagarta-militar',
    cientifico: 'Spodoptera eridania / S. cosmioides / S. frugiperda',
    tipo: 'praga',
    classe: 'secundária',
    culturas: ['tomate', 'pimentão', 'morango', 'alface', 'brócolis'],
    ciclo_dias: [21, 46],
    condicoes_fav: 'Transição seca-chuva (set-nov no Centro-oeste/Sul), temperatura 25–33°C. Surtos frequentes em início de estação chuvosa.',
    sintomas: 'Folíolos rendilhados (lagartas jovens), broqueamento de frutos (lagartas desenvolvidas), início nas folhas baixeiras.',
    fontes: ['DOC-175', 'DOC-176', 'DOC-178', 'DOC-182', 'DOC-187'],
  },
  {
    nome: 'Broca-grande',
    cientifico: 'Helicoverpa armigera / H. zea / Chloridea virescens',
    tipo: 'praga',
    classe: 'secundária',
    culturas: ['tomate', 'pimentão', 'morango', 'alface', 'brócolis'],
    ciclo_dias: [35, 60],
    condicoes_fav: 'Clima quente (22–32°C), período úmido. H. armigera tem grande capacidade migratória. Frutos perfurados apodrecem por infecção secundária.',
    sintomas: 'Grandes orifícios nos frutos, polpa destruída, presença da lagarta dentro do fruto.',
    fontes: ['DOC-175', 'DOC-176', 'DOC-178', 'DOC-182', 'DOC-187'],
  },
  {
    nome: 'Lagarta-rosca',
    cientifico: 'Agrotis ipsilon',
    tipo: 'praga',
    classe: 'secundária',
    culturas: ['tomate', 'pimentão', 'morango', 'alface', 'brócolis'],
    ciclo_dias: [34, 64],
    condicoes_fav: 'Períodos quentes e secos. Larva noturna. Ataca plantas logo após transplantio. Enrola-se quando tocada.',
    sintomas: 'Plântulas seccionadas rente ao solo. Replantio necessário em infestações severas.',
    fontes: ['DOC-175', 'DOC-176', 'DOC-178', 'DOC-182', 'DOC-187'],
  },
  {
    nome: 'Lagarta-falsa-medideira',
    cientifico: 'Chrysodeixis includens / Trichoplusia ni / Rachiplusia nu',
    tipo: 'praga',
    classe: 'secundária',
    culturas: ['tomate', 'pimentão', 'alface', 'brócolis'],
    ciclo_dias: [21, 40],
    condicoes_fav: 'Clima quente e úmido. C. includens dominante no Centro-oeste e Nordeste; R. nu mais comum no Sul (incluindo Paraná).',
    sintomas: 'Desfolha no terço superior, frutos verdes broqueados com orifícios múltiplos. Lagarta "medindo palmos".',
    fontes: ['DOC-175', 'DOC-176', 'DOC-182', 'DOC-187'],
  },
  {
    nome: 'Broca-pequena-do-fruto',
    cientifico: 'Neoleucinodes elegantalis',
    tipo: 'praga',
    classe: 'chave',
    culturas: ['tomate', 'pimentão'],
    ciclo_dias: [30, 50],
    condicoes_fav: 'Umidade relativa >50%, clima quente. Prevalece no período de florescimento. Fruto perfurado apodrece por microrganismos secundários.',
    sintomas: 'Pequena cicatriz escura no pericarpo, larva desenvolve-se inteiramente dentro do fruto.',
    fontes: ['DOC-175', 'DOC-176'],
  },
  {
    nome: 'Mosca-minadora',
    cientifico: 'Liriomyza huidobrensis / L. sativae / L. trifolii',
    tipo: 'praga',
    classe: 'secundária',
    culturas: ['tomate', 'pimentão', 'alface'],
    ciclo_dias: [14, 30],
    condicoes_fav: 'Clima ameno, primavera-outono. Alta ocorrência em estufa. Larva forma galerias serpenteantes nos folíolos.',
    sintomas: 'Galerias estreitas em serpentina nos folíolos. Alta infestação: necrose e desfolha precoce.',
    fontes: ['DOC-175', 'DOC-176', 'DOC-182'],
  },
  {
    nome: 'Ácaro-do-bronzeamento',
    cientifico: 'Aculops lycopersici',
    tipo: 'ácaro',
    classe: 'secundária',
    culturas: ['tomate'],
    ciclo_dias: [6, 6],
    condicoes_fav: 'Clima quente e seco. Ciclo de apenas 6 dias — surtos rapidíssimos. Detecção difícil (0,2mm). Pode matar plantas em alta infestação.',
    sintomas: 'Bronzeamento de ramos e folhas, aspecto brilhante, frutos com pele áspera (escaldadura).',
    fontes: ['DOC-175'],
  },
  {
    nome: 'Vira-cabeça (TSWV/GRSV/TCSV)',
    cientifico: 'Orthotospovirus — vetor: Frankliniella schultzei',
    tipo: 'vírus',
    classe: 'chave',
    culturas: ['tomate', 'pimentão', 'alface', 'morango'],
    ciclo_dias: [7, 10],
    condicoes_fav: 'Alta população de tripes (seca + calor). Vírus adquirido na fase larval. Uma vez vetor, o tripes transmite por toda a vida.',
    sintomas: 'Mosaico, arroxeamento, manchas necróticas em folhas novas, curvatura do topo, anéis necróticos nos frutos.',
    fontes: ['DOC-175', 'DOC-176', 'DOC-182'],
  },
  {
    nome: 'Geminivirose / Crinivirose',
    cientifico: 'Begomovirus / Crinivirus — vetor: Bemisia tabaci',
    tipo: 'vírus',
    classe: 'chave',
    culturas: ['tomate', 'pimentão'],
    ciclo_dias: [10, 20],
    condicoes_fav: 'Alta população de mosca-branca. Crítico nos primeiros 40 dias pós-transplantio e na fase de mudas.',
    sintomas: 'Gemini: mosaico nas folhas novas, enrolamento, nanismo. Crinivírus: clorose internerval nas folhas velhas, aspecto coriáceo.',
    fontes: ['DOC-175', 'DOC-176'],
  },
  {
    nome: 'Formigas-cortadeiras',
    cientifico: 'Atta spp. / Acromyrmex spp.',
    tipo: 'praga',
    classe: 'secundária',
    culturas: ['morango', 'alface', 'brócolis'],
    ciclo_dias: [null, null],
    condicoes_fav: 'Solo seco e arenoso, áreas próximas a mata. Risco permanente em SAF diverso.',
    sintomas: 'Corte de folhas e ramos, trilhas de formigas, destruição de mudas.',
    fontes: ['DOC-178', 'DOC-182', 'DOC-187'],
  },
  {
    nome: 'Lesmas e caracóis',
    cientifico: 'Deroceras spp. / Bradybaena similaris',
    tipo: 'praga',
    classe: 'secundária',
    culturas: ['morango', 'alface', 'brócolis'],
    ciclo_dias: [null, null],
    condicoes_fav: 'Alta umidade, temperatura amena (10–20°C), solo com muita matéria orgânica, noites úmidas. Típico de clima frio-úmido do sul do Brasil.',
    sintomas: 'Folhas consumidas durante a noite, trilho de muco prateado. Frutos de morango perfurados.',
    fontes: ['DOC-178', 'DOC-182', 'DOC-187'],
  },
];

/**
 * Princípios de manejo ecológico / MIP compilados do livro Atena + guias Embrapa
 */
const PRINCIPIOS_MIP = [
  'Monitoramento semanal obrigatório — inspeção de 20 plantas/ha, face inferior das folhas, ápice e frutos',
  'Controle biológico: Trichogramma spp. (parasitóide de ovos de lepidópteros), Chrysoperla carnea (predador de pulgões), Phytoseiulus persimilis (predador de ácaros tetraniquídeos)',
  'Calda bordalesa 1% como fungicida e bactericida preventivo em períodos úmidos',
  'Extrato de nim (azadiractina 0,5–1%) como inseticida sistêmico natural — eficaz em mosca-branca, pulgões, tripes e ácaros',
  'Rotação de culturas reduz acúmulo de populações de pragas no solo e da traça-das-crucíferas',
  'Diversidade do SAF (≥30 espécies) é a principal ferramenta preventiva — reduz explosão de Tuta absoluta e broca-do-cedro',
  'Eliminação de restos culturais — remove pupas de Tuta, Spodoptera e Helicoverpa que ficam no solo',
  'Armadilhas com feromônio sexual para monitoramento de Tuta absoluta e Spodoptera spp.',
  'Bacillus thuringiensis (Bt) — bioinseticida eficaz contra lagartas (Spodoptera, Helicoverpa, Tuta), sem impacto em inimigos naturais',
  'Óleo mineral ou de laranja + sabão potássico — controle físico de cochonilhas e ácaro-branco',
  'Trichoderma harzianum como antagonista de fungos de solo e indutor de resistência',
];

module.exports = { GUIAS, PRAGAS, PRINCIPIOS_MIP };
