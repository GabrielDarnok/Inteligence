# Open Threat Intelligence Aggregator

## 1. Visão geral

Desenvolver uma plataforma **open source de Threat Intelligence** que centralize informações provenientes de múltiplas fontes públicas, gratuitas e confiáveis.

Atualmente, informações sobre IPs, domínios, URLs, hashes, botnets, C2s, scanners, DDoS, hosts comprometidos, vulnerabilidades e outros indicadores estão distribuídas em diversas plataformas.

Cada fonte possui:

- formato próprio;
- API ou método de coleta diferente;
- nomenclatura própria;
- frequência de atualização diferente;
- critérios de classificação diferentes;
- níveis de confiança diferentes;
- histórico independente.

A proposta é criar uma camada única que faça a coleta, normalização, correlação, armazenamento e disponibilização dessas informações.

---

## 2. Problema

Um analista que queira avaliar um determinado IP atualmente precisa consultar várias fontes individualmente.

Exemplo:

```text
1.2.3.4

Shadowserver → observado participando de DDoS
GreyNoise   → scanner / malicious
ThreatFox   → C2
Spamhaus    → listado
URLhaus     → associado a atividade maliciosa
```

A plataforma deverá transformar essas informações fragmentadas em uma visão única:

```text
1.2.3.4

Threat Intelligence

Sources:
- Shadowserver
- GreyNoise
- ThreatFox
- Spamhaus
- URLhaus

Threats:
- DDoS
- Scanner
- C2

Malware:
- exemplo

First Seen:
- ...

Last Seen:
- ...

Evidence:
- múltiplas fontes independentes
```

---

## 3. Objetivo

Criar uma plataforma que:

1. Colete automaticamente dados de diversas fontes;
2. Mantenha os dados atualizados;
3. Normalize diferentes formatos;
4. Elimine duplicidades;
5. Correlacione informações sobre o mesmo indicador;
6. Preserve a origem de cada informação;
7. Mantenha histórico;
8. Permita pesquisa através de uma interface web;
9. Disponibilize uma API;
10. Permita que sistemas externos consumam os dados para tomada de decisão;
11. Permita gerar uma avaliação/recomendação sobre um indicador, inclusive para decidir se ele deve ser bloqueado.

A aplicação não deve ser um firewall ou sistema de mitigação. Ela deve fornecer a **inteligência necessária para que outros sistemas possam tomar decisões**.

---

# 4. Conceito

A arquitetura conceitual:

```text
                 PUBLIC THREAT SOURCES

 Shadowserver ───────┐
 GreyNoise ──────────┤
 ThreatFox ──────────┤
 URLhaus ────────────┤
 Feodo Tracker ──────┤
 Spamhaus ───────────┤
 CISA ───────────────┤
 MISP feeds ─────────┤
 outras fontes ──────┘
          │
          ▼
   INGESTION ENGINE
          │
          ▼
     NORMALIZATION
          │
          ▼
     DEDUPLICATION
          │
          ▼
      CORRELATION
          │
          ▼
   UNIFIED DATABASE
          │
     ┌────┴────┐
     ▼         ▼
   WEB UI     API
```

---

# 5. Princípio fundamental: evidência e proveniência

A aplicação **não deve transformar uma informação de uma fonte em verdade absoluta**.

Cada informação deve manter sua origem.

Exemplo:

```text
Indicator:
1.2.3.4

Evidence #1
Source: Shadowserver
Classification: DDoS participant
First seen: ...
Last seen: ...

Evidence #2
Source: GreyNoise
Classification: malicious
Noise: true
Last seen: ...

Evidence #3
Source: ThreatFox
Classification: C2
Malware: Mirai
First seen: ...
Last seen: ...
```

A aplicação poderá produzir uma avaliação agregada:

```text
Malicious: true
Confidence: high
Recommendation: block
```

Mas deverá ser possível visualizar quais evidências levaram a essa avaliação.

---

# 6. Indicadores

O modelo deve suportar inicialmente:

- IPv4
- IPv6
- CIDR
- domínio
- URL
- MD5
- SHA1
- SHA256
- ASN
- certificado

O sistema deve ser extensível para novos tipos de indicadores.

---

# 7. Modelo conceitual de dados

O núcleo deve ser baseado em:

```text
Indicator
    │
    ├── Evidence
    │      │
    │      └── Source
    │
    ├── Observations
    │
    ├── Tags
    │
    ├── Relationships
    │
    ├── History
    │
    └── Assessment
```

## Indicator

Representa o objeto investigado.

Exemplo:

```text
1.2.3.4
```

## Evidence

Representa uma informação fornecida por uma fonte.

Exemplo:

```text
GreyNoise
classification = malicious
```

## Source

Representa a origem da informação.

Exemplo:

```text
GreyNoise
Shadowserver
ThreatFox
```

## Observation

Representa quando e como o indicador foi observado.

Deve permitir armazenar:

- first_seen;
- last_seen;
- timestamp;
- tipo de observação;
- dados específicos da fonte.

## Relationship

Permite relacionar indicadores.

Exemplos:

```text
IP → belongs_to → ASN
IP → resolves_to → Domain
IP → associated_with → Malware
Domain → hosts → URL
IP → communicates_with → IP
```

---

# 8. Connectors

Cada fonte deverá ser implementada como um connector independente.

Estrutura sugerida:

```text
/connectors/

shadowserver/
greynoise/
threatfox/
urlhaus/
feodo/
spamhaus/
cisa/
misp/
```

O core da aplicação não deve depender de uma fonte específica.

Cada connector deve ser responsável por:

```text
fetch()
parse()
normalize()
```

Também deve informar metadados:

```text
name
description
website
license
terms_of_use
authentication_required
update_frequency
supported_indicators
```

Adicionar uma nova fonte deve exigir o mínimo possível de alterações no core.

---

# 9. Primeiras fontes

Começar com poucas fontes e criar uma arquitetura preparada para expansão.

Fontes candidatas:

### Shadowserver

Informações sobre:

- DDoS;
- botnets;
- hosts comprometidos;
- serviços vulneráveis;
- scanners;
- amplificadores;
- honeypots;
- outros relatórios de segurança.

### GreyNoise

Informações sobre:

- scanners;
- Internet noise;
- classificação de IPs;
- atividade maliciosa.

### ThreatFox

Informações sobre:

- IOCs;
- C2;
- malware;
- botnets;
- IPs;
- domínios;
- URLs.

### URLhaus

Informações sobre:

- URLs maliciosas;
- malware delivery;
- hosts;
- domínios relacionados.

### Feodo Tracker

Informações relacionadas a:

- botnets;
- C2;
- infraestrutura de malware.

### Spamhaus

Informações sobre:

- redes maliciosas;
- IPs;
- CIDRs;
- ASNs;
- reputação.

### CISA KEV

Informações sobre:

- vulnerabilidades conhecidas como exploradas.

Outras fontes poderão ser adicionadas posteriormente.

---

# 10. Normalização

Cada fonte utiliza nomenclaturas diferentes.

Exemplo:

```text
Shadowserver:
DDoS Participant

GreyNoise:
Malicious

ThreatFox:
botnet_cc

Outra fonte:
Command and Control
```

O sistema deve preservar o valor original:

```text
source_classification
```

e também poderá possuir uma classificação normalizada:

```text
normalized_classification
```

Exemplo:

```text
Source:
ThreatFox

Original:
botnet_cc

Normalized:
command_and_control
```

Nunca remover o valor original fornecido pela fonte.

---

# 11. Deduplicação

Se várias fontes fornecerem o mesmo indicador:

```text
Shadowserver → 1.2.3.4
GreyNoise    → 1.2.3.4
ThreatFox    → 1.2.3.4
```

deve existir uma única entidade:

```text
Indicator
1.2.3.4
```

com múltiplas evidências:

```text
Evidence:
├── Shadowserver
├── GreyNoise
└── ThreatFox
```

O sistema deve evitar duplicação desnecessária sem perder informações específicas de cada fonte.

---

# 12. Histórico

O histórico é fundamental.

Não armazenar somente:

```text
IP = malicious
```

Deve ser possível saber:

```text
1.2.3.4

2026-08-01
GreyNoise → observed

2026-08-05
Shadowserver → DDoS participant

2026-08-10
ThreatFox → C2

2026-09-29
GreyNoise → last seen
```

Isso permitirá análises temporais no futuro.

---

# 13. Assessment / Decision Engine

A aplicação deve poder produzir uma avaliação agregada baseada nas evidências disponíveis.

Exemplo:

```text
Indicator:
1.2.3.4

Evidence:
- Shadowserver → DDoS
- GreyNoise → malicious
- ThreatFox → C2

Assessment:
malicious = true
confidence = high
recommendation = block
```

O mecanismo deve ser configurável.

Não assumir que toda fonte possui o mesmo peso.

Uma possível estrutura futura:

```text
Source reliability
Evidence type
Recency
Number of independent sources
Historical behavior
Expiration
```

A decisão deve sempre ser explicável.

Exemplo:

```text
Recommendation: BLOCK

Reasons:
- 3 independent sources
- Recent malicious observations
- Known C2 classification
- DDoS activity observed
```

---

# 14. API

A API será uma das principais funcionalidades da plataforma.

Exemplos:

```http
GET /api/v1/indicator/1.2.3.4
```

```http
GET /api/v1/search?q=1.2.3.4
```

```http
GET /api/v1/indicators?type=ipv4
```

```http
GET /api/v1/indicators?source=shadowserver
```

```http
GET /api/v1/indicators?tag=botnet
```

```http
GET /api/v1/sources
```

```http
GET /api/v1/assessment/1.2.3.4
```

Também considerar feeds:

```text
/api/v1/feeds/malicious-ip.json
/api/v1/feeds/malicious-ip.csv
/api/v1/feeds/malicious-ip.txt
```

Esses feeds permitirão integração com:

- firewalls;
- Wanguard;
- SIEM;
- IDS/IPS;
- scripts;
- sistemas de SOC;
- ferramentas próprias.

---

# 15. Interface Web

A interface inicial deve ser focada em pesquisa.

Exemplo:

```text
┌─────────────────────────────────────────────┐
│ Search IP, Domain, Hash, ASN...             │
│                                             │
│ [ 1.2.3.4                              🔍 ] │
└─────────────────────────────────────────────┘

1.2.3.4

Type:
IPv4

Assessment:
MALICIOUS

Sources:
─────────────────────────────────────────────
Shadowserver    DDoS Participant
GreyNoise       Malicious / Noise
ThreatFox       C2
Spamhaus        Not Listed
─────────────────────────────────────────────

Threats:
DDoS
Scanner
C2

Malware:
Mirai

First Seen:
2026-08-01

Last Seen:
2026-09-29

Observations:
184
```

Também deve existir uma página para cada fonte:

```text
Sources
├── Shadowserver
├── GreyNoise
├── ThreatFox
├── URLhaus
└── ...
```

Mostrando:

- status;
- última sincronização;
- quantidade de indicadores;
- erros;
- frequência;
- documentação;
- licença/termos;
- tipos de dados.

---

# 16. Ingestion Engine

O processo de coleta deve ser automatizado.

Fluxo:

```text
Scheduler
    ↓
Connector
    ↓
Download/API
    ↓
Parser
    ↓
Validation
    ↓
Normalization
    ↓
Deduplication
    ↓
Correlation
    ↓
Database
```

Cada execução deve gerar logs:

```text
[INFO] Shadowserver: 12,431 records
[INFO] ThreatFox: 3,812 records
[INFO] GreyNoise: 500 records

[INFO] New indicators: 9,231
[INFO] Updated indicators: 13,812
[INFO] Duplicates: 41,002
[INFO] Errors: 12
```

Erros de uma fonte não devem impedir as outras fontes de funcionar.

---

# 17. Atualização e expiração

Cada fonte possui uma frequência diferente.

O sistema deve suportar:

```text
Real-time
Hourly
Daily
Weekly
On-demand
```

Também deve existir expiração de evidências.

Exemplo:

```text
Source:
GreyNoise

Last Seen:
2026-01-01

Current:
2026-09-29
```

Uma evidência antiga não deve necessariamente continuar tendo o mesmo peso.

O sistema deve preservar o histórico, mas considerar a **recência** na avaliação.

---

# 18. Arquitetura inicial sugerida

Não criar uma infraestrutura excessivamente complexa no MVP.

Sugestão:

```text
FastAPI
    │
    ├── REST API
    ├── Authentication
    └── Search
         │
         ▼
     PostgreSQL
         ▲
         │
   Ingestion Engine
         │
    ┌────┼────┐
    ▼    ▼    ▼
Shadow Threat Grey
server  Fox  Noise
```

Tecnologias possíveis:

- Python
- FastAPI
- PostgreSQL
- SQLAlchemy
- Pydantic
- HTTPX
- Docker Compose
- React/Next.js para frontend

Não adicionar Redis, Kafka, Elasticsearch, Kubernetes ou outras tecnologias de infraestrutura no MVP sem necessidade real.

---

# 19. Requisitos importantes

## Open Source

O projeto deve ser desenvolvido com arquitetura adequada para contribuição da comunidade.

Deve possuir:

```text
README.md
LICENSE
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
```

## Transparência

Para cada dado deve ser possível identificar:

```text
source
source_record
first_seen
last_seen
collection_time
original_value
normalized_value
```

## Respeito aos termos das fontes

Cada connector deve respeitar:

- API limits;
- rate limits;
- licença;
- termos de uso;
- requisitos de atribuição;
- restrições de redistribuição.

A plataforma não deve assumir que um dado disponível publicamente pode necessariamente ser redistribuído sem restrições.

---

# 20. O que NÃO fazer inicialmente

Não começar implementando:

- ML próprio;
- blockchain;
- Kubernetes;
- Kafka;
- arquitetura distribuída;
- SIEM completo;
- firewall management;
- FlowSpec;
- mitigação DDoS;
- automação de bloqueio diretamente no roteador;
- scoring extremamente complexo.

Primeiro construir muito bem:

```text
COLLECT
   ↓
NORMALIZE
   ↓
CORRELATE
   ↓
STORE
   ↓
SEARCH
   ↓
API
```

Depois adicionar automação.

---

# 21. Resultado esperado do MVP

Ao final do MVP, deve ser possível:

1. Subir a aplicação via Docker Compose;
2. Configurar as fontes;
3. Executar os collectors;
4. Popular o PostgreSQL;
5. Pesquisar um IP/domínio/hash;
6. Ver todas as fontes que possuem informações sobre ele;
7. Ver o histórico;
8. Ver as evidências individualmente;
9. Ver uma avaliação agregada;
10. Consultar a mesma informação via REST API;
11. Consumir um feed de indicadores;
12. Adicionar uma nova fonte sem modificar o core da aplicação.

---

# 22. Visão de longo prazo

A plataforma pode evoluir para uma infraestrutura pública de Threat Intelligence:

```text
             GLOBAL THREAT DATA

      ┌────────┬────────┬────────┐
      │        │        │        │
   DDoS     Malware   Botnet   Phishing
      │        │        │        │
      └────────┴────────┴────────┘
                   │
                   ▼
          THREAT INTELLIGENCE
                PLATFORM
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
       WEB        API        FEEDS
        │          │          │
        └──────────┼──────────┘
                   ▼
             COMMUNITY
```

O objetivo final é que qualquer pessoa ou organização possa consultar:

> **"O que fontes confiáveis sabem sobre este indicador?"**

e obter uma resposta consolidada, atualizada, rastreável e consumível automaticamente.

A plataforma deve ser **agnóstica ao consumidor**: não deve ser construída especificamente para uma empresa, firewall ou ferramenta. Deve funcionar como uma camada independente de Threat Intelligence que qualquer sistema possa consumir.
