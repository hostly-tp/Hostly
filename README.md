# Hostly

## Sistema de Gestão de Locação de Imóveis por Temporada

Projeto desenvolvido para a disciplina **AEDs III (Algoritmos e Estruturas de Dados III)** da PUC Minas, com foco em modelagem de dados, persistência em arquivos binários e implementação de estruturas de dados avançadas. **Não utiliza nenhum SGBD** — toda a persistência é feita diretamente em arquivos binários customizados, com índices, árvores e algoritmos implementados do zero em Go.

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
9. [Compressão de Dados e Backup Automático](#compressão-de-dados-e-backup-automático)
10. [Casamento de Padrões](#casamento-de-padrões)
11. [Compilação e Execução](#compilação-e-execução)
12. [Endpoints da API](#endpoints-da-api)
13. [Fluxo de Funcionamento](#fluxo-de-funcionamento)
14. [Arquitetura](#arquitetura)
15. [Fases do Projeto](#fases-do-projeto)
16. [Conceitos Aplicados](#conceitos-aplicados)
17. [Equipe](#equipe)

---

## Sobre o Projeto

O **Hostly** é um sistema full-stack de gestão de imóveis para locação por temporada. O diferencial do projeto está na camada de persistência: toda a infraestrutura de dados — índices, árvores, ordenação e compressão — foi escrita do zero em Go, sem uso de bibliotecas externas de estruturas de dados.

**Funcionalidades principais:**
- CRUD completo de Imóveis, Usuários, Reservas e Comodidades
- Relacionamento 1:N (Anfitrião → Imóveis → Reservas) via Hash Extensível multi-valor
- Relacionamento N:N (Imóveis ↔ Comodidades) com índices bidirecionais e Árvore B+
- Busca por ID em O(1) via Hash Extensível primário
- Busca textual por tokens via índice invertido (FNV-32a)
- Busca por faixa de valores (preço, período) processada inteiramente no backend
- Ordenação física dos arquivos via External Merge Sort com heap de k-vias
- Backup automático comprimido (Huffman e LZW) acionado pela própria expansão do sistema
- Casamento de padrões (KMP e Boyer-Moore) integrado em todas as buscas textuais da aplicação
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
| Compressão | Huffman e LZW implementados do zero — backup automático em `.hbak` |
| Busca textual | KMP e Boyer-Moore integrados em todas as buscas |

### Front-end

| Item | Versão |
|------|--------|
| React | 19.2 |
| TypeScript | 5.9 |
| Vite | 7.3 |
| Zustand | 5 (estado global + persistência no localStorage) |
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
│   │   │   ├── compression/                     # Algoritmos de compressão
│   │   │   │   ├── huffman.go                   # Huffman encode/decode
│   │   │   │   ├── lzw.go                       # LZW encode/decode
│   │   │   │   ├── archive.go                   # Empacotamento multi-arquivo (formato HLTB)
│   │   │   │   └── engine.go                    # Orquestrador (CompressRaw/DecompressRaw)
│   │   │   ├── patternmatch/                    # Casamento de padrões
│   │   │   │   ├── kmp.go                       # KMP (tabela de falha + busca)
│   │   │   │   ├── bm.go                        # Boyer-Moore (bad-char + busca)
│   │   │   │   └── engine.go                    # Orquestrador + funções MatchBM/MatchKMP
│   │   │   └── web/
│   │   │       ├── router.go                    # Roteamento + middleware de backup automático
│   │   │       └── handler/
│   │   │           ├── auth_handler.go
│   │   │           ├── property_handler.go      # BM post-filter integrado
│   │   │           ├── user_handler.go          # BM post-filter integrado
│   │   │           ├── reservation_handler.go   # BM post-filter integrado
│   │   │           ├── amenity_handler.go
│   │   │           ├── property_amenity_handler.go
│   │   │           ├── dashboard_handler.go
│   │   │           ├── backup_handler.go        # Backup: Create, List, Restore, AutoBackup
│   │   │           ├── patternmatch_handler.go  # Endpoint de diagnóstico BM vs KMP
│   │   │           └── aed_handler.go           # Diagnóstico dos índices
│   │   └── usecase/                             # Casos de uso / serviços
│   │       ├── auth/
│   │       ├── property/
│   │       ├── reservation/
│   │       ├── amenity/
│   │       └── propertyamenity/
│   ├── data/                                    # Arquivos binários gerados em runtime
│   └── go.mod
└── frontend/
    └── src/
        ├── app/
        │   └── store.ts                         # Estado global (Zustand)
        ├── features/
        │   ├── auth/                            # Login / cadastro
        │   └── properties/                      # Overlay de detalhes do imóvel
        ├── pages/
        │   ├── Landing.tsx                      # Mapa público + login
        │   ├── Explore.tsx                      # Busca e filtros de imóveis
        │   ├── AdminDashboard.tsx               # KPIs + status de backup automático
        │   ├── AdminUsers.tsx
        │   ├── AdminProperties.tsx
        │   ├── AdminReservations.tsx
        │   ├── AdminAmenities.tsx
        │   ├── HostDashboard.tsx
        │   ├── HostListings.tsx
        │   ├── HostReservations.tsx
        │   ├── HostRevenue.tsx
        │   ├── GuestDashboard.tsx
        │   └── GuestReservations.tsx
        └── services/
            └── api.ts                           # Cliente HTTP centralizado
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
| senha    | string                                | XOR a implementar (Fase 5) |
| tipo     | `ADMIN` \| `ANFITRIAO` \| `HOSPEDE`   |                          |
| ativo    | bool                                  | Exclusão lógica          |

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
| fotos        | []string   | Lista de data-URLs das fotos                  |
| comodidades  | []Amenity  | Hidratadas da relação N:N via B+              |
| ativo        | bool       | Exclusão lógica                               |

### Reserva

| Campo           | Tipo                                                                     | Regras                         |
|-----------------|--------------------------------------------------------------------------|--------------------------------|
| id              | int (PK)                                                                 |                                |
| idImovel        | int (FK)                                                                 |                                |
| idHospede       | int (FK)                                                                 |                                |
| dataInicio      | string                                                                   | YYYY-MM-DD                     |
| dataFim         | string                                                                   | Deve ser após dataInicio       |
| valorTotal      | float64                                                                  | Calculado: diária × dias       |
| status          | `PENDENTE` \| `CONFIRMADA` \| `CANCELADA`                                |                                |
| formaPagamento  | `PIX` \| `CARTAO_CREDITO` \| `CARTAO_DEBITO` \| `BOLETO` \| `DINHEIRO` |                                |
| statusPagamento | `NAO_INICIADO` \| `PENDENTE` \| `APROVADO` \| `FALHOU`                  |                                |
| confirmadaEm    | string (RFC3339)                                                         | Preenchido ao confirmar        |

### Comodidade

| Campo     | Tipo      | Regras         |
|-----------|-----------|----------------|
| id        | int (PK)  |                |
| nome      | string    | Mínimo 2 chars |
| descricao | string    |                |
| icone     | string    |                |
| ativo     | bool      |                |

### ImovelComodidade (N:N)

| Campo        | Tipo   | Regras                                |
|--------------|--------|---------------------------------------|
| idImovel     | int    | Parte da chave composta               |
| idComodidade | int    | Parte da chave composta               |
| dataCadastro | string | YYYY-MM-DD                            |
| ativo        | bool   | Exclusão lógica                       |

**Chave primária composta:** `(idImovel, idComodidade)` — impede duplicatas e é a chave da B+.

---

## Persistência em Arquivo Binário

### Cabeçalho do arquivo (12 bytes, little-endian)

```
┌──────────────┬──────────────┬──────────────┐
│   nextID     │    count     │  freeHead    │
│   4 bytes    │   4 bytes    │   4 bytes    │
└──────────────┴──────────────┴──────────────┘
```

- `nextID`: próximo ID a ser atribuído (auto-incremento)
- `count`: número de registros ativos
- `freeHead`: cabeça da lista encadeada de slots livres (para reuso)

### Registro

```
┌──────────┬──────────────┬─────────────────────┐
│  status  │      id      │    dados (N bytes)  │
│  1 byte  │   4 bytes    │    (variável)        │
└──────────┴──────────────┴─────────────────────┘
  0xFF = ativo
  0x00 = excluído
```

### Exclusão lógica com reaproveitamento de slots

Registros deletados **não são removidos fisicamente**. O byte de status é marcado como `0x00` e o slot é encadeado na lista de espaços livres via `freeHead`. Na próxima inserção, o sistema reutiliza o primeiro slot disponível dessa lista antes de expandir o arquivo. Isso evita crescimento indefinido do arquivo mesmo com muitas inserções e deleções.

### Atualizações (append-on-update)

O registro antigo é marcado com lápide. O registro atualizado é appendado ao final do arquivo com o mesmo ID. O índice primário é reescrito apontando para o novo offset. O `count` permanece inalterado (uma deleção lógica + uma inserção = saldo zero).

---

## Hash Extensível

Implementado do zero em Go, sem bibliotecas. Três camadas de uso no sistema.

### Conceito

- Buscas em **O(1) amortizado** por chave
- Cresce incrementalmente: duplica apenas o diretório, não redistribui todos os dados de uma vez
- Cada bucket tem profundidade local (`localDepth`); o diretório tem profundidade global (`globalDepth`)

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
3. Redistribui entradas usando o novo bit discriminador
4. Atualiza ponteiros do diretório que apontavam para o bucket antigo
5. Se localDepth > globalDepth: duplica o diretório
```

### Camada 1 — Hash primário (ID → offset)

Cada repositório mantém um índice primário persistido em `.pidx`:

```
data/usuarios.db.pidx      → idUsuario    → offset em bytes no arquivo
data/imoveis.db.pidx       → idImovel     → offset em bytes no arquivo
data/reservas.db.pidx      → idReserva    → offset em bytes no arquivo
data/comodidades.db.pidx   → idComodidade → offset em bytes no arquivo
```

### Camada 2 — Hash multi-valor (1:N)

Mapeia uma chave a **múltiplos valores** (`key → []int64`). Persiste em `.ridx`:

| Arquivo                                    | Chave        | Valores            |
|--------------------------------------------|--------------|--------------------|
| `imoveis.db.byuser.ridx`                   | idUsuario    | []offset imóvel    |
| `reservas.db.byproperty.ridx`              | idImovel     | []offset reserva   |
| `reservas.db.byguest.ridx`                 | idHospede    | []offset reserva   |
| `imoveis_comodidades.db.byproperty.ridx`   | idImovel     | []offset vínculo   |
| `imoveis_comodidades.db.byamenity.ridx`    | idComodidade | []offset vínculo   |

### Camada 3 — Índice invertido por tokens (busca textual)

Mesma estrutura multi-valor, com a chave sendo o hash **FNV-32a** do token normalizado:

**Split ao encher um bucket:**
```
token "praia"        → FNV-32a → entrada no índice → []idImovel
token "florianopolis"→ FNV-32a → entrada no índice → []idImovel
```

| Arquivo                      | Entidade  |
|------------------------------|-----------|
| `imoveis.db.byterm.ridx`     | Imóveis   |
| `reservas.db.byterm.ridx`    | Reservas  |
| `usuarios.db.byterm.ridx`    | Usuários  |

Busca com múltiplos tokens faz **intersecção** dos conjuntos resultantes.

### Camada 2 — Hash multi-valor (1:N)

Arquivo: `relation_extensible_hash.go`

## Árvore B+

Usada na relação N:N (ImovelComodidade) para permitir **listagem ordenada de comodidades por imóvel** sem custo de sort em memória.

**Chave composta int64:**
```go
key = int64(uint64(idImovel) << 32 | uint64(idComodidade))
```

Isso garante que todas as chaves de um mesmo imóvel formem um intervalo contíguo, viabilizando `Range(minKey, maxKey)` para recuperar as comodidades em ordem crescente de `idComodidade`.

**Parâmetros:** `bPlusMaxKeys = 15` chaves por nó. Nós folha são duplamente encadeados para varredura sequencial eficiente.

**Operações:**
- `Insert(key, offset)` — insere vínculo na árvore
- `Delete(key, offset)` — remove vínculo (com rebalanceamento)
- `Range(minKey, maxKey)` — retorna todos os offsets no intervalo

A B+ é mantida **em memória** e reconstruída a partir dos arquivos a cada inicialização do servidor.

| Arquivo                      | Entidade   |
|------------------------------|------------|
| `imoveis.db.byterm.ridx`     | Imóveis    |
| `reservas.db.byterm.ridx`    | Reservas   |
| `usuarios.db.byterm.ridx`    | Usuários   |

Busca com múltiplos tokens faz **intersecção** dos conjuntos resultantes.

---

## Ordenação Externa

Implementa **External Merge Sort** para reordenar fisicamente o arquivo binário de imóveis e reservas, viabilizando leituras já na ordem solicitada sem overhead adicional em consultas subsequentes.

### Fase 1 — Geração de runs

```
Para cada bloco de runSize registros ativos:
  1. Carrega registros em memória
  2. Ordena o bloco pela chave desejada (ex: valorDiaria asc)
  3. Grava em arquivo temporário:

  data/imoveis.db.sort.run.0.bin
  data/imoveis.db.sort.run.1.bin
  ...
```

### Fase 2 — Merge k-vias com heap mínimo

```
Abre todos os runs simultaneamente
Heap mínimo com um elemento de cada run (o menor de cada)
Loop:
  1. Extrai o menor elemento do heap
  2. Grava no arquivo de saída:
     data/imoveis.db.sorted.bin
  3. Avança o cursor do run correspondente
  4. Insere o próximo elemento desse run no heap
```

### Reescrita atômica

Após o merge, `RewriteSorted` substitui o arquivo original pelo sorted com `os.Rename` (atômico no SO) e **reconstrói todos os índices** (primário + relacionamentos + termos). Arquivos temporários de run são removidos. Nenhuma leitura concorrente observa estado intermediário.

**Atributos de ordenação disponíveis:**

| Endpoint    | `ordenarPor`                                   |
|-------------|------------------------------------------------|
| `/imoveis`  | `valorDiaria`, `dataCadastro`, `cidade`, `titulo` |
| `/reservas` | `dataInicio`, `dataFim`, `valorTotal`          |

---

## Compressão de Dados e Backup Automático

### Filosofia

A compressão não é um recurso manual — ela é **infraestrutura de backup automático**. A cada 5 operações de escrita bem-sucedidas no sistema (POST/PUT/DELETE com 2xx), um backup comprimido de toda a base de dados é criado automaticamente em background, alternando entre Huffman e LZW.

### Huffman (`compression/huffman.go`)

Compressão baseada em **frequência de símbolos**:

1. Conta a frequência de cada byte no input → `map[byte]uint32`
2. Monta min-heap de nós `{símbolo, frequência, esquerda, direita}`
3. Funde os dois menores iterativamente até restar um nó raiz (a árvore)
4. Percorre a árvore para gerar o código binário de cada símbolo (esquerda=0, direita=1)
5. Serializa o bitstream precedido pela tabela de frequências (necessária para reconstrução)

**Formato do arquivo `.hbak` (Huffman):**
```
[numSymbols  uint16]
[sym byte, freq uint32] × numSymbols   ← tabela de reconstrução
[paddingBits byte]                     ← bits de padding no último byte
[bitstream...]
```

A decodificação reconstrói a árvore a partir do cabeçalho e percorre bit a bit para recuperar os bytes originais.

### LZW (`compression/lzw.go`)

Compressão por **dicionário adaptativo**:

1. Dicionário inicial: cada byte 0–255 como entrada individual (`nextCode = 256`)
2. Acumula sequência `w`; se `w+c` está no dicionário, estende; caso contrário emite código de `w`, adiciona `w+c` ao dicionário, reinicia `w = c`
3. Emite o código final de `w`
4. Dicionário cresce dinamicamente até 65.536 entradas (`uint16` máximo)

O decoder reconstrói o mesmo dicionário ao decodificar (algoritmo determinístico), sem necessidade de armazená-lo no arquivo.

**Formato:**
```
[count uint32]      ← número de códigos emitidos
[code uint16] × count
```

### Empacotamento multi-arquivo (`compression/archive.go`)

Antes de comprimir, todos os arquivos de dados são empacotados em um único stream binário com o formato `HLTB`:

```
[magic    uint32 = 0x484C5442]   ← "HLTB" — identificador do formato
[numEntries uint16]
Para cada arquivo:
  [nameLen uint16][name bytes]
  [dataLen uint32][data bytes]
```

Esse stream é então comprimido com Huffman **ou** LZW, gerando um único arquivo `.hbak` que contém toda a base de dados.

### Middleware de backup automático (`web/router.go`)

O middleware `withAutoBackup` intercepta todas as requisições de escrita e aciona o backup em background a cada limiar atingido:

```go
// Trecho simplificado do middleware
autoBackupState.count++
if autoBackupState.count >= autoBackupThreshold { // threshold = 5
    autoBackupState.count = 0
    algo = algos[autoBackupState.idx % 2] // alterna huffman ↔ lzw
    autoBackupState.idx++
    go b.AutoBackup(algo) // não bloqueia a resposta HTTP
}
```

Log gerado automaticamente:
```
[autobackup] backup-20260603-152301-huffman.hbak criado — 48320 → 31204 bytes (64.6% do original)
[autobackup] backup-20260603-154812-lzw.hbak criado — 51840 → 28912 bytes (55.8% do original)
```

**Endpoints de gerenciamento:**
```
GET  /backups              → lista todos os backups disponíveis (nome, algoritmo, tamanho, data)
POST /backup               → {"algoritmo":"huffman"|"lzw"} — cria backup manual imediatamente
POST /restaurar            → {"arquivo":"backup-....hbak"} — restaura todos os arquivos de dados
```

O **Admin Dashboard** exibe automaticamente o status do último backup (algoritmo, tamanho, data/hora, nome do arquivo).

---

## Casamento de Padrões

### Filosofia

O casamento de padrões não existe como uma aba exclusiva de administrador — ele é **infraestrutura transparente** que roda em todas as buscas textuais do sistema para qualquer tipo de usuário.

### Fluxo de busca com BM integrado

```
Usuário hóspede busca "praia" na página Explorar
          │
          ▼
GET /imoveis?busca=praia
          │
          ▼
Índice invertido de tokens (FNV-32a)
→ recupera candidatos que contêm o token "praia"
          │
          ▼
Boyer-Moore post-filter (case-insensitive)
→ verifica que o padrão "praia" está presente como
  substring exata em pelo menos um campo de texto
          │
          ▼
Resultado final retornado
```

Campos pesquisados por entidade:

| Entidade   | Campos filtrados por BM                                |
|------------|--------------------------------------------------------|
| Imóveis    | `titulo`, `descricao`, `cidade`, `rua`, `bairro`       |
| Usuários   | `nome`, `email`                                        |
| Reservas   | `status`, `dataInicio`, `dataFim`                      |

### Boyer-Moore (`patternmatch/bm.go`)

Implementado com a heurística do **mau-caráter** (bad character rule):

1. Pré-processamento: constrói `badChar[byte]` = posição mais à direita do byte no padrão
2. Alinha o padrão ao texto e compara **da direita para a esquerda**
3. Em mismatch com o caractere `c` do texto: `shift = max(1, j - badChar[c])`
4. Salta o padrão para frente sem retroceder no texto além do necessário

**Complexidade:** O(n/m) em média — especialmente eficiente para padrões médios/longos em texto natural.

### KMP (`patternmatch/kmp.go`)

Implementado com a **tabela de falha**:

1. Pré-processamento: `fail[i]` = comprimento do maior prefixo próprio de `pattern[0..i]` que também é sufixo (O(m))
2. Em mismatch em `pattern[j]`: usa `fail[j-1]` para reutilizar prefixo já comparado — **nunca retrocede no texto**

**Complexidade:** O(n + m) — ideal para padrões com repetição interna.

### Endpoint de diagnóstico

Compara BM × KMP com métricas de tempo e posições exatas de ocorrência:

```
GET /busca/padrao?q={padrão}&entidade={imoveis|usuarios|reservas}
```

Resposta:
```json
{
  "padrao": "praia",
  "entidade": "imoveis",
  "totalRegistros": 3,
  "resultados": [
    {
      "id": 2,
      "preview": "Casa de praia em Jurere",
      "ocorrenciasBM":  [{ "campo": "titulo", "posicao": 8 }],
      "ocorrenciasKMP": [{ "campo": "titulo", "posicao": 8 }]
    }
  ],
  "tempoMs_BM": 0.532,
  "tempoMs_KMP": 0.118
}
```

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
go run ./cmd/main.go
# Servidor em http://localhost:8080
```

**O que acontece na inicialização:**
1. Cria `data/` se não existir
2. Abre (ou cria) os arquivos binários de cada entidade
3. Carrega índices de hash do disco (`.pidx`, `.ridx`)
4. Reconstrói índice da B+ em memória a partir dos vínculos salvos
5. Seed automático: usuário admin e comodidades padrão (se a base estiver vazia)
6. Inicia listener HTTP na porta 8080

### Front-end

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Contas padrão

| Papel      | Email               | Senha    |
|------------|---------------------|----------|
| Admin      | admin@hostly.com    | admin123 |

---

## Endpoints da API

### Saúde

```
GET  /health
```

### Autenticação

```
POST /auth/register      # Criar conta
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

| Parâmetro        | Tipo   | Descrição                                                     |
|------------------|--------|---------------------------------------------------------------|
| `busca`          | string | Busca textual por tokens (índice invertido + BM post-filter)  |
| `cidade`         | string | Filtro por cidade                                             |
| `ativo`          | bool   | Filtrar por status ativo/inativo                              |
| `valorDiariaMin` | float  | Faixa mínima de diária                                        |
| `valorDiariaMax` | float  | Faixa máxima de diária                                        |
| `comodidades`    | string | IDs separados por vírgula (ex: `1,3,6`)                       |
| `ordenarPor`     | string | `valorDiaria` \| `dataCadastro` \| `cidade` \| `titulo`       |
| `ordem`          | string | `asc` \| `desc`                                               |

### Usuários

```
GET    /usuarios                # param: busca (índice invertido + BM post-filter)
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

| Parâmetro    | Tipo   | Descrição                                              |
|--------------|--------|--------------------------------------------------------|
| `idUsuario`  | int    | Filtro por usuário (combinado com `papel`)             |
| `papel`      | string | `hospede` \| `anfitriao`                               |
| `idImovel`   | int    | Filtro por imóvel                                      |
| `status`     | string | `PENDENTE` \| `CONFIRMADA` \| `CANCELADA`              |
| `periodoDe`  | string | Data início do intervalo (YYYY-MM-DD)                  |
| `periodoAte` | string | Data fim do intervalo (YYYY-MM-DD)                     |
| `busca`      | string | Busca textual (índice invertido + BM post-filter)      |
| `ordenarPor` | string | `dataInicio` \| `dataFim` \| `valorTotal`              |
| `ordem`      | string | `asc` \| `desc`                                        |

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
GET    /imoveis-comodidades/imovel/{idImovel}                             # comodidades (B+, ordenado)
GET    /imoveis-comodidades/comodidade/{idComodidade}/imoveis             # imóveis com a comodidade
GET    /imoveis-comodidades/imovel/{idImovel}/comodidade/{idComodidade}
DELETE /imoveis-comodidades/imovel/{idImovel}/comodidade/{idComodidade}
```

### Backup e Compressão

```
GET  /backups
POST /backup               # body: { "algoritmo": "huffman"|"lzw" }
POST /restaurar            # body: { "arquivo": "backup-....hbak" }
```

### Diagnóstico de Padrões

```
GET /busca/padrao?q=&entidade=imoveis|usuarios|reservas
```

### Dashboard e AED

```
GET /dashboard/stats
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
        └── propertyRepo.Create()
              ├── Append no arquivo binário → obtém offset
              ├── hashPrimario.Set(id, offset)          → imoveis.db.pidx
              ├── hashByUser.Insert(idUsuario, offset)  → imoveis.db.byuser.ridx
              └── hashByTerm.Insert(token, id) × tokens → imoveis.db.byterm.ridx

          → middleware detecta POST com 2xx
          → incrementa contador de escritas
          → se contador atingiu 5: go AutoBackup("huffman"|"lzw")
```

### Busca textual com BM integrado

```
GET /imoveis?busca=praia+florianopolis

1. tokenizar("praia florianopolis") → ["praia", "florianopolis"]
2. FNV-32a("praia")        → hashByTerm.Get() → [id3, id17]
3. FNV-32a("florianopolis") → hashByTerm.Get() → [id3, id9]
4. intersecção              → [id3]
5. hashPrimario.Get(id3)    → offset
6. file.ReadAt(offset)      → deserializa registro
7. BM post-filter: MatchBM(titulo, "praia") || MatchBM(cidade, "praia") || ...
   → confirma que o padrão está presente como substring exata

Resultado: apenas o imóvel 3
```

### Ordenação externa

```
GET /imoveis?ordenarPor=valorDiaria&ordem=asc

1. SortExternal: lê registros em blocos
   └── Ordena cada bloco → grava em imoveis.db.sort.run.N.bin
2. Merge k-vias com heap mínimo → imoveis.db.sorted.bin
3. RewriteSorted: os.Rename(sorted.bin → imoveis.db) [atômico]
4. Reconstrói todos os índices (pidx, byuser, byterm)
5. Consulta retorna registros já na nova ordem física
```

### Listar comodidades de um imóvel (B+)

```
GET /imoveis-comodidades/imovel/1

1. B+.Range(key=1<<32|0, key=1<<32|MAXUINT32)
   → offsets em imoveis_comodidades.db, ordenados por idComodidade
2. Para cada offset: readAt(offset) → deserializa vínculo
3. Retorna comodidades em ordem crescente de idComodidade
```

### Backup automático

```
5ª operação de escrita bem-sucedida detectada pelo middleware
  └── go b.AutoBackup("huffman")
        ├── collectDataFiles() → glob data/*.db + data/*.ridx + data/*.pidx
        ├── archive.Pack(entries) → stream HLTB
        ├── huffman.Encode(stream) → bitstream comprimido
        └── os.WriteFile("data/backup-20260603-152301-huffman.hbak", ...)
              → log: "backup criado — 48320 → 31204 bytes (64.6%)"
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
          │  + middleware     │    │  hash extensível + B+  │
          └──────────────────┘    └────────────────────────┘
```

### Front-end — três camadas

```
pages/          → uma página por rota, uma por perfil de usuário
features/       → domínios transversais (auth, properties)
app/store.ts    → estado global com Zustand (token no localStorage)
services/api.ts → cliente HTTP centralizado (injeta Bearer token)
```

**Regra fundamental do frontend:** nenhuma filtragem, busca ou ordenação é feita no cliente. Todo query param (`busca`, `valorDiariaMin`, `comodidades`, `status`, `periodoDe`, `ordenarPor`...) é enviado ao backend, que usa os índices para processar.

---

## Fases do Projeto

### Fase 1 — Fundação: CRUD e Persistência Binária

A primeira fase estabeleceu toda a infraestrutura de persistência. O desafio central foi criar um formato de arquivo binário próprio que suportasse inserção, leitura, atualização e deleção de forma eficiente, sem depender de nenhum banco de dados.

O formato adotado usa um **cabeçalho de controle de 12 bytes** (nextID, count, freeHead) e um **byte de status por registro** para deleção lógica. A lista encadeada de slots livres (`freeHead`) garante que espaço de registros deletados seja reaproveitado em novas inserções, evitando crescimento indefinido do arquivo.

Também foram implementados nesta fase: autenticação JWT, três perfis de usuário (ADMIN, ANFITRIÃO, HÓSPEDE), promoção automática de hóspede a anfitrião ao cadastrar o primeiro imóvel, e o frontend completo com mapa interativo.

**Entregáveis:** CRUD completo para todas as entidades, persistência binária com cabeçalho, exclusão lógica, autenticação JWT, frontend com três perfis.

---

### Fase 2 — Índices e Ordenação Externa

Com o CRUD funcionando, a Fase 2 atacou a eficiência. Buscas por ID eram O(n) (varredura linear), e não havia ordenação.

O **Hash Extensível** foi implementado como índice primário, levando o acesso por ID a O(1) amortizado. O mecanismo de splitting dinâmico (com doubling do diretório quando necessário) garante que o índice escale conforme os dados crescem.

Para relacionamentos, o **Hash Extensível multi-valor** (`key → []IDs`) foi adicionado, permitindo listar todos os imóveis de um proprietário ou todas as reservas de um hóspede instantaneamente, sem varredura.

O **índice invertido de tokens** (FNV-32a sobre tokens normalizados) viabilizou busca textual eficiente: uma consulta por "praia" recupera candidatos em O(1) via índice, sem leitura sequencial de todos os registros.

A **Árvore B+** (com folhas duplamente encadeadas) foi implementada para suportar buscas por intervalo e listagem ordenada.

A **Ordenação Externa** (External Merge Sort com heap de k-vias) foi implementada para reordenar fisicamente os arquivos binários, com reescrita atômica via `os.Rename` e reconstrução automática de todos os índices.

**Entregáveis:** Hash Extensível (PK), índices 1:N, índice invertido textual, Árvore B+, ordenação externa por intercalação.

---

### Fase 3 — Relacionamento N:N e Listagem Ordenada

A Fase 3 introduziu o relacionamento N:N entre Imóveis e Comodidades, com dois índices bidirecionais (por imóvel e por comodidade) e a B+ como índice ordenado do vínculo.

A chave composta `int64 = idImovel << 32 | idComodidade` na B+ garante que todas as comodidades de um imóvel formem um intervalo contíguo, viabilizando `Range()` para listagem ordenada sem custo adicional de sort.

A integridade referencial é mantida no backend: criação de vínculo valida existência e status ativo de ambas as entidades; deleção de imóvel ou comodidade remove todos os vínculos associados.

**Entregáveis:** Tabela N:N (imoveis_comodidades), índices bidirecionais, listagem ordenada via B+, CRUD de comodidades.

---

### Fase 4 — Compressão e Casamento de Padrões

A Fase 4 foi a mais exigente em integração. O critério central foi que as novas funcionalidades não fossem abas isoladas, mas **infraestrutura transparente** do sistema.

**Casamento de Padrões:** BM e KMP foram implementados do zero. O Boyer-Moore foi inserido como post-filter em todos os handlers de busca (imóveis, usuários, reservas), rodando automaticamente em toda busca textual de qualquer usuário. O índice invertido recupera candidatos; o BM garante que o padrão está presente como substring exata nos campos de texto.

**Compressão e Backup:** Huffman e LZW foram implementados do zero. O formato de arquivo `HLTB` empacota todos os arquivos de dados em um único stream antes da compressão. O middleware `withAutoBackup` monitora toda operação de escrita bem-sucedida e aciona um backup em background a cada 5 escritas, alternando automaticamente entre Huffman e LZW. O Admin Dashboard exibe o status do último backup.

**Entregáveis:** Huffman + LZW (backup automático e manual), formato HLTB, Boyer-Moore + KMP integrados em todas as buscas textuais, endpoint de diagnóstico com métricas comparativas.

---

### Fase 5 — Criptografia (a implementar)

Criptografia XOR nas senhas dos usuários.

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
| **Huffman Encoding/Decoding** | Backup comprimido por frequência de símbolos | `compression/huffman.go` |
| **LZW Encoding/Decoding** | Backup comprimido por dicionário expansível | `compression/lzw.go` |
| **Arquivo multi-entidade (HLTB)** | Empacotamento de todos os .db em um único stream | `compression/archive.go` |
| **Backup automático por escrita** | Middleware conta escritas e aciona backup em background | `web/router.go` |
| **Boyer-Moore (bad-character)** | Post-filter em todas as buscas textuais | `patternmatch/bm.go` |
| **KMP (Knuth-Morris-Pratt)** | Busca de padrões com tabela de falha | `patternmatch/kmp.go` |
| **Arquitetura Hexagonal** | Domain / UseCase / Ports / Adapters | `internal/` |
| **Estado global persistido** | Token de sessão via Zustand + localStorage | `app/store.ts` |

---

## Equipe

- Rafael Xavier Oliveira
- Lucas Silva Santos
- Leonardo Stuart de Almeida Ramalho
- Luca Guimarães Lodi
- Tulio Geraldo da Costa Silva

---

*Projeto acadêmico — AEDs III / PUC Minas.*
