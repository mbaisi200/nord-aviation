# Nord Aviation

Consulta e cadastro de aeronaves do Registro Aeronáutico Brasileiro (RAB/ANAC).

## Stack

- **Next.js 16** (App Router) + **React 19** + TypeScript
- **Tailwind CSS v4** — interface mobile-first (PWA instalável)
- **Neon** (PostgreSQL serverless) + **Drizzle ORM**
- **zod** para validação de formulários

## Configuração

1. Crie um projeto em [console.neon.tech](https://console.neon.tech) e copie a connection string:
   ```bash
   cp .env.example .env
   # edite .env com a DATABASE_URL do Neon
   ```

2. Instale as dependências e crie as tabelas:
   ```bash
   npm install
   npm run db:migrate
   ```

3. Importe os dados do RAB (baixa o CSV direto da ANAC, ~23 MB):
   ```bash
   npm run import:rab          # baixa e importa
   npm run import:rab:update   # força download da versão mais recente
   ```

4. Rode o sistema:
   ```bash
   npm run dev
   ```

## Estrutura

```
src/
  app/
    aeronaves/            # módulo de cadastro e consulta (CRUD)
      [marcas]/           # detalhe e edição
      novo/               # cadastro
      page.tsx            # listagem com busca e paginação
    comparar/             # comparação mensal do RAB (períodos, filtros, exportação)
    actions/              # Server Actions (aeronaves, comparar, importar)
    api/exportar/         # exportação XLS
    manifest.ts           # manifest PWA
  components/             # UI (AppShell, formulário, cards, badges, card-novo expansível, navigation-loader)
  db/schema.ts            # modelo de dados (Drizzle)
  lib/                    # validação zod, icao-types (tradução C172 → Cessna 172), formatação
scripts/import-rab.ts     # importador do CSV do RAB (ANAC)
drizzle/                  # migrações SQL (0003 ds_tipo_icao_nome, 0004 hash, 0005 comparacoes_cache)
data/                     # CSV baixado (gitignored)
```

## Modelo de dados

| Tabela | Descrição |
|---|---|
| `aeronaves` | Uma aeronave por matrícula (PK: `marcas, periodo`) com todos os campos do RAB + `ds_tipo_icao_nome` (nome popular do ICAO, ex: `C172` → `Cessna 172 Skyhawk`) e `hash` (md5 materializado para comparação rápida) |
| `proprietarios` | Proprietários (nome, documento, UF) |
| `operadores` | Operadores (nome, documento, UF, autorizações 121/135/SAE) |
| `aeronave_proprietarios` | Vínculo N:N com percentual de propriedade |
| `aeronave_operadores` | Vínculo N:N aeronave ↔ operador |
| `comparacoes_cache` | Cache de comparações `base/alvo/filtros` (JSON) com TTL 5min para resposta ~5ms |
| `usuarios` | Usuários com login/senha (bcrypt) |

Fonte: [ANAC — Registro Aeronáutico Brasileiro](https://www.gov.br/anac/pt-br/acesso-a-informacao/dados-abertos/areas-de-atuacao/aeronaves-1/registro-aeronautico-brasileiro) (atualização mensal). A ANAC não oferece API REST pública; o sistema baixa o CSV oficial e sincroniza no Neon.

## Otimizações recentes

- **Nome popular ICAO persistido** (`ds_tipo_icao_nome`) com índice `GIN pg_trgm` para busca por `Cessna 172 Skyhawk` em ~3ms
- **Hash materializado** (`hash` md5) com índice `btree (periodo, hash)` para comparação mensal de 34k linhas em ~90ms (vs 350ms)
- **Cache de comparações** (`comparacoes_cache` + memória 5min) para resposta ~5ms em cliques repetidos
- **Card expansível** para `Registros novos` com ficha completa destacada em verde e `Reserva` filtrada
- **Região Vercel `gru1` (São Paulo)** `vercel.json:2` para latência <30ms até `Neon sa-east-1` (vs 150ms `iad1`)
- **Fetch paralelo** `src/app/comparar/page.tsx:141` `Promise.all([resultadoRelatorio, resultado])` para não somar 2x 90ms

## Layout mobile (notas para futuras alterações)

- **Filtros** `src/app/comparar/page.tsx:204` `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` - empilha em 1 coluna no celular para evitar scroll horizontal
- **Resumo** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` - 1 coluna em telas <640px
- **Cards novos** `src/components/card-novo.tsx:67` `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` - ficha com 7 campos para `Reserva` (oculta `—`) evita scroll
- **Tabelas do modal** `overflow-x-auto -mx-4 sm:mx-0 min-w-[640px]` - scroll horizontal com margem negativa no mobile, sem quebrar layout
- **Barras** `src/components/barra-comparacao.tsx:1` e `card-resumo` com relógio `00:00.000` dentro do próprio card para feedback imediato
- **Evitar scroll:** empilhar dados em `flex flex-col` no mobile (`sm:grid`) e usar `truncate` em `marcas/modelo` longos

## Nota sobre o CSV

O arquivo da ANAC tem ~23 MB (34 mil+ aeronaves), acima do limite de anexo de 20 MB. O script `import:rab` resolve isso baixando o arquivo diretamente da ANAC e processando-o em lotes de 500 registros.