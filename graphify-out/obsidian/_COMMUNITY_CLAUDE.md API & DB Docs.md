---
type: community
cohesion: 0.24
members: 10
---

# CLAUDE.md: API & DB Docs

**Cohesion:** 0.24 - loosely connected
**Members:** 10 nodes

## Members
- [[Dashboard Analytics]] - rationale - CLAUDE.md
- [[DetectedSubscription DB Model]] - code - CLAUDE.md
- [[Household API (GETPATCH apihousehold)]] - code - CLAUDE.md
- [[Household DB Model]] - code - CLAUDE.md
- [[HouseholdBilling DB Model]] - code - CLAUDE.md
- [[Prisma Schema (packagesdbprismaschema.prisma)]] - code - CLAUDE.md
- [[Register API (POST apiauthregister)]] - code - CLAUDE.md
- [[Transaction APIs (apitransactions)]] - code - CLAUDE.md
- [[Transaction DB Model]] - code - CLAUDE.md
- [[UploadedFile DB Model]] - code - CLAUDE.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/CLAUDEmd_API__DB_Docs
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_CLAUDE.md Auth & Storage]]
- 3 edges to [[_COMMUNITY_CLAUDE.md AI Pipeline Docs]]
- 1 edge to [[_COMMUNITY_CLAUDE.md Categories Docs]]
- 1 edge to [[_COMMUNITY_CLAUDE.md Project Overview]]
- 1 edge to [[_COMMUNITY_CLAUDE.md UI Component Docs]]

## Top bridge nodes
- [[Prisma Schema (packagesdbprismaschema.prisma)]] - degree 7, connects to 2 communities
- [[Transaction DB Model]] - degree 5, connects to 2 communities
- [[Transaction APIs (apitransactions)]] - degree 3, connects to 2 communities
- [[HouseholdBilling DB Model]] - degree 3, connects to 1 community
- [[Household API (GETPATCH apihousehold)]] - degree 2, connects to 1 community