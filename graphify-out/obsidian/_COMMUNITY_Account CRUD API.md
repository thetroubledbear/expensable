---
type: community
cohesion: 0.33
members: 6
---

# Account CRUD API

**Cohesion:** 0.33 - loosely connected
**Members:** 6 nodes

## Members
- [[ACCOUNT_TYPES_2]] - code - apps/web/app/api/accounts/[id]/route.ts
- [[DELETE()]] - code - apps/web/app/api/accounts/[id]/route.ts
- [[PATCH()]] - code - apps/web/app/api/accounts/[id]/route.ts
- [[SUPPORTED_CURRENCIES_1]] - code - apps/web/app/api/accounts/[id]/route.ts
- [[route.ts_3]] - code - apps/web/app/api/accounts/[id]/route.ts
- [[updateSchema]] - code - apps/web/app/api/accounts/[id]/route.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Account_CRUD_API
SORT file.name ASC
```

## Connections to other communities
- 4 edges to [[_COMMUNITY_Budgets & Accounts API]]
- 1 edge to [[_COMMUNITY_Auth & User API Routes]]

## Top bridge nodes
- [[route.ts_3]] - degree 8, connects to 2 communities
- [[DELETE()]] - degree 2, connects to 1 community
- [[PATCH()]] - degree 2, connects to 1 community