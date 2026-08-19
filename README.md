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
    actions/aeronaves.ts  # Server Actions (criar/atualizar/excluir/buscar)
    manifest.ts           # manifest PWA
  components/             # UI (AppShell, formulário, cards, badges)
  db/schema.ts            # modelo de dados (Drizzle)
  lib/                    # validação zod e formatação
scripts/import-rab.ts     # importador do CSV do RAB (ANAC)
drizzle/                  # migrações SQL
data/                     # CSV baixado (gitignored)
```

## Modelo de dados

| Tabela | Descrição |
|---|---|
| `aeronaves` | Uma aeronave por matrícula (PK: `marcas`) com todos os campos do RAB |
| `proprietarios` | Proprietários (nome, documento, UF) |
| `operadores` | Operadores (nome, documento, UF, autorizações 121/135/SAE) |
| `aeronave_proprietarios` | Vínculo N:N com percentual de propriedade |
| `aeronave_operadores` | Vínculo N:N aeronave ↔ operador |

Fonte: [ANAC — Registro Aeronáutico Brasileiro](https://www.gov.br/anac/pt-br/acesso-a-informacao/dados-abertos/areas-de-atuacao/aeronaves-1/registro-aeronautico-brasileiro) (atualização mensal). A ANAC não oferece API REST pública; o sistema baixa o CSV oficial e sincroniza no Neon.

## Nota sobre o CSV

O arquivo da ANAC tem ~23 MB (34 mil+ aeronaves), acima do limite de anexo de 20 MB. O script `import:rab` resolve isso baixando o arquivo diretamente da ANAC e processando-o em lotes de 500 registros.