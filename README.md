# Hostly

## Sistema de Gestão de Locação de Imóveis por Temporada

Projeto desenvolvido para a disciplina **AEDs III (Algoritmos e Estruturas de Dados III)**, com foco em modelagem de dados, persistência em arquivos binários e aplicação de estruturas de dados avançadas.

---

## Sumário

1. [Sobre o Projeto](#sobre-o-projeto)
2. [Stack Tecnológica](#stack-tecnológica)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Domínios e Entidades](#domínios-e-entidades)
5. [Persistência em Arquivo Binário](#persistência-em-arquivo-binário)
6. [Hash Extensível](#hash-extensível)
7. [Árvore B+](#árvore-b)
8. [Ordenação Externa](#ordenação-externa)
9. [Compilação e Execução](#compilação-e-execução)
10. [Endpoints da API](#endpoints-da-api)
11. [Fluxo de Funcionamento](#fluxo-de-funcionamento)
12. [Arquitetura](#arquitetura)
13. [Conceitos Aplicados](#conceitos-aplicados)
14. [Equipe](#equipe)

---

## Sobre o Projeto

O **Hostly** é um sistema full-stack de gestão de imóveis para locação por temporada. O diferencial do projeto é **não utilizar SGBD**: toda a persistência é feita diretamente em arquivos binários customizados, com índices implementados do zero.

**Funcionalidades principais:**
- CRUD completo de Imóveis, Usuários, Reservas e Comodidades
- Relacionamentos 1:N (Anfitrião → Imóveis → Reservas) via Hash Extensível multi-valor
- Relacionamento N:N (Imóveis ↔ Comodidades) via tabela intermediária com Hash + Árvore B+
- Busca por ID em O(1) via Hash Extensível primário
- Busca textual por tokens via índice invertido (FNV-32a)
- Busca por faixa de valores (preço, período) processada no backend
- Ordenação física dos arquivos via Ordenação Externa (External Merge Sort com heap de k-vias)
- Dashboard com mapa interativo e geolocalização de imóveis

---

## Stack Tecnológica

### Back-end

| Item | Detalhe |
|------|---------|
| Go 1.21+ | `net/http` stdlib — sem frameworks externos |
| Persistência | Arquivos binários customizados (`data/*.db`) |
| Índice primário | Hash Extensível (ID → offset no arquivo) |
| Índice secundário | Hash Extensível multi-valor (1:N e índice invertido) |
| Índice N:N ordenado | Árvore B+ (chave composta idImovel:idComodidade) |
| Ordenação | External Merge Sort com heap de k-vias |

### Front-end

| Item | Versão |
|------|--------|
| React | 19.2 |
| TypeScript | 5.9 |
| Vite | 7.3 |
| Zustand | 5 (estado global + persistência) |
| React Router | 7 |
| React Leaflet | Mapa interativo com pins de preço |

---

## Estrutura do Projeto

```
Hostly/
├── backend/
│   ├── cmd/
│   │   └── main.go                              # Ponto de entrada
│   ├── internal/
│   │   ├── domain/                              # Entidades e regras de negócio
│   │   │   ├── user.go
│   │   │   ├── property.go
│   │   │   ├── reservation.go
│   │   │   ├── amenity.go
│   │   │   ├── property_amenity.go
│   │   │   └── errors.go
│   │   ├── adapters/
│   │   │   ├── repository/                      # Persistência e índices
│   │   │   │   ├── binary_store.go              # CRUD genérico no arquivo binário
│   │   │   │   ├── entity_codecs.go             # Serialização manual dos campos
│   │   │   │   ├── extensible_hash.go           # Hash Extensível primário
│   │   │   │   ├── relation_extensible_hash.go  # Hash multi-valor (1:N e índice invertido)
│   │   │   │   ├── bplus_tree.go                # Árvore B+ (N:N ordenado)
│   │   │   │   ├── external_sort.go             # Ordenação Externa (merge sort k-vias)
│   │   │   │   ├── token_search.go              # Tokenização e normalização de busca
│   │   │   │   ├── user_file_repo.go
│   │   │   │   ├── property_file_repo.go
│   │   │   │   ├── reservation_file_repo.go
│   │   │   │   ├── amenity_file_repo.go
│   │   │   │   └── property_amenity_file_repo.go
│   │   │   └── web/handler/                     # Handlers HTTP
│   │   │       ├── router.go
│   │   │       ├── auth_handler.go
│   │   │       ├── property_handler.go
│   │   │       ├── user_handler.go
│   │   │       ├── reservation_handler.go
│   │   │       ├── amenity_handler.go
│   │   │       ├── property_amenity_handler.go
│   │   │       ├── dashboard_handler.go
│   │   │       └── aed_handler.go               # Diagnóstico dos índices
│   │   └── usecase/                             # Casos de uso / serviços
│   │       ├── auth/
│   │       ├── property/
│   │       ├── reservation/
│   │       ├── amenity/
│   │       └── propertyamenity/
│   ├── data/                                    # Arquivos binários gerados em runtime
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── store.ts                         # Estado global (Zustand)
│   │   ├── features/
│   │   │   ├── auth/                            # Login / cadastro
│   │   │   └── map/                             # MapView + geocodificação
│   │   ├── pages/                               # Uma página por rota
│   │   │   ├── Landing.tsx                      # Mapa público + login
│   │   │   ├── Explore.tsx                      # Busca e filtros de imóveis
│   │   │   ├── AdminUsers.tsx
│   │   │   ├── AdminProperties.tsx
│   │   │   ├── AdminReservations.tsx
│   │   │   ├── HostDashboard.tsx
│   │   │   ├── HostListings.tsx
│   │   │   ├── HostReservations.tsx
│   │   │   ├── GuestDashboard.tsx
│   │   │   └── GuestReservations.tsx
│   │   └── services/
│   │       └── api.ts                           # Cliente HTTP centralizado
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## Domínios e Entidades

### Usuario

| Campo    | Tipo                                  | Regras                   |
|----------|---------------------------------------|--------------------------|
| id       | int (PK, auto-incremento)             |                          |
| nome     | string                                | Obrigatório              |
| email    | string                                | Único                    |
| telefone | string                                | Opcional                 |
| senha    | string                                | Armazenada com hash      |
| tipo     | `ADMIN` \| `ANFITRIAO` \| `HOSPEDE`   |                          |
| ativo    | bool                                  | Exclusão lógica (lápide) |

### Imovel

| Campo        | Tipo       | Regras                                        |
|--------------|------------|-----------------------------------------------|
| id           | int (PK)   |                                               |
| idUsuario    | int (FK)   | Referência ao anfitrião                       |
| titulo       | string     | 4–120 caracteres                              |
| descricao    | string     | Obrigatório                                   |
| endereco     | Endereco   | rua, numero, bairro, cidade, estado, cep      |
| cidade       | string     | Deve coincidir com `endereco.cidade`          |
| latitude     | float64    |                                               |
| longitude    | float64    |                                               |
| valorDiaria  | float64    | Deve ser > 0                                  |
| dataCadastro | string     | YYYY-MM-DD                                    |
| fotos        | []string   | Exatamente 1 foto (URL https:// ou base64)   |
| comodidades  | []Amenity  | Hidratadas da relação N:N via B+              |
| ativo        | bool       | Exclusão lógica                               |

### Reserva

| Campo          | Tipo                                                               | Regras                             |
|----------------|--------------------------------------------------------------------|------------------------------------|
| id             | int (PK)                                                           |                                    |
| idImovel       | int (FK)                                                           |                                    |
| idHospede      | int (FK)                                                           |                                    |
| dataInicio     | string                                                             | YYYY-MM-DD                         |
| dataFim        | string                                                             | Deve ser após dataInicio           |
| valorTotal     | float64                                                            | Calculado: diária × dias           |
| status         | `PENDENTE` \| `CONFIRMADA` \| `CANCELADA`                          |                                    |
| formaPagamento | `PIX` \| `CARTAO_CREDITO` \| `CARTAO_DEBITO` \| `BOLETO` \| `DINHEIRO` |                               |
| statusPagamento| `NAO_INICIADO` \| `PENDENTE` \| `APROVADO` \| `FALHOU`             |                                    |
| confirmadaEm   | string (RFC3339)                                                   | Preenchido ao confirmar            |

### Comodidade

| Campo     | Tipo      | Regras         |
|-----------|-----------|----------------|
| id        | int (PK)  |                |
| nome      | string    | Mínimo 2 chars |
| descricao | string    |                |
| icone     | string    |                |
| ativo     | bool      |                |

### ImovelComodidade (N:N)

| Campo        | Tipo   | Regras                              |
|--------------|--------|-------------------------------------|
| idImovel     | int    | Parte da chave composta             |
| idComodidade | int    | Parte da chave composta             |
| dataCadastro | string | YYYY-MM-DD                          |
| ativo        | bool   | Exclusão lógica                     |

**Chave primária composta:** `(idImovel, idComodidade)` — impede duplicatas e é a chave da B+.

---

## Persistência em Arquivo Binário

### Cabeçalho do arquivo (9 bytes, little-endian)

```
┌──────────┬──────────────┬─────────────┐
│ version  │   lastID     │    count    │
│  1 byte  │   4 bytes    │   4 bytes   │
└──────────┴──────────────┴─────────────┘
```

- `version`: controle de compatibilidade do formato
- `lastID`: maior ID já atribuído (auto-incremento)
- `count`: número de registros ativos (decrementado ao usar lápide)

### Cabeçalho do registro (9 bytes, little-endian)

```
┌──────────┬──────────────┬─────────────┐
│  lápide  │      id      │    size     │
│  1 byte  │   4 bytes    │   4 bytes   │
└──────────┴──────────────┴─────────────┘
│                payload               │
│              (size bytes)            │
└──────────────────────────────────────┘
```

- `lápide = 0`: registro ativo; `lápide = 1`: registro excluído logicamente
- `id`: chave primária da entidade
- `size`: tamanho do payload em bytes

### Formato do payload (versão 4 — baseado em campos)

```
┌──────────┬─────────────┬──────────────┐
│ version  │ entityType  │ fieldCount   │
│  1 byte  │   1 byte    │   2 bytes    │
└──────────┴─────────────┴──────────────┘
Para cada campo:
┌──────────┬─────────────┬──────────────┐
│ fieldID  │  fieldSize  │  fieldData   │
│  1 byte  │   4 bytes   │  N bytes     │
└──────────┴─────────────┴──────────────┘
```

### Exclusão lógica (lápide)

Registros deletados não são removidos fisicamente. O byte `lápide` é marcado como `1` no próprio arquivo. Os índices de hash são atualizados para remover a entrada correspondente. O espaço é recuperado via compactação futura ou ignorado nas buscas.

### Atualizações (append-only)

O registro antigo é marcado com lápide. Um novo registro é appendado ao final do arquivo com o mesmo ID. O índice primário é atualizado para apontar para o novo offset. O `count` do cabeçalho permanece inalterado (uma inserção + uma exclusão = zero saldo).

---

## Hash Extensível

Implementado do zero em Go, sem bibliotecas. Três camadas de uso:

### Conceito

- Buscas em **O(1)** amortizado
- Cresce incrementalmente: duplica apenas o diretório, não redistribui todos os dados de uma vez
- Cada bucket tem sua própria profundidade local (`localDepth`)
- O diretório tem profundidade global (`globalDepth`); seu tamanho é `2^globalDepth`

**Lookup:**
```
dirIndex = hash(key) & ((1 << globalDepth) - 1)
bucket   = directory[dirIndex]
return bucket.find(key)
```

**Split ao encher um bucket:**
```
1. Incrementa localDepth do bucket cheio
2. Cria novo bucket com a mesma localDepth
3. Redistribui as entradas usando o novo bit discriminador
4. Atualiza as entradas do diretório que apontavam para o bucket antigo
5. Se localDepth > globalDepth: duplica o diretório inteiro
```

### Camada 1 — Hash primário (ID → offset)

Arquivo: `extensible_hash.go`

Cada repositório mantém um índice primário persistido em `.pidx`:

```
imoveis.db.pidx    → idImovel   → offset em bytes no arquivo
reservas.db.pidx   → idReserva  → offset em bytes no arquivo
usuarios.db.pidx   → idUsuario  → offset em bytes no arquivo
comodidades.db.pidx→ idComodidade → offset
```

### Camada 2 — Hash multi-valor (1:N)

Arquivo: `relation_extensible_hash.go`

Mapeia uma chave a **múltiplos valores** (`key → []int64`). Persiste em `.ridx`:

| Arquivo                         | Chave      | Valores          |
|---------------------------------|------------|------------------|
| `imoveis.db.byuser.ridx`        | idUsuario  | []offset imóvel  |
| `reservas.db.byproperty.ridx`   | idImovel   | []offset reserva |
| `reservas.db.byguest.ridx`      | idHospede  | []offset reserva |
| `imoveis_comodidades.db.byproperty.ridx` | idImovel | []offset vínculo |
| `imoveis_comodidades.db.byamenity.ridx`  | idComodidade | []offset vínculo |

### Camada 3 — Índice invertido por termos (busca textual)

Mesma estrutura multi-valor, porém a chave é o hash FNV-32a do token normalizado:

```
token "praia"       → FNV-32a → índice → []idImovel
token "florianopolis" → FNV-32a → índice → []idImovel
```

| Arquivo                      | Entidade   |
|------------------------------|------------|
| `imoveis.db.byterm.ridx`     | Imóveis    |
| `reservas.db.byterm.ridx`    | Reservas   |
| `usuarios.db.byterm.ridx`    | Usuários   |

Busca com múltiplos tokens faz **intersecção** dos conjuntos resultantes.

---

## Árvore B+

Arquivo: `bplus_tree.go`

Usada exclusivamente na relação N:N (ImovelComodidade) para permitir **consulta ordenada por idComodidade** dentro de um imóvel.

**Chave composta int64:**
```go
key = int64(uint64(idImovel) << 32 | uint64(idComodidade))
```

Isso garante que as chaves de um mesmo imóvel formem um intervalo contíguo, permitindo `Range(minKey, maxKey)` para recuperar todas as comodidades de um imóvel em ordem crescente de `idComodidade`.

**Parâmetros:** `bPlusMaxKeys = 15` chaves por nó. Nós folha são encadeados para varredura sequencial eficiente.

**Operações:**
- `Insert(key, offset)` — insere vínculo na árvore
- `Delete(key, offset)` — remove vínculo
- `Range(minKey, maxKey)` — retorna todos os offsets no intervalo (usado para listar comodidades de um imóvel)

A B+ é mantida **somente em memória** e reconstruída a partir do arquivo a cada inicialização.

---

## Ordenação Externa

Arquivo: `external_sort.go`

Usada para reordenar fisicamente o arquivo binário de imóveis e reservas, viabilizando leituras já na ordem solicitada sem custo adicional em consultas subsequentes.

**Algoritmo — dois passos:**

### Passo 1 — Distribuição em runs

```
Para cada bloco de runSize registros ativos:
  1. Carrega registros em memória
  2. Ordena o bloco pela chave desejada (ex: valorDiaria)
  3. Serializa o bloco em um arquivo de run temporário:
     ┌───────────┬──────────────────────────────────────┐
     │ count: 4B │ registros: [key:8B][id:4B][size:4B][payload:N] │
     └───────────┴──────────────────────────────────────┘
```

### Passo 2 — Merge k-vias com heap mínimo

```
Abre todos os runs simultaneamente
Heap mínimo com um elemento de cada run
Loop:
  1. Extrai o menor elemento do heap
  2. Grava no arquivo de saída sorted.bin
  3. Avança o cursor do run correspondente
  4. Insere o próximo elemento desse run no heap
```

### Reescrita atômica

Após o merge, `RewriteSorted` substitui o arquivo original pelo sorted com renomeação atômica (`os.Rename`) e reconstrói todos os índices (primário + relacionamentos + termos). Isso garante que nenhuma leitura observe um estado intermediário inconsistente.

**Atributos de ordenação disponíveis:**

| Endpoint    | `ordenarPor`                                  |
|-------------|-----------------------------------------------|
| `/imoveis`  | `valorDiaria`, `dataCadastro`, `cidade`, `titulo` |
| `/reservas` | `dataInicio`, `dataFim`, `valorTotal`         |

---

## Compilação e Execução

### Pré-requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| Go         | 1.21+         |
| Node.js    | 18+           |
| npm        | 9+            |

### Back-end

```bash
cd backend

# Compilar
go build -o hostly ./cmd/main.go

# Executar
./hostly
# ou diretamente:
go run ./cmd/main.go
```

Servidor em `http://localhost:8080`.

**O que acontece na inicialização:**
1. Cria `data/` se não existir
2. Abre (ou cria) os arquivos binários de cada entidade
3. Carrega índices de hash do disco (`.pidx`, `.ridx`)
4. Reconstrói índices de relacionamento e B+ em memória
5. Seed automático: usuário admin (`admin@hostly.local` / `admin123`) e 12 comodidades padrão
6. Inicia listener HTTP na porta 8080

### Front-end

```bash
cd frontend

npm install

# Desenvolvimento (hot reload)
npm run dev
# → http://localhost:5173

# Build de produção
npm run build

# Lint
npm run lint
```

### Executar os dois juntos

```bash
# Terminal 1
cd backend && go run ./cmd/main.go

# Terminal 2
cd frontend && npm run dev
```

### Contas padrão (após reset dos dados)

| Papel      | Email                    | Senha        |
|------------|--------------------------|--------------|
| Admin      | admin@hostly.local       | admin123     |
| Anfitrião  | anfitriao@hostly.local   | anfitriao123 |
| Hóspede    | hospede@hostly.local     | hospede123   |

---

## Endpoints da API

### Saúde

```
GET  /health
```

### Autenticação

```
POST /auth/register      # Criar conta (anfitrião ou hóspede)
POST /auth/login         # Login → retorna Bearer token
GET  /auth/me            # Dados do usuário autenticado
```

### Imóveis

```
GET    /imoveis
GET    /imoveis/{id}
GET    /imoveis/usuario/{idUsuario}
POST   /imoveis
PUT    /imoveis/{id}
DELETE /imoveis/{id}
```

**Query params — `GET /imoveis`:**

| Parâmetro        | Tipo   | Descrição                                               |
|------------------|--------|---------------------------------------------------------|
| `busca`          | string | Busca textual por tokens (índice invertido FNV-32a)     |
| `cidade`         | string | Filtro exato por cidade                                 |
| `ativo`          | bool   | Filtrar por status ativo/inativo                        |
| `valorDiariaMin` | float  | Faixa mínima de diária                                  |
| `valorDiariaMax` | float  | Faixa máxima de diária                                  |
| `comodidades`    | string | IDs separados por vírgula (ex: `1,3,6`)                 |
| `ordenarPor`     | string | `valorDiaria` \| `dataCadastro` \| `cidade` \| `titulo` |
| `ordem`          | string | `asc` \| `desc`                                         |

### Usuários

```
GET    /usuarios                # params: busca
GET    /usuarios/anfitrioes
GET    /usuarios/{id}
POST   /usuarios
PUT    /usuarios/{id}
DELETE /usuarios/{id}
```

### Reservas

```
GET    /reservas
GET    /reservas/{id}
GET    /reservas/hospede/{idHospede}
GET    /reservas/anfitriao/{idAnfitriao}
POST   /reservas
PUT    /reservas/{id}
PUT    /reservas/{id}/confirmar    # body: { "formaPagamento": "PIX" }
DELETE /reservas/{id}
```

**Query params — `GET /reservas`:**

| Parâmetro    | Tipo   | Descrição                                             |
|--------------|--------|-------------------------------------------------------|
| `idUsuario`  | int    | Filtro por usuário (combinado com `papel`)             |
| `papel`      | string | `hospede` \| `anfitriao`                              |
| `idImovel`   | int    | Filtro por imóvel (hash `byPropertyID`)               |
| `status`     | string | `PENDENTE` \| `CONFIRMADA` \| `CANCELADA`             |
| `periodoDe`  | string | Data início do intervalo (YYYY-MM-DD)                 |
| `periodoAte` | string | Data fim do intervalo (YYYY-MM-DD)                    |
| `busca`      | string | Busca textual (índice invertido)                      |
| `ordenarPor` | string | `dataInicio` \| `dataFim` \| `valorTotal`             |
| `ordem`      | string | `asc` \| `desc`                                       |

### Comodidades

```
GET    /comodidades
GET    /comodidades/{id}
POST   /comodidades
PUT    /comodidades/{id}
DELETE /comodidades/{id}
```

### Relação Imóvel-Comodidade (N:N)

```
POST   /imoveis-comodidades
GET    /imoveis-comodidades/imovel/{idImovel}                            # comodidades do imóvel (B+, ordenado)
GET    /imoveis-comodidades/comodidade/{idComodidade}/imoveis            # imóveis com a comodidade
GET    /imoveis-comodidades/imovel/{idImovel}/comodidade/{idComodidade}  # buscar vínculo específico
DELETE /imoveis-comodidades/imovel/{idImovel}/comodidade/{idComodidade}
```

### Dashboard

```
GET /dashboard/stats
```

```json
{
  "totalImoveis": 3,
  "totalAnfitrioes": 1,
  "totalReservas": 3,
  "receitaTotal": 9630.00
}
```

### AED — Diagnóstico dos índices

```
GET /aed/diagnostico
GET /aed/anfitriao/{id}
```

---

## Fluxo de Funcionamento

### Criar um imóvel

```
POST /imoveis

propertyHandler.Create()
  └── propertyService.Create(domain.Property)
        ├── Valida entidade (titulo, endereco, foto, valorDiaria...)
        ├── propertyRepo.Create()
        │     ├── Append no arquivo binário → obtém offset
        │     ├── hashPrimario.Set(id, offset)       → imoveis.db.pidx
        │     ├── hashByUser.Insert(idUsuario, offset) → imoveis.db.byuser.ridx
        │     └── hashByTerm.Insert(token, id) por cada token → imoveis.db.byterm.ridx
        └── propertyAmenityService.ReplacePropertyAmenities(id, amenities)
              └── Cria vínculos em imoveis_comodidades.db + atualiza B+ e hashes
```

### Busca textual

```
GET /imoveis?busca=praia+florianopolis

1. tokenizar("praia florianopolis") → ["praia", "florianopolis"]
2. FNV-32a("praia")        → hashByTerm.Get() → [id3, id17]
3. FNV-32a("florianopolis") → hashByTerm.Get() → [id3, id9]
4. intersecção              → [id3]
5. hashPrimario.Get(id3)    → offset
6. file.ReadAt(offset)      → deserializa registro

Resultado: apenas o imóvel 3
```

### Busca por faixa de preço

```
GET /imoveis?valorDiariaMin=300&valorDiariaMax=500

1. GetAll() → lê todos os registros ativos do arquivo
2. Aplica filtro server-side: valorDiaria >= 300 && valorDiaria <= 500
3. Retorna apenas os imóveis dentro da faixa

Nenhuma filtragem acontece no frontend.
```

### Ordenação externa

```
GET /imoveis?ordenarPor=valorDiaria&ordem=asc

1. SortExternal: lê registros em blocos (runSize)
   └── Ordena cada bloco → grava em imoveis.sort.run.N.bin
2. Merge k-vias com heap mínimo → imoveis.sorted.bin
3. RewriteSorted: renomeia atomicamente sorted.bin → imoveis.db
4. Reconstrói todos os índices (pidx, byuser, byterm)
5. Consulta retorna os registros já na nova ordem física
```

### Listar comodidades de um imóvel (B+)

```
GET /imoveis-comodidades/imovel/1

1. B+.Range(minKey=idImovel<<32|0, maxKey=idImovel<<32|MAXUINT32)
   → retorna lista de offsets em imoveis_comodidades.db, ordenados por idComodidade
2. Para cada offset: readAt(offset) → deserializa vínculo
3. Retorna comodidades em ordem crescente de idComodidade
```

### Filtro de reservas por período

```
GET /reservas?idUsuario=3&papel=hospede&periodoDe=2026-06-01&periodoAte=2026-07-31

1. hashByGuest.Get(idHospede=3) → []offsets de reservas do hóspede
2. Para cada offset: lê reserva, verifica dataInicio >= periodoDe && dataFim <= periodoAte
3. Retorna apenas as reservas dentro do intervalo

Nenhuma filtragem acontece no frontend.
```

---

## Arquitetura

### Back-end — Hexagonal (Ports & Adapters)

```
                   ┌──────────────────────────────┐
                   │           Domain              │
                   │  Entidades + Validações       │
                   └──────────────┬────────────────┘
                                  │  interfaces (ports)
                   ┌──────────────▼────────────────┐
                   │           UseCase             │
                   │   Regras de negócio           │
                   └──────┬────────────────┬───────┘
                          │                │
          ┌───────────────▼──┐    ┌────────▼──────────────┐
          │   Web Adapter    │    │  Repository Adapter    │
          │  HTTP handlers   │    │  arquivo binário +     │
          │  JSON/multipart  │    │  hash extensível + B+  │
          └──────────────────┘    └────────────────────────┘
```

### Front-end — camadas

```
pages/          → uma página por rota (role-based)
features/       → domínios transversais (auth, map)
app/store.ts    → estado global com Zustand (persiste token no localStorage)
services/api.ts → cliente HTTP centralizado (injeta Bearer token automaticamente)
```

**Regra de ouro do frontend:** nenhuma filtragem, busca ou ordenação é feita no cliente. Todo query param (`busca`, `valorDiariaMin`, `valorDiariaMax`, `comodidades`, `status`, `periodoDe`, `periodoAte`, `idUsuario`, `papel`) é enviado ao backend, que usa os índices para processar.

---

## Conceitos Aplicados

| Conceito | Onde | Arquivo |
|----------|------|---------|
| **Hash Extensível primário** | ID → offset para todas as entidades | `extensible_hash.go` |
| **Hash Extensível multi-valor** | Relacionamentos 1:N e índice invertido de busca | `relation_extensible_hash.go` |
| **Árvore B+** | Comodidades de um imóvel ordenadas por idComodidade | `bplus_tree.go` |
| **Ordenação Externa (merge sort k-vias)** | Reordenação física de imóveis e reservas | `external_sort.go` |
| **Exclusão lógica (lápide)** | Deleção em todas as entidades | `binary_store.go` |
| **Serialização manual** | Codec de campos com ID + tamanho + dados | `entity_codecs.go` |
| **Índice invertido (FNV-32a)** | Busca textual por tokens normalizados | `token_search.go` |
| **Arquitetura Hexagonal** | Domain / UseCase / Ports / Adapters | `internal/` |
| **Geocodificação** | Coordenadas por CEP para pins no mapa | `features/map/` |
| **Estado global persistido** | Token de sessão via Zustand + localStorage | `app/store.ts` |

---

## Formulário Técnico — Fase III

1. **Relacionamento N:N:** Imóveis ↔ Comodidades, via `imoveis_comodidades.db`.
2. **Índices:** Hash Extensível multi-valor bilateral (`byproperty.ridx` e `byamenity.ridx`) + Árvore B+ em memória para leitura ordenada por `idComodidade`.
3. **Chave composta:** par `(idImovel, idComodidade)` gravado no cabeçalho de cada registro da tabela intermediária (13 bytes: lápide + idImovel + idAmenidade + size).
4. **Ordenação externa:** External Merge Sort com heap de k-vias implementado em `external_sort.go`, ativado via `?ordenarPor=` nos endpoints de imóveis e reservas.
5. **Integridade referencial:** serviço valida existência e status ativo de imóvel e comodidade antes de criar vínculo; deleção de imóvel ou comodidade remove logicamente todos os vínculos associados.
6. **Integração com CRUDs:** criar/editar imóvel sincroniza vínculos via `ReplacePropertyAmenities`; listar imóvel hidrata comodidades via `HydratePropertyAmenities` (consulta B+); excluir imóvel dispara `DeleteByPropertyID` no repositório N:N.

---

## Equipe

- Rafael Xavier Oliveira
- Lucas Silva Santos
- Leonardo Stuart de Almeida Ramalho
- Luca Guimarães Lodi
- Tulio Geraldo da Costa Silva

---

## Status

- Fase 1 — Concluída
- Fase 2 — Concluída
- Fase 3 — Concluída

Projeto acadêmico desenvolvido para fins educacionais — AEDs III / PUC Minas.
