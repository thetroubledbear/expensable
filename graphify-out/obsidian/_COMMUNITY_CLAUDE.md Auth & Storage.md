---
type: community
cohesion: 0.15
members: 14
---

# CLAUDE.md: Auth & Storage

**Cohesion:** 0.15 - loosely connected
**Members:** 14 nodes

## Members
- [[AGENTS.md (Next.js Agent Rules)]] - document - apps/web/AGENTS.md
- [[Auth Config (appsweblibauthconfig.ts)]] - code - CLAUDE.md
- [[Docker Compose (Local Services)]] - code - docker-compose.yml
- [[Google Cloud Storage (libstorageindex.ts)]] - code - CLAUDE.md
- [[Middleware Proxy (proxy.ts)]] - code - CLAUDE.md
- [[MinIO Object Storage (local dev)]] - rationale - CLAUDE.md
- [[MinIO Service (docker-compose)]] - code - docker-compose.yml
- [[Neon PostgreSQL (DATABASE_URL  DIRECT_URL)]] - rationale - CLAUDE.md
- [[Next.js 16 Web App (appsweb)]] - code - CLAUDE.md
- [[NextAuth v5 Auth System]] - code - CLAUDE.md
- [[PostgreSQL 16 Service (docker-compose)]] - code - docker-compose.yml
- [[Prisma DB Package (@expensabledb)]] - code - CLAUDE.md
- [[appsweb README (Next.js bootstrapped)]] - document - apps/web/README.md
- [[appswebCLAUDE.md (references AGENTS.md)]] - document - apps/web/CLAUDE.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/CLAUDEmd_Auth__Storage
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_CLAUDE.md API & DB Docs]]
- 2 edges to [[_COMMUNITY_CLAUDE.md Project Overview]]
- 1 edge to [[_COMMUNITY_CLAUDE.md UI Component Docs]]
- 1 edge to [[_COMMUNITY_CICD Deploy Workflow]]

## Top bridge nodes
- [[Next.js 16 Web App (appsweb)]] - degree 9, connects to 4 communities
- [[Prisma DB Package (@expensabledb)]] - degree 4, connects to 2 communities