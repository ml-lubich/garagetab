# GarageTab

> Lightweight shop management for independent auto repair shops (1-5
> bays). The $29/mo alternative to Tekmetric and Shop-Ware for solo
> mechanics. Sign up, add your first repair order in under 5 minutes.

**Tagline:** "Run your shop, not your software."

```mermaid
flowchart LR
    USER[("👤 mechanic")]
    LANDING["🌐 / · landing"]
    AUTH{{"🔐 /signup · /login<br/>Supabase Auth"}}
    SHELL["🏠 /(shell)<br/>app shell"]
    INSPECT["🔍 /inspect<br/>digital inspections"]
    INVOICE["🧾 /invoice<br/>repair orders"]
    APPROVE["✅ /approve<br/>customer SMS approval"]
    DB[("🗄 Supabase<br/>Postgres")]
    PRICING[/"💳 /pricing<br/>$29/mo"/]

    USER --> LANDING --> AUTH --> SHELL
    SHELL --> INSPECT --> DB
    SHELL --> INVOICE --> DB
    SHELL --> APPROVE --> DB
    LANDING --> PRICING

    classDef io fill:#0e1116,stroke:#2f81f7,stroke-width:1.5px,color:#e6edf3;
    classDef tool fill:#161b22,stroke:#3fb950,stroke-width:1.5px,color:#e6edf3;
    classDef brain fill:#161b22,stroke:#d29922,stroke-width:1.5px,color:#e6edf3;
    classDef out fill:#0e1116,stroke:#a371f7,stroke-width:1.5px,color:#e6edf3;
    class USER,DB io;
    class INSPECT,INVOICE,APPROVE,LANDING tool;
    class AUTH,SHELL brain;
    class PRICING out;
```

## Table of contents

- [Stack](#stack)
- [Architecture](#architecture)
- [Repair-order lifecycle](#repair-order-lifecycle)
- [Customer approval (sequence)](#customer-approval-sequence)
- [Getting Started](#getting-started)
- [Requirements](#requirements)
- [🗺️ Repository map](#️-repository-map)
- [📊 Code composition](#-code-composition)

## Repair-order lifecycle

```mermaid
stateDiagram-v2
    [*] --> DRAFT: mechanic creates RO
    DRAFT --> INSPECTED: digital inspection (photos)
    INSPECTED --> AWAITING_APPROVAL: send SMS to customer
    AWAITING_APPROVAL --> APPROVED: customer taps approve
    AWAITING_APPROVAL --> DECLINED: customer declines
    APPROVED --> IN_PROGRESS: work started
    IN_PROGRESS --> READY: parts installed
    READY --> INVOICED: invoice generated
    INVOICED --> PAID: payment received
    PAID --> [*]
    DECLINED --> [*]
```

## Customer approval (sequence)

```mermaid
sequenceDiagram
    participant M as mechanic
    participant APP as /(shell)
    participant DB as Supabase
    participant SMS as SMS provider
    participant C as customer

    M->>APP: complete inspection
    APP->>DB: insert RO + photos
    APP->>SMS: send approve link
    SMS-->>C: SMS with link
    C->>APP: GET /approve/[id]
    C->>APP: tap Approve
    APP->>DB: status=APPROVED
    APP-->>M: notify (live)
    M->>APP: mark READY → INVOICED
```

## Stack

- Next.js 16 + React 19 + Tailwind CSS 4
- Supabase (auth + database)
- Vercel deployment
- TypeScript strict mode
- Bun package manager

## Architecture

- `/` — Landing page
- `/signup`, `/login` — Auth flows (Supabase)
- `/(shell)` — Authenticated app shell
- `/inspect` — Digital inspections (photos)
- `/invoice` — Repair orders + invoicing
- `/approve` — Customer approval via text
- `/pricing` — $29/mo flat

## Getting Started

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Requirements

See [REQUIREMENTS.md](REQUIREMENTS.md) for product vision, target customer, and competitive positioning.


## 🗺️ Repository map

Top-level layout of `garagetab` rendered as a Mermaid mindmap (auto-generated from the on-disk tree).

```mermaid
mindmap
  root((garagetab))
    app/
      _shell_
      approve
      favicon.ico
      globals.css
      inspect
      invoice
    components/
      sidebar.tsx
      ui.tsx
    lib/
      auth.ts
      supabase
      types
      utils.ts
    public/
      file.svg
      globe.svg
      next.svg
      vercel.svg
      window.svg
    supabase/
      migrations
    files
      README.md
      next.config.ts
      package.json
      tsconfig.json
```


## 📊 Code composition

File-type breakdown of source under this repo (skips `.git`, `node_modules`, build caches, lockfiles).

```mermaid
pie showData title File-type composition of garagetab (44 files)
    "TypeScript" : 28
    "SVG image" : 5
    "Markdown" : 4
    "JavaScript" : 2
    "JSON" : 2
    "Image" : 1
    "CSS" : 1
    "SQL" : 1
```
